import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  Storefront,
  StorefrontQuery,
  StorefrontService,
  StorefrontStore,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'storefronts-page.component.html',
  styleUrls: ['./storefronts-page.component.scss'],
})
export class StorefrontsPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Storefront>;

  public get $activeStorefront() {
    return this.storefrontQuery.selectActive() as Observable<Storefront>;
  }
  public $storefronts: Observable<Storefront[]>;
  public dataSource = new MatTableDataSource<Storefront>();
  public displayedColumns = ['title', 'subtitle', 'createdAt', 'updatedAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    private router: Router,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private storefrontStore: StorefrontStore,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Storefronts`);

    await this.fetchStorefronts();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public select(record: Storefront) {
    localStorage.setItem('storefronts._id', record._id);
    this.storefrontStore.setActive(record._id);
    this.router.navigate(['storefronts', record._id]);
  }

  private async fetchStorefronts() {
    this.$storefronts = this.storefrontQuery.selectAll({ sortBy: 'title' });
    const storefronts = await this.storefrontService.find({ sort: 'title' });

    // If only one Storefront is available, automatically select it.
    if (storefronts.length === 1) {
      this.select(storefronts[0]);
    }

    // If a Storefront was selected during a previous session, restore that selection.
    const _id = localStorage.getItem('storefronts._id');
    const storefront = storefronts.find((g) => g._id === _id);
    if (storefront && this.storefrontQuery.getActiveId() !== storefront._id) {
      this.select(storefront);
    }

    this.updateDataSource$ = this.$storefronts.subscribe((g) => (this.dataSource.data = g));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
