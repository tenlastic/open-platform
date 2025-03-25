import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  GameServerTemplateQuery,
  GameServerTemplateService,
  IAuthorization,
  MatchModel,
  MatchService,
  QueueQuery,
  QueueService,
} from '@tenlastic/http';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class MatchesListPageComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<MatchModel>();
  public get displayedColumns() {
    return this.params.queueId
      ? ['gameServerTemplate', 'teams', 'users', 'startedAt', 'finishedAt', 'actions']
      : ['gameServerTemplate', 'queue', 'teams', 'users', 'startedAt', 'finishedAt', 'actions'];
  }
  public hasWriteAuthorization: boolean;
  public message: string;
  public get pageIndex() {
    return this.paginator?.pageIndex || 0;
  }
  public get pageSize() {
    return this.paginator?.pageSize || 10;
  }

  private count = 0;
  private date = new Date(0);
  private params: Params;
  private timeout: NodeJS.Timeout;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private gameServerTemplateQuery: GameServerTemplateQuery,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matchService: MatchService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      const roles = [IAuthorization.Role.MatchesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchMatches();

      this.message = null;
    });

    this.matchService.emitter.on('create', (a) => {
      if (!this.match(a)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= a.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= a.createdAt) {
        return;
      }

      this.fetchMatches(true);
    });

    this.matchService.emitter.on('delete', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchMatches(true);
    });

    this.matchService.emitter.on('update', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(a)) {
        this.dataSource.data[index] = a;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchMatches(true);
      }
    });
  }

  public ngAfterViewInit() {
    this.paginator.length = this.count;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public async fetchMatches(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchMatches(), threshold - date.getTime());
      return;
    }

    this.date = date;

    let where: any = {};
    where.namespaceId = this.params.namespaceId;
    if (this.params.queueId) {
      where.queueId = this.params.queueId;
    }

    this.dataSource.data = await this.matchService.find(this.params.namespaceId, {
      limit: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sort: `-createdAt`,
      where,
    });

    this.count = await this.matchService.count(this.params.namespaceId, {
      where,
    });

    if (this.paginator) {
      this.paginator.length = this.count;

      if (this.paginator.length < this.pageIndex * this.pageSize) {
        this.paginator.firstPage();
      }
    }

    const gameServerTemplateIds = this.dataSource.data
      .map((d) => d.gameServerTemplateId)
      .filter((ui) => !this.gameServerTemplateQuery.hasEntity(ui));

    if (gameServerTemplateIds.length > 0) {
      await this.gameServerTemplateService.find(this.params.namespaceId, {
        where: { _id: { $in: gameServerTemplateIds } },
      });
    }

    const queueIds = this.dataSource.data
      .map((d) => d.queueId)
      .filter((qi) => qi && !this.queueQuery.hasEntity(qi));

    if (queueIds.length > 0) {
      await this.queueService.find(this.params.namespaceId, { where: { _id: { $in: queueIds } } });
    }
  }

  public getGameServerTemplate(_id: string) {
    return this.gameServerTemplateQuery.getEntity(_id);
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public getUserIds(match: MatchModel) {
    return match.teams.reduce((previous, current) => [...previous, ...current.userIds], []);
  }

  public showDeletePrompt($event: Event, record: MatchModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Match?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.matchService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Match deleted successfully.');
      }
    });
  }

  private match(match: MatchModel) {
    if (this.params.namespaceId !== match.namespaceId) {
      return false;
    }

    return true;
  }
}
