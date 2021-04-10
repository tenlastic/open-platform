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
import { ActivatedRoute } from '@angular/router';
import {
  Collection,
  CollectionQuery,
  CollectionService,
  DatabaseService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { environment } from '../../../../../../../environments/environment';
import {
  IdentityService,
  SelectedNamespaceService,
  Socket,
  SocketService,
} from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class CollectionsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Collection>;

  public $collections: Observable<Collection[]>;
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public dataSource = new MatTableDataSource<Collection>();
  public displayedColumns: string[] = ['name', 'createdAt', 'updatedAt', 'actions'];

  private updateDataSource$ = new Subscription();
  private get databaseId() {
    return this.activatedRoute.snapshot.paramMap.get('databaseId');
  }
  private socket: Socket;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Collections`);

    const url = `${environment.databaseApiBaseUrl}/${this.databaseId}/web-sockets`;
    this.socket = this.socketService.connect(url);
    this.socket.addEventListener('open', () =>
      this.socket.subscribe('collections', Collection, this.collectionService),
    );

    await this.fetchCollections();

    const database = await this.databaseService.findOne(this.databaseId);
    this.breadcrumbs = [
      { label: 'Databases', link: '../../../' },
      { label: database.name, link: '../../' },
      { label: 'Collections' },
    ];
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
    this.socket.close();
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
        this.matSnackBar.open('Collection deleted successfully.');
      }
    });
  }

  private async fetchCollections() {
    this.$collections = this.collectionQuery.selectAll({
      filterBy: gs =>
        gs.databaseId === this.databaseId &&
        gs.namespaceId === this.selectedNamespaceService.namespaceId,
    });

    await this.collectionService.find(this.databaseId, {
      sort: 'name',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$collections.subscribe(
      collections => (this.dataSource.data = collections),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
