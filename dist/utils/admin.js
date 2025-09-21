"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateTest = exports.listTests = exports.addTest = void 0;
const Test_1 = __importDefault(require("../models/Test"));
const database_1 = require("../config/database");
const addTest = async (testData) => {
    try {
        await (0, database_1.connectDatabase)();
        const test = new Test_1.default({
            ...testData,
            totalQuestions: testData.questions.length,
            isActive: true
        });
        const savedTest = await test.save();
        console.log(`✅ Test added: ${savedTest.title}`);
        return savedTest;
    }
    catch (error) {
        console.error('❌ Error adding test:', error);
        throw error;
    }
};
exports.addTest = addTest;
const listTests = async () => {
    try {
        await (0, database_1.connectDatabase)();
        const tests = await Test_1.default.find({}).select('title description totalQuestions isActive');
        console.log('📋 Available tests:');
        tests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.title} (${test.totalQuestions} questions) - ${test.isActive ? 'Active' : 'Inactive'}`);
        });
        return tests;
    }
    catch (error) {
        console.error('❌ Error listing tests:', error);
        throw error;
    }
};
exports.listTests = listTests;
const deactivateTest = async (testId) => {
    try {
        await (0, database_1.connectDatabase)();
        const test = await Test_1.default.findByIdAndUpdate(testId, { isActive: false });
        if (test) {
            console.log(`✅ Test deactivated: ${test.title}`);
        }
        else {
            console.log('❌ Test not found');
        }
        return test;
    }
    catch (error) {
        console.error('❌ Error deactivating test:', error);
        throw error;
    }
};
exports.deactivateTest = deactivateTest;
//# sourceMappingURL=admin.js.map