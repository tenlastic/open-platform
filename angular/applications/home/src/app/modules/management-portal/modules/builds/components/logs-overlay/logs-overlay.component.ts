import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  BuildLogModel,
  BuildLogService,
  BuildLogState,
  BuildModel,
  BuildState,
  IBuild,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { OVERLAY_DATA, OVERLAY_REFERENCE, OverlayReference } from '@home/app/core/services';
import { LogsComponentNode } from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

export interface LogsOverlayComponentData {
  node: IBuild.Node;
  record: BuildModel;
}

@Component({
  standalone: false,
  templateUrl: 'logs-overlay.component.html',
})
export class LogsOverlayComponent implements OnDestroy, OnInit {
  public $nodes: Observable<LogsComponentNode[]>;
  public $records: Observable<any[]>;
  public node: LogsComponentNode;

  private _id: string;
  private get webSocket() {
    const url = `${environment.wssUrl}/namespaces/${this.data.record.namespaceId}`;
    return this.webSocketService.webSockets.find((ws) => url === ws.url);
  }

  constructor(
    private buildLogService: BuildLogService,
    private buildLogState: BuildLogState,
    private buildState: BuildState,
    @Inject(OVERLAY_DATA) private data: LogsOverlayComponentData,
    @Inject(OVERLAY_REFERENCE) private overlay: OverlayReference,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this._id = uuid();

    this.$records = this.buildLogState
      .selectMany()
      .pipe(map((bls) => bls.filter((bl) => bl.buildId === this.data.record._id)))
      .pipe(map((bls) => bls.sort((a, b) => a.unix - b.unix)));
    this.$nodes = this.buildState
      .selectOne(this.data.record._id)
      .pipe(map((n) => this.getNodes(n)));
    this.node = { container: this.data.node.container, pod: this.data.node.pod };

    this.overlay.reference.updateSize({ height: '80vh', width: '80vw' });
  }

  public ngOnDestroy() {
    this.buildLogState.reset();
  }

  public find = (container: string, pod: string) => {
    return this.buildLogService.find(
      this.data.record.namespaceId,
      this.data.record._id,
      pod,
      container,
      { tail: 500 },
    );
  };

  public subscribe = (container: string, pod: string, unix: number) => {
    const resumeToken = unix ? new Date(unix) : new Date();

    return this.subscriptionService.subscribe(
      BuildLogModel,
      {
        _id: this._id,
        body: { resumeToken: resumeToken.toISOString() },
        path: `/subscriptions/builds/${this.data.record._id}/logs/${pod}/${container}`,
      },
      this.buildLogService,
      this.webSocket,
      {
        acks: true,
        callback: (response) => {
          response.body.fullDocument.container = container;
          response.body.fullDocument.buildId = this.data.record._id;
          response.body.fullDocument.pod = pod;
        },
      },
    );
  };

  public unsubscribe = () => {
    return this.subscriptionService.unsubscribe(this._id, this.webSocket);
  };

  private getLabel(displayName: string) {
    return displayName
      .toLowerCase()
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\(0\)$/, '')
      .replace(/\(([0-9]+)\)$/, (match, p1) => ` (Retry #${p1})`);
  }

  private getNodes(build: BuildModel) {
    const nodes = build.status.nodes.filter((n) => n.type === 'Pod');
    return nodes
      .map((n) => ({ container: n.container, label: this.getLabel(n.displayName), pod: n.pod }))
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
