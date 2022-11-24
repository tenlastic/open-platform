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
  @prop({ type: String })
  public component: GameServerStatusComponentName;

  @prop({ type: String })
  public container: string;

  @prop({ type: String })
  public phase: GameServerStatusPhase;

  @prop({ type: String })
  public pod: string;
}

export type GameServerStatusNodeDocument = DocumentType<GameServerStatusNodeSchema>;
export type GameServerStatusNodeModel = ReturnModelType<typeof GameServerStatusNodeSchema>;
export const GameServerStatusNode = getModelForClass(GameServerStatusNodeSchema);
