import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { arrayLengthValidator, arrayNullUndefinedValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { MatchTeamDocument, MatchTeamModel, MatchTeamSchema } from './team';

@index(
  { confirmationExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { startedAt: null } },
)
@index(
  { namespaceId: 1, 'teams.userIds': 1 },
  { partialFilterExpression: { finishedAt: null }, unique: true },
)
@index({ queueId: 1 })
@modelOptions({ schemaOptions: { collection: 'matches', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('save', function (this: MatchDocument) {
  if (this.isNew && !this.confirmationExpiresAt) {
    this.startedAt = this.createdAt;
  }
})
export class MatchSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: Date })
  public confirmationExpiresAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public confirmedUserIds: mongoose.Types.ObjectId[];

  @prop({ type: Date })
  public finishedAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ ref: 'QueueSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  @prop({ type: Date })
  public startedAt: Date;

  @prop(
    {
      required: true,
      type: MatchTeamSchema,
      validate: [arrayLengthValidator(Infinity, 1), arrayNullUndefinedValidator],
    },
    PropType.ARRAY,
  )
  public teams: MatchTeamDocument[];

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public get userIds(): mongoose.Types.ObjectId[] {
    return this.teams.reduce((previous, current) => [...previous, ...current.userIds], []);
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof MatchModel, values: Partial<MatchSchema> = {}) {
    const defaults = {
      namespaceId: new mongoose.Types.ObjectId(),
      queueId: new mongoose.Types.ObjectId(),
      teams: [MatchTeamModel.mock(), MatchTeamModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type MatchDocument = DocumentType<MatchSchema>;
export const MatchModel = getModelForClass(MatchSchema);
