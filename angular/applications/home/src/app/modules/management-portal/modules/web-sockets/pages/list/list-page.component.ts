import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { UserQuery, WebSocketModel, WebSocketService } from '@tenlastic/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ClipboardService } from '../../../../../../core/services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class WebSocketsListPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<WebSocketModel>();
  public displayedColumns = ['user', 'createdAt', 'disconnectedAt'];
  public filter: string;
  public includeConnected = true;
  public includeDisconnected = false;
  public message: string;

  private filter$ = new Subject();
  private date = new Date(0);
  private params: Params;
  private timeout: NodeJS.Timeout;

  constructor(
    private activatedRoute: ActivatedRoute,
    private clipboardService: ClipboardService,
    private matSnackBar: MatSnackBar,
    private userQuery: UserQuery,
    private webSocketService: WebSocketService,
  ) {}

  public ngAfterViewInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchWebSockets());

    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.message = 'Loading...';
      await this.fetchWebSockets();
      this.message = null;
    });

    this.webSocketService.emitter.on('create', (ws) => {
      if (!this.match(ws)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= ws.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= ws.createdAt) {
        return;
      }

      this.fetchWebSockets(true);
    });

    this.webSocketService.emitter.on('delete', (ws) => {
      const index = this.dataSource.data.findIndex((d) => d._id === ws._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchWebSockets(true);
    });

    this.webSocketService.emitter.on('update', (ws) => {
      const index = this.dataSource.data.findIndex((d) => d._id === ws._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(ws)) {
        this.dataSource.data[index] = ws;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchWebSockets(true);
      }
    });
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public copyToClipboard(value: string) {
    this.clipboardService.copy(value);
    this.matSnackBar.open('User ID copied to clipboard.');
  }

  public async fetchWebSockets(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchWebSockets(), threshold - date.getTime());
      return;
    }

    if (!this.paginator || !this.params) {
      return;
    }

    this.date = date;

    if (!this.includeConnected && !this.includeDisconnected) {
      this.dataSource.data = [];
      this.paginator.firstPage();
      this.paginator.length = 0;
      return;
    }

    let where: any = {};
    if (this.filter) {
      where.userId = this.filter;
    }
    if (this.includeConnected) {
      where.$or ||= [];
      where.$or.push({ disconnectedAt: null });
    }
    if (this.includeDisconnected) {
      where.$or ||= [];
      where.$or.push({ disconnectedAt: { $exists: true } });
    }

    this.dataSource.data = await this.webSocketService.find(this.params.namespaceId, {
      limit: this.paginator.pageSize,
      skip: this.paginator.pageIndex * this.paginator.pageSize,
      sort: `-createdAt`,
      where,
    });

    this.paginator.length = await this.webSocketService.count(this.params.namespaceId, { where });

    if (this.paginator.length < this.paginator.pageIndex * this.paginator.pageSize) {
      this.paginator.firstPage();
    }
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  private match(webSocket: WebSocketModel) {
    if (this.filter && this.filter !== webSocket.userId) {
      return false;
    }

    if (!this.includeConnected && !webSocket.disconnectedAt) {
      return false;
    }

    if (!this.includeDisconnected && webSocket.disconnectedAt) {
      return false;
    }

    if (this.params.namespaceId !== webSocket.namespaceId) {
      return false;
    }

    return true;
  }
}
