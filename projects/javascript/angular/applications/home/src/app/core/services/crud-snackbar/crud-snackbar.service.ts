import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import {
  CollectionService,
  DatabaseService,
  NamespaceService,
  RecordService,
  UserService,
} from '@tenlastic/ng-http';

import { SNACKBAR_DURATION } from '../../../shared/constants';

@Injectable({ providedIn: 'root' })
export class CrudSnackbarService {
  constructor(
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private namespaceService: NamespaceService,
    private recordService: RecordService,
    private snackBar: MatSnackBar,
    private userService: UserService,
  ) {
    this.collectionService.onCreate.subscribe(() => this.createMessage('Collection'));
    this.collectionService.onDelete.subscribe(() => this.deleteMessage('Collection'));
    this.collectionService.onUpdate.subscribe(() => this.updateMessage('Collection'));

    this.databaseService.onCreate.subscribe(() => this.createMessage('Database'));
    this.databaseService.onDelete.subscribe(() => this.deleteMessage('Database'));
    this.databaseService.onUpdate.subscribe(() => this.updateMessage('Database'));

    this.namespaceService.onCreate.subscribe(() => this.createMessage('Namespace'));
    this.namespaceService.onDelete.subscribe(() => this.deleteMessage('Namespace'));
    this.namespaceService.onUpdate.subscribe(() => this.updateMessage('Namespace'));

    this.recordService.onCreate.subscribe(() => this.createMessage('Record'));
    this.recordService.onDelete.subscribe(() => this.deleteMessage('Record'));
    this.recordService.onUpdate.subscribe(() => this.updateMessage('Record'));

    this.userService.onCreate.subscribe(() => this.createMessage('User'));
    this.userService.onDelete.subscribe(() => this.deleteMessage('User'));
    this.userService.onUpdate.subscribe(() => this.updateMessage('User'));
  }

  private createMessage(name: string) {
    this.showSnackBar(`${name} created successfully.`);
  }

  private deleteMessage(name: string) {
    this.showSnackBar(`${name} deleted successfully.`);
  }

  private updateMessage(name: string) {
    this.showSnackBar(`${name} updated successfully.`);
  }

  public showSnackBar(message: string) {
    this.snackBar.open(message, null, {
      duration: SNACKBAR_DURATION,
    });
  }
}
