import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export enum GameServerPortProtocol {
  Tcp = 'TCP',
  Udp = 'UDP',
}

export interface GameServerPort {
  port: number;
  protocol?: GameServerPortProtocol;
}

export type GameServerPortDocument = mongoose.Document<mongoose.Types.ObjectId> & GameServerPort;

export interface GameServerPortModelType extends mongoose.Model<GameServerPortDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: GameServerPortModelType, values?: Partial<GameServerPort>): GameServerPortDocument;
}

const GameServerPortSchema = new mongoose.Schema<GameServerPortDocument, GameServerPortModelType>(
  {
    port: { max: 65535, min: 1, required: true, type: Number },
    protocol: {
      default: GameServerPortProtocol.Tcp,
      enum: Object.values(GameServerPortProtocol),
      type: String,
    },
  },
  { _id: false },
);

GameServerPortSchema.statics.mock = function (values: Partial<GameServerPort> = {}) {
  const chance = new Chance();
  const defaults: Partial<GameServerPort> = { port: chance.integer({ max: 65535, min: 1 }) };

  return new this({ ...defaults, ...values });
};

export const GameServerPortModel = mongoose.model<GameServerPortDocument, GameServerPortModelType>(
  'GameServerPortSchema',
  GameServerPortSchema,
);

export { GameServerPortSchema };

export default GameServerPortModel;
