import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusNodeSchema {
  @prop({ enum: NamespaceStatusComponentName, required: true, type: String })
  public component: NamespaceStatusComponentName;

  @prop({ required: true, type: String })
  public container: string;

  @prop({ default: () => NamespaceStatusPhase.Pending, enum: NamespaceStatusPhase, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof NamespaceStatusNodeModel,
    values: Partial<NamespaceStatusNodeSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      component: NamespaceStatusComponentName.API,
      container: chance.hash(),
      phase: NamespaceStatusPhase.Running,
      pod: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceStatusNodeDocument = DocumentType<NamespaceStatusNodeSchema>;
export const NamespaceStatusNodeModel = getModelForClass(NamespaceStatusNodeSchema);
