"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = void 0;
exports.messages = {
    welcome: `🎓 *Ona tili fanidan test tizimiga xush kelibsiz!*

Bu bot orqali siz o'zbek tili fanidan testlarni yechishingiz va bilimingizni sinab ko'rishingiz mumkin.

Boshlash uchun ro'yxatdan o'ting.`,
    registration: {
        firstName: `👤 *To'liq ism va familiyangizni kiriting:*

Iltimos, ism va familiyangizni to'liq yozing.
Masalan: Shehroz Raxmatov Shavkatjonovich`,
        phone: `📱 *Telefon raqamingizni yuboring:*

Iltimos, telefon raqamingizni yuborish tugmasini bosing yoki raqamni qo'lda kiriting.`,
        success: `✅ *Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!*

Ism: {firstName} {lastName}
Telefon: {phone}

Endi siz testlarni yechishni boshlashingiz mumkin.`
    },
    test: {
        selection: `📝 *Testlarni tanlang:*

Quyida mavjud testlar ro'yxati. Biror testni tanlang:`,
        start: `🎯 *{testTitle}* testi boshlandi!

Savollar soni: {totalQuestions}
Vaqt chegarasi: {timeLimit} daqiqa

📄 *Eslatma:* Savollar qog'ozda berilgan. Siz faqat variantlarni tanlaysiz.

Tayyor bo'lsangiz, "Boshla" tugmasini bosing.`,
        question: `📝 *Savol {currentQuestion}/{totalQuestions}*

Qog'ozdan savolni o'qing va quyidagi variantlardan birini tanlang:`,
        answerSaved: `✅ Javob saqlandi!`,
        completed: `🎉 *Test yakunlandi!*

Tabriklaymiz!`
    },
    results: {
        noResults: `📊 *Hozircha hech qanday test yechmadingiz.*

Test yechish uchun "Test yechish" tugmasini bosing.`,
        userResults: `📊 *Sizning natijalaringiz:*

{results}

Jami ball: {totalScore}`
    },
    errors: {
        invalidInput: `❌ *Noto'g'ri ma'lumot kiritildi.*

Iltimos, to'g'ri ma'lumot kiriting.`,
        testNotFound: `❌ *Test topilmadi.*

Iltimos, qaytadan urinib ko'ring.`,
        alreadyRegistered: `⚠️ *Siz allaqachon ro'yxatdan o'tgansiz.*

Test yechish uchun "Test yechish" tugmasini bosing.`,
        testInProgress: `⚠️ *Sizda hozir boshqa test davom etmoqda.*

Avval joriy testni yakunlang.`
    },
    buttons: {
        start: '🚀 Boshlash',
        back: '🔙 Orqaga',
        next: '⏭️ Keyingi savol',
        finish: '🏁 Testni yakunlash',
        yes: '✅ Ha',
        no: '❌ Yo\'q',
        mainMenu: '🏠 Bosh menyu',
        takeTest: '📝 Test yechish',
        myResults: '📊 Natijalarim',
        info: 'ℹ️ Ma\'lumot',
        settings: '⚙️ Sozlamalar'
    }
};
//# sourceMappingURL=messages.js.map