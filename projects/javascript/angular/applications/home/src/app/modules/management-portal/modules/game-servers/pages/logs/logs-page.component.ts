import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '@datorama/akita';
import { Log, LogQuery, LogService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService, SocketService } from '../../../../../../core/services';

@Component({
  templateUrl: 'logs-page.component.html',
  styleUrls: ['./logs-page.component.scss'],
})
export class GameServersLogsPageComponent implements OnDestroy, OnInit {
  public $logs: Observable<Log[]>;
  public isLive = false;
  public isVisible = false;
  public visibility = {};

  private setDefaultVisibility$ = new Subscription();
  private logJson: { [_id: string]: any } = {};
  private socket: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private logQuery: LogQuery,
    private logService: LogService,
    private socketService: SocketService,
  ) {}

  public ngOnInit() {
    this.fetchLogs();
  }

  public ngOnDestroy() {
    this.setDefaultVisibility$.unsubscribe();

    if (this.socket) {
      this.socketService.unsubscribe(this.socket);
    }
  }

  public fetchLogs() {
    const _id = this.activatedRoute.snapshot.paramMap.get('_id');

    this.$logs = this.logQuery.selectAll({
      filterBy: log => log.gameServerId === _id,
      limitTo: 250,
      sortBy: '_id',
      sortByOrder: Order.DESC,
    });

    this.logService.find({ limit: 250, sort: '-_id', where: { gameServerId: _id } });

    this.setDefaultVisibility$ = this.$logs.subscribe(logs => {
      for (const log of logs) {
        this.visibility[log._id] = this.isVisible;
      }
    });

    if (this.isLive) {
      this.socket = this.socketService.subscribe('logs', Log, this.logService);
    }
  }

  public getJson(log: Log) {
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

  public toggleVisibility(logs: Log[]) {
    this.isVisible = !this.isVisible;

    for (const log of logs) {
      this.visibility[log._id] = this.isVisible;
    }
  }
}
