"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./config/bot");
const database_1 = require("./config/database");
const BotController_1 = require("./controllers/BotController");
const UserController_1 = require("./controllers/UserController");
const seedData_1 = require("./utils/seedData");
// Connect to database
(0, database_1.connectDatabase)().then(async () => {
    // Seed sample data
    await (0, seedData_1.seedTestData)();
    // Bot event handlers
    bot_1.bot.start(UserController_1.UserController.start);
    bot_1.bot.on('text', BotController_1.BotController.handleMessage);
    bot_1.bot.on('contact', BotController_1.BotController.handleContact);
    bot_1.bot.on('callback_query', BotController_1.BotController.handleCallbackQuery);
    // Error handling
    bot_1.bot.catch((err) => {
        console.error('Bot error:', err);
    });
    // Start bot with retry mechanism
    const startBot = async () => {
        try {
            await bot_1.bot.launch();
            console.log('🤖 Bot ishga tushdi!');
        }
        catch (error) {
            console.error('❌ Bot ishga tushmadi:', error);
            console.log('🔄 5 soniyadan keyin qayta urinilmoqda...');
            setTimeout(startBot, 5000);
        }
    };
    startBot();
    // Graceful stop
    process.once('SIGINT', () => bot_1.bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot_1.bot.stop('SIGTERM'));
}).catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map