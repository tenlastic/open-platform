import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import {
  ArticleService,
  CollectionService,
  DatabaseService,
  GameServerService,
  GameService,
  NamespaceService,
  RecordService,
  RefreshTokenService,
  ReleaseService,
  UserService,
} from '@tenlastic/ng-http';

import { SNACKBAR_DURATION } from '../../../shared/constants';

@Injectable()
export class CrudSnackbarService {
  constructor(
    private articleService: ArticleService,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private gameServerService: GameServerService,
    private gameService: GameService,
    private namespaceService: NamespaceService,
    private recordService: RecordService,
    private refreshTokenService: RefreshTokenService,
    private releaseService: ReleaseService,
    private snackBar: MatSnackBar,
    private userService: UserService,
  ) {
    this.articleService.onCreate.subscribe(() => this.createMessage('Article'));
    this.articleService.onDelete.subscribe(() => this.deleteMessage('Article'));
    this.articleService.onUpdate.subscribe(() => this.updateMessage('Article'));

    this.collectionService.onCreate.subscribe(() => this.createMessage('Collection'));
    this.collectionService.onDelete.subscribe(() => this.deleteMessage('Collection'));
    this.collectionService.onUpdate.subscribe(() => this.updateMessage('Collection'));

    this.databaseService.onCreate.subscribe(() => this.createMessage('Database'));
    this.databaseService.onDelete.subscribe(() => this.deleteMessage('Database'));
    this.databaseService.onUpdate.subscribe(() => this.updateMessage('Database'));

    this.gameServerService.onCreate.subscribe(() => this.createMessage('Game Server'));
    this.gameServerService.onDelete.subscribe(() => this.deleteMessage('Game Server'));
    this.gameServerService.onUpdate.subscribe(() => this.updateMessage('Game Server'));

    this.gameService.onCreate.subscribe(() => this.createMessage('Game'));
    this.gameService.onDelete.subscribe(() => this.deleteMessage('Game'));
    this.gameService.onUpdate.subscribe(() => this.updateMessage('Game'));

    this.namespaceService.onCreate.subscribe(() => this.createMessage('Namespace'));
    this.namespaceService.onDelete.subscribe(() => this.deleteMessage('Namespace'));
    this.namespaceService.onUpdate.subscribe(() => this.updateMessage('Namespace'));

    this.recordService.onCreate.subscribe(() => this.createMessage('Record'));
    this.recordService.onDelete.subscribe(() => this.deleteMessage('Record'));
    this.recordService.onUpdate.subscribe(() => this.updateMessage('Record'));

    this.refreshTokenService.onCreate.subscribe(() => this.createMessage('Refresh Token'));
    this.refreshTokenService.onDelete.subscribe(() => this.deleteMessage('Refresh Token'));
    this.refreshTokenService.onUpdate.subscribe(() => this.updateMessage('Refresh Token'));

    this.releaseService.onCreate.subscribe(() => this.createMessage('Release'));
    this.releaseService.onDelete.subscribe(() => this.deleteMessage('Release'));
    this.releaseService.onUpdate.subscribe(() => this.updateMessage('Release'));

    this.userService.onCreate.subscribe(() => this.createMessage('User'));
    this.userService.onDelete.subscribe(() => this.deleteMessage('User'));
    this.userService.onUpdate.subscribe(() => this.updateMessage('User'));
  }

  private createMessage(name: string) {
    this.showSnackBar(`${name} created successfully.`);
  }

  private deleteMessage(name: string) {
    this.showSnackBar(`${name} deleted successfully.`);
  }

  private updateMessage(name: string) {
    this.showSnackBar(`${name} updated successfully.`);
  }

  public showSnackBar(message: string) {
    this.snackBar.open(message, null, {
      duration: SNACKBAR_DURATION,
    });
  }
}
