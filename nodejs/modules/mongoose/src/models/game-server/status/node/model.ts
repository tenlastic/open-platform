import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerStatusNodeSchema {
  @prop({ enum: GameServerStatusComponentName, required: true, type: String })
  public component: GameServerStatusComponentName;

  @prop({ required: true, type: String })
  public container: string;

  @prop({ default: () => GameServerStatusPhase.Pending, enum: GameServerStatusPhase, type: String })
  public phase: GameServerStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerStatusNodeModel,
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
export const GameServerStatusNodeModel = getModelForClass(GameServerStatusNodeSchema, {
  existingMongoose: mongoose,
});
