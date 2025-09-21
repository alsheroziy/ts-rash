"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTestData = void 0;
const Test_1 = __importDefault(require("../models/Test"));
const seedTestData = async () => {
    try {
        // Clear existing tests
        await Test_1.default.deleteMany({});
        console.log('Mavjud testlar o\'chirildi');
        // 1-32 savollar: 4ta variantli (A, B, C, D)
        const questions1to32 = [];
        for (let i = 1; i <= 32; i++) {
            questions1to32.push({
                id: `q${i}`,
                question: `Savol ${i}`,
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                explanation: `Savol ${i} uchun to'g'ri javob A`
            });
        }
        // 33-35 savollar: 6ta variantli (A, B, C, D, E, F)
        const questions33to35 = [];
        for (let i = 33; i <= 35; i++) {
            questions33to35.push({
                id: `q${i}`,
                question: `Savol ${i}`,
                options: ['A', 'B', 'C', 'D', 'E', 'F'],
                correctAnswer: 'A',
                explanation: `Savol ${i} uchun to'g'ri javob A`
            });
        }
        // 36-39 savollar: qo'lda kiritish (matn)
        const questions36to39 = [];
        for (let i = 36; i <= 39; i++) {
            questions36to39.push({
                id: `q${i}`,
                question: `Savol ${i}`,
                options: ['Matn kiritish'],
                correctAnswer: 'Matn kiritish',
                explanation: `Savol ${i} uchun matn kiritish kerak`,
                inputType: 'text'
            });
        }
        // 40-44 savollar: 2tali kiritish (A va B)
        const questions40to44 = [];
        for (let i = 40; i <= 44; i++) {
            questions40to44.push({
                id: `q${i}`,
                question: `${i}A va ${i}B javobini kiriting`,
                options: ['A', 'B'],
                correctAnswer: 'A',
                explanation: `${i}A va ${i}B javobini kiritish kerak`,
                inputType: 'multiple'
            });
        }
        const sampleTests = [
            {
                title: 'Ona tili 1-test',
                description: 'Ona tili fanidan 1-test (44 ta savol)',
                questions: [
                    ...questions1to32,
                    ...questions33to35,
                    ...questions36to39,
                    ...questions40to44
                ],
                totalQuestions: 44,
                timeLimit: 120,
                isActive: true
            }
        ];
        for (const testData of sampleTests) {
            const test = new Test_1.default(testData);
            await test.save();
            console.log(`✅ Test yaratildi: ${testData.title} (${testData.totalQuestions} ta savol)`);
        }
        console.log('🎉 Barcha test ma\'lumotlari yaratildi!');
        // Testlarni tekshirish
        const savedTests = await Test_1.default.find({});
        console.log(`📊 Jami ${savedTests.length} ta test saqlangan`);
        savedTests.forEach(test => {
            console.log(`- ${test.title}: ${test.questions.length} ta savol, isActive: ${test.isActive}`);
        });
    }
    catch (error) {
        console.error('❌ Seed data error:', error);
    }
};
exports.seedTestData = seedTestData;
//# sourceMappingURL=seedData.js.map