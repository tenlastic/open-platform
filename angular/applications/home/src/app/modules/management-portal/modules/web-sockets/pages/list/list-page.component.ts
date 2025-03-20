import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  UserQuery,
  UserService,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class WebSocketsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public $webSockets: Observable<WebSocketModel[]>;
  public dataSource = new MatTableDataSource<WebSocketModel>();
  public displayedColumns = ['user', 'createdAt', 'disconnectedAt'];
  public get includeConnected() {
    return this._includeConnected;
  }
  public set includeConnected(value: boolean) {
    this._includeConnected = value;
    this.setData();
  }
  public get includeDisconnected() {
    return this._includeDisconnected;
  }
  public set includeDisconnected(value: boolean) {
    this._includeDisconnected = value;
    this.setData();
  }
  public message: string;

  private _includeConnected = true;
  private _includeDisconnected = false;
  private updateDataSource$ = new Subscription();
  private webSockets: WebSocketModel[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      await this.fetchWebSockets(params.namespaceId);
      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  private async fetchWebSockets(namespaceId: string) {
    this.$webSockets = this.webSocketQuery.selectAll({
      filterBy: (ws) => !namespaceId || ws.namespaceId === namespaceId,
    });

    this.updateDataSource$ = this.$webSockets.subscribe((webSockets) => {
      this.webSockets = webSockets;
      this.setData();
    });

    this.dataSource.filterPredicate = (data: WebSocketModel, filter: string) => {
      filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      const regex = new RegExp(filter, 'i');
      const user = this.getUser(data.userId);
      return regex.test(user.username);
    };

    const webSockets = await this.webSocketService.find(namespaceId, { sort: '-createdAt' });
    const userIds = webSockets.map((ws) => ws.userId).filter((ui, i, arr) => arr.indexOf(ui) === i);
    await this.userService.find({ where: { _id: { $in: userIds } } });
  }

  private setData() {
    this.dataSource.data = this.webSockets.filter((ws) => {
      if (!this.includeConnected && !ws.disconnectedAt) return false;

      if (!this.includeDisconnected && ws.disconnectedAt) return false;

      return true;
    });
  }
}
