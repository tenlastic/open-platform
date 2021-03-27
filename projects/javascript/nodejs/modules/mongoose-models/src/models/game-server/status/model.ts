import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { GameServerStatusNodeSchema } from './node';

export enum GameServerStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusSchema {
  @arrayProp({ items: GameServerStatusNodeSchema })
  public nodes: GameServerStatusNodeSchema[];

  @prop({ enum: GameServerStatusPhase, required: true })
  public phase: GameServerStatusPhase;
}

export type GameServerStatusDocument = DocumentType<GameServerStatusSchema>;
export type GameServerStatusModel = ReturnModelType<typeof GameServerStatusSchema>;
export const GameServerStatus = getModelForClass(GameServerStatusSchema);
