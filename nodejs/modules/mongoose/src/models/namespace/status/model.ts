import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  NamespaceStatusComponentDocument,
  NamespaceStatusComponentModel,
  NamespaceStatusComponentSchema,
} from './component';
import {
  NamespaceStatusLimitsDocument,
  NamespaceStatusLimitsModel,
  NamespaceStatusLimitsSchema,
} from './limits';
import { NamespaceStatusNodeDocument, NamespaceStatusNodeSchema } from './node';

export enum NamespaceStatusComponentName {
  API = 'API',
  CDC = 'CDC',
  Connector = 'Connector',
  Metrics = 'Metrics',
  Sidecar = 'Sidecar',
}

export enum NamespaceStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusSchema {
  @prop(
    {
      default: () => [
        new NamespaceStatusComponentModel({
          current: 0,
          name: NamespaceStatusComponentName.API,
          phase: NamespaceStatusPhase.Pending,
          total: 1,
        }),
        new NamespaceStatusComponentModel({
          current: 0,
          name: NamespaceStatusComponentName.CDC,
          phase: NamespaceStatusPhase.Pending,
          total: 1,
        }),
        new NamespaceStatusComponentModel({
          current: 0,
          name: NamespaceStatusComponentName.Connector,
          phase: NamespaceStatusPhase.Pending,
          total: 1,
        }),
        new NamespaceStatusComponentModel({
          current: 0,
          name: NamespaceStatusComponentName.Metrics,
          phase: NamespaceStatusPhase.Pending,
          total: 1,
        }),
        new NamespaceStatusComponentModel({
          current: 0,
          name: NamespaceStatusComponentName.Sidecar,
          phase: NamespaceStatusPhase.Pending,
          total: 1,
        }),
      ],
      type: NamespaceStatusComponentSchema,
      unset: false,
    },
    PropType.ARRAY,
  )
  public components: NamespaceStatusComponentDocument[];

  @prop({
    default: () => new NamespaceStatusLimitsModel(),
    type: NamespaceStatusLimitsSchema,
    unset: false,
  })
  public limits: NamespaceStatusLimitsDocument;

  @prop({ type: NamespaceStatusNodeSchema }, PropType.ARRAY)
  public nodes: NamespaceStatusNodeDocument[];

  @prop({ default: () => NamespaceStatusPhase.Pending, enum: NamespaceStatusPhase, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ type: String })
  public version: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof NamespaceStatusModel,
    values: Partial<NamespaceStatusSchema> = {},
  ) {
    const defaults = { phase: NamespaceStatusPhase.Running };

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceStatusDocument = DocumentType<NamespaceStatusSchema>;
export const NamespaceStatusModel = getModelForClass(NamespaceStatusSchema, {
  existingMongoose: mongoose,
});
