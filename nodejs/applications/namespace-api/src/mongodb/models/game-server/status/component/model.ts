import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class GameServerStatusComponentSchema {
  @prop({ required: true, type: Number })
  public current: number;

  @prop({ enum: GameServerStatusComponentName, required: true, type: String })
  public name: GameServerStatusComponentName;

  @prop({ enum: GameServerStatusPhase, required: true, type: String })
  public phase: GameServerStatusPhase;

  @prop({ required: true, type: Number })
  public total: number;
}

export type GameServerStatusComponentDocument = DocumentType<GameServerStatusComponentSchema>;
export type GameServerStatusComponentModel = ReturnModelType<
  typeof GameServerStatusComponentSchema
>;
export const GameServerStatusComponent = getModelForClass(GameServerStatusComponentSchema);
