import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Order } from '@datorama/akita';
import {
  Queue,
  QueueLog,
  QueueLogQuery,
  QueueLogService,
  QueueQuery,
  QueueService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

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
  public displayedColumns: string[] = [
    'game',
    'name',
    'description',
    'createdAt',
    'updatedAt',
    'actions',
  ];

  private updateDataSource$ = new Subscription();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueLogQuery: QueueLogQuery,
    private queueLogService: QueueLogService,
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
    this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.queueLogQuery.selectAll({
          filterBy: log => log.queueId === record._id,
          limitTo: 250,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        find: () => this.queueLogService.find(record._id, { limit: 250, sort: '-unix' }),
        subscribe: () =>
          this.socketService.subscribe('queue-logs', QueueLog, this.queueLogService, {
            queueId: record._id,
          }),
      },
    });
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
}
