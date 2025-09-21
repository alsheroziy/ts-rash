"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
const messages_1 = require("../utils/messages");
const keyboards_1 = require("../utils/keyboards");
class UserController {
    static async start(ctx) {
        const telegramId = ctx.from?.id;
        if (!telegramId)
            return;
        try {
            const user = await UserService_1.UserService.findOrCreateUser(telegramId);
            // Eski testni tugatish
            if (user.currentTest) {
                await UserService_1.UserService.updateUser(telegramId, {
                    currentTest: undefined,
                    currentQuestion: 0,
                    answers: new Map()
                });
                console.log('🔄 Eski test tugatildi');
            }
            if (user.isRegistered) {
                await ctx.reply(`Salom, ${user.firstName || ''} ${user.lastName || ''}! 👋\n\n` + messages_1.messages.welcome, { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup });
            }
            else {
                await ctx.reply(messages_1.messages.registration.firstName, { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getBackKeyboard)().reply_markup });
                await UserService_1.UserService.updateUser(telegramId, { currentQuestion: 0 });
            }
        }
        catch (error) {
            console.error('Start error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async handleFirstName(ctx) {
        const telegramId = ctx.from?.id;
        const fullName = ctx.message?.text?.trim();
        if (!telegramId || !fullName)
            return;
        try {
            // Split full name into parts
            const nameParts = fullName.trim().split(/\s+/);
            if (nameParts.length < 2) {
                await ctx.reply('❌ *Iltimos, to\'liq ism va familiyangizni kiriting.*\n\nMasalan: Shehroz Raxmatov', { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getBackKeyboard)().reply_markup });
                return;
            }
            // First part is first name, rest is last name
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            await UserService_1.UserService.updateUser(telegramId, { firstName, lastName });
            await ctx.reply(messages_1.messages.registration.phone, { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getPhoneKeyboard)().reply_markup });
        }
        catch (error) {
            console.error('First name error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async handlePhone(ctx) {
        const telegramId = ctx.from?.id;
        let phoneNumber = '';
        // Check if it's a contact
        if (ctx.message?.contact?.phone_number) {
            phoneNumber = ctx.message.contact.phone_number;
        }
        else if (ctx.message?.text) {
            phoneNumber = ctx.message.text.trim();
        }
        if (!telegramId || !phoneNumber)
            return;
        try {
            await UserService_1.UserService.updateUser(telegramId, {
                phoneNumber,
                isRegistered: true
            });
            const user = await UserService_1.UserService.getUser(telegramId);
            if (user) {
                await ctx.reply(messages_1.messages.registration.success
                    .replace('{firstName}', user.firstName || '')
                    .replace('{lastName}', user.lastName || '')
                    .replace('{phone}', user.phoneNumber || ''), {
                    parse_mode: 'Markdown',
                    reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup
                });
            }
        }
        catch (error) {
            console.error('Phone error:', error);
            await ctx.reply(messages_1.messages.errors.invalidInput);
        }
    }
    static async showMainMenu(ctx) {
        await ctx.reply('🏠 *Bosh menyu*', { parse_mode: 'Markdown', reply_markup: (0, keyboards_1.getMainMenuKeyboard)().reply_markup });
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map