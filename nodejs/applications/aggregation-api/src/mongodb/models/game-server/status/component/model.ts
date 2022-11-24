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
  @prop({ type: Number })
  public current: number;

  @prop({ type: String })
  public name: GameServerStatusComponentName;

  @prop({ type: String })
  public phase: GameServerStatusPhase;

  @prop({ type: Number })
  public total: number;
}

export type GameServerStatusComponentDocument = DocumentType<GameServerStatusComponentSchema>;
export type GameServerStatusComponentModel = ReturnModelType<
  typeof GameServerStatusComponentSchema
>;
export const GameServerStatusComponent = getModelForClass(GameServerStatusComponentSchema);
