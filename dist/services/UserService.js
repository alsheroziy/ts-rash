"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = __importDefault(require("../models/User"));
class UserService {
    static async findOrCreateUser(telegramId) {
        let user = await User_1.default.findOne({ telegramId });
        if (!user) {
            user = new User_1.default({
                telegramId,
                isRegistered: false,
                answers: new Map(),
                totalScore: 0,
                completedTests: []
            });
            await user.save();
        }
        return user;
    }
    static async updateUser(telegramId, updateData) {
        return await User_1.default.findOneAndUpdate({ telegramId }, updateData, { new: true });
    }
    static async getUser(telegramId) {
        return await User_1.default.findOne({ telegramId });
    }
    static async completeTest(telegramId, testId, score) {
        const user = await User_1.default.findOne({ telegramId });
        if (!user)
            return null;
        user.totalScore += score;
        user.completedTests.push(testId);
        // Completely clear test state
        user.currentTest = undefined;
        user.currentQuestion = 0;
        user.answers = new Map();
        const savedUser = await user.save();
        console.log('✅ User test completed and state cleared:', {
            telegramId: savedUser.telegramId,
            currentTest: savedUser.currentTest,
            currentQuestion: savedUser.currentQuestion,
            totalScore: savedUser.totalScore
        });
        return savedUser;
    }
    static async startTest(telegramId, testId) {
        return await User_1.default.findOneAndUpdate({ telegramId }, {
            currentTest: testId,
            currentQuestion: 0,
            answers: new Map()
        }, { new: true });
    }
    static async saveAnswer(telegramId, questionId, answer) {
        const user = await User_1.default.findOne({ telegramId });
        if (!user)
            return null;
        user.answers.set(questionId, answer);
        return await user.save();
    }
    static async nextQuestion(telegramId) {
        const user = await User_1.default.findOne({ telegramId });
        if (!user)
            return null;
        user.currentQuestion = (user.currentQuestion || 0) + 1;
        return await user.save();
    }
    static async resetCurrentTest(telegramId) {
        // Unset currentTest to avoid stale references and clear progress
        return await User_1.default.findOneAndUpdate({ telegramId }, {
            $unset: { currentTest: "" },
            $set: { currentQuestion: 0, answers: {} }
        }, { new: true });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map