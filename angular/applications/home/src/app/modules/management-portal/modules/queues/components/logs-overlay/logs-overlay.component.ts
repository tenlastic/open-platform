import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  IQueue,
  QueueLogModel,
  QueueLogService,
  QueueLogState,
  QueueModel,
  QueueState,
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
  record: QueueModel;
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
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.data.record.namespaceId}` === ws.url,
    );
  }

  constructor(
    @Inject(OVERLAY_DATA) private data: LogsOverlayComponentData,
    @Inject(OVERLAY_REFERENCE) private overlay: OverlayReference,
    private queueLogService: QueueLogService,
    private queueLogState: QueueLogState,
    private queueState: QueueState,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this._id = uuid();

    this.$records = this.queueLogState
      .selectMany()
      .pipe(map((nls) => nls.filter((nl) => nl.queueId === this.data.record._id)))
      .pipe(map((nls) => nls.sort((a, b) => a.unix - b.unix)));
    this.$nodes = this.queueState
      .selectOne(this.data.record._id)
      .pipe(map((n) => this.getNodes(n)));

    this.overlay.reference.updateSize({ height: '80vh', width: '80vw' });
  }

  public ngOnDestroy() {
    this.queueLogState.reset();
  }

  public find = (container: string, pod: string) => {
    return this.queueLogService.find(
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
      QueueLogModel,
      {
        _id: this._id,
        body: { resumeToken: resumeToken.toISOString() },
        path: `/subscriptions/queues/${this.data.record._id}/logs/${pod}/${container}`,
      },
      this.queueLogService,
      this.webSocket,
      {
        acks: true,
        callback: (response) => {
          response.body.fullDocument.container = container;
          response.body.fullDocument.queueId = this.data.record._id;
          response.body.fullDocument.pod = pod;
        },
      },
    );
  };

  public unsubscribe = () => {
    return this.subscriptionService.unsubscribe(this._id, this.webSocket);
  };

  private getNodes(record: QueueModel) {
    return record.status.nodes
      .map((n) => {
        let label: string = 'Game Server';
        if (
          n.component === IQueue.StatusComponentName.Sidecar &&
          n.container === 'endpoints-sidecar'
        ) {
          label = `${IQueue.StatusComponentName.Sidecar} (Endpoints)`;
        } else if (
          n.component === IQueue.StatusComponentName.Sidecar &&
          n.container === 'status-sidecar'
        ) {
          label = `${IQueue.StatusComponentName.Sidecar} (Status)`;
        }

        return { container: n.container, label: label, pod: n.pod };
      })
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
