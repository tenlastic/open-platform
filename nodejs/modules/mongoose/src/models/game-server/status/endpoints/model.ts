import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusEndpointsSchema {
  @prop({ type: String })
  public tcp: string;

  @prop({ type: String })
  public udp: string;

  @prop({ type: String })
  public websocket: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: GameServerStatusEndpointsModel,
    values: Partial<GameServerStatusEndpointsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusEndpointsDocument = DocumentType<GameServerStatusEndpointsSchema>;
export type GameServerStatusEndpointsModel = ReturnModelType<
  typeof GameServerStatusEndpointsSchema
>;
export const GameServerStatusEndpoints = getModelForClass(GameServerStatusEndpointsSchema);
