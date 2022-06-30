import {
  DocumentType,
  getDiscriminatorModelForClass,
  pre,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

import { Module, ModuleSchema } from '../../models';
import { ResourcesSchema } from './resources';
import { StatusSchema } from './status';

export const BuildModuleDiscriminatorValue = 'build';

@pre('validate', function (this: BuildModuleDocument) {
  const { limits, resources } = this;
  const message = 'Resource request exceeds limit.';

  // Check Minio limits.
  if (resources.minio.cpu > limits.minio.cpu) {
    this.invalidate('resources.minio.cpu', message, resources.minio.cpu);
  }
  if (resources.minio.memory > limits.minio.memory) {
    this.invalidate('resources.minio.memory', message, resources.minio.memory);
  }
  if (limits.minio.preemptible && !resources.minio.preemptible) {
    this.invalidate('resources.minio.preemptible', message, resources.minio.preemptible);
  }
  if (resources.minio.replicas > limits.minio.replicas) {
    this.invalidate('resources.minio.replicas', message, resources.minio.replicas);
  }
  if (resources.minio.storage > limits.minio.storage) {
    this.invalidate('resources.minio.storage', message, resources.minio.storage);
  }
})
export class BuildModuleSchema extends ModuleSchema {
  @prop()
  public limits: ResourcesSchema;

  @prop()
  public resources: ResourcesSchema;

  @prop()
  public status: StatusSchema;
}

export type BuildModuleDocument = DocumentType<BuildModuleSchema>;
export type BuildModuleModel = ReturnModelType<typeof BuildModuleSchema>;
export const BuildModule = getDiscriminatorModelForClass(
  Module,
  BuildModuleSchema,
  BuildModuleDiscriminatorValue,
);
