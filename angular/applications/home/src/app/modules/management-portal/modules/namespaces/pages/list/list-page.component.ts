import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AuthorizationState,
  IAuthorization,
  NamespaceModel,
  NamespaceService,
  NamespaceState,
  WebSocketService,
} from '@tenlastic/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { formatDate } from '@angular/common';
import { IdentityService, OverlayService } from '@home/app/core/services';
import {
  DeletionOverlayComponent,
  DeletionOverlayComponentData,
  ListTableColumn,
  ListTableSubscription,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';
import { LogsOverlayComponent, LogsOverlayComponentData } from '../../components';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class NamespacesListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<NamespaceModel[]>;
  public columns: ListTableColumn<NamespaceModel>[] = [
    { header: 'Name', text: (v) => v.name },
    { header: 'Status', text: (v) => this.getStatus(v) },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasLogAuthorization = false;
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: NamespaceModel,
      request: { _id: uuid(), path: '/subscriptions/namespaces' },
      service: this.namespaceService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find((ws) => environment.wssUrl === ws.url);
  }

  private get where() {
    if (this.$filter.value) {
      return { name: { $regex: `${this.$filter.value}`, $options: 'i' } };
    } else {
      return {};
    }
  }

  constructor(
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private matSnackBar: MatSnackBar,
    private namespaceState: NamespaceState,
    private namespaceService: NamespaceService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    const userId = this.identityService.user?._id;
    const logRoles = [IAuthorization.Role.NamespaceLogsRead];
    this.hasLogAuthorization = this.authorizationState.hasRoles(null, logRoles, userId);
    const writeRoles = [IAuthorization.Role.NamespacesWrite];
    this.hasWriteAuthorization = this.authorizationState.hasRoles(null, writeRoles, userId);

    this.$records = this.namespaceState.selectMany();
  }

  public count = () => {
    return this.namespaceService.count({ where: this.where });
  };

  public filter = (record: NamespaceModel) => {
    if (!this.$filter.value) {
      return true;
    }

    return new RegExp(this.$filter.value, 'i').test(record.name);
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.namespaceService.find({
      limit: pageSize,
      skip: page * pageSize,
      sort: 'name',
      where: this.where,
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public hasWriteAuthorizationForNamespace(namespaceId: string) {
    const roles = [IAuthorization.Role.NamespacesWrite];
    const userId = this.identityService.user?._id;
    return this.authorizationState.hasRoles(namespaceId, roles, userId);
  }

  public navigate = (record: NamespaceModel) => {
    return [record._id];
  };

  public async restart($event: Event, record: NamespaceModel) {
    $event.stopPropagation();

    await this.namespaceService.restart(record._id);
    this.matSnackBar.open('Namespace is restarting...');
  }

  public showDeletePrompt($event: Event, record: NamespaceModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.namespaceService.delete(record._id),
      name: 'Namespace',
    });
  }

  public showLogsOverlay($event: Event, record: NamespaceModel) {
    $event.stopPropagation();
    this.overlayService.open<LogsOverlayComponentData>(LogsOverlayComponent, { record });
  }

  private getStatus(record: NamespaceModel) {
    const current = record.status.components.reduce((a, b) => a + (b.current ?? 0), 0);
    const total = record.status.components.reduce((a, b) => a + (b.total ?? 0), 0);

    return `${record.status.phase} (${current} / ${total})`;
  }
}
