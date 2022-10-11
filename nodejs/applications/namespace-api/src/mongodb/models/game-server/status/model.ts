import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { GameServerStatusEndpointsSchema } from './endpoints';
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
  @prop({ type: GameServerStatusEndpointsSchema })
  public endpoints: GameServerStatusEndpointsSchema;

  @prop({ type: GameServerStatusNodeSchema }, PropType.ARRAY)
  public nodes: GameServerStatusNodeSchema[];

  @prop({ enum: GameServerStatusPhase, required: true, type: String })
  public phase: GameServerStatusPhase;

  @prop({ type: String })
  public version: string;
}

export type GameServerStatusDocument = DocumentType<GameServerStatusSchema>;
export type GameServerStatusModel = ReturnModelType<typeof GameServerStatusSchema>;
export const GameServerStatus = getModelForClass(GameServerStatusSchema);
