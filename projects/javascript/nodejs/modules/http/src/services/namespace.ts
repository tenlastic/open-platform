import { NamespaceModel } from '../models';
import { namespaceStore } from '../stores';
import { BaseService } from './base';

const apiUrl = process.env.API_URL;

export class NamespaceService extends BaseService<NamespaceModel> {
  protected store = namespaceStore;
  protected url = `${apiUrl}/namespaces`;
}

export const namespaceService = new NamespaceService();
