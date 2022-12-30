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
  BuildQuery,
  BuildService,
  GameServerTemplateQuery,
  GameServerTemplateService,
  IAuthorization,
  IQueue,
  QueueLogModel,
  QueueLogQuery,
  QueueLogService,
  QueueLogStore,
  QueueModel,
  QueueQuery,
  QueueService,
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
export class QueuesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<QueueModel>;

  public dataSource = new MatTableDataSource<QueueModel>();
  public displayedColumns = ['name', 'description', 'gameServerTemplate', 'status', 'actions'];
  public hasWriteAuthorization: boolean;

  private $queues: Observable<QueueModel[]>;
  private updateDataSource$ = new Subscription();
  private params: Params;
  private get streamServiceUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private gameServerTemplateQuery: GameServerTemplateQuery,
    private gameServerTemplateService: GameServerTemplateService,
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
      this.params = params;

      const roles = [IAuthorization.Role.QueuesWrite];
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

  public getGameServerTemplate(_id: string) {
    return this.gameServerTemplateQuery.getEntity(_id);
  }

  public getStatus(record: QueueModel) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public async restart($event: Event, record: QueueModel) {
    $event.stopPropagation();

    await this.queueService.restart(record.namespaceId, record._id);
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

    const data = {
      $logs: this.queueLogQuery.selectAll({
        filterBy: (log) => log.queueId === record._id,
        sortBy: 'unix',
        sortByOrder: Order.DESC,
      }),
      $nodes: this.queueQuery.selectEntity(record._id).pipe(map((queue) => this.getNodes(queue))),
      find: (container, pod) =>
        this.queueLogService.find(record.namespaceId, record._id, pod, container, {
          tail: 500,
        }),
      subscribe: (container, pod, unix) => {
        return this.streamService.logs<QueueLogModel>(
          QueueLogModel,
          { queueId: record._id },
          {
            body: { since: unix ? new Date(unix) : new Date() },
            path: `/subscriptions/queues/${record._id}/logs/${pod}/${container}`,
          },
          this.queueLogStore,
          this.streamServiceUrl,
        );
      },
      wssUrl: this.streamServiceUrl,
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.queueLogStore.reset());
  }

  private async fetchQueues(params: Params) {
    this.$queues = this.queueQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === params.namespaceId,
    });

    this.updateDataSource$ = this.$queues.subscribe((queues) => (this.dataSource.data = queues));

    this.dataSource.filterPredicate = (data: QueueModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.description) || regex.test(data.name) || regex.test(data.status.phase);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    const queues = await this.queueService.find(params.namespaceId, { sort: 'name' });
    await this.gameServerTemplateService.find(params.namespaceId, {
      where: { _id: { $in: queues.map((q) => q.gameServerTemplateId) } },
    });
  }

  private getNodes(queue: QueueModel) {
    return queue.status.nodes
      .map((n) => {
        let label = 'Queue';
        if (n.component === IQueue.StatusComponentName.Sidecar) {
          label = 'Sidecar';
        }

        return { container: n.container, label, pod: n.pod };
      })
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
