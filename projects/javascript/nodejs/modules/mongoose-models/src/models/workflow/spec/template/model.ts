import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecTemplateDagSchema } from './dag';
import { WorkflowSpecTemplateInputsSchema } from './inputs';
import { WorkflowSpecTemplateRetryStrategySchema } from './retry-strategy';
import { WorkflowSpecTemplateScriptSchema } from './script';
import { WorkflowSpecTemplateSidecarSchema } from './sidecar';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSchema {
  @prop()
  public dag: WorkflowSpecTemplateDagSchema;

  @prop()
  public inputs: WorkflowSpecTemplateInputsSchema;

  @prop({ required: true })
  public name: string;

  @prop()
  public retryStrategy: WorkflowSpecTemplateRetryStrategySchema;

  @prop()
  public script: WorkflowSpecTemplateScriptSchema;

  @arrayProp({ items: WorkflowSpecTemplateSidecarSchema })
  public sidecars: WorkflowSpecTemplateSidecarSchema[];
}

export type WorkflowSpecTemplateDocument = DocumentType<WorkflowSpecTemplateSchema>;
export type WorkflowSpecTemplateModel = ReturnModelType<typeof WorkflowSpecTemplateSchema>;
export const WorkflowSpecTemplate = getModelForClass(WorkflowSpecTemplateSchema);
