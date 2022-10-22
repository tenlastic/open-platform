import { enumValidator } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
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

@index({ namespaceId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'queues', minimize: false, timestamps: true },
})
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

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ type: String })
  public description: string;

  @prop({ required: true, type: GameServerTemplateSchema })
  public gameServerTemplate: GameServerTemplateSchema;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public metadata: any;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ min: 0, required: true, type: Number, validate: enumValidator([1, 3, 5]) })
  public replicas: number;

  @prop({ type: Date })
  public restartedAt: Date;

  @prop({ default: { phase: 'Pending' }, merge: true, type: QueueStatusSchema })
  public status: QueueStatusSchema;

  @prop({ min: 1, required: true, type: Number })
  public teams: number;

  public updatedAt: Date;

  @prop({ min: 1, required: true, type: Number })
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
