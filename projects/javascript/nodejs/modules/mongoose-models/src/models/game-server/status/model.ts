import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
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
  @prop()
  public endpoints: GameServerStatusEndpointsSchema;

  @arrayProp({ items: GameServerStatusNodeSchema })
  public nodes: GameServerStatusNodeSchema[];

  @prop({ enum: GameServerStatusPhase, required: true })
  public phase: GameServerStatusPhase;

  @prop()
  public version: string;
}

export type GameServerStatusDocument = DocumentType<GameServerStatusSchema>;
export type GameServerStatusModel = ReturnModelType<typeof GameServerStatusSchema>;
export const GameServerStatus = getModelForClass(GameServerStatusSchema);
