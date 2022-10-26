import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Order } from '@datorama/akita';
import {
  AuthorizationQuery,
  IAuthorization,
  NamespaceLogModel,
  NamespaceLogQuery,
  NamespaceLogService,
  NamespaceLogStore,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  StreamService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

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
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<NamespaceModel>;

  public dataSource = new MatTableDataSource<NamespaceModel>();
  public displayedColumns = ['name', 'status', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;

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
    private streamService: StreamService,
  ) {}

  public ngOnInit() {
    const roles = [IAuthorization.Role.NamespacesReadWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

    this.fetchNamespaces();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getStatus(record: NamespaceModel) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public hasWriteAuthorizationForNamespace(namespaceId: string) {
    const roles = [IAuthorization.Role.NamespacesReadWrite];
    const userId = this.identityService.user?._id;
    return this.authorizationQuery.hasRoles(namespaceId, roles, userId);
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
      subscribe: async (container, pod, unix) => {
        return this.streamService.logs(
          NamespaceLogModel,
          { container, namespaceId: record._id, pod, since: unix ? new Date(unix) : new Date() },
          this.namespaceLogStore,
          environment.wssUrl,
        );
      },
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

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getNodes(namespace: NamespaceModel) {
    return namespace.status?.nodes
      .map((n) => {
        let label = 'API';
        if (n.component === 'cdc') {
          label = 'CDC';
        } else if (n.component === 'connector' && n.container === 'aggregation-api') {
          label = 'Connector (Aggregation API)';
        } else if (n.component === 'connector' && n.container === 'api') {
          label = 'Connector (API)';
        } else if (n.component === 'metrics') {
          label = 'Metrics';
        } else if (n.component === 'sidecar' && n.container === 'namespace-api-migrations') {
          label = 'Sidecar (Migrations)';
        } else if (n.component === 'sidecar' && n.container === 'status-sidecar') {
          label = 'Sidecar (Status)';
        }

        return { container: n.container, label, pod: n.pod };
      })
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
