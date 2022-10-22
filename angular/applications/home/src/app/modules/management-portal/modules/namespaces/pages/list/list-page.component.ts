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
import { LogsDialogComponent, PromptComponent } from '../../../../../../shared/components';

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

    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.namespaceLogQuery.selectAll({
          filterBy: (log) => log.namespaceId === record._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.namespaceQuery
          .selectEntity(record._id)
          .pipe(map((namespace) => this.getNodeIds(namespace))),
        find: (nodeId) => this.namespaceLogService.find(record._id, nodeId, { tail: 500 }),
        nodeIds: record.status?.nodes?.map((n) => n._id),
        subscribe: async (nodeId, unix) => {
          return this.streamService.logs(
            NamespaceLogModel,
            { namespaceId: record._id, nodeId, since: unix ? new Date(unix) : new Date() },
            this.namespaceLogStore,
            environment.wssUrl,
          );
        },
      },
    });

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

  private getNodeIds(namespace: NamespaceModel) {
    return namespace.status?.nodes
      .map((n) => {
        let displayName = 'API';
        if (n.component === 'cdc') {
          displayName = 'CDC';
        } else if (n.component === 'connectors') {
          displayName = 'Connectors';
        } else if (n.component === 'sidecar') {
          displayName = 'Sidecar';
        }

        return { label: displayName, value: n._id };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
