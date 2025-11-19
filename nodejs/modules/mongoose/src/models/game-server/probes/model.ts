import * as mongoose from 'mongoose';

import {
  GameServerProbesProbeDocument,
  GameServerProbesProbeModel,
  GameServerProbesProbeSchema,
} from './probe';

export interface GameServerProbes {
  liveness: GameServerProbesProbeDocument;
  readiness?: GameServerProbesProbeDocument;
}

export type GameServerProbesDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerProbes;

export interface GameServerProbesModelType extends mongoose.Model<GameServerProbesDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerProbesModelType,
    values?: Partial<GameServerProbes>,
  ): GameServerProbesDocument;
}

const GameServerProbesSchema = new mongoose.Schema<
  GameServerProbesDocument,
  GameServerProbesModelType
>(
  {
    liveness: { required: true, type: GameServerProbesProbeSchema },
    readiness: { type: GameServerProbesProbeSchema },
  },
  { _id: false },
);

GameServerProbesSchema.statics.mock = function (values: Partial<GameServerProbes> = {}) {
  const defaults: Partial<GameServerProbes> = { liveness: GameServerProbesProbeModel.mock() };

  return new this({ ...defaults, ...values });
};

export const GameServerProbesModel = mongoose.model<
  GameServerProbesDocument,
  GameServerProbesModelType
>('GameServerProbesSchema', GameServerProbesSchema);

export { GameServerProbesSchema };

export default GameServerProbesModel;
