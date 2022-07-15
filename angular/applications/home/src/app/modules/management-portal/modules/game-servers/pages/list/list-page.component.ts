import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { Order } from '@datorama/akita';
import {
  AuthorizationQuery,
  GameServer,
  GameServerLog,
  GameServerLogQuery,
  GameServerLogStore,
  GameServerQuery,
  GameServerService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService, SocketService } from '../../../../../../core/services';
import { LogsDialogComponent, PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameServersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameServer>;

  public dataSource = new MatTableDataSource<GameServer>();
  public displayedColumns = ['name', 'description', 'status', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public get queueId() {
    return this.params?.queueId;
  }

  private $gameServers: Observable<GameServer[]>;
  private params: Params;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private gameServerLogQuery: GameServerLogQuery,
    private gameServerLogStore: GameServerLogStore,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.titleService.setTitle(`${TITLE} | Game Servers`);

      const roles = [IAuthorization.AuthorizationRole.GameServersReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchGameServers(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async restart(record: GameServer) {
    await this.gameServerService.update({ _id: record._id, restartedAt: new Date() });
    this.matSnackBar.open('Game Server is restarting...');
  }

  public showDeletePrompt($event: Event, record: GameServer) {
    $event.stopPropagation();
    
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Server?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.gameServerService.delete(record._id);
        this.matSnackBar.open('Game Server deleted successfully.');
      }
    });
  }

  public showLogsDialog(record: GameServer) {
    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.gameServerLogQuery.selectAll({
          filterBy: (log) => log.gameServerId === record._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.gameServerQuery
          .selectEntity(record._id)
          .pipe(map((gameServer) => this.getNodeIds(gameServer))),
        find: (nodeId) => this.gameServerService.logs(record._id, nodeId, { tail: 500 }),
        nodeIds: record.status?.nodes?.map((n) => n._id),
        subscribe: async (nodeId, unix) => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.logs(
            GameServerLog,
            { gameServerId: record._id, nodeId, since: unix ? new Date(unix) : new Date() },
            this.gameServerService,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.gameServerLogStore.reset());
  }

  private async fetchGameServers(params: Params) {
    const $gameServers = this.gameServerQuery.selectAll({
      filterBy: (gs) =>
        gs.namespaceId === params.namespaceId && (!this.queueId || this.queueId === gs.queueId),
    });
    this.$gameServers = this.gameServerQuery.populate($gameServers);

    await this.gameServerService.find({ sort: 'name', where: { namespaceId: params.namespaceId } });

    this.updateDataSource$ = this.$gameServers.subscribe(
      (gameServers) => (this.dataSource.data = gameServers),
    );

    this.dataSource.filterPredicate = (data: GameServer, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      return (
        regex.test(data.description) || regex.test(data.name) || regex.test(data.status?.phase)
      );
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getNodeIds(gameServer: GameServer) {
    return gameServer.status?.nodes
      .map((n) => {
        let displayName = 'Game Server';
        if (n._id.includes('sidecar')) {
          displayName = 'Sidecar';
        }

        return { label: displayName, value: n._id };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
