"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotController = void 0;
const UserController_1 = require("./UserController");
const TestController_1 = require("./TestController");
const UserService_1 = require("../services/UserService");
const TestService_1 = require("../services/TestService");
const messages_1 = require("../utils/messages");
const keyboards_1 = require("../utils/keyboards");
class BotController {
    static async handleMessage(ctx) {
        const telegramId = ctx.from?.id;
        const text = ctx.message?.text;
        if (!telegramId || !text)
            return;
        try {
            const user = await UserService_1.UserService.getUser(telegramId);
            // Handle registration flow
            if (!user || !user.isRegistered) {
                if (text === '🔙 Orqaga') {
                    await UserController_1.UserController.start(ctx);
                    return;
                }
                if (!user?.firstName || !user?.lastName || user.firstName === '' || user.lastName === '') {
                    await UserController_1.UserController.handleFirstName(ctx);
                    return;
                }
                if (!user?.phoneNumber) {
                    await UserController_1.UserController.handlePhone(ctx);
                    return;
                }
            }
            // Handle main menu
            switch (text) {
                case '📝 Test yechish':
                    await TestController_1.TestController.showTestSelection(ctx, { force: true });
                    break;
                case '📊 Natijalarim':
                    await TestController_1.TestController.showResults(ctx);
                    break;
                case 'ℹ️ Ma\'lumot':
                    await ctx.reply(`ℹ️ *Bot haqida ma'lumot*\n\n` +
                        `Bu bot o'zbek tili fanidan testlarni yechish uchun yaratilgan.\n\n` +
                        `Imkoniyatlar:\n` +
                        `• Turli mavzulardagi testlar\n` +
                        `• Natijalarni saqlash\n` +
                        `• Reyting tizimi\n\n` +
                        `Bot yaratuvchisi: @your_username`, { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup });
                    break;
                case '⚙️ Sozlamalar':
                    await ctx.reply('⚙️ *Sozlamalar*\n\nHozircha sozlamalar mavjud emas.', { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup });
                    break;
                case '🏁 Testni yakunlash':
                    await TestController_1.TestController.completeCurrentTest(ctx);
                    break;
                case '⏭️ Keyingi savol':
                    await TestController_1.TestController.nextQuestion(ctx);
                    break;
                case '🧹 Avvalgi testni tugatish':
                    await TestController_1.TestController.startNewTest(ctx);
                    break;
                case '🔙 Orqaga':
                    await UserController_1.UserController.showMainMenu(ctx);
                    break;
                default:
                    // Check if it's a test title (robust, case/space-insensitive)
                    if (user?.isRegistered && !user.currentTest) {
                        const test = await TestService_1.TestService.getActiveTestByTitle(text);
                        if (test) {
                            await TestController_1.TestController.startTest(ctx, test.title);
                            return;
                        }
                    }
                    // Check if user is taking a test
                    if (user?.currentTest) {
                        await TestController_1.TestController.handleAnswer(ctx, text);
                        return;
                    }
                    await ctx.reply(messages_1.messages.errors.invalidInput);
            }
        }
        catch (error) {
            console.error('Handle message error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async handleCallbackQuery(ctx) {
        const callbackData = ctx.callbackQuery?.data;
        const telegramId = ctx.from?.id;
        if (!callbackData || !telegramId)
            return;
        try {
            if (callbackData.startsWith('start_test_')) {
                const testId = callbackData.replace('start_test_', '');
                await TestController_1.TestController.showQuestion(ctx, testId, 0);
                await ctx.answerCbQuery('Test boshlandi!');
            }
            else if (callbackData.startsWith('answer_')) {
                const answer = callbackData.replace('answer_', '');
                await TestController_1.TestController.handleAnswer(ctx, answer);
                await ctx.answerCbQuery('Javob qabul qilindi!');
            }
        }
        catch (error) {
            console.error('Handle callback error:', error);
            await ctx.answerCbQuery('Xatolik yuz berdi!');
        }
    }
    static async handleContact(ctx) {
        await UserController_1.UserController.handlePhone(ctx);
    }
}
exports.BotController = BotController;
//# sourceMappingURL=BotController.js.map