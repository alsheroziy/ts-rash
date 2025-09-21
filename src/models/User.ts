import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/User';

const UserSchema = new Schema<IUser>({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: function() {
      return this.isRegistered;
    },
    trim: true
  },
  lastName: {
    type: String,
    required: function() {
      return this.isRegistered;
    },
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  currentTest: {
    type: String,
    ref: 'Test'
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  answers: {
    type: Map,
    of: String,
    default: new Map()
  },
  totalScore: {
    type: Number,
    default: 0
  },
  completedTests: [{
    type: String,
    ref: 'Test'
  }]
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
