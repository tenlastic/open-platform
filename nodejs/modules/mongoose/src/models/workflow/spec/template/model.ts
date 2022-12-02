import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';

import { WorkflowSpecTemplateDagDocument, WorkflowSpecTemplateDagSchema } from './dag';
import { WorkflowSpecTemplateInputsDocument, WorkflowSpecTemplateInputsSchema } from './inputs';
import {
  WorkflowSpecTemplateRetryStrategyDocument,
  WorkflowSpecTemplateRetryStrategySchema,
} from './retry-strategy';
import { WorkflowSpecTemplateScriptDocument, WorkflowSpecTemplateScriptSchema } from './script';
import { WorkflowSpecTemplateSidecarDocument, WorkflowSpecTemplateSidecarSchema } from './sidecar';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSchema {
  @prop({ type: WorkflowSpecTemplateDagSchema })
  public dag: WorkflowSpecTemplateDagDocument;

  @prop({ type: WorkflowSpecTemplateInputsSchema })
  public inputs: WorkflowSpecTemplateInputsDocument;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ type: WorkflowSpecTemplateRetryStrategySchema })
  public retryStrategy: WorkflowSpecTemplateRetryStrategyDocument;

  @prop({ type: WorkflowSpecTemplateScriptSchema })
  public script: WorkflowSpecTemplateScriptDocument;

  @prop({ type: WorkflowSpecTemplateSidecarSchema }, PropType.ARRAY)
  public sidecars: WorkflowSpecTemplateSidecarDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowSpecTemplateModel,
    values: Partial<WorkflowSpecTemplateSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { name: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateDocument = DocumentType<WorkflowSpecTemplateSchema>;
export const WorkflowSpecTemplateModel = getModelForClass(WorkflowSpecTemplateSchema);
