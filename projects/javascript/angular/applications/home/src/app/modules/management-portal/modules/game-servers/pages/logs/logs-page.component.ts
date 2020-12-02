import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '@datorama/akita';
import { GameServerLog, GameServerLogQuery, GameServerLogService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { IdentityService, SocketService } from '../../../../../../core/services';

@Component({
  templateUrl: 'logs-page.component.html',
  styleUrls: ['./logs-page.component.scss'],
})
export class GameServersLogsPageComponent implements OnDestroy, OnInit {
  public $logs: Observable<GameServerLog[]>;
  public isLive = false;
  public isVisible = false;
  public visibility = {};

  private logJson: { [_id: string]: any } = {};
  private socket: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private gameServerLogQuery: GameServerLogQuery,
    private gameServerLogService: GameServerLogService,
    private socketService: SocketService,
  ) {}

  public ngOnInit() {
    this.fetchLogs();
  }

  public ngOnDestroy() {
    if (this.socket) {
      this.socketService.unsubscribe(this.socket);
    }
  }

  public fetchLogs() {
    const _id = this.activatedRoute.snapshot.paramMap.get('_id');

    this.$logs = this.gameServerLogQuery.selectAll({
      filterBy: log => log.gameServerId === _id,
      limitTo: 250,
      sortBy: 'unix',
      sortByOrder: Order.DESC,
    });

    this.gameServerLogService.find(_id, { limit: 250, sort: '-unix' });

    if (this.isLive) {
      this.socket = this.socketService.subscribe(
        'game-server-logs',
        GameServerLog,
        this.gameServerLogService,
        { gameServerId: _id },
      );
    }
  }

  public getJson(log: GameServerLog) {
    if (this.logJson[log._id]) {
      return this.logJson[log._id];
    }

    try {
      this.logJson[log._id] = JSON.parse(log.body);
    } catch {
      this.logJson[log._id] = null;
    }

    return this.logJson[log._id];
  }

  public toggleIsLive() {
    this.isLive = !this.isLive;
    this.fetchLogs();

    if (!this.isLive && this.socket) {
      this.socketService.unsubscribe(this.socket);
    }
  }

  public toggleVisibility(logs: GameServerLog[]) {
    this.isVisible = !this.isVisible;

    for (const log of logs) {
      this.visibility[log._id] = this.isVisible;
    }
  }
}
