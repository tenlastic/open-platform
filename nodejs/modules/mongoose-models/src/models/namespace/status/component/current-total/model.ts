import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class CurrentTotalSchema {
  @prop({ default: 0 })
  public current: number;

  @prop({ default: 0 })
  public total: number;
}

export type CurrentTotalDocument = DocumentType<CurrentTotalSchema>;
export type CurrentTotalModel = ReturnModelType<typeof CurrentTotalSchema>;
export const CurrentTotal = getModelForClass(CurrentTotalSchema);
