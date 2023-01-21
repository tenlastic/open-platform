import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StorefrontModel, StorefrontQuery, StorefrontService } from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class ListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public $storefronts: Observable<StorefrontModel[]>;
  public dataSource = new MatTableDataSource<StorefrontModel>();
  public displayedColumns = ['title', 'subtitle', 'createdAt', 'updatedAt'];

  private updateDataSource$ = new Subscription();

  constructor(
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    await this.fetchStorefronts();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  private async fetchStorefronts() {
    this.$storefronts = this.storefrontQuery.selectAll({ sortBy: 'title' });
    await this.storefrontService.find(null, { sort: 'title' });

    this.updateDataSource$ = this.$storefronts.subscribe((g) => (this.dataSource.data = g));
  }
}
