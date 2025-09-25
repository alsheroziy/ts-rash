"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotController = void 0;
const UserController_1 = require("./UserController");
const TestController_1 = require("./TestController");
const UserService_1 = require("../services/UserService");
const TestService_1 = require("../services/TestService");
const messages_1 = require("../utils/messages");
const AdminController_1 = require("./AdminController");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
class BotController {
    static async handleMessage(ctx) {
        const telegramId = ctx.from?.id;
        const text = ctx.message?.text;
        if (!telegramId || !text)
            return;
        try {
            // Admin routing (only for ADMIN_ID)
            if (ADMIN_ID && telegramId === ADMIN_ID) {
                if (text === '🧪 Test yaratish' || text === '📋 Testlar ro\'yxati' || text === '🔙 Orqaga') {
                    await AdminController_1.AdminController.handleMessage(ctx);
                    return;
                }
                if (AdminController_1.AdminController.hasActiveSession(telegramId)) {
                    const user = await UserService_1.UserService.getUser(telegramId);
                    if (user?.isRegistered && !user.currentTest) {
                        const normalized = text.trim().replace(/\s+/g, ' ');
                        const found = await TestService_1.TestService.getActiveTestByTitle(normalized);
                        if (found) {
                            await TestController_1.TestController.startTest(ctx, found.title);
                            return;
                        }
                    }
                    // Otherwise, forward to AdminController
                    await AdminController_1.AdminController.handleMessage(ctx);
                    return;
                }
            }
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
                case '🏁 Testni yakunlash':
                    await TestController_1.TestController.completeCurrentTest(ctx);
                    break;
                case '⏭️ Keyingi savol':
                    await TestController_1.TestController.nextQuestion(ctx);
                    break;
                case '🧹 Avvalgi testni tugatish':
                    await TestController_1.TestController.startNewTest(ctx);
                    break;
                case '📊 Natijalarim':
                    await TestController_1.TestController.showResults(ctx);
                    break;
                case '🔙 Orqaga':
                    await UserController_1.UserController.showMainMenu(ctx);
                    break;
                default:
                    // Check if user is taking a test - this should be checked first
                    if (user?.currentTest) {
                        console.log('📝 User is taking test, handling as answer:', text);
                        await TestController_1.TestController.handleAnswer(ctx, text);
                        return;
                    }
                    // Check if it's a test title (robust, case/space-insensitive)
                    // Only if user is registered and not currently taking a test
                    if (user?.isRegistered && !user.currentTest) {
                        console.log('🔍 Checking if text is a test title:', text);
                        const normalized = text.trim().replace(/\s+/g, ' ');
                        const test = await TestService_1.TestService.getActiveTestByTitle(normalized);
                        if (test) {
                            console.log('✅ Found test, starting:', test.title);
                            await TestController_1.TestController.startTest(ctx, test.title);
                            return;
                        }
                    }
                    console.log('❌ Invalid input, no matching action found for:', text);
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
            // Admin callback routing
            if (ADMIN_ID && telegramId === ADMIN_ID && (callbackData.startsWith('admin_'))) {
                await AdminController_1.AdminController.handleCallbackQuery(ctx);
                return;
            }
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