import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { WorkflowStatusDocument, WorkflowStatusModel, WorkflowStatusSchema } from '../workflow';
import { BuildFileDocument, BuildFileSchema } from './file';
import { BuildReferenceDocument, BuildReferenceSchema } from './reference';

export enum BuildPlatform {
  Server64 = 'Server64',
  Windows64 = 'Windows64',
}

@index({ name: 1, namespaceId: 1, platform: 1 }, { unique: true })
@index({ publishedAt: 1 })
@modelOptions({ schemaOptions: { collection: 'builds', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class BuildSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ maxlength: 256, required: true, trim: true, type: String })
  public entrypoint: string;

  @prop({ type: BuildFileSchema }, PropType.ARRAY)
  public files: BuildFileDocument[];

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: BuildPlatform, required: true, type: String })
  public platform: BuildPlatform;

  @prop({ type: Date })
  public publishedAt: Date;

  @prop({ type: BuildReferenceSchema })
  public reference: BuildReferenceDocument;

  @prop({ default: () => new WorkflowStatusModel(), merge: true, type: WorkflowStatusSchema })
  public status: WorkflowStatusDocument;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof BuildModel, values: Partial<BuildSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      entrypoint: chance.hash(),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      platform: chance.pickone(Object.values(BuildPlatform)),
    };

    return new this({ ...defaults, ...values });
  }
}

export type BuildDocument = DocumentType<BuildSchema>;
export const BuildModel = getModelForClass(BuildSchema);
