import { WorkflowSpecEnvValueFrom, WorkflowSpecEnvValueFromSchema } from './model';
import { WorkflowSpecEnvValueFromSecretKeyRefMock } from './secret-key-ref';

export class WorkflowSpecEnvValueFromMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecEnvValueFromSchema> = {}) {
    const defaults = {
      secretKeyRef: WorkflowSpecEnvValueFromSecretKeyRefMock.create(),
    };

    return new WorkflowSpecEnvValueFrom({ ...defaults, ...params });
  }
}
