import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusEndpointsSchema {
  @prop()
  public tcp: string;

  @prop()
  public udp: string;

  @prop()
  public websocket: string;
}

export type GameServerStatusEndpointsDocument = DocumentType<GameServerStatusEndpointsSchema>;
export type GameServerStatusEndpointsModel = ReturnModelType<
  typeof GameServerStatusEndpointsSchema
>;
export const GameServerStatusEndpoints = getModelForClass(GameServerStatusEndpointsSchema);
