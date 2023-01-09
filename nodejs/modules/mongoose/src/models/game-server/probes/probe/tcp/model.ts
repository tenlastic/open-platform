import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerProbesProbeTcpSchema {
  @prop({ max: 65535, min: 1, required: true, type: Number })
  public port: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerProbesProbeTcpModel,
    values: Partial<GameServerProbesProbeTcpSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { port: chance.integer({ max: 65535, min: 1 }) };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerProbesProbeTcpDocument = DocumentType<GameServerProbesProbeTcpSchema>;
export const GameServerProbesProbeTcpModel = getModelForClass(GameServerProbesProbeTcpSchema, {
  existingMongoose: mongoose,
});
