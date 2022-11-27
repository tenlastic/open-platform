import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class GameServerStatusNodeSchema {
  @prop({ enum: GameServerStatusComponentName, required: true, type: String })
  public component: GameServerStatusComponentName;

  @prop({ required: true, type: String })
  public container: string;

  @prop({ enum: GameServerStatusPhase, required: true, type: String })
  public phase: GameServerStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: GameServerStatusNodeModel,
    values: Partial<GameServerStatusNodeSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      component: GameServerStatusComponentName.Application,
      container: chance.hash(),
      phase: GameServerStatusPhase.Running,
      pod: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerStatusNodeDocument = DocumentType<GameServerStatusNodeSchema>;
export type GameServerStatusNodeModel = ReturnModelType<typeof GameServerStatusNodeSchema>;
export const GameServerStatusNode = getModelForClass(GameServerStatusNodeSchema);
