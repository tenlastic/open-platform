import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Build, BuildQuery, BuildService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class BuildsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Build>;

  public $builds: Observable<Build[]>;
  public dataSource = new MatTableDataSource<Build>();
  public displayedColumns: string[] = [
    'game',
    'platform',
    'version',
    'status',
    'publishedAt',
    'actions',
  ];

  private updateDataSource$ = new Subscription();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Builds`);
    this.fetchBuilds();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getPlatform(platform: string) {
    const map = {
      server64: 'Linux Server (x64)',
      windows64: 'Windows Client (x64)',
    };

    return map[platform];
  }

  public async publish(article: Build) {
    return this.buildService.update({ ...article, publishedAt: new Date() });
  }

  public showDeletePrompt(record: Build) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Build?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.buildService.delete(record._id);
        this.matSnackBar.open('Build deleted successfully.');
      }
    });
  }

  public async unpublish(article: Build) {
    return this.buildService.update({ ...article, publishedAt: null });
  }

  private async fetchBuilds() {
    const $builds = this.buildQuery.selectAll({
      filterBy: build => build.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$builds = this.buildQuery.populate($builds);

    await this.buildService.find({
      sort: '-createdAt',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$builds.subscribe(builds => (this.dataSource.data = builds));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
