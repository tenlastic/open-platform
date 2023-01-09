import { DocumentType, getModelForClass, modelOptions, pre, prop } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { GameServerProbesProbeExecDocument, GameServerProbesProbeExecSchema } from './exec';
import {
  GameServerProbesProbeHttpDocument,
  GameServerProbesProbeHttpModel,
  GameServerProbesProbeHttpSchema,
} from './http';
import { GameServerProbesProbeTcpDocument, GameServerProbesProbeTcpSchema } from './tcp';

@modelOptions({ schemaOptions: { _id: false } })
@pre('validate', function (this: GameServerProbesProbeDocument) {
  if (!this.validateOneExecHttpTcp()) {
    const message = 'One of the following fields must be provided: exec, http, and tcp.';

    this.invalidate('exec', message, this.exec);
    this.invalidate('http', message, this.http);
    this.invalidate('tcp', message, this.tcp);
  } else if (!this.validateOnlyOneExecHttpTcp()) {
    const message = 'Only one of the following fields can be provided: exec, http, and tcp.';

    this.invalidate('exec', message, this.exec);
    this.invalidate('http', message, this.http);
    this.invalidate('tcp', message, this.tcp);
  }
})
export class GameServerProbesProbeSchema {
  @prop({ type: GameServerProbesProbeExecSchema })
  public exec: GameServerProbesProbeExecDocument;

  @prop({ default: 3, type: Number })
  public failureThreshold: number;

  @prop({ type: GameServerProbesProbeHttpSchema })
  public http: GameServerProbesProbeHttpDocument;

  @prop({ default: 0, type: Number })
  public initialDelaySeconds: number;

  @prop({ default: 10, type: Number })
  public periodSeconds: number;

  @prop({ default: 1, type: Number })
  public successThreshold: number;

  @prop({ type: GameServerProbesProbeTcpSchema })
  public tcp: GameServerProbesProbeTcpDocument;

  @prop({ default: 1, type: Number })
  public timeoutSeconds: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerProbesProbeModel,
    values: Partial<GameServerProbesProbeSchema> = {},
  ) {
    const defaults = { http: GameServerProbesProbeHttpModel.mock() };

    return new this({ ...defaults, ...values });
  }

  /**
   * Returns true if at least one strategy is provided.
   */
  private validateOneExecHttpTcp(this: GameServerProbesProbeDocument) {
    return this.exec || this.http || this.tcp;
  }

  /**
   * Returns true if only one strategy is provided.
   */
  private validateOnlyOneExecHttpTcp(this: GameServerProbesProbeDocument) {
    const fields = ['exec', 'http', 'tcp'];
    const count = fields.reduce((previous, current) => (this[current] ? ++previous : previous), 0);

    return count === 1;
  }
}

export type GameServerProbesProbeDocument = DocumentType<GameServerProbesProbeSchema>;
export const GameServerProbesProbeModel = getModelForClass(GameServerProbesProbeSchema, {
  existingMongoose: mongoose,
});
