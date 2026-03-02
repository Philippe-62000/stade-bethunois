import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  type: string;
  date: Date;
  time: string;
  endTime?: string;
  location: string;
  teamId: mongoose.Types.ObjectId;
  isRecurring: boolean;
  recurringRuleId: mongoose.Types.ObjectId | null;
  isException: boolean; // événement modifié depuis récurrence
  isCustom: boolean; // événement créé manuellement
  selectedChildrenIds: mongoose.Types.ObjectId[] | null; // null = tous les enfants de l'équipe
  modifiedFields?: { time?: boolean; location?: boolean; type?: boolean }; // champs modifiés (affichage rouge parents)
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    type: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringRuleId: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringRule',
      default: null,
    },
    isException: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    selectedChildrenIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Child',
      default: null,
    },
    modifiedFields: {
      time: { type: Boolean, default: false },
      location: { type: Boolean, default: false },
      type: { type: Boolean, default: false },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes fréquentes
EventSchema.index({ date: 1 });
EventSchema.index({ teamId: 1 });
EventSchema.index({ recurringRuleId: 1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
