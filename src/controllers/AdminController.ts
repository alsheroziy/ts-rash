import { Context } from 'telegraf';
import dotenv from 'dotenv';
import Test from '../models/Test';
import TestResult from '../models/TestResult';
import User from '../models/User';
import { PDFService } from '../services/PDFService';
import { getAdminMenuKeyboard, getAdminCreateKeyboard, getAdminAnswerKeyboard, getBackKeyboard, getAdminTestsListKeyboard } from '../utils/keyboards';

dotenv.config();

type AdminStage = 'idle' | 'awaiting_title' | 'awaiting_description' | 'setting_answers' | 'done' | 'viewing_results';

interface AdminCreateSession {
  stage: AdminStage;
  tempTest: {
    title: string;
    description: string;
    questions: Array<{ id: string; question: string; options: string[]; correctAnswer: string; explanation?: string }>;
  } | null;
  qIndex: number; // 0..43
  abPart?: 'A' | 'B';
}

const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
const isAdminUser = (ctx: Context): boolean => {
  const uid = ctx.from?.id;
  return !!uid && !!ADMIN_ID && uid === ADMIN_ID;
};

// In-memory admin sessions
const sessions = new Map<number, AdminCreateSession>();

function ensureSession(id: number): AdminCreateSession {
  if (!sessions.has(id)) {
    sessions.set(id, { stage: 'idle', tempTest: null, qIndex: 0 });
  }
  return sessions.get(id)!;
}

function isABQuestion(index: number) {
  return index >= 39 && index <= 43; // 40..44 (0-based index)
}

function isTextQuestion(index: number) {
  return index >= 35 && index <= 38; // 36..39
}

function getOptionsForIndex(index: number): string[] {
  if (index <= 31) return ['A', 'B', 'C', 'D']; // 1..32
  if (index >= 32 && index <= 34) return ['A', 'B', 'C', 'D', 'E', 'F']; // 33..35
  if (isTextQuestion(index)) return []; // free text
  if (isABQuestion(index)) return []; // text A/B
  return ['A', 'B', 'C', 'D'];
}

function buildDefaultQuestions(): Array<{ id: string; question: string; options: string[]; correctAnswer: string; explanation?: string }>{
  const list: Array<{ id: string; question: string; options: string[]; correctAnswer: string; explanation?: string }> = [];
  for (let i = 1; i <= 44; i++) {
    const idx = i - 1;
    const options = getOptionsForIndex(idx);
    const q: { id: string; question: string; options: string[]; correctAnswer: string; explanation?: string } = {
      id: `q${i}`,
      question: `Savol ${i}`,
      options,
      correctAnswer: ''
    };
    list.push(q);
  }
  return list;
}

export class AdminController {
  static hasActiveSession(telegramId: number): boolean {
    const s = sessions.get(telegramId);
    return !!s && s.stage !== 'idle' && s.stage !== 'done';
  }

  static async start(ctx: Context) {
    if (!isAdminUser(ctx)) {
      await ctx.reply('⛔️ Siz admin emassiz.');
      return;
    }

    const tid = ctx.from!.id;
    const s = ensureSession(tid);
    s.stage = 'idle';
    s.tempTest = null;
    s.qIndex = 0;
    s.abPart = undefined;

    await ctx.reply('🛠 Admin panel', { reply_markup: getAdminMenuKeyboard().reply_markup });
  }

