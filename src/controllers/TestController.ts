import { Context } from 'telegraf';
import { UserService } from '../services/UserService';
import { TestService } from '../services/TestService';
import { messages } from '../utils/messages';
import { getTestSelectionKeyboard, getAnswerKeyboard, getTestNavigationKeyboard, getMainMenuKeyboard } from '../utils/keyboards';

export class TestController {
  static async showTestSelection(ctx: Context, opts?: { force?: boolean }) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      console.log('📋 showTestSelection called with opts:', opts);
      
      const user = await UserService.getUser(telegramId);
      if (!user || !user.isRegistered) {
        console.log('❌ User not registered:', telegramId);
        await ctx.reply(messages.errors.alreadyRegistered);
        return;
      }

      console.log('👤 User status:', { 
        currentTest: user.currentTest, 
        force: opts?.force 
      });

      if (user.currentTest && !opts?.force) {
        console.log('🔄 Continuing current test');
        // Joriy testni davom ettirish
        await this.continueCurrentTest(ctx);
        return;
      }

      console.log('🔍 Fetching active tests...');
      const tests = await TestService.getAllActiveTests();
      console.log('📊 Found tests:', tests.length);
      console.log('Test details:', tests.map(t => ({ title: t.title, isActive: t.isActive })));
      
      if (tests.length === 0) {
        console.log('❌ No tests available');
        await ctx.reply('Hozircha hech qanday test mavjud emas.');
        return;
      }

