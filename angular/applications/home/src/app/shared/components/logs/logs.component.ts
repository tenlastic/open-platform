import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BaseLogModel, WebSocketResponse } from '@tenlastic/http';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

export interface LogsComponentLog {
  container: string;
  pod: string;
  unix: number;
}

export interface LogsComponentNode {
  container: string;
  label?: string;
  pod: string;
}

@Component({
  selector: 'app-logs',
  standalone: false,
  styleUrls: ['./logs.component.scss'],
  templateUrl: 'logs.component.html',
})
export class LogsComponent implements OnDestroy, OnInit {
  @Input() public $nodes: Observable<LogsComponentNode[]>;

  @Input() private $records: Observable<LogsComponentLog[]>;
  @Input() private find: (container: string, pod: string) => Promise<LogsComponentLog[]>;
  @Input() private set node(value: LogsComponentNode) {
    this._node = value;
    this.value = this.getValueFromNode(value);
  }
  @Input() private subscribe: (
    container: string,
    pod: string,
    unix: number,
  ) => Promise<WebSocketResponse>;
  @Input() private unsubscribe: () => Promise<WebSocketResponse>;

  @ViewChild('container') private container: ElementRef;

  public get $logs() {
    return this.$records.pipe(
      map((logs) => {
        return this.node
          ? logs.filter((l) => l.container === this.node.container && l.pod === this.node.pod)
          : logs;
      }),
    );
  }
  public form: FormGroup;
  public isLive = false;
  public isVisible = false;
  public get node() {
    return this._node;
  }
  public value: string;
  public visibility = {};

  private setDefaultNode$ = new Subscription();
  private _node: LogsComponentNode;
  private logJson: { [_id: string]: any } = {};

  constructor(private formBuilder: FormBuilder) {}

  public async ngOnInit() {
    this.form = this.formBuilder.group({ node: null });

    const nodes = await firstValueFrom(this.$nodes);
    this.node = this.node
      ? nodes.find((n) => n.container == this.node.container && n.pod === this.node.pod)
      : nodes[0];

    this.setDefaultNode$ = this.$nodes.subscribe((n) => {
      if (!this.node && !this.node && n.length > 0) {
        const value = this.getValueFromNode(n[0]);
        this.setNode(value);
      }
    });

    if (this.node) {
      await this.find(this.node.container, this.node.pod);
    }

    await this.scrollToBottom();
  }

  public async ngOnDestroy() {
    this.setDefaultNode$.unsubscribe();
    await this.unsubscribe();
  }

  public getBody(log: BaseLogModel, space = 0) {
    return typeof log.body === 'string' ? log.body : JSON.stringify(log.body, null, space);
  }

  public getJson(log: BaseLogModel) {
    if (this.logJson[log._id]) {
      return this.logJson[log._id];
    }

    try {
      this.logJson[log._id] = JSON.parse(log.body as string);
    } catch {
      this.logJson[log._id] = null;
    }

    return this.logJson[log._id];
  }

  public getValueFromNode(node: LogsComponentNode) {
    if (!node) {
      return null;
    }

    return JSON.stringify([node.container, node.pod]);
  }

  public async setNode(value: string) {
    this.node = await this.getNodeFromValue(value);

    if (this.isLive) {
      await this.toggleIsLive();
    }

    if (this.node) {
      await this.find(this.node.container, this.node.pod);
    }

    await this.scrollToBottom();
  }

  public async toggleIsLive() {
    this.isLive = !this.isLive;

    if (this.isLive) {
      const logs = await this.$logs.pipe(first()).toPromise();
      const mostRecentLog = logs.length > 0 ? logs[0] : null;

      await this.subscribe(this.node.container, this.node.pod, mostRecentLog?.unix);
    } else {
      await this.unsubscribe();
    }
  }

  public toggleVisibility(isVisible: boolean, logs: BaseLogModel[]) {
    this.isVisible = isVisible;

    for (const log of logs) {
      this.visibility[log.unix] = this.isVisible;
    }
  }

  private async getNodeFromValue(value: string) {
    const [container, pod] = JSON.parse(value);
    const nodes = await firstValueFrom(this.$nodes);
    return nodes.find((n) => n.container === container && n.pod === pod);
  }

  private async scrollToBottom() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
  }
}
