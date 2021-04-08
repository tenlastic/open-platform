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
import { ActivatedRoute } from '@angular/router';
import { Order } from '@datorama/akita';
import {
  GameServer,
  GameServerLog,
  GameServerLogQuery,
  GameServerLogService,
  GameServerQuery,
  GameServerService,
  Queue,
  QueueService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { environment } from '../../../../../../../environments/environment';
import {
  IdentityService,
  SelectedNamespaceService,
  SocketService,
} from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  LogsDialogComponent,
  PromptComponent,
} from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameServersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameServer>;

  public $gameServers: Observable<GameServer[]>;
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public dataSource = new MatTableDataSource<GameServer>();
  public displayedColumns: string[] = [
    'game',
    'name',
    'description',
    'status',
    'createdAt',
    'actions',
  ];
  public queue: Queue;

  private updateDataSource$ = new Subscription();
  private get queueId() {
    return this.activatedRoute.snapshot.paramMap.get('queueId');
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private gameServerLogQuery: GameServerLogQuery,
    private gameServerLogService: GameServerLogService,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Game Servers`);

    await this.fetchQueue();
    await this.fetchGameServers();

    if (this.queue) {
      this.breadcrumbs = [
        { label: 'Queues', link: '../../' },
        { label: this.queue.name, link: '../' },
        { label: 'Game Servers' },
      ];
    }
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async restart(record: GameServer) {
    await this.gameServerService.restart(record._id);
    this.matSnackBar.open('Game Server is restarting...');
  }

  public showDeletePrompt(record: GameServer) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Server?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.gameServerService.delete(record._id);
        this.matSnackBar.open('Game Server deleted successfully.');
      }
    });
  }

  public showLogsDialog(record: GameServer) {
    this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.gameServerLogQuery.selectAll({
          filterBy: log => log.gameServerId === record._id,
          limitTo: 250,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        find: () => this.gameServerLogService.find(record._id, { limit: 250, sort: '-unix' }),
        subscribe: () => {
          const socket = this.socketService.connect(environment.apiBaseUrl);
          return socket.subscribe('game-server-logs', GameServerLog, this.gameServerLogService, {
            gameServerId: record._id,
          });
        },
      },
    });
  }

  private async fetchGameServers() {
    const $gameServers = this.gameServerQuery.selectAll({
      filterBy: gs =>
        gs.namespaceId === this.selectedNamespaceService.namespaceId &&
        ((this.queue && this.queue._id === gs.queueId) || (!this.queue && !gs.queueId)),
    });
    this.$gameServers = this.gameServerQuery.populate($gameServers);

    await this.gameServerService.find({
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$gameServers.subscribe(
      gameServers => (this.dataSource.data = gameServers),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private async fetchQueue() {
    if (this.queueId) {
      this.queue = await this.queueService.findOne(this.queueId);
    }
  }
}
