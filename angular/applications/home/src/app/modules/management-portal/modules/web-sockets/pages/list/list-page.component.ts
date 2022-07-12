import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { WebSocket, WebSocketQuery, WebSocketService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class WebSocketsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<WebSocket>;

  public $webSockets: Observable<WebSocket[]>;
  public dataSource = new MatTableDataSource<WebSocket>();
  public displayedColumns: string[] = ['user', 'createdAt', 'disconnectedAt', 'duration'];

  private updateDataSource$ = new Subscription();

  constructor(
    private titleService: Title,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Web Sockets`);
    this.fetchWebSockets();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  private async fetchWebSockets() {
    const $webSockets = this.webSocketQuery.selectAll();
    this.$webSockets = this.webSocketQuery.populate($webSockets);

    const webSockets = await this.webSocketService.find({ sort: '-createdAt' });

    this.updateDataSource$ = this.$webSockets.subscribe(
      (webSockets) => (this.dataSource.data = webSockets),
    );

    this.dataSource.filterPredicate = (data: WebSocket, filter: string) => {
      filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      const regex = new RegExp(filter, 'i');
      return regex.test(data.user?.username);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
