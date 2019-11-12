import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { CollectionService, DatabaseService } from '@app/core/http';
import { IdentityService } from '@app/core/services';
import { PromptComponent } from '@app/shared/components';
import { TITLE } from '@app/shared/constants';
import { Collection, Database } from '@app/shared/models';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class CollectionsListPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Collection>;

  public dataSource: MatTableDataSource<Collection>;
  public displayedColumns: string[] = ['name', 'createdAt', 'updatedAt', 'actions'];
  public search = '';

  private database: Database;
  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const databaseName = params.get('databaseName');
      this.database = await this.databaseService.findOne(databaseName);

      this.titleService.setTitle(`${TITLE} | Collections`);
      this.fetchCollections();

      this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
    });
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public showDeletePrompt(record: Collection) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [{ background: 'accent', label: 'No' }, { color: 'white', label: 'Yes' }],
        message: `Are you sure you want to delete this Collection?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.collectionService.delete(this.database.name, record.name);
        this.deleteCollection(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchCollections() {
    const records = await this.collectionService.find(this.database.name, { sort: 'name' });

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
