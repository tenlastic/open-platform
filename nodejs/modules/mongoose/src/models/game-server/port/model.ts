import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export enum GameServerPortProtocol {
  Tcp = 'TCP',
  Udp = 'UDP',
}

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerPortSchema {
  @prop({ max: 65535, min: 1, required: true, type: Number })
  public port: number;

  @prop({ default: GameServerPortProtocol.Tcp, enum: GameServerPortProtocol, type: String })
  public protocol: GameServerPortProtocol;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof GameServerPortModel, values: Partial<GameServerPortSchema> = {}) {
    const chance = new Chance();
    const defaults = { port: chance.integer({ max: 65535, min: 1 }) };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerPortDocument = DocumentType<GameServerPortSchema>;
export const GameServerPortModel = getModelForClass(GameServerPortSchema, {
  existingMongoose: mongoose,
});
