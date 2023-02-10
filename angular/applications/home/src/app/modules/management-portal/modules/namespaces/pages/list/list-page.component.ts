import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Order } from '@datorama/akita';
import {
  AuthorizationQuery,
  IAuthorization,
  INamespace,
  NamespaceLogModel,
  NamespaceLogQuery,
  NamespaceLogService,
  NamespaceLogStore,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  SubscriptionService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService } from '../../../../../../core/services';
import {
  LogsDialogComponent,
  LogsDialogComponentData,
  PromptComponent,
} from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class NamespacesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<NamespaceModel>();
  public displayedColumns = ['name', 'status', 'createdAt', 'updatedAt', 'actions'];
  public hasLogAuthorization: boolean;
  public hasWriteAuthorization: boolean;
  public message: string;

  private $namespaces: Observable<NamespaceModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceLogQuery: NamespaceLogQuery,
    private namespaceLogService: NamespaceLogService,
    private namespaceLogStore: NamespaceLogStore,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private subscriptionService: SubscriptionService,
  ) {}

  public async ngOnInit() {
    this.message = 'Loading...';

    const userId = this.identityService.user?._id;
    const logRoles = [IAuthorization.Role.NamespaceLogsRead];
    this.hasLogAuthorization = this.authorizationQuery.hasRoles(null, logRoles, userId);
    const writeRoles = [IAuthorization.Role.NamespacesWrite];
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, writeRoles, userId);

    await this.fetchNamespaces();

    this.message = null;
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getStatus(record: NamespaceModel) {
    const current = record.status.components.reduce((a, b) => a + (b.current ?? 0), 0);
    const total = record.status.components.reduce((a, b) => a + (b.total ?? 0), 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public hasWriteAuthorizationForNamespace(namespaceId: string) {
    const roles = [IAuthorization.Role.NamespacesWrite];
    const userId = this.identityService.user?._id;
    return this.authorizationQuery.hasRoles(namespaceId, roles, userId);
  }

  public async restart($event: Event, record: NamespaceModel) {
    $event.stopPropagation();

    await this.namespaceService.restart(record._id);
    this.matSnackBar.open('Namespace is restarting...');
  }

  public showDeletePrompt($event: Event, record: NamespaceModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Namespace?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.namespaceService.delete(record._id);
        this.matSnackBar.open('Namespace deleted successfully.');
      }
    });
  }

  public showLogsDialog($event: Event, record: NamespaceModel) {
    $event.stopPropagation();

    const _id = uuid();
    const data = {
      $logs: this.namespaceLogQuery.selectAll({
        filterBy: (log) => log.namespaceId === record._id,
        sortBy: 'unix',
        sortByOrder: Order.DESC,
      }),
      $nodes: this.namespaceQuery
        .selectEntity(record._id)
        .pipe(map((namespace) => this.getNodes(namespace))),
      find: (container, pod) =>
        this.namespaceLogService.find(record._id, pod, container, { tail: 500 }),
      subscribe: (container, pod, unix) => {
        const resumeToken = unix ? new Date(unix) : new Date();

        return this.subscriptionService.subscribe<NamespaceLogModel>(
          NamespaceLogModel,
          {
            _id,
            body: { resumeToken: resumeToken.toISOString() },
            path: `/subscriptions/namespaces/${record._id}/logs/${pod}/${container}`,
          },
          this.namespaceLogService,
          this.namespaceLogStore,
          environment.wssUrl,
          {
            callback: (response) => {
              response.body.fullDocument.container = container;
              response.body.fullDocument.namespaceId = record._id;
              response.body.fullDocument.pod = pod;
            },
          },
        );
      },
      unsubscribe: () => this.subscriptionService.unsubscribe(_id, environment.wssUrl),
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.namespaceLogStore.reset());
  }

  private async fetchNamespaces() {
    this.$namespaces = this.namespaceQuery.selectAll();
    await this.namespaceService.find({ sort: 'name' });

    this.updateDataSource$ = this.$namespaces.subscribe(
      (namespaces) => (this.dataSource.data = namespaces),
    );

    this.dataSource.filterPredicate = (data: NamespaceModel, filter: string) => {
      return new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i').test(data.name);
    };
  }

  private getNodes(namespace: NamespaceModel) {
    return namespace.status.nodes
      .map((n) => {
        let label: string = INamespace.StatusComponentName.API;

        if (n.component === INamespace.StatusComponentName.CDC) {
          label = INamespace.StatusComponentName.CDC;
        } else if (
          n.component === INamespace.StatusComponentName.Connector &&
          n.container === 'aggregation-api'
        ) {
          label = `${INamespace.StatusComponentName.Connector} (Aggregation API)`;
        } else if (
          n.component === INamespace.StatusComponentName.Connector &&
          n.container === 'api'
        ) {
          label = `${INamespace.StatusComponentName.Connector} (API)`;
        } else if (
          n.component === INamespace.StatusComponentName.Connector &&
          n.container === 'social-api'
        ) {
          label = `${INamespace.StatusComponentName.Connector} (Social API)`;
        } else if (n.component === INamespace.StatusComponentName.Metrics) {
          label = INamespace.StatusComponentName.Metrics;
        } else if (n.component === INamespace.StatusComponentName.Migrations) {
          label = INamespace.StatusComponentName.Migrations;
        } else if (
          n.component === INamespace.StatusComponentName.Sidecar &&
          n.container === 'status-sidecar'
        ) {
          label = `${INamespace.StatusComponentName.Sidecar} (Status)`;
        }

        return { container: n.container, label, pod: n.pod };
      })
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
