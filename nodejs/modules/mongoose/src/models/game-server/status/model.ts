import * as mongoose from 'mongoose';

import {
  GameServerStatusComponentDocument,
  GameServerStatusComponentModel,
  GameServerStatusComponentSchema,
} from './component';
import { GameServerStatusEndpointDocument, GameServerStatusEndpointSchema } from './endpoint';
import { GameServerStatusNodeDocument, GameServerStatusNodeSchema } from './node';
import { GameServerStatusComponentName, GameServerStatusPhase } from './types';

export interface GameServerStatus {
  components?: GameServerStatusComponentDocument[];
  endpoints?: GameServerStatusEndpointDocument[];
  message?: string;
  nodes?: GameServerStatusNodeDocument[];
  phase?: GameServerStatusPhase;
  version?: string;
}

export type GameServerStatusDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerStatus & {
    /**
     * Sets components, filling in default values if missing.
     */
    setComponents(): void;
    /**
     * Sets the phase.
     */
    setPhase(): void;
  };

export interface GameServerStatusModelType extends mongoose.Model<GameServerStatusDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerStatusModelType,
    values?: Partial<GameServerStatus>,
  ): GameServerStatusDocument;
}

const GameServerStatusSchema = new mongoose.Schema<
  GameServerStatusDocument,
  GameServerStatusModelType
>(
  {
    components: { type: [GameServerStatusComponentSchema] },
    endpoints: { type: [GameServerStatusEndpointSchema] },
    message: { type: String },
    nodes: { type: [GameServerStatusNodeSchema] },
    phase: {
      default: () => GameServerStatusPhase.Pending,
      enum: Object.values(GameServerStatusPhase),
      type: String,
    },
    version: { type: String },
  },
  { _id: false },
);

GameServerStatusSchema.pre('save', function (this: GameServerStatusDocument) {
  if (this.isModified('components') || this.isNew) {
    this.setComponents();
    this.setPhase();
  }
});

GameServerStatusSchema.statics.mock = function (values: Partial<GameServerStatus> = {}) {
  const defaults: Partial<GameServerStatus> = { phase: GameServerStatusPhase.Running };

  return new this({ ...defaults, ...values });
};

GameServerStatusSchema.methods.setComponents = function (this: GameServerStatusDocument) {
  const components: GameServerStatusComponentDocument[] = [
    new GameServerStatusComponentModel({
      current: 0,
      name: GameServerStatusComponentName.Application,
      phase: GameServerStatusPhase.Pending,
      total: 1,
    }),
    new GameServerStatusComponentModel({
      current: 0,
      name: GameServerStatusComponentName.Sidecar,
      phase: GameServerStatusPhase.Pending,
      total: 1,
    }),
  ];

  for (const component of this.components) {
    const index = components.findIndex((d) => d.name === component.name);
    components[index] = component;
  }

  this.components = components;
};

GameServerStatusSchema.methods.setPhase = function (this: GameServerStatusDocument) {
  let phase = GameServerStatusPhase.Pending;
  const statuses = [GameServerStatusPhase.Running, GameServerStatusPhase.Succeeded];

  if (this.nodes?.some((n) => n.phase === GameServerStatusPhase.Error)) {
    phase = GameServerStatusPhase.Error;
  } else if (this.components?.every((c) => statuses.includes(c.phase))) {
    phase = GameServerStatusPhase.Running;
  }

  this.phase = phase;
};

export const GameServerStatusModel = mongoose.model<
  GameServerStatusDocument,
  GameServerStatusModelType
>('GameServerStatusSchema', GameServerStatusSchema);

export { GameServerStatusSchema };

export default GameServerStatusModel;
