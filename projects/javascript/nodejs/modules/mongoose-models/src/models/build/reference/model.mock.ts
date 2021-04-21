import * as mongoose from 'mongoose';

import { BuildReference, BuildReferenceSchema } from './model';

export class BuildReferenceMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<BuildReferenceSchema> = {}) {
    const defaults = {
      _id: mongoose.Types.ObjectId(),
    };

    return new BuildReference({ ...defaults, ...params });
  }
}
