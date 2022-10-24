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
  @prop({ enum: GameServerStatusComponentName, required: true, type: String })
  public component: GameServerStatusComponentName;

  @prop({ required: true, type: String })
  public container: string;

  @prop({ enum: GameServerStatusPhase, required: true, type: String })
  public phase: GameServerStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;
}

export type GameServerStatusNodeDocument = DocumentType<GameServerStatusNodeSchema>;
export type GameServerStatusNodeModel = ReturnModelType<typeof GameServerStatusNodeSchema>;
export const GameServerStatusNode = getModelForClass(GameServerStatusNodeSchema);
