import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

import { QueueStatusComponentName, QueueStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class QueueStatusNodeSchema {
  @prop({ enum: QueueStatusComponentName, required: true, type: String })
  public component: QueueStatusComponentName;

  @prop({ require: true, type: String })
  public container: string;

  @prop({ default: () => QueueStatusPhase.Pending, enum: QueueStatusPhase, type: String })
  public phase: QueueStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: QueueStatusNodeModel, values: Partial<QueueStatusNodeSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      component: QueueStatusComponentName.Application,
      container: chance.hash(),
      phase: QueueStatusPhase.Running,
      pod: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueStatusNodeDocument = DocumentType<QueueStatusNodeSchema>;
export type QueueStatusNodeModel = ReturnModelType<typeof QueueStatusNodeSchema>;
export const QueueStatusNode = getModelForClass(QueueStatusNodeSchema);
