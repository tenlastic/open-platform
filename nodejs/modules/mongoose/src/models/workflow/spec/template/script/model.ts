import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';

import { WorkflowSpecEnvDocument, WorkflowSpecEnvSchema } from '../../env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateScriptSchema {
  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public args: string[];

  @prop({ default: ['sh'], type: String }, PropType.ARRAY)
  public command: string[];

  @prop({ default: undefined, type: WorkflowSpecEnvSchema }, PropType.ARRAY)
  public env: WorkflowSpecEnvDocument[];

  @prop({ required: true, type: String })
  public image: string;

  @prop({ required: true, type: String })
  public source: string;

  @prop({ default: '/workspace/', type: String })
  public workingDir: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowSpecTemplateScriptModel,
    values: Partial<WorkflowSpecTemplateScriptSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { image: chance.hash(), source: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateScriptDocument = DocumentType<WorkflowSpecTemplateScriptSchema>;
export const WorkflowSpecTemplateScriptModel = getModelForClass(WorkflowSpecTemplateScriptSchema);
