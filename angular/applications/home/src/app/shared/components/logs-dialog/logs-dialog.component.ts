import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseLogModel, WebSocketResponse } from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

export interface LogsDialogComponentData {
  $logs: Observable<any[]>;
  $nodes: Observable<LogsDialogComponentNode[]>;
  find(container: string, pod: string): Promise<any[]>;
  node?: LogsDialogComponentNode;
  subscribe(container: string, pod: string, unix: string): Promise<WebSocketResponse>;
  unsubscribe(): Promise<WebSocketResponse>;
}

export interface LogsDialogComponentNode {
  container: string;
  label?: string;
  pod: string;
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
        return this.node
          ? logs.filter((l) => l.container === this.node.container && l.pod === this.node.pod)
          : logs;
      }),
    );
  }
  public isLive = false;
  public isVisible = false;
  public get node() {
    return this._node;
  }
  public set node(value) {
    this._node = value;
    this.value = this.getValueFromNode(value);
  }
  public value: string;
  public visibility = {};

  private setDefaultNode$ = new Subscription();
  private _node: LogsDialogComponentNode;
  private logJson: { [_id: string]: any } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogsDialogComponentData,
    private matDialogRef: MatDialogRef<LogsDialogComponent>,
  ) {}

  public async ngOnInit() {
    this.matDialogRef.addPanelClass('app-logs-dialog');

    const { node } = this.data;
    const nodes = await this.data.$nodes.pipe(first()).toPromise();
    this.node = node
      ? nodes.find((n) => n.container == node.container && n.pod === node.pod)
      : nodes[0];

    this.setDefaultNode$ = this.data.$nodes.subscribe((n) => {
      if (!this.node && !this.data.node && n.length > 0) {
        const value = this.getValueFromNode(n[0]);
        this.setNode(value);
      }
    });

    await this.find();
    await this.scrollToBottom();
  }

  public async ngOnDestroy() {
    this.setDefaultNode$.unsubscribe();
    await this.data.unsubscribe();
  }

  public getBody(log: BaseLogModel, space = 0) {
    return typeof log.body === 'string' ? log.body : JSON.stringify(log.body, null, space);
  }

  public getJson(log: BaseLogModel) {
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

  public async getNodeFromValue(value: string) {
    const [container, pod] = JSON.parse(value);
    const nodes = await this.data.$nodes.pipe(first()).toPromise();
    return nodes.find((n) => n.container === container && n.pod === pod);
  }

  public getValueFromNode(node: LogsDialogComponentNode) {
    return JSON.stringify([node.container, node.pod]);
  }

  public async setNode(value: string) {
    this.node = await this.getNodeFromValue(value);

    if (this.isLive) {
      await this.toggleIsLive();
    }

    await this.find();
    await this.scrollToBottom();
  }

  public async toggleIsLive() {
    this.isLive = !this.isLive;

    if (this.isLive) {
      const logs = await this.$logs.pipe(first()).toPromise();
      const mostRecentLog = logs.length > 0 ? logs[0] : null;

      await this.data.subscribe(this.node.container, this.node.pod, mostRecentLog?.unix);
    } else {
      await this.data.unsubscribe();
    }
  }

  public toggleVisibility(isVisible: boolean, logs: BaseLogModel[]) {
    this.isVisible = isVisible;

    for (const log of logs) {
      this.visibility[log.unix] = this.isVisible;
    }
  }

  private find() {
    if (!this.node) {
      return;
    }

    return this.data.find(this.node.container, this.node.pod);
  }

  private async scrollToBottom() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
  }
}
