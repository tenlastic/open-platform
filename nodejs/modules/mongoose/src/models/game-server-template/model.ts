import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { arrayLengthValidator, duplicateValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import {
  GameServerPortDocument,
  GameServerPortModel,
  GameServerPortSchema,
} from '../game-server/port';
import { GameServerProbesDocument, GameServerProbesSchema } from '../game-server/probes';

export interface GameServerTemplate {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  buildId: mongoose.Types.ObjectId;
  cpu: number;
  createdAt?: Date;
  description?: string;
  memory: number;
  metadata?: unknown;
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  ports: GameServerPortDocument[];
  preemptible?: boolean;
  probes?: GameServerProbesDocument;
  secrets?: unknown;
  updatedAt?: Date;
}

export type GameServerTemplateDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerTemplate;

export interface GameServerTemplateModelType extends mongoose.Model<GameServerTemplateDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerTemplateModelType,
    values?: Partial<GameServerTemplate>,
  ): GameServerTemplateDocument;
}

const GameServerTemplateSchema = new mongoose.Schema<
  GameServerTemplateDocument,
  GameServerTemplateModelType
>(
  {
    buildId: { ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    cpu: { min: 0.1, required: true, type: Number },
    description: { maxlength: 128, trim: true, type: String },
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
    secrets: { type: mongoose.Schema.Types.Mixed, unset: false },
  },
  { collection: 'game-server-templates', timestamps: true },
);

GameServerTemplateSchema.index({ authorizedUserIds: 1 });
GameServerTemplateSchema.index({ buildId: 1 });
GameServerTemplateSchema.index({ currentUserIds: 1 });
GameServerTemplateSchema.index({ matchId: 1 });
GameServerTemplateSchema.index({ namespaceId: 1 });
GameServerTemplateSchema.index({ queueId: 1 });

GameServerTemplateSchema.plugin(unsetPlugin);

GameServerTemplateSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

GameServerTemplateSchema.statics.mock = function (values: Partial<GameServerTemplate> = {}) {
  const chance = new Chance();
  const defaults: Partial<GameServerTemplate> = {
    buildId: new mongoose.Types.ObjectId(),
    cpu: chance.floating({ max: 1, min: 0.1 }),
    memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    ports: [GameServerPortModel.mock()],
  };

  return new this({ ...defaults, ...values });
};

export const GameServerTemplateModel = mongoose.model<
  GameServerTemplateDocument,
  GameServerTemplateModelType
>('GameServerTemplateSchema', GameServerTemplateSchema);

export { GameServerTemplateSchema };

export default GameServerTemplateModel;
