"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const Test_1 = __importDefault(require("../models/Test"));
const keyboards_1 = require("../utils/keyboards");
dotenv_1.default.config();
const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : undefined;
const isAdminUser = (ctx) => {
    const uid = ctx.from?.id;
    return !!uid && !!ADMIN_ID && uid === ADMIN_ID;
};
// In-memory admin sessions
const sessions = new Map();
function ensureSession(id) {
    if (!sessions.has(id)) {
        sessions.set(id, { stage: 'idle', tempTest: null, qIndex: 0 });
    }
    return sessions.get(id);
}
function isABQuestion(index) {
    return index >= 39 && index <= 43; // 40..44 (0-based index)
}
function isTextQuestion(index) {
    return index >= 35 && index <= 38; // 36..39
}
function getOptionsForIndex(index) {
    if (index <= 31)
        return ['A', 'B', 'C', 'D']; // 1..32
    if (index >= 32 && index <= 34)
        return ['A', 'B', 'C', 'D', 'E', 'F']; // 33..35
    if (isTextQuestion(index))
        return []; // free text
    if (isABQuestion(index))
        return []; // text A/B
    return ['A', 'B', 'C', 'D'];
}
function buildDefaultQuestions() {
    const list = [];
    for (let i = 1; i <= 44; i++) {
        const idx = i - 1;
        const options = getOptionsForIndex(idx);
        const q = {
            id: `q${i}`,
            question: `Savol ${i}`,
            options,
            correctAnswer: ''
        };
        list.push(q);
    }
    return list;
}
class AdminController {
    static hasActiveSession(telegramId) {
        const s = sessions.get(telegramId);
        return !!s && s.stage !== 'idle' && s.stage !== 'done';
    }
    static async start(ctx) {
        if (!isAdminUser(ctx)) {
            await ctx.reply('⛔️ Siz admin emassiz.');
            return;
        }
        const tid = ctx.from.id;
        const s = ensureSession(tid);
        s.stage = 'idle';
        s.tempTest = null;
        s.qIndex = 0;
        s.abPart = undefined;
        await ctx.reply('🛠 Admin panel', { reply_markup: (0, keyboards_1.getAdminMenuKeyboard)().reply_markup });
    }
    static async handleMessage(ctx) {
        if (!isAdminUser(ctx))
            return; // ignore non-admin
        const tid = ctx.from.id;
        const text = ctx.message?.text?.trim();
        if (!text)
            return;
        const s = ensureSession(tid);
        // Entry points from menu
        if (text === '🧪 Test yaratish') {
            // Directly start creation without listing existing tests
            const s = ensureSession(tid);
            s.stage = 'awaiting_title';
            s.tempTest = null;
            s.qIndex = 0;
            s.abPart = undefined;
            await ctx.reply('🏷 Yangi test nomini kiriting:', { reply_markup: (0, keyboards_1.getBackKeyboard)().reply_markup });
            return;
        }
        if (text === '📋 Testlar ro\'yxati') {
            const tests = await Test_1.default.find({}).select('title totalQuestions isActive');
            if (tests.length === 0) {
                await ctx.reply('Hozircha testlar yo\'q.', { reply_markup: (0, keyboards_1.getAdminMenuKeyboard)().reply_markup });
            }
            else {
                let msg = '📋 Mavjud testlar:\n\n';
                tests.forEach((t, i) => {
                    msg += `${i + 1}. ${t.title} (${t.totalQuestions}) - ${t.isActive ? 'Active' : 'Inactive'}\n`;
                });
                await ctx.reply(msg, { reply_markup: (0, keyboards_1.getAdminTestsListKeyboard)(tests) });
            }
            return;
        }
        if (text === '🔙 Orqaga') {
            await AdminController.start(ctx);
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
            await ctx.reply('✍️ Test uchun qisqacha ta\'rif kiriting (ixtiyoriy). O\'tkazib yuborish uchun "-" yuboring.', { reply_markup: (0, keyboards_1.getBackKeyboard)().reply_markup });
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
            if (!s.tempTest)
                return;
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
                    const partial = { A: text };
                    q.correctAnswer = JSON.stringify(partial); // temp store
                    s.abPart = 'B';
                    await ctx.reply(`✍️ ${idx + 1}-savol B qismining to\'g\'ri javobini kiriting:`);
                    return;
                }
                else {
                    // merge with existing A
                    try {
                        const prev = q.correctAnswer && q.correctAnswer.startsWith('{') ? JSON.parse(q.correctAnswer) : {};
                        prev.B = text;
                        q.correctAnswer = JSON.stringify(prev);
                    }
                    catch {
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
    static async handleCallbackQuery(ctx) {
        if (!isAdminUser(ctx))
            return; // only admin
        const data = ctx.callbackQuery?.data;
        if (!data)
            return;
        const tid = ctx.from.id;
        const s = ensureSession(tid);
        try {
            if (data === 'admin_create_new') {
                s.stage = 'awaiting_title';
                s.tempTest = null;
                s.qIndex = 0;
                s.abPart = undefined;
                await ctx.reply('🏷 Yangi test nomini kiriting:', { reply_markup: (0, keyboards_1.getBackKeyboard)().reply_markup });
                await ctx.answerCbQuery();
                return;
            }
            if (data.startsWith('admin_delete_')) {
                const id = data.replace('admin_delete_', '');
                const deleted = await Test_1.default.findByIdAndDelete(id);
                if (deleted) {
                    await ctx.answerCbQuery('O\'chirildi');
                    const tests = await Test_1.default.find({}).select('title totalQuestions isActive');
                    if (tests.length === 0) {
                        await ctx.reply('✅ O\'chirildi. Endi testlar yo\'q.', { reply_markup: (0, keyboards_1.getAdminMenuKeyboard)().reply_markup });
                    }
                    else {
                        let msg = '📋 Mavjud testlar (yangilandi):\n\n';
                        tests.forEach((t, i) => {
                            msg += `${i + 1}. ${t.title} (${t.totalQuestions}) - ${t.isActive ? 'Active' : 'Inactive'}\n`;
                        });
                        await ctx.reply(msg, { reply_markup: (0, keyboards_1.getAdminTestsListKeyboard)(tests) });
                    }
                }
                else {
                    await ctx.answerCbQuery('Topilmadi');
                }
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
        }
        catch (e) {
            console.error('Admin callback error:', e);
            try {
                await ctx.answerCbQuery('Xatolik');
            }
            catch { }
        }
    }
    static async showTestsAndCreateOption(ctx) {
        const tests = await Test_1.default.find({}).select('title totalQuestions isActive');
        let msg = '🧪 Test yaratish\n\n';
        if (tests.length === 0) {
            msg += 'Hozircha testlar yo\'q.\n';
        }
        else {
            msg += 'Mavjud testlar:\n';
            tests.forEach((t, i) => {
                msg += `${i + 1}. ${t.title} (${t.totalQuestions}) - ${t.isActive ? 'Active' : 'Inactive'}\n`;
            });
            msg += '\n';
        }
        await ctx.reply(msg, { reply_markup: (0, keyboards_1.getAdminCreateKeyboard)() });
    }
    static async promptNextAnswer(ctx, s) {
        if (!s.tempTest)
            return;
        const idx = s.qIndex;
        if (idx >= s.tempTest.questions.length) {
            // Save test
            const toSave = new Test_1.default({
                title: s.tempTest.title,
                description: s.tempTest.description,
                questions: s.tempTest.questions,
                totalQuestions: s.tempTest.questions.length,
                isActive: true
            });
            await toSave.save();
            s.stage = 'done';
            await ctx.reply(`✅ "${s.tempTest.title}" testi saqlandi!`, { reply_markup: (0, keyboards_1.getAdminMenuKeyboard)().reply_markup });
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
        await ctx.reply(`📝 ${qNo}-savol uchun to\'g\'ri variantni tanlang:`, { reply_markup: (0, keyboards_1.getAdminAnswerKeyboard)(options) });
    }
}
exports.AdminController = AdminController;
exports.default = AdminController;
//# sourceMappingURL=AdminController.js.map