import mongoose, { Schema } from 'mongoose';
import { ITest, IQuestion } from '../interfaces/Test';

const QuestionSchema = new Schema<IQuestion>({
  id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String
  }
}, { _id: false });

const TestSchema = new Schema<ITest>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  questions: [QuestionSchema],
  totalQuestions: {
    type: Number,
    required: true
  },
  timeLimit: {
    type: Number // in minutes
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ITest>('Test', TestSchema);
