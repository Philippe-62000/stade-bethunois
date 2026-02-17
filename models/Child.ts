import mongoose, { Schema, Document } from 'mongoose';

export interface IChild extends Document {
  name: string;
  parentId: mongoose.Types.ObjectId;
  parentId2?: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChildSchema = new Schema<IChild>(
  {
    name: {
      type: String,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    birthDate: {
      type: Date,
      required: false,
      default: () => new Date('2000-01-01'),
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Child || mongoose.model<IChild>('Child', ChildSchema);
