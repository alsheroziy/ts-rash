"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const Test_1 = __importDefault(require("../models/Test"));
const TestResult_1 = __importDefault(require("../models/TestResult"));
const GradingService_1 = require("./GradingService");
class TestService {
    static async getAllActiveTests() {
        const tests = await Test_1.default.find({ isActive: true }).select('title description totalQuestions isActive');
        console.log('🔍 TestService.getAllActiveTests result:', tests.length, 'tests found');
        console.log('Tests:', tests.map(t => ({ title: t.title, isActive: t.isActive })));
        return tests;
    }
    static async getActiveTestByTitle(title) {
        // Normalize title and search case-insensitively, ignoring extra spaces
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const normalized = title.trim().replace(/\s+/g, ' ');
        const regex = new RegExp(`^${escapeRegExp(normalized)}$`, 'i');
        const direct = await Test_1.default.findOne({ isActive: true, title: { $regex: regex } });
        if (direct)
            return direct;
        // Fallback: loose contains match
        const contains = new RegExp(escapeRegExp(normalized), 'i');
        return await Test_1.default.findOne({ isActive: true, title: { $regex: contains } });
    }
    static async getTestById(testId) {
        return await Test_1.default.findById(testId);
    }
    static async getTestQuestion(testId, questionIndex) {
        const test = await Test_1.default.findById(testId);
        if (!test || questionIndex >= test.questions.length) {
            return null;
        }
        return {
            question: test.questions[questionIndex],
            totalQuestions: test.totalQuestions,
            currentQuestion: questionIndex + 1
        };
    }
    static async calculateScore(testId, answers) {
        const test = await Test_1.default.findById(testId);
        if (!test) {
            throw new Error('Test not found');
        }
        let correctAnswers = 0;
        const totalQuestions = test.questions.length;
        const norm = (s) => (s || '').toString().trim().toLowerCase();
        test.questions.forEach(question => {
            const right = question.correctAnswer;
            const userAnswer = answers.get(question.id);
            if (userAnswer == null)
                return;
            // Handle A/B JSON answers for 40-44 where we may have stored JSON in correctAnswer
            const looksJson = (val) => typeof val === 'string' && /^\s*\{/.test(val);
            try {
                if (looksJson(right) || looksJson(userAnswer)) {
                    const r = looksJson(right) ? JSON.parse(right) : { A: right, B: '' };
                    const u = looksJson(userAnswer) ? JSON.parse(userAnswer) : { A: userAnswer, B: '' };
                    if (norm(r.A) && norm(r.B)) {
                        if (norm(r.A) === norm(u.A) && norm(r.B) === norm(u.B))
                            correctAnswers++;
                    }
                    else {
                        // Fallback: if only A is specified, compare A only
                        if (norm(r.A) === norm(u.A))
                            correctAnswers++;
                    }
                    return;
                }
            }
            catch {
                // ignore parse errors and fallback to simple compare
            }
            if (norm(userAnswer) === norm(right)) {
                correctAnswers++;
            }
        });
        const score = correctAnswers;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        return {
            score,
            correctAnswers,
            totalQuestions,
            percentage
        };
    }
    static async saveTestResult(userId, testId, answers, timeSpent) {
        const scoreData = await this.calculateScore(testId, answers);
        // Rash modeli baholash tizimi bo'yicha hisoblash
        const rashResult = GradingService_1.GradingService.calculateFullResult(scoreData.correctAnswers, scoreData.totalQuestions);
        const testResult = new TestResult_1.default({
            userId,
            testId,
            answers,
            score: scoreData.score,
            totalQuestions: scoreData.totalQuestions,
            correctAnswers: scoreData.correctAnswers,
            percentage: scoreData.percentage,
            rashScore: rashResult.rashScore,
            grade: rashResult.grade,
            timeSpent
        });
        return await testResult.save();
    }
    static async getUserResults(userId) {
        return await TestResult_1.default.find({ userId })
            .populate('testId', 'title')
            .sort({ completedAt: -1 });
    }
    static async getTestStats(testId) {
        const results = await TestResult_1.default.find({ testId });
        if (results.length === 0) {
            return {
                totalAttempts: 0,
                averageScore: 0,
                averagePercentage: 0
            };
        }
        const totalAttempts = results.length;
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);
        return {
            totalAttempts,
            averageScore: Math.round(totalScore / totalAttempts),
            averagePercentage: Math.round(totalPercentage / totalAttempts)
        };
    }
}
exports.TestService = TestService;
//# sourceMappingURL=TestService.js.map