import { Minio, MinioSchema } from './model';

export class MinioMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<MinioSchema> = {}) {
    const defaults = {};

    return new Minio({ ...defaults, ...params });
  }
}
