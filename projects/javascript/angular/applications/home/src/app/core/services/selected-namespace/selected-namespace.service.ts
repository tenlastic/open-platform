import { Injectable } from '@angular/core';
import { Namespace, NamespaceService } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class SelectedNamespaceService {
  public get namespace() {
    return this._namespace;
  }
  public set namespace(value: Namespace) {
    if (value) {
      this._namespace = value;
      localStorage.setItem('management-portal.namespace._id', value._id);
    } else {
      this._namespace = null;
      localStorage.removeItem('management-portal.namespace._id');
    }
  }
  public get namespaceId() {
    return localStorage.getItem('management-portal.namespace._id');
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
