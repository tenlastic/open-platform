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
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { duplicateValidator, namespaceValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import {
  QueueDocument,
  QueueGameServerTemplateDocument,
  QueueGameServerTemplateModel,
  QueueGameServerTemplateSchema,
} from '../queue';

@index({ gameServerId: 1 }, { unique: true })
@index({ queueId: 1 })
@modelOptions({ schemaOptions: { collection: 'matches', timestamps: true } })
@plugin(unsetPlugin)
@pre('save', async function (this: MatchDocument) {
  if (!this.populated('queueDocument')) {
    await this.populate('queueDocument');
  }

  this.gameServerTemplate = this.queueDocument.gameServerTemplate;
})
@pre('validate', function (this: MatchDocument) {
  const users = this.teams * this.usersPerTeam || 0;

  if (this.userIds?.length !== users) {
    this.invalidate('userIds', `User IDs must contain ${users} values.`, this.userIds);
  }
})
export class MatchSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ type: QueueGameServerTemplateSchema })
  public gameServerTemplate: QueueGameServerTemplateDocument;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({
    ref: 'QueueSchema',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    validate: namespaceValidator('queueDocument', 'queueId'),
  })
  public queueId: mongoose.Types.ObjectId;

  @prop({ min: 1, required: true, type: Number })
  public teams: number;

  public updatedAt: Date;

  @prop(
    {
      ref: 'UserSchema',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      validate: duplicateValidator,
    },
    PropType.ARRAY,
  )
  public userIds: mongoose.Types.ObjectId[];

  @prop({ min: 1, required: true, type: Number })
  public usersPerTeam: number;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof MatchModel, values: Partial<MatchSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      gameServerTemplate: QueueGameServerTemplateModel.mock(),
      namespaceId: new mongoose.Types.ObjectId(),
      queueId: new mongoose.Types.ObjectId(),
      teams: chance.integer({ min: 1 }),
      usersPerTeam: chance.integer({ min: 1 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type MatchDocument = DocumentType<MatchSchema>;
export const MatchModel = getModelForClass(MatchSchema);
