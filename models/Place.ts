import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema = new Schema<IPlace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Place || mongoose.model<IPlace>('Place', PlaceSchema);
