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
import { NamespaceStatusComponentName, NamespaceStatusPhase } from './types';

export interface NamespaceStatus {
  components: NamespaceStatusComponentDocument[];
  limits: NamespaceStatusLimitsDocument;
  nodes: NamespaceStatusNodeDocument[];
  phase: NamespaceStatusPhase;
  version?: string;
}

export type NamespaceStatusDocument = mongoose.Document<mongoose.Types.ObjectId> & NamespaceStatus;

export interface NamespaceStatusModelType extends mongoose.Model<NamespaceStatusDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: NamespaceStatusModelType, values?: Partial<NamespaceStatus>): NamespaceStatusDocument;
}

const NamespaceStatusSchema = new mongoose.Schema<
  NamespaceStatusDocument,
  NamespaceStatusModelType
>(
  {
    components: { type: [NamespaceStatusComponentSchema], unset: false },
    limits: {
      default: () => new NamespaceStatusLimitsModel(),
      type: NamespaceStatusLimitsSchema,
      unset: false,
    },
    nodes: { type: [NamespaceStatusNodeSchema] },
    phase: {
      default: () => NamespaceStatusPhase.Pending,
      enum: Object.values(NamespaceStatusPhase),
      type: String,
    },
    version: { type: String },
  },
  { _id: false },
);

NamespaceStatusSchema.pre('save', async function (this: NamespaceStatusDocument) {
  if (this.isModified('components') || this.isNew) {
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

    let phase = NamespaceStatusPhase.Pending;
    const statuses = [NamespaceStatusPhase.Running, NamespaceStatusPhase.Succeeded];

    if (this.nodes.some((n) => n.phase === NamespaceStatusPhase.Error)) {
      phase = NamespaceStatusPhase.Error;
    } else if (this.components.every((c) => statuses.includes(c.phase))) {
      phase = NamespaceStatusPhase.Running;
    }

    this.phase = phase;
  }
});

NamespaceStatusSchema.statics.mock = function (values: Partial<NamespaceStatus> = {}) {
  const defaults: Partial<NamespaceStatus> = { phase: NamespaceStatusPhase.Running };

  return new this({ ...defaults, ...values });
};

export const NamespaceStatusModel = mongoose.model<
  NamespaceStatusDocument,
  NamespaceStatusModelType
>('NamespaceStatusSchema', NamespaceStatusSchema);

export { NamespaceStatusSchema };

export default NamespaceStatusModel;
