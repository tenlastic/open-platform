import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import {
  BaseModel,
  ServiceWithEmitter,
  SubscribeRequest,
  SubscriptionService,
  WebSocket,
} from '@tenlastic/http';
import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ListTableColumn<TModel> {
  header: string;
  icon?: (v: TModel) => string;
  text?: (v: TModel) => string;
}

export interface ListTableSubscription<TModel = BaseModel> {
  _ids?: string[];
  Model: new (...args: unknown[]) => TModel;
  request: SubscribeRequest;
  service: ServiceWithEmitter;
}

@Component({
  selector: 'app-list-table',
  standalone: false,
  styleUrls: ['./list-table.component.scss'],
  templateUrl: './list-table.component.html',
})
export class ListTableComponent implements OnDestroy, OnInit {
  @Input() public columns: ListTableColumn<unknown>[];
  @Input() public navigate = (element: unknown) => [];
  @Input() public template: TemplateRef<unknown>;

  @Input() private $records: Observable<BaseModel[]>;
  @Input() private $refresh = new Subject<void>();
  @Input() private count: () => Promise<number>;
  @Input() private filter: (v: unknown) => boolean;
  @Input() private find: (page: number, pageSize: number) => Promise<BaseModel[]>;
  @Input() private subscriptions: ListTableSubscription<BaseModel>[] = [];
  @Input() private webSocket: WebSocket;

  public get POSITIVE_INFINITY() {
    return Number.POSITIVE_INFINITY;
  }

  public $elements: Observable<unknown[]>;
  public $page = new BehaviorSubject(0);
  public get firstPageEnabled() {
    return this.page > 0 && this.total > 0;
  }
  public get lastPageEnabled() {
    return this.page < this.totalPages && this.total > 0;
  }
  public message: string;
  public get nextPageEnabled() {
    return this.page < this.totalPages && this.total > 0;
  }
  public page = 0;
  public pageCount = 0;
  public pageSize = 10;
  public get pageText() {
    const max = Math.min(this.page * this.pageSize + this.pageCount, this.total);
    const min = Math.min(max, this.page * this.pageSize + 1);
    return `${min} - ${max} of ${this.total}`;
  }
  public get previousPageEnabled() {
    return this.page > 0 && this.total > 0;
  }
  public total = 0;
  public get totalPages() {
    return Math.ceil(this.total / this.pageSize) - 1;
  }

  private $ids = new BehaviorSubject<string[]>([]);
  private refresh$: Subscription;

  constructor(private subscriptionService: SubscriptionService) {}

  public ngOnInit() {
    this.$elements = combineLatest([this.$ids, this.$records]).pipe(
      map(([ids, records]) => {
        const elements = records.filter((n) => this.filter(n));
        return elements
          .filter((e) => ids.includes(e._id))
          .sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id));
      }),
    );

    this.refresh$ = this.$refresh.subscribe(() => this.fetch());

    this.refresh();
  }

  public ngOnDestroy() {
    this.refresh$.unsubscribe();
    this.unsubscribe();
  }

  public async refresh() {
    await this.fetch();
  }

  public setPage(value: number) {
    if (value > this.totalPages) {
      value = this.totalPages;
    }

    if (value < 0) {
      value = 0;
    }

    if (this.$page.value === value) {
      return;
    }

    this.$page.next(value);
    this.$refresh.next();
  }

  private async fetch() {
    this.message = 'Loading...';

    const [count, records] = await Promise.all([
      this.count(),
      this.find(this.$page.value, this.pageSize),
    ]);

    const _ids = records.map((r) => r._id);
    this.$ids.next(_ids);

    this.page = this.$page.value;
    this.pageCount = records.length;
    this.total = count;

    if (this.$page.value > this.totalPages) {
      this.setPage(0);
    }

    await this.unsubscribe();
    await this.subscribe();

    this.message = null;
  }

  private subscribe() {
    const promises = this.subscriptions.map((s) => {
      const options = { acks: true };
      const request: SubscribeRequest = {
        ...s.request,
      };

      return this.subscriptionService.subscribe(
        s.Model,
        request,
        s.service,
        this.webSocket,
        options,
      );
    });

    return Promise.all(promises);
  }

  private unsubscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.unsubscribe(s.request._id, this.webSocket),
    );

    return Promise.all(promises);
  }
}
