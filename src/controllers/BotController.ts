import { Context } from 'telegraf';
import { UserController } from './UserController';
import { TestController } from './TestController';
import { UserService } from '../services/UserService';
import { TestService } from '../services/TestService';
import { messages } from '../utils/messages';
import { getMainMenuKeyboard } from '../utils/keyboards';

export class BotController {
  static async handleMessage(ctx: Context) {
    const telegramId = ctx.from?.id;
    const text = (ctx.message as any)?.text;
    
    if (!telegramId || !text) return;

    try {
      const user = await UserService.getUser(telegramId);
      
      // Handle registration flow
      if (!user || !user.isRegistered) {
        if (text === '🔙 Orqaga') {
          await UserController.start(ctx);
          return;
        }
        
        if (!user?.firstName || !user?.lastName || user.firstName === '' || user.lastName === '') {
          await UserController.handleFirstName(ctx);
          return;
        }
        
        if (!user?.phoneNumber) {
          await UserController.handlePhone(ctx);
          return;
        }
      }

      // Handle main menu
      switch (text) {
        case '📝 Test yechish':
          await TestController.showTestSelection(ctx, { force: true });
          break;
          
        case '📊 Natijalarim':
          await TestController.showResults(ctx);
          break;
          
        case 'ℹ️ Ma\'lumot':
          await ctx.reply(
            `ℹ️ *Bot haqida ma'lumot*\n\n` +
            `Bu bot o'zbek tili fanidan testlarni yechish uchun yaratilgan.\n\n` +
            `Imkoniyatlar:\n` +
            `• Turli mavzulardagi testlar\n` +
            `• Natijalarni saqlash\n` +
            `• Reyting tizimi\n\n` +
            `Bot yaratuvchisi: @your_username`,
            { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard().reply_markup }
          );
          break;
          
        case '⚙️ Sozlamalar':
          await ctx.reply(
            '⚙️ *Sozlamalar*\n\nHozircha sozlamalar mavjud emas.',
            { parse_mode: 'Markdown', reply_markup: getMainMenuKeyboard().reply_markup }
          );
          break;
          
        case '🏁 Testni yakunlash':
          await TestController.completeCurrentTest(ctx);
          break;
          
        case '⏭️ Keyingi savol':
          await TestController.nextQuestion(ctx);
          break;
        
        case '🧹 Avvalgi testni tugatish':
          await TestController.startNewTest(ctx);
          break;
          
        case '🔙 Orqaga':
          await UserController.showMainMenu(ctx);
          break;
          
        default:
          // Check if it's a test title (robust, case/space-insensitive)
          if (user?.isRegistered && !user.currentTest) {
            const test = await TestService.getActiveTestByTitle(text);
            if (test) {
              await TestController.startTest(ctx, test.title);
              return;
            }
          }
          
          // Check if user is taking a test
          if (user?.currentTest) {
            await TestController.handleAnswer(ctx, text);
            return;
          }
          
          await ctx.reply(messages.errors.invalidInput);
      }
    } catch (error) {
      console.error('Handle message error:', error);
      await ctx.reply(messages.errors.invalidInput);
    }
  }

  static async handleCallbackQuery(ctx: Context) {
    const callbackData = (ctx.callbackQuery as any)?.data;
    const telegramId = ctx.from?.id;
    
    if (!callbackData || !telegramId) return;

    try {
      if (callbackData.startsWith('start_test_')) {
        const testId = callbackData.replace('start_test_', '');
        await TestController.showQuestion(ctx, testId, 0);
        await ctx.answerCbQuery('Test boshlandi!');
      } else if (callbackData.startsWith('answer_')) {
        const answer = callbackData.replace('answer_', '');
        await TestController.handleAnswer(ctx, answer);
        await ctx.answerCbQuery('Javob qabul qilindi!');
      }
    } catch (error) {
      console.error('Handle callback error:', error);
      await ctx.answerCbQuery('Xatolik yuz berdi!');
    }
  }

  static async handleContact(ctx: Context) {
    await UserController.handlePhone(ctx);
  }
}
