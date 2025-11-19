import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface GameServerProbesProbeHttpHeader {
  name: string;
  value: string;
}

export type GameServerProbesProbeHttpHeaderDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerProbesProbeHttpHeader;

export interface GameServerProbesProbeHttpHeaderModelType
  extends mongoose.Model<GameServerProbesProbeHttpHeaderDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerProbesProbeHttpHeaderModelType,
    values?: Partial<GameServerProbesProbeHttpHeader>,
  ): GameServerProbesProbeHttpHeaderDocument;
}

const GameServerProbesProbeHttpHeaderSchema =
  new mongoose.Schema<GameServerProbesProbeHttpHeaderDocument>(
    {
      name: { maxlength: 64, required: true, trim: true, type: String },
      value: { maxlength: 5120, required: true, trim: true, type: String },
    },
    { _id: false },
  );

GameServerProbesProbeHttpHeaderSchema.statics.mock = function (
  values: Partial<GameServerProbesProbeHttpHeader> = {},
) {
  const chance = new Chance();
  const defaults: Partial<GameServerProbesProbeHttpHeader> = {
    name: chance.hash(),
    value: chance.hash(),
  };

  return new this({ ...defaults, ...values });
};

export const GameServerProbesProbeHttpHeaderModel = mongoose.model<
  GameServerProbesProbeHttpHeaderDocument,
  GameServerProbesProbeHttpHeaderModelType
>('GameServerProbesProbeHttpHeaderSchema', GameServerProbesProbeHttpHeaderSchema);

export { GameServerProbesProbeHttpHeaderSchema };

export default GameServerProbesProbeHttpHeaderModel;
