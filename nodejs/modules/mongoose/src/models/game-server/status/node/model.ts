import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../types';

export interface GameServerStatusNode {
  component: GameServerStatusComponentName;
  container: string;
  phase?: GameServerStatusPhase;
  pod: string;
}

export type GameServerStatusNodeDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerStatusNode;

export interface GameServerStatusNodeModelType
  extends mongoose.Model<GameServerStatusNodeDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerStatusNodeModelType,
    values?: Partial<GameServerStatusNode>,
  ): GameServerStatusNodeDocument;
}

const GameServerStatusNodeSchema = new mongoose.Schema<GameServerStatusNodeDocument>(
  {
    component: { enum: Object.values(GameServerStatusComponentName), required: true, type: String },
    container: { required: true, type: String },
    phase: {
      default: () => GameServerStatusPhase.Pending,
      enum: Object.values(GameServerStatusPhase),
      type: String,
    },
    pod: { required: true, type: String },
  },
  { _id: false },
);

GameServerStatusNodeSchema.statics.mock = function (values: Partial<GameServerStatusNode> = {}) {
  const chance = new Chance();
  const defaults: Partial<GameServerStatusNode> = {
    component: GameServerStatusComponentName.Application,
    container: chance.hash(),
    phase: GameServerStatusPhase.Running,
    pod: chance.hash(),
  };

  return new this({ ...defaults, ...values });
};

export const GameServerStatusNodeModel = mongoose.model<
  GameServerStatusNodeDocument,
  GameServerStatusNodeModelType
>('GameServerStatusNodeSchema', GameServerStatusNodeSchema);

export { GameServerStatusNodeSchema };

export default GameServerStatusNodeModel;
