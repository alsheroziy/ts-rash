"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./config/bot");
const database_1 = require("./config/database");
const BotController_1 = require("./controllers/BotController");
const UserController_1 = require("./controllers/UserController");
const seedData_1 = require("./utils/seedData");
const AdminController_1 = require("./controllers/AdminController");
(0, database_1.connectDatabase)().then(async () => {
    if (process.env.SEED_ON_START === 'true') {
        await (0, seedData_1.seedTestData)();
    }
    bot_1.bot.start(UserController_1.UserController.start);
    bot_1.bot.command('admin', AdminController_1.AdminController.start);
    bot_1.bot.on('text', async (ctx) => {
        // Route admin when in active admin flow OR when tapping admin menu items
        const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
        const isAdmin = !!ctx.from?.id && !!ADMIN_ID && ctx.from.id === ADMIN_ID;
        const text = ctx.message?.text?.trim();
        const isAdminMenuText = text === '🧪 Test yaratish'
            || text === '📋 Testlar ro\'yxati'
            || text === '📊 Natijalar'
            || text === '🔙 Orqaga';
        const shouldRouteToAdmin = isAdmin && (isAdminMenuText || AdminController_1.AdminController.hasActiveSession(ctx.from.id));
        if (shouldRouteToAdmin) {
            await AdminController_1.AdminController.handleMessage(ctx);
            return;
        }
        await BotController_1.BotController.handleMessage(ctx);
    });
    bot_1.bot.on('contact', BotController_1.BotController.handleContact);
    bot_1.bot.on('callback_query', async (ctx) => {
        // Route admin callbacks for admin_* actions or when in active admin flow
        const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
        const isAdmin = !!ctx.from?.id && !!ADMIN_ID && ctx.from.id === ADMIN_ID;
        const data = ctx.callbackQuery?.data;
        const isAdminAction = !!data && /^admin_/.test(data);
        const shouldRouteToAdmin = isAdmin && (isAdminAction || AdminController_1.AdminController.hasActiveSession(ctx.from.id));
        if (shouldRouteToAdmin) {
            await AdminController_1.AdminController.handleCallbackQuery(ctx);
            return;
        }
        await BotController_1.BotController.handleCallbackQuery(ctx);
    });
    bot_1.bot.catch((err) => {
        console.error('Bot error:', err);
    });
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
    process.once('SIGINT', () => bot_1.bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot_1.bot.stop('SIGTERM'));
}).catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map