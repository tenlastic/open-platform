import { Injectable } from '@angular/core';

import { NamespaceService } from '@app/core/http';
import { Namespace } from '@app/shared/models';

@Injectable({
  providedIn: 'root',
})
export class SelectedNamespaceService {
  public get namespace() {
    return this._namespace;
  }
  public set namespace(value: Namespace) {
    if (value) {
      this._namespace = value;
      localStorage.setItem('selectedNamespaceId', value._id);
    } else {
      this._namespace = null;
      localStorage.removeItem('selectedNamespaceId');
    }
  }
  public get namespaceId() {
    return localStorage.getItem('selectedNamespaceId');
  }

  private _namespace: Namespace;

  constructor(private namespaceService: NamespaceService) {
    this.namespaceService.onDelete.subscribe(record => this.onDelete(record));
    this.namespaceService.onUpdate.subscribe(record => this.onUpdate(record));
  }

  private onDelete(record: Namespace) {
    if (!this.namespace || this.namespace._id !== record._id) {
      return;
    }

    this.namespace = null;
  }

  private onUpdate(record: Namespace) {
    if (!this.namespace || this.namespace._id !== record._id) {
      return;
    }

    this.namespace = record;
  }
}