  static async handleMessage(ctx: Context) {
    if (!isAdminUser(ctx)) return; // ignore non-admin
    const tid = ctx.from!.id;
    const text = (ctx.message as any)?.text?.trim();
    if (!text) return;

    const s = ensureSession(tid);

    // Entry points from menu
    if (text === '🧪 Test yaratish') {
      // Directly start creation without listing existing tests
      const s = ensureSession(tid);
      s.stage = 'awaiting_title';
      s.tempTest = null;
      s.qIndex = 0;
      s.abPart = undefined;
      await ctx.reply('🏷 Yangi test nomini kiriting:', { reply_markup: getBackKeyboard().reply_markup });
      return;
    }

    if (text === '📋 Testlar ro\'yxati') {
      const tests = await Test.find({}).select('title totalQuestions isActive');
      if (tests.length === 0) {
        await ctx.reply('Hozircha testlar yo\'q.', { reply_markup: getAdminMenuKeyboard().reply_markup });
      } else {
        let msg = '📋 Mavjud testlar:\n\n';
        tests.forEach((t, i) => {
          msg += `${i + 1}. ${t.title} (${t.totalQuestions}) - ${t.isActive ? 'Active' : 'Inactive'}\n`;
        });
        await ctx.reply(msg, { reply_markup: getAdminTestsListKeyboard(tests) });
      }
      return;
    }

    if (text === '📊 Natijalar') {
      s.stage = 'viewing_results';
      const tests = await Test.find({}).select('title totalQuestions isActive');
      if (tests.length === 0) {
        await ctx.reply('Hozircha testlar yo\'q.', { reply_markup: getAdminMenuKeyboard().reply_markup });
      } else {
        let msg = '📊 Test natijalari:\n\n';
        tests.forEach((t, i) => {
          msg += `${i + 1}. ${t.title} (${t.totalQuestions} savol)\n`;
        });
        msg += '\nPDF yaratish uchun testni tanlang:';
        await ctx.reply(msg, { reply_markup: getAdminTestsListKeyboard(tests) });
      }
      return;
    }


    if (text === '🔙 Orqaga') {
      if (s.stage === 'viewing_results') {
        s.stage = 'idle';
        await ctx.reply('🛠 Admin panel', { reply_markup: getAdminMenuKeyboard().reply_markup });
      } else {
        await AdminController.start(ctx);
      }
      return;
    }


    // Creation flow
    if (s.stage === 'awaiting_title') {
      s.tempTest = {
        title: text,
        description: '',
        questions: buildDefaultQuestions()
      };
      s.stage = 'awaiting_description';
      await ctx.reply('✍️ Test uchun qisqacha ta\'rif kiriting (ixtiyoriy). O\'tkazib yuborish uchun "-" yuboring.', { reply_markup: getBackKeyboard().reply_markup });
      return;
    }

    if (s.stage === 'awaiting_description') {
      if (s.tempTest) {
        s.tempTest.description = text === '-' ? `${s.tempTest.title} (44 ta savol)` : text;
      }
      s.stage = 'setting_answers';
      s.qIndex = 0;
      s.abPart = undefined;
      await AdminController.promptNextAnswer(ctx, s);
      return;
    }

    if (s.stage === 'setting_answers') {
      // Free text answers handling for 36-39 and A/B parts for 40-44
      if (!s.tempTest) return;
      const idx = s.qIndex;
      const q = s.tempTest.questions[idx];

      if (isTextQuestion(idx)) {
        q.correctAnswer = text;
        s.qIndex++;
        await AdminController.promptNextAnswer(ctx, s);
        return;
      }

      if (isABQuestion(idx)) {
        // Manage A then B
        if (!s.abPart || s.abPart === 'A') {
          // store A
          const partial: any = { A: text };
          q.correctAnswer = JSON.stringify(partial); // temp store
          s.abPart = 'B';
          await ctx.reply(`✍️ ${idx + 1}-savol B qismining to\'g\'ri javobini kiriting:`);
          return;
        } else {
          // merge with existing A
          try {
            const prev = q.correctAnswer && q.correctAnswer.startsWith('{') ? JSON.parse(q.correctAnswer) : {};
            prev.B = text;
            q.correctAnswer = JSON.stringify(prev);
          } catch {
            q.correctAnswer = JSON.stringify({ A: '', B: text });
          }
          s.abPart = undefined;
          s.qIndex++;
          await AdminController.promptNextAnswer(ctx, s);
          return;
        }
      }
    }
  }

