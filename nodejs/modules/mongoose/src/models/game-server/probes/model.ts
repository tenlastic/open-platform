import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

import {
  GameServerProbesProbeDocument,
  GameServerProbesProbeModel,
  GameServerProbesProbeSchema,
} from './probe';

@modelOptions({ schemaOptions: { _id: false } })
export class GameServerProbesSchema {
  @prop({ required: true, type: GameServerProbesProbeSchema })
  public liveness: GameServerProbesProbeDocument;

  @prop({ type: GameServerProbesProbeSchema })
  public readiness: GameServerProbesProbeDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerProbesModel,
    values: Partial<GameServerProbesSchema> = {},
  ) {
    const defaults = { liveness: GameServerProbesProbeModel.mock() };

    return new this({ ...defaults, ...values });
  }
}

export type GameServerProbesDocument = DocumentType<GameServerProbesSchema>;
export const GameServerProbesModel = getModelForClass(GameServerProbesSchema);
