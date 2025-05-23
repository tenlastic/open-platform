import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  arrayLengthValidator,
  arrayNullUndefinedValidator,
  duplicateValidator,
} from '../../../validators';

@modelOptions({ schemaOptions: { _id: false } })
export class MatchTeamSchema {
  @prop({ type: Number })
  public index: number;

  @prop({ type: Number })
  public rating: number;

  @prop({ ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId })
  public teamId: mongoose.Types.ObjectId;

  @prop(
    {
      ref: 'UserSchema',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      validate: [
        arrayLengthValidator(Infinity, 1),
        arrayNullUndefinedValidator,
        duplicateValidator,
      ],
    },
    PropType.ARRAY,
  )
  public userIds: mongoose.Types.ObjectId[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof MatchTeamModel, values: Partial<MatchTeamSchema> = {}) {
    const defaults = {
      teamId: new mongoose.Types.ObjectId(),
      userIds: [new mongoose.Types.ObjectId()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type MatchTeamDocument = DocumentType<MatchTeamSchema>;
export const MatchTeamModel = getModelForClass(MatchTeamSchema);
