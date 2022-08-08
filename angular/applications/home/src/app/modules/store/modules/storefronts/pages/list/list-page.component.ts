import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { StorefrontModel, StorefrontQuery, StorefrontService } from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class ListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<StorefrontModel>;

  public $storefronts: Observable<StorefrontModel[]>;
  public dataSource = new MatTableDataSource<StorefrontModel>();
  public displayedColumns = ['title', 'subtitle', 'createdAt', 'updatedAt'];

  private updateDataSource$ = new Subscription();

  constructor(
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Storefronts`);

    await this.fetchStorefronts();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  private async fetchStorefronts() {
    this.$storefronts = this.storefrontQuery.selectAll({ sortBy: 'title' });
    await this.storefrontService.find(null, { sort: 'title' });

    this.updateDataSource$ = this.$storefronts.subscribe((g) => (this.dataSource.data = g));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
