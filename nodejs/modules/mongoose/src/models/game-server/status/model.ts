import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import {
  GameServerStatusComponent,
  GameServerStatusComponentDocument,
  GameServerStatusComponentSchema,
} from './component';
import { GameServerStatusEndpointsDocument, GameServerStatusEndpointsSchema } from './endpoints';
import { GameServerStatusNodeDocument, GameServerStatusNodeSchema } from './node';

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
  @prop(
    {
      default: () => [
        new GameServerStatusComponent({
          current: 0,
          name: GameServerStatusComponentName.Application,
          phase: GameServerStatusPhase.Pending,
          total: 1,
        }),
        new GameServerStatusComponent({
          current: 0,
          name: GameServerStatusComponentName.Sidecar,
          phase: GameServerStatusPhase.Pending,
          total: 1,
        }),
      ],
      type: GameServerStatusComponentSchema,
      unset: false,
    },
    PropType.ARRAY,
  )
  public components: GameServerStatusComponentDocument[];

  @prop({ type: GameServerStatusEndpointsSchema })
  public endpoints: GameServerStatusEndpointsDocument;

  @prop({ type: String })
  public message: string;

  @prop({ type: GameServerStatusNodeSchema }, PropType.ARRAY)
  public nodes: GameServerStatusNodeDocument[];

  @prop({ default: () => GameServerStatusPhase.Pending, enum: GameServerStatusPhase, type: String })
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
