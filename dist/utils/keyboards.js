"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhoneKeyboard = exports.getBackKeyboard = exports.getConfirmationKeyboard = exports.getTestNavigationKeyboard = exports.getAnswerKeyboard = exports.getTestSelectionKeyboard = exports.getMainMenuKeyboard = void 0;
const telegraf_1 = require("telegraf");
const getMainMenuKeyboard = () => {
    return telegraf_1.Markup.keyboard([
        ['📝 Test yechish', '📊 Natijalarim'],
        ['ℹ️ Ma\'lumot', '⚙️ Sozlamalar'],
        ['🧹 Avvalgi testni tugatish']
    ]).resize();
};
exports.getMainMenuKeyboard = getMainMenuKeyboard;
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