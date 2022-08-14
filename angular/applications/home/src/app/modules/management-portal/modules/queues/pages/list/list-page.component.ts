import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { Order } from '@datorama/akita';
import {
  AuthorizationQuery,
  IAuthorization,
  QueueModel,
  QueueLogModel,
  QueueLogQuery,
  QueueLogStore,
  QueueQuery,
  QueueService,
  QueueLogService,
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
export class QueuesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<QueueModel>;

  public dataSource = new MatTableDataSource<QueueModel>();
  public displayedColumns = ['name', 'description', 'status', 'actions'];
  public hasWriteAuthorization: boolean;

  private $queues: Observable<QueueModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueLogQuery: QueueLogQuery,
    private queueLogService: QueueLogService,
    private queueLogStore: QueueLogStore,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private streamService: StreamService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const roles = [IAuthorization.Role.QueuesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchQueues(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getStatus(record: QueueModel) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public async restart($event: Event, record: QueueModel) {
    $event.stopPropagation();

    await this.queueService.update(record.namespaceId, record._id, { restartedAt: new Date() });
    this.matSnackBar.open('Queue is restarting...');
  }

  public showDeletePrompt($event: Event, record: QueueModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Queue?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.queueService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Queue deleted successfully.');
      }
    });
  }

  public showLogsDialog($event: Event, record: QueueModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.queueLogQuery.selectAll({
          filterBy: (log) => log.queueId === record._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.queueQuery
          .selectEntity(record._id)
          .pipe(map((queue) => this.getNodeIds(queue))),
        find: (nodeId) =>
          this.queueLogService.find(record.namespaceId, record._id, nodeId, { tail: 500 }),
        nodeIds: record.status?.nodes?.map((n) => n._id),
        subscribe: async (nodeId, unix) => {
          return this.streamService.logs(
            QueueLogModel,
            { nodeId, queueId: record._id, since: unix ? new Date(unix) : new Date() },
            this.queueLogStore,
            environment.wssUrl,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.queueLogStore.reset());
  }

  private async fetchQueues(params: Params) {
    this.$queues = this.queueQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === params.namespaceId,
    });

    await this.queueService.find(params.namespaceId, { sort: 'name' });

    this.updateDataSource$ = this.$queues.subscribe((queues) => (this.dataSource.data = queues));

    this.dataSource.filterPredicate = (data: QueueModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      return (
        regex.test(data.description) || regex.test(data.name) || regex.test(data.status?.phase)
      );
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getNodeIds(queue: QueueModel) {
    return queue.status?.nodes
      .map((n) => {
        let displayName = 'Queue';
        if (n._id.includes('redis')) {
          displayName = 'Redis';
        } else if (n._id.includes('sidecar')) {
          displayName = 'Sidecar';
        }

        const index = isNaN(n._id.slice(-1) as any) ? '0' : n._id.slice(-1);
        return { label: `${displayName} (${index})`, value: n._id };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
