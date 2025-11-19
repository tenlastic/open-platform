import * as k8s from '@kubernetes/client-node';

export interface BaseWatchOptions {
  [key: string]: boolean | number | string;
  fieldSelector?: string;
  labelSelector?: string;
  resourceVersion?: string;
}

export type BaseWatchAction = 'ADDED' | 'DELETED' | 'MODIFIED';
export type BaseWatchCallback<T> = (
  action: BaseWatchAction,
  object: T & V1Object,
) => void | Promise<void>;
export type BaseWatchDoneCallback = (err: unknown) => void;

interface V1Object {
  metadata: k8s.V1ObjectMeta;
}

export class Watch<T> {
  private abortController: AbortController;
  private callback: BaseWatchCallback<T>;
  private close = false;
  private done: BaseWatchDoneCallback;
  private endpoint: string;
  private options: BaseWatchOptions;
  private names: { [key: string]: boolean } = {};
  private timeout: NodeJS.Timeout;

  constructor(
    endpoint: string,
    options: BaseWatchOptions,
    callback: BaseWatchCallback<T>,
    done?: BaseWatchDoneCallback,
  ) {
    this.callback = callback;
    this.endpoint = endpoint;
    this.options = options;

    this.callback = (action, object) => {
      if (action === 'ADDED' && this.names[object.metadata.name]) {
        return;
      }

      if (action === 'ADDED' || action === 'MODIFIED') {
        this.names[object.metadata.name] = true;
      } else if (action === 'DELETED') {
        delete this.names[object.metadata.name];
      }

      return callback(action, object);
    };
    this.done = (err) => {
      const aborted =
        typeof err === 'object' &&
        err &&
        'message' in err &&
        typeof err.message == 'string' &&
        err.message === 'aborted';

      if (!this.close && aborted) {
        return this.start();
      }

      clearInterval(this.timeout);

      return done(aborted ? null : err);
    };
  }

  public async start() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const watch = new k8s.Watch(kc);

    this.abortController = await watch.watch(this.endpoint, this.options, this.callback, this.done);
    this.timeout = setTimeout(() => this.abortController.abort(), 15 * 60 * 1000);
  }

  public stop() {
    this.abortController?.abort();
    this.close = true;
  }
}
