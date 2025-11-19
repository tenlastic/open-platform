import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { arrayLengthValidator } from '../../../../../validators';

import {
  GameServerProbesProbeHttpHeaderDocument,
  GameServerProbesProbeHttpHeaderModel,
  GameServerProbesProbeHttpHeaderSchema,
} from './header';

export enum GameServerProbesProbeHttpScheme {
  Http = 'HTTP',
  Https = 'HTTPS',
}

export interface GameServerProbesProbeHttp {
  headers: GameServerProbesProbeHttpHeaderDocument[];
  path?: string;
  port: number;
  scheme?: GameServerProbesProbeHttpScheme;
}

export type GameServerProbesProbeHttpDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerProbesProbeHttp;

export interface GameServerProbesProbeHttpModelType
  extends mongoose.Model<GameServerProbesProbeHttpDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerProbesProbeHttpModelType,
    values?: Partial<GameServerProbesProbeHttp>,
  ): GameServerProbesProbeHttpDocument;
}

const GameServerProbesProbeHttpSchema = new mongoose.Schema<
  GameServerProbesProbeHttpDocument,
  GameServerProbesProbeHttpModelType
>(
  {
    headers: {
      required: true,
      type: [GameServerProbesProbeHttpHeaderSchema],
      validate: arrayLengthValidator(10),
    },
    path: { default: '/', maxlength: 128, trim: true, type: String },
    port: { max: 65535, min: 1, required: true, type: Number },
    scheme: {
      default: GameServerProbesProbeHttpScheme.Http,
      enum: Object.values(GameServerProbesProbeHttpScheme),
      type: String,
    },
  },
  { _id: false },
);

GameServerProbesProbeHttpSchema.statics.mock = function (
  values: Partial<GameServerProbesProbeHttp> = {},
) {
  const chance = new Chance();
  const defaults: Partial<GameServerProbesProbeHttp> = {
    headers: [GameServerProbesProbeHttpHeaderModel.mock()],
    path: chance.hash(),
    port: chance.integer({ max: 65535, min: 1 }),
  };

  return new this({ ...defaults, ...values });
};

export const GameServerProbesProbeHttpModel = mongoose.model<
  GameServerProbesProbeHttpDocument,
  GameServerProbesProbeHttpModelType
>('GameServerProbesProbeHttpSchema', GameServerProbesProbeHttpSchema);

export { GameServerProbesProbeHttpSchema };

export default GameServerProbesProbeHttpModel;
