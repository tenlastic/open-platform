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
  { invitationsExpireAt: 1 },
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
  if (this.isNew && !this.invitationsExpireAt) {
    this.startedAt = this.createdAt;
  }
})
@pre('validate', function (this: MatchDocument) {
  if (this.finishedAt && !this.startedAt) {
    const message = 'A Match cannot be finished before it is started.';
    this.invalidate('finishedAt', message, this.finishedAt);
    this.invalidate('startedAt', message, this.startedAt);
  }
})
export class MatchSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public acceptedUserIds: mongoose.Types.ObjectId[];

  public createdAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public declinedUserIds: mongoose.Types.ObjectId[];

  @prop({ filter: { create: true, update: true }, type: Date })
  public finishedAt: Date;

  @prop({ ref: 'GameServerTemplateSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public gameServerTemplateId: mongoose.Types.ObjectId;

  @prop({ default: 30, min: 0, type: Number })
  public invitationSeconds: number;

  @prop({ type: Date })
  public invitationsExpireAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  @prop({ filter: { create: true, update: true }, type: Date })
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

  public get userIds(): mongoose.Types.ObjectId[] {
    return this.teams.map((t) => t.userIds).flat();
  }

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof MatchModel, values: Partial<MatchSchema> = {}) {
    const defaults = {
      gameServerTemplateId: new mongoose.Types.ObjectId(),
      namespaceId: new mongoose.Types.ObjectId(),
      teams: [MatchTeamModel.mock(), MatchTeamModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type MatchDocument = DocumentType<MatchSchema>;
export const MatchModel = getModelForClass(MatchSchema);
