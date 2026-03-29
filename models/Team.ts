import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  category: string; // ex: "U12", "U15"
  educatorId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    educatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
