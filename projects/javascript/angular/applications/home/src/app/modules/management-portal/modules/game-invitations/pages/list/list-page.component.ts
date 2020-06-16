import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  Game,
  GameService,
  GameInvitation,
  GameInvitationQuery,
  GameInvitationService,
  GameQuery,
  UserQuery,
  UserService,
} from '@tenlastic/ng-http';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameInvitationsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameInvitation>;

  public $gameInvitations: Observable<GameInvitation[]>;
  public dataSource = new MatTableDataSource<GameInvitation>();
  public displayedColumns: string[] = ['game', 'toUser', 'createdAt', 'actions'];
  public game: Game;
  public gameIds: string[] = [];
  public search = '';

  private fetchGameInvitationGame$ = new Subscription();
  private fetchGameInvitationToUser$ = new Subscription();
  private updateDataSource$ = new Subscription();
  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private gameInvitationQuery: GameInvitationQuery,
    private gameInvitationService: GameInvitationService,
    private gameQuery: GameQuery,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const gameSlug = params.get('gameSlug');
      if (gameSlug) {
        this.game = await this.gameService.findOne(gameSlug);
      } else {
        const { namespaceId } = this.selectedNamespaceService;
        const games = await this.gameService.find({ where: { namespaceId } });

        this.gameIds = games.map(g => g._id);
      }

      this.titleService.setTitle(`${TITLE} | Game Invitations`);
      this.fetchGameInvitations();

      this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
    });
  }

  public ngOnDestroy() {
    this.fetchGameInvitationGame$.unsubscribe();
    this.fetchGameInvitationToUser$.unsubscribe();
    this.updateDataSource$.unsubscribe();
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public showDeletePrompt(record: GameInvitation) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Invitation?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.gameInvitationService.delete(record._id);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchGameInvitations() {
    const $gameInvitations = this.gameInvitationQuery.selectAll();
    this.$gameInvitations = this.gameInvitationQuery.populate($gameInvitations);

    const where = this.game ? { gameId: this.game._id } : { gameId: { $in: this.gameIds } };
    await this.gameInvitationService.find({ sort: '-createdAt', where });

    this.fetchGameInvitationGame$ = this.$gameInvitations.subscribe(gameInvitations => {
      const missingGameIds = gameInvitations
        .map(f => f.gameId)
        .filter(gameId => !this.gameQuery.hasEntity(gameId));

      if (missingGameIds.length > 0) {
        this.gameService.find({ where: { _id: { $in: missingGameIds } } });
      }
    });
    this.fetchGameInvitationToUser$ = this.$gameInvitations.subscribe(gameInvitations => {
      const missingUserIds = gameInvitations
        .map(f => f.toUserId)
        .filter(toUserId => !this.userQuery.hasEntity(toUserId));

      if (missingUserIds.length > 0) {
        this.userService.find({ where: { _id: { $in: missingUserIds } } });
      }
    });
    this.updateDataSource$ = this.$gameInvitations.subscribe(
      gameInvitations => (this.dataSource.data = gameInvitations),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
