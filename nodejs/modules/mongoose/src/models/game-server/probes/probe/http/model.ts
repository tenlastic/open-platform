import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';

import { arrayLengthValidator } from '../../../../../validators';

import {
  GameServerProbesProbeHttpHeaderDocument,
  GameServerProbesProbeHttpHeaderSchema,
} from './header';

export enum GameServerProbesProbeHttpScheme {
  Http = 'HTTP',
  Https = 'HTTPS',
}

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerProbesProbeHttpSchema {
  @prop(
    {
      required: true,
      type: GameServerProbesProbeHttpHeaderSchema,
      validate: arrayLengthValidator(10),
    },
    PropType.ARRAY,
  )
  public headers: GameServerProbesProbeHttpHeaderDocument[];

  @prop({ default: '/', maxlength: 128, trim: true, type: String })
  public path: string;

  @prop({ required: true, type: Number })
  public port: number;

  @prop({
    default: GameServerProbesProbeHttpScheme.Http,
    enum: GameServerProbesProbeHttpScheme,
    type: String,
  })
  public scheme: GameServerProbesProbeHttpScheme;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerProbesProbeHttpModel,
    values: Partial<GameServerProbesProbeHttpSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { path: chance.hash(), port: chance.integer({ max: 65535, min: 80 }) };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerProbesProbeHttpDocument = DocumentType<GameServerProbesProbeHttpSchema>;
export const GameServerProbesProbeHttpModel = getModelForClass(GameServerProbesProbeHttpSchema);
