import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  Collection,
  CollectionQuery,
  CollectionService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class CollectionsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Collection>;

  public dataSource = new MatTableDataSource<Collection>();
  public displayedColumns: string[] = ['name', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $collections: Observable<Collection[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.titleService.setTitle(`${TITLE} | Collections`);

      const roles = [IAuthorization.AuthorizationRole.CollectionsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchCollections(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
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

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.collectionService.delete(record._id);
        this.matSnackBar.open('Collection deleted successfully.');
      }
    });
  }

  private async fetchCollections(params: Params) {
    this.$collections = this.collectionQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === params.namespaceId,
    });

    await this.collectionService.find({
      sort: 'name',
      where: { namespaceId: params.namespaceId },
    });

    this.updateDataSource$ = this.$collections.subscribe(
      (collections) => (this.dataSource.data = collections),
    );

    this.dataSource.filterPredicate = (data: Collection, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
