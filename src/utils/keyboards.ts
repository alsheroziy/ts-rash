import { Markup } from 'telegraf';

export const getMainMenuKeyboard = () => {
  return Markup.keyboard([
    ['📝 Test yechish', '📊 Natijalarim'],
    ['ℹ️ Ma\'lumot', '⚙️ Sozlamalar'],
    ['🧹 Avvalgi testni tugatish']
  ]).resize();
};

export const getTestSelectionKeyboard = (tests: any[]) => {
  const buttons = tests.map(test => [test.title]);
  buttons.push(['🔙 Orqaga']);
  
  return Markup.keyboard(buttons).resize();
};

export const getAnswerKeyboard = (options: string[]) => {
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

export const getTestNavigationKeyboard = () => {
  return Markup.keyboard([
    ['⏭️ Keyingi savol', '🏁 Testni yakunlash'],
    ['🔙 Orqaga']
  ]).resize();
};

export const getConfirmationKeyboard = () => {
  return Markup.keyboard([
    ['✅ Ha', '❌ Yo\'q']
  ]).resize();
};

export const getBackKeyboard = () => {
  return Markup.keyboard([
    ['🔙 Orqaga']
  ]).resize();
};

export const getPhoneKeyboard = () => {
  return Markup.keyboard([
    [Markup.button.contactRequest('📱 Telefon raqamini yuborish')],
    ['🔙 Orqaga']
  ]).resize();
};
