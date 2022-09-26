import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

export enum NamespaceStatusLimitName {
  Bandwidth = 'bandwidth',
  Cpu = 'cpu',
  Memory = 'memory',
  Storage = 'storage',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class NamespaceStatusLimitSchema {
  @prop({ required: true })
  public current: number;

  @prop({ enum: NamespaceStatusLimitName, required: true })
  public name: NamespaceStatusLimitName;

  @prop({ required: true })
  public total: number;
}

export type NamespaceStatusLimitDocument = DocumentType<NamespaceStatusLimitSchema>;
export type NamespaceStatusLimitModel = ReturnModelType<typeof NamespaceStatusLimitSchema>;
export const NamespaceStatusLimit = getModelForClass(NamespaceStatusLimitSchema);
