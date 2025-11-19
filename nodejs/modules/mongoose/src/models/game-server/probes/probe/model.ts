import * as mongoose from 'mongoose';

import { GameServerProbesProbeExecDocument, GameServerProbesProbeExecSchema } from './exec';
import {
  GameServerProbesProbeHttpDocument,
  GameServerProbesProbeHttpModel,
  GameServerProbesProbeHttpSchema,
} from './http';
import { GameServerProbesProbeTcpDocument, GameServerProbesProbeTcpSchema } from './tcp';

export interface GameServerProbesProbe {
  exec?: GameServerProbesProbeExecDocument;
  failureThreshold?: number;
  http?: GameServerProbesProbeHttpDocument;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  tcp?: GameServerProbesProbeTcpDocument;
  timeoutSeconds?: number;
}

export type GameServerProbesProbeDocument = mongoose.Document<mongoose.Types.ObjectId> &
  GameServerProbesProbe;

export interface GameServerProbesProbeModelType
  extends mongoose.Model<GameServerProbesProbeDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: GameServerProbesProbeModelType,
    values?: Partial<GameServerProbesProbe>,
  ): GameServerProbesProbeDocument;
}

const GameServerProbesProbeSchema = new mongoose.Schema<
  GameServerProbesProbeDocument,
  GameServerProbesProbeModelType
>(
  {
    exec: { type: GameServerProbesProbeExecSchema },
    failureThreshold: { default: 3, type: Number },
    http: { type: GameServerProbesProbeHttpSchema },
    initialDelaySeconds: { default: 0, type: Number },
    periodSeconds: { default: 10, type: Number },
    successThreshold: { default: 1, type: Number },
    tcp: { type: GameServerProbesProbeTcpSchema },
    timeoutSeconds: { default: 1, type: Number },
  },
  { _id: false },
);

GameServerProbesProbeSchema.pre('validate', function (this: GameServerProbesProbeDocument) {
  const hasOne = !!(this.exec || this.http || this.tcp);
  if (!hasOne) {
    const message = 'One of the following fields must be provided: exec, http, and tcp.';

    this.invalidate('exec', message, this.exec);
    this.invalidate('http', message, this.http);
    this.invalidate('tcp', message, this.tcp);
  } else {
    const fields = ['exec', 'http', 'tcp'];
    const count = fields.reduce(
      (previous, current) =>
        (this as unknown as Record<string, unknown>)[current] !== undefined ? ++previous : previous,
      0,
    );

    if (count !== 1) {
      const message = 'Only one of the following fields can be provided: exec, http, and tcp.';

      this.invalidate('exec', message, this.exec);
      this.invalidate('http', message, this.http);
      this.invalidate('tcp', message, this.tcp);
    }
  }
});

GameServerProbesProbeSchema.statics.mock = function (values: Partial<GameServerProbesProbe> = {}) {
  const defaults: Partial<GameServerProbesProbe> = { http: GameServerProbesProbeHttpModel.mock() };

  return new this({ ...defaults, ...values });
};

export const GameServerProbesProbeModel = mongoose.model<
  GameServerProbesProbeDocument,
  GameServerProbesProbeModelType
>('GameServerProbesProbeSchema', GameServerProbesProbeSchema);

export { GameServerProbesProbeSchema };

export default GameServerProbesProbeModel;
