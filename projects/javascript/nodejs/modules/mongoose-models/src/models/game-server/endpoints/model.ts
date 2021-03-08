import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerEndpointsSchema {
  @prop()
  public tcp: string;

  @prop()
  public udp: string;

  @prop()
  public websocket: string;
}

export type GameServerEndpointsDocument = DocumentType<GameServerEndpointsSchema>;
export type GameServerEndpointsModel = ReturnModelType<typeof GameServerEndpointsSchema>;
export const GameServerEndpoints = getModelForClass(GameServerEndpointsSchema);
