import mongoose, { Schema, Document } from 'mongoose';

export interface IRecurringRule extends Document {
  type: 'training' | 'match' | 'tournament';
  dayOfWeek: number; // 0=dimanche, 1=lundi, etc.
  time: string; // "18:00"
  endTime?: string; // "19:30" optionnel
  teamId: mongoose.Types.ObjectId;
  location: string;
  startDate: Date;
  endDate: Date | null; // null si continue
  periodType: 'monthly' | 'seasonal' | 'continuous';
  selectedChildrenIds: mongoose.Types.ObjectId[] | null; // null = tous
  lastModified: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringRuleSchema = new Schema<IRecurringRule>(
  {
    type: {
      type: String,
      enum: ['training', 'match', 'tournament'],
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    time: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: false,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    periodType: {
      type: String,
      enum: ['monthly', 'seasonal', 'continuous'],
      required: true,
    },
    selectedChildrenIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Child',
      default: null,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.RecurringRule || mongoose.model<IRecurringRule>('RecurringRule', RecurringRuleSchema);
