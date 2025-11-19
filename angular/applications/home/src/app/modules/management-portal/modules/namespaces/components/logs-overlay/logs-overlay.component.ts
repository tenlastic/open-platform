import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  INamespace,
  NamespaceLogModel,
  NamespaceLogService,
  NamespaceLogState,
  NamespaceModel,
  NamespaceState,
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
  record: NamespaceModel;
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
    return this.webSocketService.webSockets.find((ws) => environment.wssUrl === ws.url);
  }

  constructor(
    @Inject(OVERLAY_DATA) private data: LogsOverlayComponentData,
    private namespaceLogService: NamespaceLogService,
    private namespaceLogState: NamespaceLogState,
    private namespaceState: NamespaceState,
    @Inject(OVERLAY_REFERENCE) private overlay: OverlayReference,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this._id = uuid();

    this.$records = this.namespaceLogState
      .selectMany()
      .pipe(map((nls) => nls.filter((nl) => nl.namespaceId === this.data.record._id)))
      .pipe(map((nls) => nls.sort((a, b) => a.unix - b.unix)));
    this.$nodes = this.namespaceState
      .selectOne(this.data.record._id)
      .pipe(map((n) => this.getNodes(n)));

    this.overlay.reference.updateSize({ height: '80vh', width: '80vw' });
  }

  public ngOnDestroy() {
    this.namespaceLogState.reset();
  }

  public find = (container: string, pod: string) => {
    return this.namespaceLogService.find(this.data.record._id, pod, container, { tail: 500 });
  };

  public subscribe = (container: string, pod: string, unix: number) => {
    const resumeToken = unix ? new Date(unix) : new Date();

    return this.subscriptionService.subscribe(
      NamespaceLogModel,
      {
        _id: this._id,
        body: { resumeToken: resumeToken.toISOString() },
        path: `/subscriptions/namespaces/${this.data.record._id}/logs/${pod}/${container}`,
      },
      this.namespaceLogService,
      this.webSocket,
      {
        acks: true,
        callback: (response) => {
          response.body.fullDocument.container = container;
          response.body.fullDocument.namespaceId = this.data.record._id;
          response.body.fullDocument.pod = pod;
        },
      },
    );
  };

  public unsubscribe = () => {
    return this.subscriptionService.unsubscribe(this._id, this.webSocket);
  };

  private getNodes(record: NamespaceModel) {
    return record.status.nodes
      .map((n) => {
        let label: string = INamespace.StatusComponentName.API;

        if (n.component === INamespace.StatusComponentName.CDC) {
          label = INamespace.StatusComponentName.CDC;
        } else if (
          n.component === INamespace.StatusComponentName.Connector &&
          n.container === 'aggregation-api'
        ) {
          label = `${INamespace.StatusComponentName.Connector} (Aggregation API)`;
        } else if (
          n.component === INamespace.StatusComponentName.Connector &&
          n.container === 'api'
        ) {
          label = `${INamespace.StatusComponentName.Connector} (API)`;
        } else if (n.component === INamespace.StatusComponentName.Metrics) {
          label = INamespace.StatusComponentName.Metrics;
        } else if (n.component === INamespace.StatusComponentName.Migrations) {
          label = INamespace.StatusComponentName.Migrations;
        } else if (
          n.component === INamespace.StatusComponentName.Sidecar &&
          n.container === 'status-sidecar'
        ) {
          label = `${INamespace.StatusComponentName.Sidecar} (Status)`;
        }

        return { container: n.container, label, pod: n.pod };
      })
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
