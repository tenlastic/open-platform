import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Order } from '@datorama/akita';
import {
  Queue,
  QueueLog,
  QueueLogQuery,
  QueueLogStore,
  QueueQuery,
  QueueService,
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
export class QueuesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Queue>;

  public $queues: Observable<Queue[]>;
  public dataSource = new MatTableDataSource<Queue>();
  public displayedColumns: string[] = ['game', 'name', 'description', 'status', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueLogQuery: QueueLogQuery,
    private queueLogStore: QueueLogStore,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Queues`);
    this.fetchQueues();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getStatus(record: Queue) {
    const running = record.status?.nodes?.filter(
      n => !n._id.includes('sidecar') && n.phase === 'Running',
    ).length;
    const total = record.replicas * 2;

    const phase = running === total ? 'Running' : 'Pending';

    return `${phase} (${running} / ${total})`;
  }

  public showDeletePrompt(record: Queue) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Queue?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.queueService.delete(record._id);
        this.matSnackBar.open('Queue deleted successfully.');
      }
    });
  }

  public showLogsDialog(record: Queue) {
    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.queueLogQuery.selectAll({
          filterBy: log => log.queueId === record._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.queueQuery
          .selectEntity(record._id)
          .pipe(map(queue => this.getNodeIds(queue))),
        find: nodeId => this.queueService.logs(record._id, nodeId, { tail: 500 }),
        nodeIds: record.status?.nodes?.map(n => n._id),
        subscribe: async (nodeId, unix) => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.logs(
            QueueLog,
            { nodeId, queueId: record._id, since: unix ? new Date(unix) : new Date() },
            this.queueService,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.queueLogStore.reset());
  }

  private async fetchQueues() {
    const $queues = this.queueQuery.selectAll({
      filterBy: gs => gs.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$queues = this.queueQuery.populate($queues);

    await this.queueService.find({
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$queues.subscribe(queues => (this.dataSource.data = queues));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getNodeIds(queue: Queue) {
    return queue.status?.nodes
      .map(n => {
        let displayName = 'Queue';
        if (n._id.includes('redis')) {
          displayName = 'Redis';
        } else if (n._id.includes('sidecar')) {
          displayName = 'Sidecar';
        }

        const index = isNaN(n._id.substr(-1) as any) ? '0' : n._id.substr(-1);
        return { label: `${displayName} (${index})`, value: n._id };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
