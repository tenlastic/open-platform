import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecEnvValueFromSecretKeyRefSchema } from './secret-key-ref';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecEnvValueFromSchema {
  @prop({ required: true })
  public secretKeyRef: WorkflowSpecEnvValueFromSecretKeyRefSchema;
}

export type WorkflowSpecEnvValueFromDocument = DocumentType<WorkflowSpecEnvValueFromSchema>;
export type WorkflowSpecEnvValueFromModel = ReturnModelType<typeof WorkflowSpecEnvValueFromSchema>;
export const WorkflowSpecEnvValueFrom = getModelForClass(WorkflowSpecEnvValueFromSchema);