      console.log('✅ Sending test selection keyboard');
      await ctx.reply(
        messages.test.selection,
        { 
          parse_mode: 'Markdown', 
          reply_markup: getTestSelectionKeyboard(tests).reply_markup 
        }
      );
    } catch (error) {
      console.error('❌ Test selection error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async startTest(ctx: Context, testTitle: string) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user || !user.isRegistered) {
        await ctx.reply(messages.errors.alreadyRegistered);
        return;
      }

      // If a previous test was in progress, reset it and proceed
      if (user.currentTest) {
        await UserService.resetCurrentTest(telegramId);
      }

  // Find test by title (case/space-insensitive)
  const test = await TestService.getActiveTestByTitle(testTitle);
      
      if (!test) {
        await ctx.reply(messages.errors.testNotFound);
        return;
      }

      await UserService.startTest(telegramId, (test as any)._id.toString());

      // Immediately show the first question (no extra start button)
      await this.showQuestion(ctx, (test as any)._id.toString(), 0);
    } catch (error) {
      console.error('Start test error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async showQuestion(ctx: Context, testId: string, questionIndex: number = 0) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const questionData = await TestService.getTestQuestion(testId, questionIndex);
      
      if (!questionData) {
        await ctx.reply('Savol topilmadi.');
        return;
      }

      const { question, totalQuestions, currentQuestion } = questionData;

      // 36-39 savollar (index 35..38): matnni bevosita kiritish (tugmasiz)
      if (questionIndex >= 35 && questionIndex <= 38) {
        await ctx.reply(
          `📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n` +
          `Iltimos, javobni matn ko\'rinishida kiriting:`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // 40-44 savollar (index 39..43): A/B qismlarini matn ko'rinishida olish
      if (questionIndex >= 39 && questionIndex <= 43) {
        const user = await UserService.getUser(telegramId);
        const qId = (question as any).id;
        const hasA = user?.answers?.get?.(`${qId}__A`);
        const partLabel = hasA ? 'B' : 'A';
        const prompt = `📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n${currentQuestion} savol ${partLabel} qismini kiriting:`;
        await ctx.reply(prompt, { parse_mode: 'Markdown' });
        return;
      }

      // Boshqa savollar: variantni tugmalar bilan
      await ctx.reply(
        `📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n` +
        `Qog'ozdan savolni o'qing va quyidagi variantlardan birini tanlang:`,
        { 
          parse_mode: 'Markdown',
          reply_markup: getAnswerKeyboard(question.options)
        }
      );
    } catch (error) {
      console.error('Show question error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async handleAnswer(ctx: Context, answer: string) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user || !user.currentTest) return;

      const test = await TestService.getTestById(user.currentTest);
      if (!test) return;

      const currentQuestion = test.questions[user.currentQuestion || 0];
      if (!currentQuestion) return;

      const qIdx = user.currentQuestion || 0;

      // 36-39 (index 35..38): matnli javob (bitta qiymat)
      if (qIdx >= 35 && qIdx <= 38) {
        await UserService.saveAnswer(telegramId, currentQuestion.id, answer);
        if ((qIdx + 1) < test.questions.length) {
          const updatedUser = await UserService.nextQuestion(telegramId);
          await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || (qIdx + 1));
        } else {
          await this.completeTest(ctx, user.currentTest);
        }
        return;
      }

      // 40-44 (index 39..43): ikki qismli matnli javob
      if (qIdx >= 39 && qIdx <= 43) {
        const qId = currentQuestion.id;
        const existingA = user.answers.get(`${qId}__A`);
        if (!existingA) {
          // A qismini saqlaymiz, B so'raymiz
          await UserService.saveAnswer(telegramId, `${qId}__A`, answer);
          await this.showQuestion(ctx, user.currentTest, qIdx); // B ni so'rash
          return;
        }
        // B qismini saqlab, birlashtiramiz va keyingi savolga o'tamiz
        await UserService.saveAnswer(telegramId, `${qId}__B`, answer);
        const combined = JSON.stringify({ A: existingA, B: answer });
        await UserService.saveAnswer(telegramId, qId, combined);

        // Keyingisiga o'tish
        const updatedUser = await UserService.nextQuestion(telegramId);
        if ((qIdx + 1) < test.questions.length) {
          await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || (qIdx + 1));
        } else {
          await this.completeTest(ctx, user.currentTest);
        }
        return;
      }

      // Oddiy savollar (variantli)
      await UserService.saveAnswer(telegramId, currentQuestion.id, answer);
      if ((user.currentQuestion || 0) + 1 < test.questions.length) {
        const updatedUser = await UserService.nextQuestion(telegramId);
        await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || 0);
      } else {
        await this.completeTest(ctx, user.currentTest);
      }
    } catch (error) {
      console.error('Handle answer error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async completeTest(ctx: Context, testId: string) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user) return;

      const test = await TestService.getTestById(testId);
      if (!test) return;

      // Calculate score
      const scoreData = await TestService.calculateScore(testId, user.answers);
      
      // Save test result
      await TestService.saveTestResult(
        user.telegramId.toString(),
        testId,
        user.answers
      );

      // Update user - clear current test and reset state
      await UserService.completeTest(telegramId, testId, scoreData.score);

      // Verify the user state was properly updated
      const updatedUser = await UserService.getUser(telegramId);
      console.log('✅ Test completed. User state:', {
        telegramId: updatedUser?.telegramId,
        currentTest: updatedUser?.currentTest,
        currentQuestion: updatedUser?.currentQuestion
      });

      await ctx.reply(
        messages.test.completed,
        { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard().reply_markup
        }
      );
    } catch (error) {
      console.error('Complete test error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async continueCurrentTest(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user || !user.currentTest) {
        await ctx.reply('Joriy test topilmadi.');
        return;
      }

      const test = await TestService.getTestById(user.currentTest);
      if (!test) {
        // Stale test reference: reset once and show selection
        await UserService.resetCurrentTest(telegramId);
        await ctx.reply('⛔️ Avvalgi test topilmadi. Iltimos, yangi test tanlang.');
        await this.showTestSelection(ctx, { force: true });
        return;
      }

      // Joriy savolni ko'rsatish
      await this.showQuestion(ctx, user.currentTest, user.currentQuestion || 0);
    } catch (error) {
      console.error('Continue test error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async startNewTest(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      console.log('🔄 startNewTest called for user:', telegramId);
      
      const user = await UserService.getUser(telegramId);
      if (!user) {
        console.log('❌ User not found:', telegramId);
        await ctx.reply('Foydalanuvchi topilmadi.');
        return;
      }

      console.log('👤 User found:', { 
        telegramId: user.telegramId, 
        currentTest: user.currentTest,
        isRegistered: user.isRegistered 
      });

      // Joriy testni bekor qilish (barqaror)
      const resetResult = await UserService.resetCurrentTest(telegramId);
      console.log('🔄 Test reset result:', resetResult ? 'Success' : 'Failed');

      await ctx.reply('✅ Avvalgi test tugatildi. Yangi test tanlang:');
      
      // Yangi test tanlash (force)
      await this.showTestSelection(ctx, { force: true });
    } catch (error) {
      console.error('❌ Start new test error:', error);
      await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
  }

  static async showResults(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user || !user.isRegistered) {
        await ctx.reply(messages.errors.alreadyRegistered);
        return;
      }

      const results = await TestService.getUserResults((user as any)._id.toString());
      
      if (results.length === 0) {
        await ctx.reply(
          messages.results.noResults,
          { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard().reply_markup }
        );
        return;
      }

      let resultsText = '';
      results.forEach((result, index) => {
        resultsText += `${index + 1}. ${(result as any).testId?.title || 'Test'}\n`;
        resultsText += `   Ball: ${result.score}/${result.totalQuestions}\n`;
        resultsText += `   Foiz: ${result.percentage}%\n`;
        resultsText += `   Sana: ${result.completedAt.toLocaleDateString('uz-UZ')}\n\n`;
      });

      await ctx.reply(
        messages.results.userResults
          .replace('{results}', resultsText)
          .replace('{totalScore}', user.totalScore.toString()),
        { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard().reply_markup
        }
      );
    } catch (error) {
      console.error('Show results error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async completeCurrentTest(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user || !user.currentTest) {
        await ctx.reply('Joriy test topilmadi.');
        return;
      }

      await this.completeTest(ctx, user.currentTest);
    } catch (error) {
      console.error('Complete current test error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async nextQuestion(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.getUser(telegramId);
      if (!user || !user.currentTest) {
        await ctx.reply('Joriy test topilmadi.');
        return;
      }

      const test = await TestService.getTestById(user.currentTest);
      if (!test) {
        await ctx.reply('Test topilmadi.');
        return;
      }

      // Keyingi savolni ko'rsatish
      const nextQuestionIndex = (user.currentQuestion || 0) + 1;
      if (nextQuestionIndex < test.questions.length) {
        await UserService.nextQuestion(telegramId);
        await this.showQuestion(ctx, user.currentTest, nextQuestionIndex);
      } else {
        await ctx.reply('Bu testning oxirgi savoli. Testni yakunlash uchun "🏁 Testni yakunlash" tugmasini bosing.');
      }
    } catch (error) {
      console.error('Next question error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }
}
