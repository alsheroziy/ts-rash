import Test from '../models/Test';
import { connectDatabase } from '../config/database';

export const addTest = async (testData: {
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
  timeLimit?: number;
}) => {
  try {
    await connectDatabase();
    
    const test = new Test({
      ...testData,
      totalQuestions: testData.questions.length,
      isActive: true
    });
    
    const savedTest = await test.save();
    console.log(`✅ Test added: ${savedTest.title}`);
    return savedTest;
  } catch (error) {
    console.error('❌ Error adding test:', error);
    throw error;
  }
};

export const listTests = async () => {
  try {
    await connectDatabase();
    
    const tests = await Test.find({}).select('title description totalQuestions isActive');
    console.log('📋 Available tests:');
    tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.title} (${test.totalQuestions} questions) - ${test.isActive ? 'Active' : 'Inactive'}`);
    });
    return tests;
  } catch (error) {
    console.error('❌ Error listing tests:', error);
    throw error;
  }
};

export const deactivateTest = async (testId: string) => {
  try {
    await connectDatabase();
    
    const test = await Test.findByIdAndUpdate(testId, { isActive: false });
    if (test) {
      console.log(`✅ Test deactivated: ${test.title}`);
    } else {
      console.log('❌ Test not found');
    }
    return test;
  } catch (error) {
    console.error('❌ Error deactivating test:', error);
    throw error;
  }
};
