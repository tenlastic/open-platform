import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '@datorama/akita';
import { Log, LogQuery, LogService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'logs-page.component.html',
  styleUrls: ['./logs-page.component.scss'],
})
export class GameServersLogsPageComponent implements OnInit {
  public $logs: Observable<Log[]>;
  public visibility = {};

  private logJson: { [_id: string]: any } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private logQuery: LogQuery,
    private logService: LogService,
  ) {}

  public ngOnInit() {
    const _id = this.activatedRoute.snapshot.paramMap.get('_id');

    this.$logs = this.logQuery.selectAll({
      filterBy: log => log.gameServerId === _id,
      sortBy: '_id',
      sortByOrder: Order.DESC,
    });

    this.logService.find({ where: { gameServerId: _id } });
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
}
