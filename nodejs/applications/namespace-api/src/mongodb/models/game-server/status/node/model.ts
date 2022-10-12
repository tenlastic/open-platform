import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class GameServerStatusNodeSchema {
  @prop({ required: true, type: String })
  public _id: string;

  @prop({ enum: GameServerStatusComponentName, required: true, type: String })
  public component: GameServerStatusComponentName;

  @prop({ enum: GameServerStatusPhase, required: true, type: String })
  public phase: GameServerStatusPhase;
}

export type GameServerStatusNodeDocument = DocumentType<GameServerStatusNodeSchema>;
export type GameServerStatusNodeModel = ReturnModelType<typeof GameServerStatusNodeSchema>;
export const GameServerStatusNode = getModelForClass(GameServerStatusNodeSchema);
