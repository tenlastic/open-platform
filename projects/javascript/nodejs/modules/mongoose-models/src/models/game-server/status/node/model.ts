import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { GameServerStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusNodeSchema {
  @prop({ required: true })
  public name: string;

  @prop({ enum: GameServerStatusPhase, required: true })
  public phase: GameServerStatusPhase;
}

export type GameServerStatusNodeDocument = DocumentType<GameServerStatusNodeSchema>;
export type GameServerStatusNodeModel = ReturnModelType<typeof GameServerStatusNodeSchema>;
export const GameServerStatusNode = getModelForClass(GameServerStatusNodeSchema);
