import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../types';

export interface GameServerStatusComponent {
  current?: number;
  name: GameServerStatusComponentName;
  phase?: GameServerStatusPhase;
  total?: number;
}

export type GameServerStatusComponentDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerStatusComponent;

export interface GameServerStatusComponentModelType
  extends mongoose.Model<GameServerStatusComponentDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerStatusComponentModelType,
    values?: Partial<GameServerStatusComponent>,
  ): GameServerStatusComponentDocument;
}

const GameServerStatusComponentSchema = new mongoose.Schema<GameServerStatusComponentDocument>(
  {
    current: { type: Number },
    name: { enum: Object.values(GameServerStatusComponentName), required: true, type: String },
    phase: {
      default: () => GameServerStatusPhase.Pending,
      enum: Object.values(GameServerStatusPhase),
      type: String,
    },
    total: { type: Number },
  },
  { _id: false },
);

GameServerStatusComponentSchema.statics.mock = function (
  values: Partial<GameServerStatusComponent> = {},
) {
  const chance = new Chance();
  const defaults: Partial<GameServerStatusComponent> = {
    current: chance.integer({ min: 0 }),
    name: GameServerStatusComponentName.Application,
    phase: GameServerStatusPhase.Running,
    total: chance.integer({ min: 0 }),
  };

  return new this({ ...defaults, ...values });
};

export const GameServerStatusComponentModel = mongoose.model<
  GameServerStatusComponentDocument,
  GameServerStatusComponentModelType
>('GameServerStatusComponentSchema', GameServerStatusComponentSchema);

export { GameServerStatusComponentSchema };

export default GameServerStatusComponentModel;
