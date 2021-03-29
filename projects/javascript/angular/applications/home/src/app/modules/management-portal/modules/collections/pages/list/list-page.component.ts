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
import { ActivatedRoute } from '@angular/router';
import { Collection, CollectionService, DatabaseService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class CollectionsListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Collection>;

  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public dataSource: MatTableDataSource<Collection>;
  public displayedColumns: string[] = ['name', 'createdAt', 'updatedAt', 'actions'];

  private databaseId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.databaseId = params.get('databaseId');

      this.titleService.setTitle(`${TITLE} | Collections`);
      this.fetchCollections();

      const database = await this.databaseService.findOne(this.databaseId);
      this.breadcrumbs = [
        { label: 'Databases', link: '../../' },
        { label: database.name, link: '../' },
        { label: 'Collections' },
      ];
    });
  }

  public showDeletePrompt(record: Collection) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Collection?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.collectionService.delete(this.databaseId, record._id);
        this.deleteCollection(record);

        this.matSnackBar.open('Collection deleted successfully.');
      }
    });
  }

  private async fetchCollections() {
    const records = await this.collectionService.find(this.databaseId, {
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.dataSource = new MatTableDataSource<Collection>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteCollection(record: Collection) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
