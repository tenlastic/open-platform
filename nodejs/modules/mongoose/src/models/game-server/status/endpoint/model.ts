import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export enum GameServerStatusEndpointProtocol {
  Tcp = 'TCP',
  Udp = 'UDP',
}

export interface GameServerStatusEndpoint {
  externalIp: string;
  externalPort: number;
  internalIp: string;
  internalPort: number;
  protocol: GameServerStatusEndpointProtocol;
}

export type GameServerStatusEndpointDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerStatusEndpoint;

export interface GameServerStatusEndpointModelType
  extends mongoose.Model<GameServerStatusEndpointDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerStatusEndpointModelType,
    values?: Partial<GameServerStatusEndpoint>,
  ): GameServerStatusEndpointDocument;
}

const GameServerStatusEndpointSchema = new mongoose.Schema<GameServerStatusEndpointDocument>(
  {
    externalIp: { required: true, type: String },
    externalPort: { required: true, type: Number },
    internalIp: { required: true, type: String },
    internalPort: { required: true, type: Number },
    protocol: {
      enum: Object.values(GameServerStatusEndpointProtocol),
      required: true,
      type: String,
    },
  },
  { _id: false },
);

GameServerStatusEndpointSchema.statics.mock = function (
  values: Partial<GameServerStatusEndpoint> = {},
) {
  const chance = new Chance();
  const defaults: Partial<GameServerStatusEndpoint> = {
    externalIp: chance.hash(),
    externalPort: chance.integer({ max: 65535, min: 1 }),
    internalIp: chance.hash(),
    internalPort: chance.integer({ max: 65535, min: 1 }),
    protocol: GameServerStatusEndpointProtocol.Tcp,
  };

  return new this({ ...defaults, ...values });
};

export const GameServerStatusEndpointModel = mongoose.model<
  GameServerStatusEndpointDocument,
  GameServerStatusEndpointModelType
>('GameServerStatusEndpointSchema', GameServerStatusEndpointSchema);

export { GameServerStatusEndpointSchema };

export default GameServerStatusEndpointModel;
