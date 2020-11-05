import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Build, BuildService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { SNACKBAR_DURATION, TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class BuildsListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Build>;

  public dataSource: MatTableDataSource<Build>;
  public displayedColumns: string[] = [
    'version',
    'publishedAt',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private buildService: BuildService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Builds`);
    this.fetchBuilds();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public async publish(article: Build) {
    const result = await this.buildService.update({
      ...article,
      publishedAt: new Date(),
    });
    article.publishedAt = result.publishedAt;
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
        this.deleteBuild(record);

        this.matSnackBar.open('Build deleted successfully.', null, {
          duration: SNACKBAR_DURATION,
        });
      }
    });
  }

  public async unpublish(article: Build) {
    const result = await this.buildService.update({
      ...article,
      publishedAt: null,
    });
    article.publishedAt = result.publishedAt;
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchBuilds() {
    const records = await this.buildService.find({
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.dataSource = new MatTableDataSource<Build>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteBuild(record: Build) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
