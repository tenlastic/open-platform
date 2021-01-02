import { Component, OnInit, ViewChild } from '@angular/core';
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
import { Queue, QueueLog, QueueLogQuery, QueueLogService, QueueService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
export class QueuesListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Queue>;

  public dataSource: MatTableDataSource<Queue>;
  public displayedColumns: string[] = ['name', 'description', 'createdAt', 'updatedAt', 'actions'];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueLogQuery: QueueLogQuery,
    private queueLogService: QueueLogService,
    private queueService: QueueService,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Queues`);
    this.fetchQueues();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
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
        this.deleteQueue(record);

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

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchQueues() {
    const records = await this.queueService.find({
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.dataSource = new MatTableDataSource<Queue>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteQueue(record: Queue) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
