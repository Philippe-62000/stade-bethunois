import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  roles: ('parent' | 'educator' | 'admin')[];
  name: string;
  notificationSettings: {
    enabled: boolean;
    reminderEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      enum: ['parent', 'educator', 'admin'],
      required: true,
      validate: {
        validator(v: string[]) {
          return Array.isArray(v) && v.length >= 1 && v.length <= 3;
        },
        message: 'Au moins un rôle requis',
      },
    },
    name: {
      type: String,
      required: true,
    },
    notificationSettings: {
      enabled: {
        type: Boolean,
        default: true,
      },
      reminderEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
