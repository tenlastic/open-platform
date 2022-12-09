import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { MatchTeamDocument, MatchTeamModel, MatchTeamSchema } from './team';

@index(
  { namespaceId: 1, 'teams.userIds': 1 },
  { partialFilterExpression: { finishedAt: { $type: 'undefined' } }, unique: true },
)
@index({ queueId: 1 })
@modelOptions({ schemaOptions: { collection: 'matches', timestamps: true } })
@plugin(unsetPlugin)
export class MatchSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: Date })
  public finishedAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ ref: 'QueueSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  @prop({ required: true, type: MatchTeamSchema }, PropType.ARRAY)
  public teams: MatchTeamDocument[];

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public get userIds() {
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
