import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Order } from '@datorama/akita';
import {
  Database,
  DatabaseLog,
  DatabaseLogQuery,
  DatabaseLogStore,
  DatabaseQuery,
  DatabaseService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import {
  IdentityService,
  SelectedNamespaceService,
  SocketService,
  VersionService,
} from '../../../../../../core/services';
import { LogsDialogComponent, PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class DatabasesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Database>;

  public $databases: Observable<Database[]>;
  public dataSource = new MatTableDataSource<Database>();
  public displayedColumns: string[] = ['name', 'status', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    private databaseLogQuery: DatabaseLogQuery,
    private databaseLogStore: DatabaseLogStore,
    private databaseQuery: DatabaseQuery,
    private databaseService: DatabaseService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
    private titleService: Title,
    public versionService: VersionService,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Databases`);
    await this.fetchDatabases();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getStatus(record: Database) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public async restart(record: Database) {
    await this.databaseService.update({ _id: record._id, restartedAt: new Date() });
    this.matSnackBar.open('Database is restarting...');
  }

  public showDeletePrompt(record: Database) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Database?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.databaseService.delete(record._id);
        this.matSnackBar.open('Database deleted successfully.');
      }
    });
  }

  public showLogsDialog(record: Database) {
    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.databaseLogQuery.selectAll({
          filterBy: (log) => log.databaseId === record._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.databaseQuery
          .selectEntity(record._id)
          .pipe(map((database) => this.getNodeIds(database))),
        find: (nodeId) => this.databaseService.logs(record._id, nodeId, { tail: 500 }),
        subscribe: async (nodeId, unix) => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.logs(
            DatabaseLog,
            { databaseId: record._id, nodeId, since: unix ? new Date(unix) : new Date() },
            this.databaseService,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.databaseLogStore.reset());
  }

  private async fetchDatabases() {
    const $databases = this.databaseQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$databases = this.databaseQuery.populate($databases);

    await this.databaseService.find({
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$databases.subscribe(
      (databases) => (this.dataSource.data = databases),
    );

    this.dataSource.filterPredicate = (data: Database, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getNodeIds(database: Database) {
    return database.status?.nodes
      .map((n) => {
        let displayName = 'API';
        if (n._id.includes('mongodb')) {
          displayName = 'MongoDB';
        } else if (n._id.includes('nats')) {
          displayName = 'NATS';
        } else if (n._id.includes('sidecar')) {
          displayName = 'Sidecar';
        }

        const index = isNaN(n._id.substr(-1) as any) ? '0' : n._id.substr(-1);
        return { label: `${displayName} (${index})`, value: n._id };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
