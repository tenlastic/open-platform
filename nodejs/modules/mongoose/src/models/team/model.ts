import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import {
  arrayLengthValidator,
  arrayNullUndefinedValidator,
  duplicateValidator,
} from '../../validators';
import { AuthorizationDocument } from '../authorization';

@index({ userIds: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'teams', timestamps: true },
})
@plugin(unsetPlugin)
export class TeamSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ ref: 'QueueSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  @prop({ required: true, type: Number })
  public rating: number;

  public updatedAt: Date;

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

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof TeamModel, values: Partial<TeamSchema> = {}) {
    const defaults = {
      namespaceId: new mongoose.Types.ObjectId(),
      queueId: new mongoose.Types.ObjectId(),
      userIds: [new mongoose.Types.ObjectId()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type TeamDocument = DocumentType<TeamSchema>;
export const TeamModel = getModelForClass(TeamSchema);
