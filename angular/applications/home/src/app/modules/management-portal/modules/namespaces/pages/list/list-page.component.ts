import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Order } from '@datorama/akita';
import {
  Namespace,
  NamespaceLog,
  NamespaceLogQuery,
  NamespaceLogStore,
  NamespaceQuery,
  NamespaceService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import {
  IdentityService,
  SelectedNamespaceService,
  SocketService,
} from '../../../../../../core/services';
import { LogsDialogComponent, PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class NamespacesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Namespace>;

  public $namespaces: Observable<Namespace[]>;
  public dataSource = new MatTableDataSource<Namespace>();
  public displayedColumns: string[] = ['name', 'status', 'createdAt', 'updatedAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceLogQuery: NamespaceLogQuery,
    private namespaceLogStore: NamespaceLogStore,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    public selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Namespaces`);
    this.fetchNamespaces();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getStatus(record: Namespace) {
    if (!record.status) {
      return 'Pending';
    }

    const current = record.status.components.reduce((a, b) => a + b.replicas.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.replicas.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public hasPermission(namespace: Namespace) {
    const namespaceUser = namespace.users?.find((u) => u._id === this.identityService.user._id);
    const user = this.identityService.user;

    return namespaceUser?.roles.includes('namespaces') || user.roles.includes('namespaces');
  }

  public async restart(record: Namespace) {
    await this.namespaceService.update({ _id: record._id, restartedAt: new Date() });
    this.matSnackBar.open('Namespace is restarting...');
  }

  public select(record: Namespace) {
    this.selectedNamespaceService.namespace = record;
  }

  public showDeletePrompt(record: Namespace) {
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

  public showLogsDialog(record: Namespace) {
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
        find: (nodeId) => this.namespaceService.logs(record._id, nodeId, { tail: 500 }),
        subscribe: async (nodeId, unix) => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.logs(
            NamespaceLog,
            { namespaceId: record._id, nodeId, since: unix ? new Date(unix) : new Date() },
            this.namespaceService,
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

    this.dataSource.filterPredicate = (data: Namespace, filter: string) => {
      return new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i').test(data.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getNodeIds(namespace: Namespace) {
    return namespace.status?.nodes
      .map((n) => {
        let displayName = 'API';
        if (n._id.includes('api')) {
          displayName = 'API';
        } else if (n._id.includes('docker-registry')) {
          displayName = 'Docker Registry';
        } else if (n._id.includes('minio')) {
          displayName = 'Minio';
        } else if (n._id.includes('mongodb')) {
          displayName = 'MongoDB';
        } else if (n._id.includes('nats')) {
          displayName = 'NATS';
        } else if (n._id.includes('provisioner')) {
          displayName = 'Provisioner';
        } else if (n._id.includes('sidecar')) {
          displayName = 'Sidecar';
        } else if (n._id.includes('workflow-controller')) {
          displayName = 'Workflow Controller';
        } else if (n._id.includes('wss')) {
          displayName = 'Web Socket Server';
        }

        const index = isNaN(n._id.slice(-1) as any) ? '0' : n._id.slice(-1);
        return { label: `${displayName} (${index})`, value: n._id };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
