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
import { RefreshToken, RefreshTokenQuery, RefreshTokenService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RefreshTokensListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<RefreshToken>;

  public $refreshTokens: Observable<RefreshToken[]>;
  public dataSource = new MatTableDataSource<RefreshToken>();
  public displayedColumns: string[] = ['_id', 'createdAt', 'updatedAt', 'expiresAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private refreshTokenQuery: RefreshTokenQuery,
    private refreshTokenService: RefreshTokenService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Refresh Tokens`);

    await this.fetchRefreshTokens();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt(record: RefreshToken) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Refresh Token?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.refreshTokenService.delete(record._id);
        this.deleteRefreshToken(record);

        this.matSnackBar.open('Refresh Token deleted successfully.');
      }
    });
  }

  private async fetchRefreshTokens() {
    this.$refreshTokens = this.refreshTokenQuery.selectAll();

    await this.refreshTokenService.find({});

    this.updateDataSource$ = this.$refreshTokens.subscribe(
      refreshTokens => (this.dataSource.data = refreshTokens),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteRefreshToken(record: RefreshToken) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
