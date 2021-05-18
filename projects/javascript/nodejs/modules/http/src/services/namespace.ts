import { apiUrl } from '../api-url';
import { NamespaceModel } from '../models';
import { namespaceStore } from '../stores';
import { BaseService } from './base';

export class NamespaceService extends BaseService<NamespaceModel> {
  protected store = namespaceStore;
  protected get url() {
    return `${apiUrl}/namespaces`;
  }
}

export const namespaceService = new NamespaceService();
