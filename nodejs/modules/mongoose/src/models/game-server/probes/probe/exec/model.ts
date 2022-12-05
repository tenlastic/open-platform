import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';

import { arrayLengthValidator } from '../../../../../validators';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerProbesProbeExecSchema {
  @prop(
    {
      maxlength: 64,
      required: true,
      trim: true,
      type: String,
      validate: arrayLengthValidator(10, 1),
    },
    PropType.ARRAY,
  )
  public command: string[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerProbesProbeExecModel,
    values: Partial<GameServerProbesProbeExecSchema> = {},
  ) {
    const defaults = { command: ['command'] };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerProbesProbeExecDocument = DocumentType<GameServerProbesProbeExecSchema>;
export const GameServerProbesProbeExecModel = getModelForClass(GameServerProbesProbeExecSchema);
