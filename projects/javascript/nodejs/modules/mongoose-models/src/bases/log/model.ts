import { modelOptions, prop, Ref } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';
import { NamespaceDocument } from '../../models/namespace';

@modelOptions({ schemaOptions: { minimize: false, timestamps: true } })
export class LogBase {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  public createdAt: Date;

  @prop()
  public expiresAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ required: true })
  public unix: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}
