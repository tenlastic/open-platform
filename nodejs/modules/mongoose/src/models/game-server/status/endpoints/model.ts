import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

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
    this: typeof GameServerStatusEndpointsModel,
    values: Partial<GameServerStatusEndpointsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusEndpointsDocument = DocumentType<GameServerStatusEndpointsSchema>;
export const GameServerStatusEndpointsModel = getModelForClass(GameServerStatusEndpointsSchema);
