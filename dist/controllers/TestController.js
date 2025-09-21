"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const UserService_1 = require("../services/UserService");
const TestService_1 = require("../services/TestService");
const messages_1 = require("../utils/messages");
const keyboards_1 = require("../utils/keyboards");
class TestController {
    static async showTestSelection(ctx, opts) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.isRegistered) {
                await ctx.reply(messages_1.messages.errors.alreadyRegistered);
                return;
            }
            if (user.currentTest && !opts?.force) {
                // Joriy testni davom ettirish
                await this.continueCurrentTest(ctx);
                return;
            }
            const tests = await TestService_1.TestService.getAllActiveTests();
            console.log('📊 Found tests:', tests.length);
            console.log('Test details:', tests.map(t => ({ title: t.title, isActive: t.isActive })));
            if (tests.length === 0) {
                await ctx.reply('Hozircha hech qanday test mavjud emas.');
                return;
            }
            await ctx.reply(messages_1.messages.test.selection, {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.getTestSelectionKeyboard)(tests).reply_markup
            });
        }
        catch (error) {
            console.error('Test selection error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async startTest(ctx, testTitle) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.isRegistered) {
                await ctx.reply(messages_1.messages.errors.alreadyRegistered);
                return;
            }
            // If a previous test was in progress, reset it and proceed
            if (user.currentTest) {
                await UserService_1.UserService.resetCurrentTest(telegramId);
            }
            // Find test by title (case/space-insensitive)
            const test = await TestService_1.TestService.getActiveTestByTitle(testTitle);
            if (!test) {
                await ctx.reply(messages_1.messages.errors.testNotFound);
                return;
            }
            await UserService_1.UserService.startTest(telegramId, test._id.toString());
            // Immediately show the first question (no extra start button)
            await this.showQuestion(ctx, test._id.toString(), 0);
        }
        catch (error) {
            console.error('Start test error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async showQuestion(ctx, testId, questionIndex = 0) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const questionData = await TestService_1.TestService.getTestQuestion(testId, questionIndex);
            if (!questionData) {
                await ctx.reply('Savol topilmadi.');
                return;
            }
            const { question, totalQuestions, currentQuestion } = questionData;
            // 36-39 savollar (index 35..38): matnni bevosita kiritish (tugmasiz)
            if (questionIndex >= 35 && questionIndex <= 38) {
                await ctx.reply(`📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n` +
                    `Iltimos, javobni matn ko\'rinishida kiriting:`, { parse_mode: 'Markdown' });
                return;
            }
            // 40-44 savollar (index 39..43): A/B qismlarini matn ko'rinishida olish
            if (questionIndex >= 39 && questionIndex <= 43) {
                const user = await UserService_1.UserService.getUser(telegramId);
                const qId = question.id;
                const hasA = user?.answers?.get?.(`${qId}__A`);
                const partLabel = hasA ? 'B' : 'A';
                const prompt = `📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n${currentQuestion} savol ${partLabel} qismini kiriting:`;
                await ctx.reply(prompt, { parse_mode: 'Markdown' });
                return;
            }
            // Boshqa savollar: variantni tugmalar bilan
            await ctx.reply(`📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n` +
                `Qog'ozdan savolni o'qing va quyidagi variantlardan birini tanlang:`, {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.getAnswerKeyboard)(question.options)
            });
        }
        catch (error) {
            console.error('Show question error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async handleAnswer(ctx, answer) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.currentTest)
                return;
            const test = await TestService_1.TestService.getTestById(user.currentTest);
            if (!test)
                return;
            const currentQuestion = test.questions[user.currentQuestion || 0];
            if (!currentQuestion)
                return;
            const qIdx = user.currentQuestion || 0;
            // 36-39 (index 35..38): matnli javob (bitta qiymat)
            if (qIdx >= 35 && qIdx <= 38) {
                await UserService_1.UserService.saveAnswer(telegramId, currentQuestion.id, answer);
                if ((qIdx + 1) < test.questions.length) {
                    const updatedUser = await UserService_1.UserService.nextQuestion(telegramId);
                    await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || (qIdx + 1));
                }
                else {
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
                    await UserService_1.UserService.saveAnswer(telegramId, `${qId}__A`, answer);
                    await this.showQuestion(ctx, user.currentTest, qIdx); // B ni so'rash
                    return;
                }
                // B qismini saqlab, birlashtiramiz va keyingi savolga o'tamiz
                await UserService_1.UserService.saveAnswer(telegramId, `${qId}__B`, answer);
                const combined = JSON.stringify({ A: existingA, B: answer });
                await UserService_1.UserService.saveAnswer(telegramId, qId, combined);
                // Keyingisiga o'tish
                const updatedUser = await UserService_1.UserService.nextQuestion(telegramId);
                if ((qIdx + 1) < test.questions.length) {
                    await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || (qIdx + 1));
                }
                else {
                    await this.completeTest(ctx, user.currentTest);
                }
                return;
            }
            // Oddiy savollar (variantli)
            await UserService_1.UserService.saveAnswer(telegramId, currentQuestion.id, answer);
            if ((user.currentQuestion || 0) + 1 < test.questions.length) {
                const updatedUser = await UserService_1.UserService.nextQuestion(telegramId);
                await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || 0);
            }
            else {
                await this.completeTest(ctx, user.currentTest);
            }
        }
        catch (error) {
            console.error('Handle answer error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async completeTest(ctx, testId) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user)
                return;
            const test = await TestService_1.TestService.getTestById(testId);
            if (!test)
                return;
            // Calculate score
            const scoreData = await TestService_1.TestService.calculateScore(testId, user.answers);
            // Save test result
            await TestService_1.TestService.saveTestResult(user._id.toString(), testId, user.answers);
            // Update user
            await UserService_1.UserService.completeTest(telegramId, testId, scoreData.score);
            await ctx.reply(messages_1.messages.test.completed, {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup
            });
        }
        catch (error) {
            console.error('Complete test error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async continueCurrentTest(ctx) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.currentTest) {
                await ctx.reply('Joriy test topilmadi.');
                return;
            }
            const test = await TestService_1.TestService.getTestById(user.currentTest);
            if (!test) {
                // Stale test reference: reset once and show selection
                await UserService_1.UserService.resetCurrentTest(telegramId);
                await ctx.reply('⛔️ Avvalgi test topilmadi. Iltimos, yangi test tanlang.');
                await this.showTestSelection(ctx, { force: true });
                return;
            }
            // Joriy savolni ko'rsatish
            await this.showQuestion(ctx, user.currentTest, user.currentQuestion || 0);
        }
        catch (error) {
            console.error('Continue test error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async startNewTest(ctx) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user)
                return;
            // Joriy testni bekor qilish (barqaror)
            await UserService_1.UserService.resetCurrentTest(telegramId);
            await ctx.reply('✅ Avvalgi test tugatildi. Iltimos, yangi test tanlang.');
            // Yangi test tanlash (force)
            await this.showTestSelection(ctx, { force: true });
        }
        catch (error) {
            console.error('Start new test error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async completeCurrentTest(ctx) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.currentTest) {
                await ctx.reply('Joriy test topilmadi.');
                return;
            }
            await this.completeTest(ctx, user.currentTest);
        }
        catch (error) {
            console.error('Complete current test error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async nextQuestion(ctx) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.currentTest) {
                await ctx.reply('Joriy test topilmadi.');
                return;
            }
            const test = await TestService_1.TestService.getTestById(user.currentTest);
            if (!test) {
                await ctx.reply('Test topilmadi.');
                return;
            }
            // Keyingi savolni ko'rsatish
            const nextQuestionIndex = (user.currentQuestion || 0) + 1;
            if (nextQuestionIndex < test.questions.length) {
                await UserService_1.UserService.nextQuestion(telegramId);
                await this.showQuestion(ctx, user.currentTest, nextQuestionIndex);
            }
            else {
                await ctx.reply('Bu testning oxirgi savoli. Testni yakunlash uchun "🏁 Testni yakunlash" tugmasini bosing.');
            }
        }
        catch (error) {
            console.error('Next question error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
}
exports.TestController = TestController;
//# sourceMappingURL=TestController.js.map