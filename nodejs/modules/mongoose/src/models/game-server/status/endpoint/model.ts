import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';

export enum GameServerStatusEndpointProtocol {
  Tcp = 'TCP',
  Udp = 'UDP',
}

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusEndpointSchema {
  @prop({ required: true, type: String })
  public externalIp: string;

  @prop({ required: true, type: Number })
  public externalPort: string;

  @prop({ required: true, type: String })
  public internalIp: string;

  @prop({ required: true, type: Number })
  public internalPort: number;

  @prop({
    enum: GameServerStatusEndpointProtocol,
    required: true,
    type: String,
  })
  public protocol: GameServerStatusEndpointProtocol;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerStatusEndpointModel,
    values: Partial<GameServerStatusEndpointSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      externalIp: chance.hash(),
      externalPort: chance.integer({ max: 65535, min: 1 }),
      internalIp: chance.hash(),
      internalPort: chance.integer({ max: 65535, min: 1 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusEndpointDocument = DocumentType<GameServerStatusEndpointSchema>;
export const GameServerStatusEndpointModel = getModelForClass(GameServerStatusEndpointSchema);
