import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecEnvDocument, WorkflowSpecEnvSchema } from '../../env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSidecarSchema {
  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public args: string[];

  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public command: string[];

  @prop({ default: undefined, type: WorkflowSpecEnvSchema }, PropType.ARRAY)
  public env: WorkflowSpecEnvDocument[];

  @prop({ required: true, type: String })
  public image: string;

  @prop({ required: true, type: String })
  public name: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowSpecTemplateSidecarModel,
    values: Partial<WorkflowSpecTemplateSidecarSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { image: chance.hash(), name: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateSidecarDocument = DocumentType<WorkflowSpecTemplateSidecarSchema>;
export const WorkflowSpecTemplateSidecarModel = getModelForClass(
  WorkflowSpecTemplateSidecarSchema,
  { existingMongoose: mongoose },
);
