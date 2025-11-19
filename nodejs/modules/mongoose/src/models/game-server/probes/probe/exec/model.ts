import * as mongoose from 'mongoose';

import { arrayLengthValidator } from '../../../../../validators';

export interface GameServerProbesProbeExec {
  command: string[];
}

export type GameServerProbesProbeExecDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerProbesProbeExec;

export interface GameServerProbesProbeExecModelType
  extends mongoose.Model<GameServerProbesProbeExecDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerProbesProbeExecModelType,
    values?: Partial<GameServerProbesProbeExec>,
  ): GameServerProbesProbeExecDocument;
}

const GameServerProbesProbeExecSchema = new mongoose.Schema<GameServerProbesProbeExecDocument>(
  {
    command: {
      maxlength: 64,
      required: true,
      trim: true,
      type: [String],
      validate: arrayLengthValidator(10, 1),
    },
  },
  { _id: false },
);

GameServerProbesProbeExecSchema.statics.mock = function (
  values: Partial<GameServerProbesProbeExec> = {},
) {
  const defaults: Partial<GameServerProbesProbeExec> = { command: ['command'] };

  return new this({ ...defaults, ...values });
};

export const GameServerProbesProbeExecModel = mongoose.model<
  GameServerProbesProbeExecDocument,
  GameServerProbesProbeExecModelType
>('GameServerProbesProbeExecSchema', GameServerProbesProbeExecSchema);

export { GameServerProbesProbeExecSchema };

export default GameServerProbesProbeExecModel;
