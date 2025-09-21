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
            if (user.currentTest) {
                await ctx.reply(messages_1.messages.errors.testInProgress);
                return;
            }
            // Find test by title (case/space-insensitive)
            const test = await TestService_1.TestService.getActiveTestByTitle(testTitle);
            if (!test) {
                await ctx.reply(messages_1.messages.errors.testNotFound);
                return;
            }
            await UserService_1.UserService.startTest(telegramId, test._id.toString());
            const timeLimitText = test.timeLimit ? `${test.timeLimit} daqiqa` : 'Cheklanmagan';
            await ctx.reply(`🎯 *${test.title}* testi boshlandi!\n\n` +
                `Savollar soni: ${test.totalQuestions}\n` +
                `Vaqt chegarasi: ${timeLimitText}\n\n` +
                `📄 *Eslatma:* Savollar qog'ozda berilgan. Siz faqat variantlarni tanlaysiz.`, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: '🚀 Boshla', callback_data: `start_test_${test._id}` }]] }
            });
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
            await ctx.reply(`📝 *Savol ${currentQuestion}/${totalQuestions}*\n\n` +
                `Qog'ozdan savolni o'qing va quyidagi variantlardan birini tanlang:`, {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.getAnswerKeyboard)(question.options)
            });
            // Test boshqaruvi tugmalari
            await ctx.reply('Test boshqaruvi:', {
                reply_markup: (0, keyboards_1.getTestNavigationKeyboard)().reply_markup
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
            // Save answer
            await UserService_1.UserService.saveAnswer(telegramId, currentQuestion.id, answer);
            // Check if there are more questions
            if ((user.currentQuestion || 0) + 1 < test.questions.length) {
                const updatedUser = await UserService_1.UserService.nextQuestion(telegramId);
                await this.showQuestion(ctx, user.currentTest, updatedUser?.currentQuestion || 0);
            }
            else {
                // Test completed
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
            await ctx.reply(messages_1.messages.test.completed
                .replace('{correctAnswers}', scoreData.correctAnswers.toString())
                .replace('{totalQuestions}', scoreData.totalQuestions.toString())
                .replace('{percentage}', scoreData.percentage.toString())
                .replace('{score}', scoreData.score.toString()), {
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
    static async showResults(ctx) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            if (!user || !user.isRegistered) {
                await ctx.reply(messages_1.messages.errors.alreadyRegistered);
                return;
            }
            const results = await TestService_1.TestService.getUserResults(user._id.toString());
            if (results.length === 0) {
                await ctx.reply(messages_1.messages.results.noResults, { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup });
                return;
            }
            let resultsText = '';
            results.forEach((result, index) => {
                resultsText += `${index + 1}. ${result.testId?.title || 'Test'}\n`;
                resultsText += `   Ball: ${result.score}/${result.totalQuestions}\n`;
                resultsText += `   Foiz: ${result.percentage}%\n`;
                resultsText += `   Sana: ${result.completedAt.toLocaleDateString('uz-UZ')}\n\n`;
            });
            await ctx.reply(messages_1.messages.results.userResults
                .replace('{results}', resultsText)
                .replace('{totalScore}', user.totalScore.toString()), {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup
            });
        }
        catch (error) {
            console.error('Show results error:', error);
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