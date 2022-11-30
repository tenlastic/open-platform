import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';
import { unsetPlugin } from '../../plugins';

import { enumValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import {
  QueueGameServerTemplate,
  QueueGameServerTemplateDocument,
  QueueGameServerTemplateSchema,
} from './game-server-template';
import {
  QueueStatus,
  QueueStatusComponent,
  QueueStatusComponentName,
  QueueStatusDocument,
  QueueStatusPhase,
  QueueStatusSchema,
} from './status';

@index({ namespaceId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'queues', minimize: false, timestamps: true },
})
@plugin(unsetPlugin)
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ type: String })
  public description: string;

  @prop({ required: true, type: QueueGameServerTemplateSchema })
  public gameServerTemplate: QueueGameServerTemplateDocument;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
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

  @prop({
    default(this: QueueDocument) {
      return new QueueStatus({
        component: [
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
        ],
      });
    },
    merge: true,
    type: QueueStatusSchema,
  })
  public status: QueueStatusDocument;

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

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: QueueModel, values: Partial<QueueSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      cpu: chance.floating({ max: 1, min: 0.1 }),
      gameServerTemplate: QueueGameServerTemplate.mock(),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      teams: chance.integer({ min: 1 }),
      usersPerTeam: chance.integer({ min: 1 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);
