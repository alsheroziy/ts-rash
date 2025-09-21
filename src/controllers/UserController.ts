import { Context } from 'telegraf';
import { UserService } from '../services/UserService';
import { messages } from '../utils/messages';
import { getMainMenuKeyboard, getPhoneKeyboard, getBackKeyboard } from '../utils/keyboards';
import { UserState } from '../enum/UserState';

export class UserController {
  static async start(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const user = await UserService.findOrCreateUser(telegramId);
      
      // Eski testni tugatish
      if (user.currentTest) {
        await UserService.updateUser(telegramId, {
          currentTest: undefined,
          currentQuestion: 0,
          answers: new Map()
        });
        console.log('🔄 Eski test tugatildi');
      }
      
      if (user.isRegistered) {
        await ctx.reply(
          `Salom, ${user.firstName || ''} ${user.lastName || ''}! 👋\n\n` + messages.welcome,
          { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard().reply_markup }
        );
      } else {
        await ctx.reply(
          messages.registration.firstName,
          { parse_mode: 'Markdown', reply_markup: getBackKeyboard().reply_markup }
        );
        await UserService.updateUser(telegramId, { currentQuestion: 0 });
      }
    } catch (error) {
      console.error('Start error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async handleFirstName(ctx: Context) {
    const telegramId = ctx.from?.id;
    const fullName = (ctx.message as any)?.text?.trim();
    
    if (!telegramId || !fullName) return;

    try {
      // Split full name into parts
      const nameParts = fullName.trim().split(/\s+/);
      
      if (nameParts.length < 2) {
        await ctx.reply(
          '❌ *Iltimos, to\'liq ism va familiyangizni kiriting.*\n\nMasalan: Shehroz Raxmatov',
          { parse_mode: 'Markdown', reply_markup: getBackKeyboard().reply_markup }
        );
        return;
      }

      // First part is first name, rest is last name
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      await UserService.updateUser(telegramId, { firstName, lastName });
      await ctx.reply(
        messages.registration.phone,
        { parse_mode: 'Markdown', reply_markup: getPhoneKeyboard().reply_markup }
      );
    } catch (error) {
      console.error('First name error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }


  static async handlePhone(ctx: Context) {
    const telegramId = ctx.from?.id;
    let phoneNumber = '';

    // Check if it's a contact
    if ((ctx.message as any)?.contact?.phone_number) {
      phoneNumber = (ctx.message as any).contact.phone_number;
    } else if ((ctx.message as any)?.text) {
      phoneNumber = (ctx.message as any).text.trim();
    }

    if (!telegramId || !phoneNumber) return;

    try {
      await UserService.updateUser(telegramId, { 
        phoneNumber,
        isRegistered: true
      });

      const user = await UserService.getUser(telegramId);
      if (user) {
        await ctx.reply(
          messages.registration.success
            .replace('{firstName}', user.firstName || '')
            .replace('{lastName}', user.lastName || '')
            .replace('{phone}', user.phoneNumber || ''),
          { 
            parse_mode: 'Markdown', 
            reply_markup: getMainMenuKeyboard().reply_markup 
          }
        );
      }
    } catch (error) {
      console.error('Phone error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async showMainMenu(ctx: Context) {
    await ctx.reply(
      '🏠 *Bosh menyu*',
      { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard().reply_markup }
    );
  }
}
