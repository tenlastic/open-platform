import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusComponentSchema {
  @prop({ required: true, type: Number })
  public current: number;

  @prop({ enum: GameServerStatusComponentName, required: true, type: String })
  public name: GameServerStatusComponentName;

  @prop({ default: () => GameServerStatusPhase.Pending, enum: GameServerStatusPhase, type: String })
  public phase: GameServerStatusPhase;

  @prop({ required: true, type: Number })
  public total: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: GameServerStatusComponentModel,
    values: Partial<GameServerStatusComponentSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      current: chance.integer({ min: 0 }),
      name: GameServerStatusComponentName.Application,
      phase: GameServerStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusComponentDocument = DocumentType<GameServerStatusComponentSchema>;
export type GameServerStatusComponentModel = ReturnModelType<
  typeof GameServerStatusComponentSchema
>;
export const GameServerStatusComponent = getModelForClass(GameServerStatusComponentSchema);
