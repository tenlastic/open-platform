import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  GameServerStatusComponentDocument,
  GameServerStatusComponentModel,
  GameServerStatusComponentSchema,
} from './component';
import { GameServerStatusEndpointDocument, GameServerStatusEndpointSchema } from './endpoint';
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
        new GameServerStatusComponentModel({
          current: 0,
          name: GameServerStatusComponentName.Application,
          phase: GameServerStatusPhase.Pending,
          total: 1,
        }),
        new GameServerStatusComponentModel({
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

  @prop({ type: GameServerStatusEndpointSchema }, PropType.ARRAY)
  public endpoints: GameServerStatusEndpointDocument[];

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
  public static mock(
    this: typeof GameServerStatusModel,
    values: Partial<GameServerStatusSchema> = {},
  ) {
    const defaults = { phase: GameServerStatusPhase.Running };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusDocument = DocumentType<GameServerStatusSchema>;
export const GameServerStatusModel = getModelForClass(GameServerStatusSchema, {
  existingMongoose: mongoose,
});
