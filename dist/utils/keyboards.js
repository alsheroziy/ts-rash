"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhoneKeyboard = exports.getBackKeyboard = exports.getConfirmationKeyboard = exports.getTestNavigationKeyboard = exports.getAdminTestsListKeyboard = exports.getAdminCreateKeyboard = exports.getAdminAnswerKeyboard = exports.getAnswerKeyboard = exports.getTestSelectionKeyboard = exports.getAdminMenuKeyboard = exports.getMainMenuKeyboard = void 0;
const telegraf_1 = require("telegraf");
const getMainMenuKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        ['📝 Test yechish', '📊 Natijalarim'],
        ['ℹ️ Ma\'lumot', '⚙️ Sozlamalar'],
        ['🧹 Avvalgi testni tugatish']
    ]).resize();
};
exports.getMainMenuKeyboard = getMainMenuKeyboard;
// Admin: main menu
const getAdminMenuKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        ['🧪 Test yaratish', '📋 Testlar ro\'yxati'],
        ['📊 Natijalar'],
        ['🔙 Orqaga']
    ]).resize();
};
exports.getAdminMenuKeyboard = getAdminMenuKeyboard;
const getTestSelectionKeyboard = (tests) => {
    const buttons = tests.map(test => [test.title]);
    buttons.push(['🔙 Orqaga']);
    return telegraf_1.Markup.keyboard(buttons).resize();
};
exports.getTestSelectionKeyboard = getTestSelectionKeyboard;
const getAnswerKeyboard = (options) => {
    // Variantlarni inline keyboard sifatida ko'rsatish
    const inlineButtons = options.map(option => ({
        text: option,
        callback_data: `answer_${option}`
    }));
    // Inline keyboard uchun 2 ta ustunli format
    const inlineKeyboard = [];
    for (let i = 0; i < inlineButtons.length; i += 2) {
        const row = inlineButtons.slice(i, i + 2);
        inlineKeyboard.push(row);
    }
    return {
        inline_keyboard: inlineKeyboard
    };
};
exports.getAnswerKeyboard = getAnswerKeyboard;
// Admin: answer keyboard with admin-specific callback prefix
const getAdminAnswerKeyboard = (options) => {
    const inlineButtons = options.map(option => ({
        text: option,
        callback_data: `admin_ans_${option}`
    }));
    const inlineKeyboard = [];
    for (let i = 0; i < inlineButtons.length; i += 2) {
        inlineKeyboard.push(inlineButtons.slice(i, i + 2));
    }
    return { inline_keyboard: inlineKeyboard };
};
exports.getAdminAnswerKeyboard = getAdminAnswerKeyboard;
// Admin: create new test button
const getAdminCreateKeyboard = () => {
    return {
        inline_keyboard: [[{ text: '➕ Yangi test yaratish', callback_data: 'admin_create_new' }]]
    };
};
exports.getAdminCreateKeyboard = getAdminCreateKeyboard;
const getAdminTestsListKeyboard = (tests) => {
    const rows = tests.map((t) => [
        { text: `🗑 O'chirish: ${t.title.substring(0, 30)}`, callback_data: `admin_delete_${t._id}` },
        { text: `📄 PDF: ${t.title.substring(0, 30)}`, callback_data: `admin_pdf_${t._id}` }
    ]);
    return { inline_keyboard: rows };
};
exports.getAdminTestsListKeyboard = getAdminTestsListKeyboard;
const getTestNavigationKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        ['⏭️ Keyingi savol', '🏁 Testni yakunlash'],
        ['🔙 Orqaga']
    ]).resize();
};
exports.getTestNavigationKeyboard = getTestNavigationKeyboard;
const getConfirmationKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        ['✅ Ha', '❌ Yo\'q']
    ]).resize();
};
exports.getConfirmationKeyboard = getConfirmationKeyboard;
const getBackKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        ['🔙 Orqaga']
    ]).resize();
};
exports.getBackKeyboard = getBackKeyboard;
const getPhoneKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        [telegraf_1.Markup.button.contactRequest('📱 Telefon raqamini yuborish')],
        ['🔙 Orqaga']
    ]).resize();
};
exports.getPhoneKeyboard = getPhoneKeyboard;
//# sourceMappingURL=keyboards.js.map