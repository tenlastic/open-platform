import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { GameServerStatusComponentSchema } from './component';
import { GameServerStatusEndpointsSchema } from './endpoints';
import { GameServerStatusNodeSchema } from './node';

export enum GameServerStatusComponentName {
  Application = 'Application',
  Sidecar = 'Sidecar',
}

export enum GameServerStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusSchema {
  @prop({ type: GameServerStatusComponentSchema }, PropType.ARRAY)
  public components: GameServerStatusComponentSchema[];

  @prop({ type: GameServerStatusEndpointsSchema })
  public endpoints: GameServerStatusEndpointsSchema;

  @prop({ type: String })
  public message: string;

  @prop({ type: GameServerStatusNodeSchema }, PropType.ARRAY)
  public nodes: GameServerStatusNodeSchema[];

  @prop({
    default: GameServerStatusPhase.Pending,
    enum: GameServerStatusPhase,
    required: true,
    type: String,
  })
  public phase: GameServerStatusPhase;

  @prop({ type: String })
  public version: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: GameServerStatusModel, values: Partial<GameServerStatusSchema> = {}) {
    const defaults = { phase: GameServerStatusPhase.Running };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusDocument = DocumentType<GameServerStatusSchema>;
export type GameServerStatusModel = ReturnModelType<typeof GameServerStatusSchema>;
export const GameServerStatus = getModelForClass(GameServerStatusSchema);