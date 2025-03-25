import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({ schemaOptions: { _id: false } })
export class QueueMemberTeamSchema {
  @prop({ type: Number })
  public rating: number;

  @prop({ ref: 'TeamSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public teamId: mongoose.Types.ObjectId;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof QueueMemberTeamModel,
    values: Partial<QueueMemberTeamSchema> = {},
  ) {
    const defaults = { teamId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }
}

export type QueueMemberTeamDocument = DocumentType<QueueMemberTeamSchema>;
export const QueueMemberTeamModel = getModelForClass(QueueMemberTeamSchema);
