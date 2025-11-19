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

export interface Build {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  entrypoint: string;
  files?: BuildFileDocument[];
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  platform: BuildPlatform;
  publishedAt?: Date;
  reference?: BuildReferenceDocument;
  status?: WorkflowStatusDocument;
  updatedAt?: Date;
}

export type BuildDocument = mongoose.Document<mongoose.Types.ObjectId> & Build;

export interface BuildModelType extends mongoose.Model<BuildDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: BuildModelType, values?: Partial<Build>): BuildDocument;
}

const BuildSchema = new mongoose.Schema<BuildDocument, BuildModelType>(
  {
    entrypoint: { maxlength: 256, required: true, trim: true, type: String },
    files: { type: [BuildFileSchema] },
    name: { maxlength: 64, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    platform: { enum: Object.values(BuildPlatform), required: true, type: String },
    publishedAt: { type: Date },
    reference: { type: BuildReferenceSchema },
    status: { default: () => new WorkflowStatusModel(), merge: true, type: WorkflowStatusSchema },
  },
  {
    collection: 'builds',
    timestamps: true,
  },
);

BuildSchema.index({ name: 1, namespaceId: 1, platform: 1 }, { unique: true });
BuildSchema.index({ publishedAt: 1 });

BuildSchema.plugin(duplicateKeyErrorPlugin);
BuildSchema.plugin(unsetPlugin);

BuildSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

BuildSchema.statics.mock = function (values: Partial<Build> = {}) {
  const chance = new Chance();
  const defaults: Partial<Build> = {
    entrypoint: chance.hash(),
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    platform: chance.pickone(Object.values(BuildPlatform)) as BuildPlatform,
  };

  return new this({ ...defaults, ...values });
};

export const BuildModel = mongoose.model<BuildDocument, BuildModelType>(
  'BuildSchema',
  BuildSchema,
  'builds',
);

export default BuildModel;
