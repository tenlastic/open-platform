import * as mongoose from 'mongoose';

import { QueueDocument } from '../model';
import {
  QueueStatusComponentDocument,
  QueueStatusComponentModel,
  QueueStatusComponentSchema,
} from './component';
import { QueueStatusNodeDocument, QueueStatusNodeSchema } from './node';
import { QueueStatusComponentName, QueueStatusPhase } from './types';

export interface QueueStatus {
  components: QueueStatusComponentDocument[];
  message?: string;
  nodes: QueueStatusNodeDocument[];
  phase: QueueStatusPhase;
  version?: string;
}

export type QueueStatusDocument = mongoose.Document<mongoose.Types.ObjectId> & QueueStatus;

export interface QueueStatusModelType extends mongoose.Model<QueueStatusDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: QueueStatusModelType, values?: Partial<QueueStatus>): QueueStatusDocument;
}

const QueueStatusSchema = new mongoose.Schema<QueueStatusDocument, QueueStatusModelType>(
  {
    components: { type: [QueueStatusComponentSchema], unset: false },
    message: { type: String },
    nodes: { type: [QueueStatusNodeSchema] },
    phase: {
      default: () => QueueStatusPhase.Pending,
      enum: Object.values(QueueStatusPhase),
      type: String,
    },
    version: { type: String },
  },
  { _id: false },
);

QueueStatusSchema.pre('save', async function (this: QueueStatusDocument) {
  if (this.isModified('components') || this.isNew) {
    setComponents(this);
    setPhase(this);
  }
});

QueueStatusSchema.statics.mock = function (values: Partial<QueueStatus> = {}) {
  const defaults: Partial<QueueStatus> = { phase: QueueStatusPhase.Running };

  return new this({ ...defaults, ...values });
};

export const QueueStatusModel = mongoose.model<QueueStatusDocument, QueueStatusModelType>(
  'QueueStatusSchema',
  QueueStatusSchema,
);

export { QueueStatusSchema };

export default QueueStatusModel;

/**
 * Sets components, filling in default values if missing.
 */
function setComponents(queueStatus: QueueStatusDocument) {
  const parent = queueStatus.$parent() as QueueDocument;

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

  for (const component of queueStatus.components) {
    const index = components.findIndex((d) => d.name === component.name);
    components[index] = component;
  }

  queueStatus.components = components;
}

/**
 * Sets the phase.
 */
function setPhase(queueStatus: QueueStatusDocument) {
  let phase = QueueStatusPhase.Pending;
  const statuses = [QueueStatusPhase.Running, QueueStatusPhase.Succeeded];

  if (queueStatus.nodes.some((n) => n.phase === QueueStatusPhase.Error)) {
    phase = QueueStatusPhase.Error;
  } else if (queueStatus.components.every((c) => statuses.includes(c.phase))) {
    phase = QueueStatusPhase.Running;
  }

  queueStatus.phase = phase;
}
