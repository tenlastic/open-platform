import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface GameServerProbesProbeTcp {
  port: number;
}

export type GameServerProbesProbeTcpDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerProbesProbeTcp;

export interface GameServerProbesProbeTcpModelType
  extends mongoose.Model<GameServerProbesProbeTcpDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerProbesProbeTcpModelType,
    values?: Partial<GameServerProbesProbeTcp>,
  ): GameServerProbesProbeTcpDocument;
}

const GameServerProbesProbeTcpSchema = new mongoose.Schema<GameServerProbesProbeTcpDocument>(
  { port: { max: 65535, min: 1, required: true, type: Number } },
  { _id: false },
);

GameServerProbesProbeTcpSchema.statics.mock = function (
  values: Partial<GameServerProbesProbeTcp> = {},
) {
  const chance = new Chance();
  const defaults: Partial<GameServerProbesProbeTcp> = {
    port: chance.integer({ max: 65535, min: 1 }),
  };

  return new this({ ...defaults, ...values });
};

export const GameServerProbesProbeTcpModel = mongoose.model<
  GameServerProbesProbeTcpDocument,
  GameServerProbesProbeTcpModelType
>('GameServerProbesProbeTcpSchema', GameServerProbesProbeTcpSchema);

export { GameServerProbesProbeTcpSchema };

export default GameServerProbesProbeTcpModel;
