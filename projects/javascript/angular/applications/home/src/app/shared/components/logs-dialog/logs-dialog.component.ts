import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GameServerLog } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { IdentityService, SocketService } from '../../../core/services';

export interface LogsDialogComponentData {
  $logs: Observable<any[]>;
  find(): any[];
  subscribe(): string;
}

@Component({
  selector: 'app-logs-dialog',
  styleUrls: ['./logs-dialog.component.scss'],
  templateUrl: 'logs-dialog.component.html',
})
export class LogsDialogComponent implements OnDestroy, OnInit {
  public isLive = false;
  public isVisible = false;
  public visibility = {};

  private logJson: { [_id: string]: any } = {};
  private socket: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogsDialogComponentData,
    public identityService: IdentityService,
    public matDialogRef: MatDialogRef<LogsDialogComponent>,
    private socketService: SocketService,
  ) {}

  public ngOnInit() {
    this.matDialogRef.addPanelClass('app-logs-dialog');
    this.data.find();
  }

  public ngOnDestroy() {
    if (this.socket) {
      this.socketService.unsubscribe(this.socket);
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

    if (this.isLive) {
      this.data.find();
      this.socket = this.data.subscribe();
    } else {
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
