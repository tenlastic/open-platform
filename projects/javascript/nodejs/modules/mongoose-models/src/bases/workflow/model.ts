import { Ref, modelOptions, prop } from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { NamespaceDocument } from '../../models/namespace';
import { WorkflowSpecSchema } from './spec';
import { WorkflowStatusSchema } from './status';

@modelOptions({
  schemaOptions: {
    minimize: false,
    timestamps: true,
  },
})
export abstract class WorkflowBase {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ immutable: true })
  public isPreemptible: boolean;

  @prop({ immutable: true, required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ immutable: true, required: true })
  public spec: WorkflowSpecSchema;

  @prop()
  public status: WorkflowStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public abstract kubernetesName: string;
  public abstract kubernetesNamespace: string;
  public wasModified: string[];
  public wasNew: boolean;
}
