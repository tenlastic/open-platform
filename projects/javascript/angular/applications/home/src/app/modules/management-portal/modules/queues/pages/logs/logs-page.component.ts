import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '@datorama/akita';
import { QueueLog, QueueLogQuery, QueueLogService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { IdentityService, SocketService } from '../../../../../../core/services';

@Component({
  templateUrl: 'logs-page.component.html',
  styleUrls: ['./logs-page.component.scss'],
})
export class QueuesLogsPageComponent implements OnDestroy, OnInit {
  public $logs: Observable<QueueLog[]>;
  public isLive = false;
  public isVisible = false;
  public visibility = {};

  private logJson: { [_id: string]: any } = {};
  private socket: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private queueLogQuery: QueueLogQuery,
    private queueLogService: QueueLogService,
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

    this.$logs = this.queueLogQuery.selectAll({
      filterBy: log => log.queueId === _id,
      limitTo: 250,
      sortBy: 'unix',
      sortByOrder: Order.DESC,
    });

    this.queueLogService.find(_id, { limit: 250, sort: '-unix' });

    if (this.isLive) {
      this.socket = this.socketService.subscribe('queue-logs', QueueLog, this.queueLogService, {
        queueId: _id,
      });
    }
  }

  public getJson(log: QueueLog) {
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

  public toggleVisibility(logs: QueueLog[]) {
    this.isVisible = !this.isVisible;

    for (const log of logs) {
      this.visibility[log._id] = this.isVisible;
    }
  }
}
