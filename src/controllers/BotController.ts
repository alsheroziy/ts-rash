import { Context } from 'telegraf';
import { UserController } from './UserController';
import { TestController } from './TestController';
import { UserService } from '../services/UserService';
import { TestService } from '../services/TestService';
import { messages } from '../utils/messages';
import { getMainMenuKeyboard } from '../utils/keyboards';
import { AdminController } from './AdminController';
import dotenv from 'dotenv';

dotenv.config();
const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;

export class BotController {
  static async handleMessage(ctx: Context) {
    const telegramId = ctx.from?.id;
    const text = (ctx.message as any)?.text;
    
    if (!telegramId || !text) return;

    try {
      // Admin routing (only for ADMIN_ID)
      if (ADMIN_ID && telegramId === ADMIN_ID) {
        if (text === '🧪 Test yaratish' || text === '📋 Testlar ro\'yxati' || text === '🔙 Orqaga') {
          await AdminController.handleMessage(ctx);
          return;
        }
        if (AdminController.hasActiveSession(telegramId)) {
          const user = await UserService.getUser(telegramId);
          if (user?.isRegistered && !user.currentTest) {
            const normalized = text.trim().replace(/\s+/g, ' ');
            const found = await TestService.getActiveTestByTitle(normalized);
            if (found) {
              await TestController.startTest(ctx, found.title);
              return;
            }
          }
          // Otherwise, forward to AdminController
          await AdminController.handleMessage(ctx);
          return;
        }
      }

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
          // Check if user is taking a test - this should be checked first
          if (user?.currentTest) {
            console.log('📝 User is taking test, handling as answer:', text);
            await TestController.handleAnswer(ctx, text);
            return;
          }
          
          // Check if it's a test title (robust, case/space-insensitive)
          // Only if user is registered and not currently taking a test
          if (user?.isRegistered && !user.currentTest) {
            console.log('🔍 Checking if text is a test title:', text);
            const normalized = text.trim().replace(/\s+/g, ' ');
            const test = await TestService.getActiveTestByTitle(normalized);
            if (test) {
              console.log('✅ Found test, starting:', test.title);
              await TestController.startTest(ctx, test.title);
              return;
            }
          }
          
          console.log('❌ Invalid input, no matching action found for:', text);
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
      // Admin callback routing
      if (ADMIN_ID && telegramId === ADMIN_ID && (callbackData.startsWith('admin_'))) {
        await AdminController.handleCallbackQuery(ctx);
        return;
      }

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
