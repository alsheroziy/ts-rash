import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required');
}

export const bot = new Telegraf(BOT_TOKEN, {
  handlerTimeout: 30000
});

// Xatolik boshqarish
bot.catch((err: any) => {
  console.error('Bot error:', err);
});

export default bot;
