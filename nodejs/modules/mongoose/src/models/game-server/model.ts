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
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { arrayLengthValidator, duplicateValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { GameServerPortDocument, GameServerPortModel, GameServerPortSchema } from './port';
import { GameServerProbesDocument, GameServerProbesSchema } from './probes';
import { GameServerStatusDocument, GameServerStatusModel, GameServerStatusSchema } from './status';

@index({ authorizedUserIds: 1 })
@index({ buildId: 1 })
@index({ currentUserIds: 1 })
@index({ matchId: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'game-servers', timestamps: true },
})
@plugin(unsetPlugin)
export class GameServerSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public authorizedUserIds: mongoose.Types.ObjectId[];

  @prop({ ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public buildId: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public currentUserIds: mongoose.Types.ObjectId[];

  @prop({ maxlength: 128, trim: true, type: String })
  public description: string;

  @prop({ ref: 'MatchSchema', type: mongoose.Schema.Types.ObjectId })
  public matchId: mongoose.Types.ObjectId;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public persistent: boolean;

  @prop(
    {
      required: true,
      type: GameServerPortSchema,
      validate: [arrayLengthValidator(5, 1), duplicateValidator],
    },
    PropType.ARRAY,
  )
  public ports: GameServerPortDocument[];

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ type: GameServerProbesSchema })
  public probes: GameServerProbesDocument;

  @prop({ ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  @prop({ type: Date, writable: false })
  public restartedAt: Date;

  @prop({ default: () => new GameServerStatusModel(), merge: true, type: GameServerStatusSchema })
  public status: GameServerStatusDocument;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof GameServerModel, values: Partial<GameServerSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      buildId: new mongoose.Types.ObjectId(),
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      ports: [GameServerPortModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'memory',
      'ports',
      'preemptible',
      'probes',
      'restartedAt',
    ];

    return immutableFields.some((i) => fields.includes(i));
  }
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export const GameServerModel = getModelForClass(GameServerSchema);
