import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerProbesProbeHttpHeaderSchema {
  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ maxlength: 5120, required: true, trim: true, type: String })
  public value: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerProbesProbeHttpHeaderModel,
    values: Partial<GameServerProbesProbeHttpHeaderSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { name: chance.hash(), value: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerProbesProbeHttpHeaderDocument =
  DocumentType<GameServerProbesProbeHttpHeaderSchema>;
export const GameServerProbesProbeHttpHeaderModel = getModelForClass(
  GameServerProbesProbeHttpHeaderSchema,
);
