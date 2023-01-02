import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  UserQuery,
  UserService,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class WebSocketsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<WebSocketModel>;

  public $webSockets: Observable<WebSocketModel[]>;
  public dataSource = new MatTableDataSource<WebSocketModel>();
  public displayedColumns = ['user', 'createdAt'];

  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.fetchWebSockets(params.namespaceId, params.userId);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  private async fetchWebSockets(namespaceId: string, userId: string) {
    this.$webSockets = this.webSocketQuery.selectAll({
      filterBy: (ws) =>
        (!namespaceId || ws.namespaceId === namespaceId) && (!userId || ws.userId === userId),
    });

    this.updateDataSource$ = this.$webSockets.subscribe(
      (webSockets) => (this.dataSource.data = webSockets),
    );

    this.dataSource.filterPredicate = (data: WebSocketModel, filter: string) => {
      filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      const regex = new RegExp(filter, 'i');
      const user = this.getUser(data.userId);
      return regex.test(user.username);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    const webSockets = await this.webSocketService.find(namespaceId, {
      sort: '-createdAt',
      where: { namespaceId },
    });
    const userIds = webSockets.map((ws) => ws.userId).filter((ui, i, arr) => arr.indexOf(ui) === i);
    await this.userService.find({ where: { _id: { $in: userIds } } });
  }
}
