import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';

import { QueueDocument } from '../model';
import {
  QueueStatusComponentDocument,
  QueueStatusComponentModel,
  QueueStatusComponentSchema,
} from './component';
import { QueueStatusNodeDocument, QueueStatusNodeSchema } from './node';

export enum QueueStatusComponentName {
  Application = 'Application',
  Sidecar = 'Sidecar',
}

export enum QueueStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
@pre('save', function (this: QueueStatusDocument) {
  if (this.isModified('components') || this.isNew) {
    this.setComponents();
    this.setPhase();
  }
})
export class QueueStatusSchema {
  @prop({ type: QueueStatusComponentSchema, unset: false }, PropType.ARRAY)
  public components: QueueStatusComponentDocument[];

  @prop({ type: String })
  public message: string;

  @prop({ type: QueueStatusNodeSchema }, PropType.ARRAY)
  public nodes: QueueStatusNodeDocument[];

  @prop({ default: () => QueueStatusPhase.Pending, enum: QueueStatusPhase, type: String })
  public phase: QueueStatusPhase;

  @prop({ type: String })
  public version: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static create(this: typeof QueueStatusModel, values: Partial<QueueStatusSchema> = {}) {
    const defaults = { phase: QueueStatusPhase.Running };

    return new this({ ...defaults, ...values });
  }

  /**
   * Sets components, filling in default values if missing.
   */
  private setComponents(this: QueueStatusDocument) {
    const parent = this.$parent() as QueueDocument;

    const components: QueueStatusComponentDocument[] = [
      new QueueStatusComponentModel({
        current: 0,
        name: QueueStatusComponentName.Application,
        phase: QueueStatusPhase.Pending,
        total: parent.replicas,
      }),
      new QueueStatusComponentModel({
        current: 0,
        name: QueueStatusComponentName.Sidecar,
        phase: QueueStatusPhase.Pending,
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
  private setPhase(this: QueueStatusDocument) {
    let phase = QueueStatusPhase.Pending;
    const statuses = [QueueStatusPhase.Running, QueueStatusPhase.Succeeded];

    if (this.nodes.some((n) => n.phase === QueueStatusPhase.Error)) {
      phase = QueueStatusPhase.Error;
    } else if (this.components.every((c) => statuses.includes(c.phase))) {
      phase = QueueStatusPhase.Running;
    }

    this.phase = phase;
  }
}

export type QueueStatusDocument = DocumentType<QueueStatusSchema>;
export const QueueStatusModel = getModelForClass(QueueStatusSchema);
