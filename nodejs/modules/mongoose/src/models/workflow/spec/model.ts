import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecArgumentsDocument, WorkflowSpecArgumentsSchema } from './arguments';
import {
  WorkflowSpecTemplateDocument,
  WorkflowSpecTemplateModel,
  WorkflowSpecTemplateSchema,
} from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecSchema {
  @prop({ type: WorkflowSpecArgumentsSchema })
  public arguments: WorkflowSpecArgumentsDocument;

  @prop({ required: true, type: String })
  public entrypoint: string;

  @prop({ default: 1, min: 0, type: Number })
  public parallelism: number;

  @prop({ required: true, type: WorkflowSpecTemplateSchema }, PropType.ARRAY)
  public templates: WorkflowSpecTemplateDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof WorkflowSpecModel, values: Partial<WorkflowSpecSchema> = {}) {
    const chance = new Chance();
    const defaults = { entrypoint: chance.hash(), templates: [WorkflowSpecTemplateModel.mock()] };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecDocument = DocumentType<WorkflowSpecSchema>;
export const WorkflowSpecModel = getModelForClass(WorkflowSpecSchema, {
  existingMongoose: mongoose,
});
