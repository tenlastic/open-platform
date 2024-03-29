import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusComponentSchema {
  @prop({ type: Number })
  public current: number;

  @prop({ enum: NamespaceStatusComponentName, required: true, type: String })
  public name: NamespaceStatusComponentName;

  @prop({ default: () => NamespaceStatusPhase.Pending, enum: NamespaceStatusPhase, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ type: Number })
  public total: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof NamespaceStatusComponentModel,
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
export const NamespaceStatusComponentModel = getModelForClass(NamespaceStatusComponentSchema);
