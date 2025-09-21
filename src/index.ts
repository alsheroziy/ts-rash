import { bot } from './config/bot';
import { connectDatabase } from './config/database';
import { BotController } from './controllers/BotController';
import { UserController } from './controllers/UserController';
import { seedTestData } from './utils/seedData';

// Connect to database
connectDatabase().then(async () => {
  // Seed sample data
  await seedTestData();
  
  // Bot event handlers
  bot.start(UserController.start);
  bot.on('text', BotController.handleMessage);
  bot.on('contact', BotController.handleContact);
  bot.on('callback_query', BotController.handleCallbackQuery);

  // Error handling
  bot.catch((err: any) => {
    console.error('Bot error:', err);
  });

  // Start bot with retry mechanism
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

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}).catch((error) => {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
});
