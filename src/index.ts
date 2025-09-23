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
    // Check if user is admin first
    const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
    const isAdmin = ctx.from?.id && ADMIN_ID && ctx.from.id === ADMIN_ID;
    
    if (isAdmin) {
      // Always handle admin messages through AdminController
      await AdminController.handleMessage(ctx);
    } else {
      // Handle regular user messages
      await BotController.handleMessage(ctx);
    }
  });
  bot.on('contact', BotController.handleContact);
  bot.on('callback_query', async (ctx) => {
    // Check if user is admin first
    const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
    const isAdmin = ctx.from?.id && ADMIN_ID && ctx.from.id === ADMIN_ID;
    
    if (isAdmin) {
      // Always handle admin callbacks through AdminController
      await AdminController.handleCallbackQuery(ctx);
    } else {
      // Handle regular user callbacks
      await BotController.handleCallbackQuery(ctx);
    }
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
