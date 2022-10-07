import {
  changeStreamPlugin,
  enumValidator,
  EventEmitter,
  IDatabasePayload,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { GameServerTemplateSchema } from './game-server-template';
import {
  QueueStatusComponent,
  QueueStatusComponentName,
  QueueStatusPhase,
  QueueStatusSchema,
} from './status';

export const OnQueueProduced = new EventEmitter<IDatabasePayload<QueueDocument>>();

@index({ namespaceId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'queues', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnQueueProduced })
@pre('save', async function (this: QueueDocument) {
  if (!this.isNew) {
    return;
  }

  this.status.components = [
    new QueueStatusComponent({
      current: 0,
      name: QueueStatusComponentName.Application,
      phase: QueueStatusPhase.Pending,
      total: this.replicas,
    }),
    new QueueStatusComponent({
      current: 0,
      name: QueueStatusComponentName.Sidecar,
      phase: QueueStatusPhase.Pending,
      total: 1,
    }),
  ];
})
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ required: true })
  public gameServerTemplate: GameServerTemplateSchema;

  @prop({ min: 100 * 1000 * 1000, required: true })
  public memory: number;

  @prop()
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop()
  public preemptible: boolean;

  @prop({ min: 0, required: true, validate: enumValidator([1, 3, 5]) })
  public replicas: number;

  @prop()
  public restartedAt: Date;

  @prop({ default: { phase: 'Pending' } })
  public status: QueueStatusSchema;

  @prop({ min: 1, required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({ min: 1, required: true })
  public usersPerTeam: number;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'gameServerTemplate',
      'memory',
      'preemptible',
      'replicas',
      'restartedAt',
    ];

    return immutableFields.some((i) => fields.includes(i));
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);
