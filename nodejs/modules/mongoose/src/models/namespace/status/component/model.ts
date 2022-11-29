import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusComponentSchema {
  @prop({ required: true, type: Number })
  public current: number;

  @prop({ enum: NamespaceStatusComponentName, required: true, type: String })
  public name: NamespaceStatusComponentName;

  @prop({ enum: NamespaceStatusPhase, required: true, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ required: true, type: Number })
  public total: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: NamespaceStatusComponentModel,
    values: Partial<NamespaceStatusComponentSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      current: chance.integer({ min: 0 }),
      name: NamespaceStatusComponentName.API,
      phase: NamespaceStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceStatusComponentDocument = DocumentType<NamespaceStatusComponentSchema>;
export type NamespaceStatusComponentModel = ReturnModelType<typeof NamespaceStatusComponentSchema>;
export const NamespaceStatusComponent = getModelForClass(NamespaceStatusComponentSchema);
