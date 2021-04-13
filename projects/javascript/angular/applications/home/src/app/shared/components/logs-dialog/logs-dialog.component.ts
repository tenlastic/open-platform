import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GameServerLog } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { IdentityService, SocketService } from '../../../core/services';

export interface LogsDialogComponentData {
  $logs: Observable<any[]>;
  find(): Promise<any[]>;
  subscribe(): string;
}

@Component({
  selector: 'app-logs-dialog',
  styleUrls: ['./logs-dialog.component.scss'],
  templateUrl: 'logs-dialog.component.html',
})
export class LogsDialogComponent implements OnDestroy, OnInit {
  @ViewChild('container', { static: true }) private container: ElementRef;

  public get $logs() {
    return this.data.$logs.pipe(
      map(logs => {
        return this.nodeId ? logs.filter(l => l.nodeId === this.nodeId) : logs;
      }),
    );
  }
  public get $nodeIds() {
    return this.data.$logs.pipe(
      map(logs => {
        const nodeIds = logs.map(l => l.nodeId);
        return nodeIds.filter((ni, i) => nodeIds.indexOf(ni) === i).sort();
      }),
    );
  }
  public isLive = false;
  public isVisible = false;
  public nodeId: string;
  public visibility = {};

  private logJson: { [_id: string]: any } = {};
  private socket: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogsDialogComponentData,
    public identityService: IdentityService,
    public matDialogRef: MatDialogRef<LogsDialogComponent>,
    private socketService: SocketService,
  ) {}

  public async ngOnInit() {
    this.matDialogRef.addPanelClass('app-logs-dialog');

    await this.data.find();
    this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
  }

  public ngOnDestroy() {
    if (this.socket) {
      const socket = this.socketService.connect(environment.apiBaseUrl);
      socket.unsubscribe(this.socket);
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

  public setNodeId($event) {
    this.nodeId = $event.value;
  }

  public toggleIsLive() {
    this.isLive = !this.isLive;

    if (this.isLive) {
      this.data.find();
      this.socket = this.data.subscribe();
    } else {
      const socket = this.socketService.connect(environment.apiBaseUrl);
      socket.unsubscribe(this.socket);
    }
  }

  public toggleVisibility(logs: GameServerLog[]) {
    this.isVisible = !this.isVisible;

    for (const log of logs) {
      this.visibility[log._id] = this.isVisible;
    }
  }
}
