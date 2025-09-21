"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
}
exports.bot = new telegraf_1.Telegraf(BOT_TOKEN, {
    handlerTimeout: 30000
});
// Xatolik boshqarish
exports.bot.catch((err) => {
    console.error('Bot error:', err);
});
exports.default = exports.bot;
//# sourceMappingURL=bot.js.map