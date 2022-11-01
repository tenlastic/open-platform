import * as k8s from '@kubernetes/client-node';

export interface BaseWatchOptions {
  fieldSelector?: string;
  labelSelector?: string;
  resourceVersion?: string;
}

export type BaseWatchAction = 'ADDED' | 'DELETED' | 'MODIFIED';
export type BaseWatchCallback<T> = (
  action: BaseWatchAction,
  object: T & V1Object,
) => void | Promise<void>;
export type BaseWatchDoneCallback = (err: any) => void;

interface V1Object {
  metadata: k8s.V1ObjectMeta;
}

interface Parameters {
  request?: any;
}

export class Watch<T> {
  private callback: BaseWatchCallback<T>;
  private close = false;
  private done: BaseWatchDoneCallback;
  private endpoint: string;
  private options: BaseWatchOptions;
  private names: { [key: string]: boolean } = {};
  private parameters: Parameters;
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
    this.parameters = {};

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
      if (!this.close && err?.message === 'aborted') {
        return this.start();
      }

      clearInterval(this.timeout);
      return done(err?.message === 'aborted' ? null : err);
    };
  }

  public async start() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const watch = new k8s.Watch(kc);

    this.parameters.request = await watch.watch(
      this.endpoint,
      this.options,
      this.callback,
      this.done,
    );

    this.timeout = setTimeout(() => this.parameters.request.abort(), 15 * 60 * 1000);
  }

  public stop() {
    this.close = true;
    this.parameters.request.abort();
  }
}
