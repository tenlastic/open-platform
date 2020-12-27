import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecTemplateDagDocument } from './dag';
import { WorkflowSpecTemplateInputsDocument } from './inputs';
import { WorkflowSpecTemplateRetryStrategyDocument } from './retry-strategy';
import { WorkflowSpecTemplateScriptDocument } from './script';
import { WorkflowSpecTemplateSidecar, WorkflowSpecTemplateSidecarDocument } from './sidecar';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSchema {
  @prop()
  public dag: WorkflowSpecTemplateDagDocument;

  @prop()
  public inputs: WorkflowSpecTemplateInputsDocument;

  @prop({ required: true })
  public name: string;

  @prop()
  public retryStrategy: WorkflowSpecTemplateRetryStrategyDocument;

  @prop()
  public script: WorkflowSpecTemplateScriptDocument;

  @arrayProp({ items: WorkflowSpecTemplateSidecar })
  public sidecars: WorkflowSpecTemplateSidecarDocument;
}

export type WorkflowSpecTemplateDocument = DocumentType<WorkflowSpecTemplateSchema>;
export type WorkflowSpecTemplateModel = ReturnModelType<typeof WorkflowSpecTemplateSchema>;
export const WorkflowSpecTemplate = getModelForClass(WorkflowSpecTemplateSchema);
