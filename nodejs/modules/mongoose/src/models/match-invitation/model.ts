import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { MatchDocument } from '../match';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { acceptedAt: null } })
@index({ matchId: 1 })
@index({ namespaceId: 1 })
@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'match-invitations', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('validate', function (this: MatchInvitationDocument) {
  const acceptedAtIsModified = this.isModified('acceptedAt');
  const declinedAtIsModified = this.isModified('declinedAt');

  if (acceptedAtIsModified && !this.acceptedAt) {
    this.invalidate('acceptedAt', new Error('Cannot unset acceptedAt.'), this.acceptedAt);
  }

  if (declinedAtIsModified && !this.declinedAt) {
    this.invalidate('declinedAt', new Error('Cannot unset declinedAt.'), this.declinedAt);
  }

  if (acceptedAtIsModified && !declinedAtIsModified && this.acceptedAt && this.declinedAt) {
    const message = 'Cannot set acceptedAt if declinedAt is already set.';
    this.invalidate('acceptedAt', new Error(message), this.acceptedAt);
  }

  if (!acceptedAtIsModified && declinedAtIsModified && this.acceptedAt && this.declinedAt) {
    const message = 'Cannot set declinedAt if acceptedAt is already set.';
    this.invalidate('declinedAt', new Error(message), this.declinedAt);
  }

  if (acceptedAtIsModified && declinedAtIsModified && this.acceptedAt && this.declinedAt) {
    const message = 'Cannot set declinedAt and acceptedAt at the same time.';
    this.invalidate('acceptedAt', new Error(message), this.acceptedAt);
    this.invalidate('declinedAt', new Error(message), this.declinedAt);
  }
})
export class MatchInvitationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ filter: { create: true, update: true }, type: Date })
  public acceptedAt: Date;

  public createdAt: Date;

  @prop({ filter: { create: true, update: true }, type: Date })
  public declinedAt: Date;

  @prop({ required: true, type: Date })
  public expiresAt: Date;

  @prop({ ref: 'MatchSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public matchId: mongoose.Types.ObjectId;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates Match Invitations for the Match.
   */
  public static createForMatch(this: typeof MatchInvitationModel, match: MatchDocument) {
    const { namespaceId, queueId } = match;

    // If the Match required confirmation, use the confirmation time.
    // If not, use the invitation time.
    let expiresAt = new Date(Date.now() + match.invitationSeconds * 1000);
    if (match.invitationsExpireAt && !match.startedAt) {
      expiresAt = match.invitationsExpireAt;
    }

    const values = { expiresAt, matchId: match._id, namespaceId, queueId };
    const matchInvitations = match.userIds.map((ui) => new this({ ...values, userId: ui }));

    return MatchInvitationModel.create(matchInvitations);
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof MatchInvitationModel,
    values: Partial<MatchInvitationSchema> = {},
  ) {
    const defaults = {
      matchId: new mongoose.Types.ObjectId(),
      namespaceId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type MatchInvitationDocument = DocumentType<MatchInvitationSchema>;
export const MatchInvitationModel = getModelForClass(MatchInvitationSchema);
