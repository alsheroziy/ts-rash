import { bot } from './config/bot';
import { connectDatabase } from './config/database';
import { BotController } from './controllers/BotController';
import { UserController } from './controllers/UserController';
import { seedTestData } from './utils/seedData';
import { AdminController } from './controllers/AdminController';

connectDatabase().then(async () => {
  if (process.env.SEED_ON_START === 'true') {
    await seedTestData();
  }
  
  bot.start(UserController.start);
  bot.command('admin', AdminController.start);
  bot.on('text', async (ctx) => {
    // Route admin when in active admin flow OR when tapping admin menu items
    const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
    const isAdmin = !!ctx.from?.id && !!ADMIN_ID && ctx.from.id === ADMIN_ID;
    const text = (ctx.message as any)?.text?.trim();
    const isAdminMenuText = text === '🧪 Test yaratish'
      || text === '📋 Testlar ro\'yxati'
      || text === '📊 Natijalar'
      || text === '🔙 Orqaga';
    const shouldRouteToAdmin = isAdmin && (isAdminMenuText || AdminController.hasActiveSession(ctx.from!.id));

    if (shouldRouteToAdmin) {
      await AdminController.handleMessage(ctx);
      return;
    }
    await BotController.handleMessage(ctx);
  });
  bot.on('contact', BotController.handleContact);
  bot.on('callback_query', async (ctx) => {
    // Route admin callbacks for admin_* actions or when in active admin flow
    const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
    const isAdmin = !!ctx.from?.id && !!ADMIN_ID && ctx.from.id === ADMIN_ID;
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    const isAdminAction = !!data && /^admin_/.test(data);
    const shouldRouteToAdmin = isAdmin && (isAdminAction || AdminController.hasActiveSession(ctx.from!.id));

    if (shouldRouteToAdmin) {
      await AdminController.handleCallbackQuery(ctx);
      return;
    }
    await BotController.handleCallbackQuery(ctx);
  });

  bot.catch((err: any) => {
    console.error('Bot error:', err);
  });

  const startBot = async () => {
    try {
      await bot.launch();
      console.log('🤖 Bot ishga tushdi!');
    } catch (error) {
      console.error('❌ Bot ishga tushmadi:', error);
      console.log('🔄 5 soniyadan keyin qayta urinilmoqda...');
      setTimeout(startBot, 5000);
    }
  };

  startBot();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}).catch((error) => {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
});
