import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';

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
  Migrations = 'Migrations',
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
@pre('save', function (this: NamespaceStatusDocument) {
  if (this.isModified('components') || this.isNew) {
    this.setComponents();
    this.setPhase();
  }
})
export class NamespaceStatusSchema {
  @prop({ type: NamespaceStatusComponentSchema, unset: false }, PropType.ARRAY)
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

  /**
   * Sets components, filling in default values if missing.
   */
  private setComponents(this: NamespaceStatusDocument) {
    const components: NamespaceStatusComponentDocument[] = [
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
        name: NamespaceStatusComponentName.Migrations,
        phase: NamespaceStatusPhase.Pending,
        total: 1,
      }),
      new NamespaceStatusComponentModel({
        current: 0,
        name: NamespaceStatusComponentName.Sidecar,
        phase: NamespaceStatusPhase.Pending,
        total: 1,
      }),
    ];

    for (const component of this.components) {
      const index = components.findIndex((d) => d.name === component.name);
      components[index] = component;
    }

    this.components = components;
  }

  /**
   * Sets the phase.
   */
  private setPhase(this: NamespaceStatusDocument) {
    let phase = NamespaceStatusPhase.Pending;
    const statuses = [NamespaceStatusPhase.Running, NamespaceStatusPhase.Succeeded];

    if (this.nodes.some((n) => n.phase === NamespaceStatusPhase.Error)) {
      phase = NamespaceStatusPhase.Error;
    } else if (this.components.every((c) => statuses.includes(c.phase))) {
      phase = NamespaceStatusPhase.Running;
    }

    this.phase = phase;
  }
}

export type NamespaceStatusDocument = DocumentType<NamespaceStatusSchema>;
export const NamespaceStatusModel = getModelForClass(NamespaceStatusSchema);
