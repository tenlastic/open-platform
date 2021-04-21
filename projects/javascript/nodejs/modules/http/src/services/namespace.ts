import { NamespaceModel } from '../models';
import { namespaceStore } from '../stores';
import { BaseService } from './base';

const apiRootUrl = process.env.API_URL;

export class NamespaceService extends BaseService<NamespaceModel> {
  protected store = namespaceStore;
  protected url = `${apiRootUrl}/namespaces`;
}

export const namespaceService = new NamespaceService();
