import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusEndpointsSchema {
  @prop({ type: String })
  public tcp: string;

  @prop({ type: String })
  public udp: string;

  @prop({ type: String })
  public websocket: string;
}

export type GameServerStatusEndpointsDocument = DocumentType<GameServerStatusEndpointsSchema>;
export type GameServerStatusEndpointsModel = ReturnModelType<
  typeof GameServerStatusEndpointsSchema
>;
export const GameServerStatusEndpoints = getModelForClass(GameServerStatusEndpointsSchema);
