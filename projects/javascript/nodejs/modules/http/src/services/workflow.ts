import { apiUrl } from '../api-url';
import { WorkflowModel } from '../models';
import { workflowStore } from '../stores';
import { BaseService } from './base';

export class WorkflowService extends BaseService<WorkflowModel> {
  protected store = workflowStore;
  protected get url() {
    return `${apiUrl}/workflows`;
  }
}

export const workflowService = new WorkflowService();
