import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { arrayLengthValidator, duplicateValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { GameServerPortDocument, GameServerPortModel, GameServerPortSchema } from './port';
import { GameServerProbesDocument, GameServerProbesSchema } from './probes';
import { GameServerStatusDocument, GameServerStatusModel, GameServerStatusSchema } from './status';

export interface GameServer {
  _id: mongoose.Types.ObjectId;
  authorizedUserIds?: mongoose.Types.ObjectId[];
  authorizationDocuments?: AuthorizationDocument[];
  buildId: mongoose.Types.ObjectId;
  cpu: number;
  createdAt?: Date;
  currentUserIds?: mongoose.Types.ObjectId[];
  description?: string;
  matchId?: mongoose.Types.ObjectId;
  memory: number;
  metadata?: unknown;
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  persistent: boolean;
  ports: GameServerPortDocument[];
  preemptible?: boolean;
  probes?: GameServerProbesDocument;
  queueId?: mongoose.Types.ObjectId;
  restartedAt?: Date;
  secrets?: unknown;
  status?: GameServerStatusDocument;
  updatedAt?: Date;
}

export type GameServerDocument = mongoose.Document<mongoose.Types.ObjectId> & GameServer & {};

export interface GameServerModelType extends mongoose.Model<GameServerDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: GameServerModelType, values?: Partial<GameServer>): GameServerDocument;

  /**
   * Returns true if a restart is required on an update.
   */
  isRestartRequired(fields: string[]): boolean;
}

const GameServerSchema = new mongoose.Schema<GameServerDocument, GameServerModelType>(
  {
    authorizedUserIds: { ref: 'UserSchema', type: [mongoose.Schema.Types.ObjectId] },
    buildId: { ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    cpu: { min: 0.1, required: true, type: Number },
    currentUserIds: { ref: 'UserSchema', type: [mongoose.Schema.Types.ObjectId] },
    description: { maxlength: 256, trim: true, type: String },
    matchId: { ref: 'MatchSchema', type: mongoose.Schema.Types.ObjectId },
    memory: { min: 100 * 1000 * 1000, required: true, type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, unset: false },
    name: { maxlength: 64, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    ports: {
      required: true,
      type: [GameServerPortSchema],
      validate: [arrayLengthValidator(5, 1), duplicateValidator],
    },
    preemptible: { type: Boolean },
    probes: { type: GameServerProbesSchema },
    queueId: { ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId },
    restartedAt: { filter: { create: true, update: true }, type: Date },
    secrets: { type: mongoose.Schema.Types.Mixed, unset: false },
    status: { default: () => new GameServerStatusModel(), type: GameServerStatusSchema },
  },
  {
    collection: 'game-servers',
    timestamps: true,
  },
);

GameServerSchema.index({ authorizedUserIds: 1 });
GameServerSchema.index({ buildId: 1 });
GameServerSchema.index({ currentUserIds: 1 });
GameServerSchema.index({ matchId: 1 });
GameServerSchema.index({ namespaceId: 1 });
GameServerSchema.index({ queueId: 1 });

GameServerSchema.plugin(unsetPlugin);

GameServerSchema.virtual('persistent').get(function (this: GameServerDocument) {
  return !this.matchId;
});

GameServerSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

GameServerSchema.statics.mock = function (values: Partial<GameServer> = {}) {
  const chance = new Chance();
  const defaults: Partial<GameServer> = {
    buildId: new mongoose.Types.ObjectId(),
    cpu: chance.floating({ max: 1, min: 0.1 }),
    memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    ports: [GameServerPortModel.mock()],
  };

  return new this({ ...defaults, ...values });
};

GameServerSchema.statics.isRestartRequired = function (fields: string[]) {
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
};

export const GameServerModel = mongoose.model<GameServerDocument, GameServerModelType>(
  'GameServerSchema',
  GameServerSchema,
  'game-servers',
);

export { GameServerSchema };

export default GameServerModel;
