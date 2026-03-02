import mongoose, { Schema, Document } from 'mongoose';

export interface IEventModificationAck extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // parent
  createdAt: Date;
}

const EventModificationAckSchema = new Schema<IEventModificationAck>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

EventModificationAckSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.models.EventModificationAck ||
  mongoose.model<IEventModificationAck>('EventModificationAck', EventModificationAckSchema);
