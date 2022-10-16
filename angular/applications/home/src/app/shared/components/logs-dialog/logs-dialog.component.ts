import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameServerLogModel, StreamService } from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

export interface LogsDialogComponentData {
  $logs: Observable<any[]>;
  $nodeIds: Observable<NodeId[]>;
  nodeId?: string;
  find(nodeId: string): Promise<any[]>;
  subscribe(nodeId: string, unix: string): Promise<string>;
  wssUrl?: string;
}

export interface NodeId {
  label: string;
  value: string;
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
      map((logs) => {
        return this.nodeId ? logs.filter((l) => l.nodeId === this.nodeId) : logs;
      }),
    );
  }
  public isLive = false;
  public isVisible = false;
  public nodeId: string;
  public visibility = {};

  private setDefaultNodeId$ = new Subscription();
  private logJson: { [_id: string]: any } = {};
  private subscription: string;
  private get wssUrl() {
    return this.data.wssUrl ?? environment.wssUrl;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogsDialogComponentData,
    private matDialogRef: MatDialogRef<LogsDialogComponent>,
    private streamService: StreamService,
  ) {}

  public async ngOnInit() {
    this.matDialogRef.addPanelClass('app-logs-dialog');

    const nodeIds = await this.data.$nodeIds.pipe(first()).toPromise();
    this.nodeId = this.data.nodeId || nodeIds[0]?.value;

    this.setDefaultNodeId$ = this.data.$nodeIds.subscribe((nis) => {
      if (!this.nodeId && !this.data.nodeId && nis.length > 0) {
        this.setNodeId(nis[0].value);
      }
    });

    await this.find();
    this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
  }

  public async ngOnDestroy() {
    this.setDefaultNodeId$.unsubscribe();
    this.streamService.unsubscribe(this.subscription, this.wssUrl);
  }

  public getJson(log: GameServerLogModel) {
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

  public async setNodeId(nodeId: string) {
    this.nodeId = nodeId;

    if (this.isLive) {
      await this.toggleIsLive();
    }

    await this.find();
    this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
  }

  public async toggleIsLive() {
    this.isLive = !this.isLive;

    if (this.isLive) {
      await this.find();

      const logs = await this.$logs.pipe(first()).toPromise();
      const mostRecentLog = logs.length > 0 ? logs[0] : null;
      this.subscription = await this.data.subscribe(this.nodeId, mostRecentLog?.unix);
    } else {
      this.streamService.unsubscribe(this.subscription, this.wssUrl);
    }
  }

  public toggleVisibility(logs: GameServerLogModel[]) {
    this.isVisible = !this.isVisible;

    for (const log of logs) {
      this.visibility[log.unix] = this.isVisible;
    }
  }

  private find() {
    if (!this.nodeId) {
      return;
    }

    return this.data.find(this.nodeId);
  }
}
