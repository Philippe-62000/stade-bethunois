import mongoose, { Schema, Document } from 'mongoose';

export interface IEventType extends Document {
  key: string;
  label: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventTypeSchema = new Schema<IEventType>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.EventType || mongoose.model<IEventType>('EventType', EventTypeSchema);