  static async handleCallbackQuery(ctx: Context) {
    if (!isAdminUser(ctx)) return; // only admin
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    if (!data) return;

    const tid = ctx.from!.id;
    const s = ensureSession(tid);

    try {
      if (data === 'admin_create_new') {
        s.stage = 'awaiting_title';
        s.tempTest = null;
        s.qIndex = 0;
        s.abPart = undefined;
        await ctx.reply('🏷 Yangi test nomini kiriting:', { reply_markup: getBackKeyboard().reply_markup });
        await ctx.answerCbQuery();
        return;
      }

      if (data.startsWith('admin_delete_')) {
        const id = data.replace('admin_delete_', '');
        const deleted = await Test.findByIdAndDelete(id);
        if (deleted) {
          await ctx.answerCbQuery('O\'chirildi');
          const tests = await Test.find({}).select('title totalQuestions isActive');
          if (tests.length === 0) {
            await ctx.reply('✅ O\'chirildi. Endi testlar yo\'q.', { reply_markup: getAdminMenuKeyboard().reply_markup });
          } else {
            let msg = '📋 Mavjud testlar (yangilandi):\n\n';
            tests.forEach((t, i) => {
              msg += `${i + 1}. ${t.title} (${t.totalQuestions}) - ${t.isActive ? 'Active' : 'Inactive'}\n`;
            });
            await ctx.reply(msg, { reply_markup: getAdminTestsListKeyboard(tests) });
          }
        } else {
          await ctx.answerCbQuery('Topilmadi');
        }
        return;
      }

      if (data.startsWith('admin_pdf_')) {
        const testId = data.replace('admin_pdf_', '');
        await ctx.answerCbQuery('PDF yaratilmoqda...');
        await AdminController.generateResultsPDF(ctx, testId);
        return;
      }

      if (data.startsWith('admin_ans_')) {
        if (!s.tempTest || s.stage !== 'setting_answers') {
          await ctx.answerCbQuery('Noto\'g\'ri holat');
          return;
        }
        const value = data.replace('admin_ans_', '');
        const idx = s.qIndex;
        const q = s.tempTest.questions[idx];
        // For multiple choice questions, set correctAnswer
        q.correctAnswer = value;
        s.qIndex++;
        await AdminController.promptNextAnswer(ctx, s);
        await ctx.answerCbQuery('Tanlandi');
        return;
      }
    } catch (e) {
      console.error('Admin callback error:', e);
      try { await ctx.answerCbQuery('Xatolik'); } catch {}
    }
  }

  static async showTestsAndCreateOption(ctx: Context) {
    const tests = await Test.find({}).select('title totalQuestions isActive');
    let msg = '🧪 Test yaratish\n\n';
    if (tests.length === 0) {
      msg += 'Hozircha testlar yo\'q.\n';
    } else {
      msg += 'Mavjud testlar:\n';
      tests.forEach((t, i) => {
        msg += `${i + 1}. ${t.title} (${t.totalQuestions}) - ${t.isActive ? 'Active' : 'Inactive'}\n`;
      });
      msg += '\n';
    }
    await ctx.reply(msg, { reply_markup: getAdminCreateKeyboard() });
  }

  private static async promptNextAnswer(ctx: Context, s: AdminCreateSession) {
    if (!s.tempTest) return;
    const idx = s.qIndex;
    if (idx >= s.tempTest.questions.length) {
      // Save test
      const toSave = new Test({
        title: s.tempTest.title,
        description: s.tempTest.description,
        questions: s.tempTest.questions,
        totalQuestions: s.tempTest.questions.length,
        isActive: true
      });
      await toSave.save();
      s.stage = 'done';
      await ctx.reply(`✅ "${s.tempTest.title}" testi saqlandi!`, { reply_markup: getAdminMenuKeyboard().reply_markup });
      return;
    }

    const qNo = idx + 1;
    if (isTextQuestion(idx)) {
      await ctx.reply(`✍️ ${qNo}-savol uchun to\'g\'ri javobni matn ko\'rinishida kiriting:`);
      return;
    }

    if (isABQuestion(idx)) {
      s.abPart = 'A';
      await ctx.reply(`✍️ ${qNo}-savol A qismining to\'g\'ri javobini kiriting:`);
      return;
    }

    // Multiple choice
    const options = getOptionsForIndex(idx);
    await ctx.reply(`📝 ${qNo}-savol uchun to\'g\'ri variantni tanlang:`, { reply_markup: getAdminAnswerKeyboard(options) });
  }


  static async generateResultsPDF(ctx: Context, testId?: string) {
    try {
      await ctx.reply('📄 PDF yaratilmoqda...');
      
      // Generate results PDF with user names
      const pdfBuffer = await PDFService.generateResultsPDFWithNames(testId);
      
      // Create filename
      const currentDate = new Date().toLocaleDateString('uz-UZ').replace(/\./g, '-');
      const filename = testId ? 
        `Test_natijalari_${currentDate}.pdf` : 
        `Barcha_natijalar_${currentDate}.pdf`;
      
      // Send PDF as document
      await ctx.replyWithDocument({
        source: pdfBuffer,
        filename: filename
      }, {
        caption: testId ? 
          '📄 Test natijalari PDF formatida (ismlar bilan)' : 
          '📄 Barcha natijalar PDF formatida (ismlar bilan)'
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      await ctx.reply('PDF yaratishda xatolik yuz berdi.');
    }
  }
}

export default AdminController;
