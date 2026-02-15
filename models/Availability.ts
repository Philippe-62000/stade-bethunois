import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
  eventId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'pending';
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'pending'],
      default: 'pending',
    },
    comment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes fréquentes
AvailabilitySchema.index({ eventId: 1, childId: 1 }, { unique: true });
AvailabilitySchema.index({ parentId: 1 });
AvailabilitySchema.index({ childId: 1 });

export default mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);
