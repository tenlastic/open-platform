import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowSpecTemplateDagSchema } from './dag';
import { WorkflowSpecTemplateInputsSchema } from './inputs';
import { WorkflowSpecTemplateRetryStrategySchema } from './retry-strategy';
import { WorkflowSpecTemplateScriptSchema } from './script';
import { WorkflowSpecTemplateSidecarSchema } from './sidecar';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSchema {
  @prop({ type: WorkflowSpecTemplateDagSchema })
  public dag: WorkflowSpecTemplateDagSchema;

  @prop({ WorkflowSpecTemplateInputsSchema })
  public inputs: WorkflowSpecTemplateInputsSchema;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ type: WorkflowSpecTemplateRetryStrategySchema })
  public retryStrategy: WorkflowSpecTemplateRetryStrategySchema;

  @prop({ WorkflowSpecTemplateScriptSchema })
  public script: WorkflowSpecTemplateScriptSchema;

  @prop({ type: WorkflowSpecTemplateSidecarSchema }, PropType.ARRAY)
  public sidecars: WorkflowSpecTemplateSidecarSchema[];
}

export type WorkflowSpecTemplateDocument = DocumentType<WorkflowSpecTemplateSchema>;
export type WorkflowSpecTemplateModel = ReturnModelType<typeof WorkflowSpecTemplateSchema>;
export const WorkflowSpecTemplate = getModelForClass(WorkflowSpecTemplateSchema);
