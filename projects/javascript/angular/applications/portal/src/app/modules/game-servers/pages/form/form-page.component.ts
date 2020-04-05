import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
  Game,
  GameServer,
  GameServerService,
  GameService,
  Release,
  ReleaseService,
} from '@tenlastic/ng-http';

import { SelectedNamespaceService } from '../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GameServersFormPageComponent implements OnInit {
  public data: GameServer;
  public error: string;
  public form: FormGroup;
  public games: Game[];
  public releases: Release[];

  private game: Game;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameServerService: GameServerService,
    private gameService: GameService,
    public identityService: IdentityService,
    private releaseService: ReleaseService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.gameServerService.findOne(_id);
      }

      const { namespaceId } = this.selectedNamespaceService;
      this.games = await this.gameService.find({ where: { namespaceId } });

      const gameSlug = params.get('gameSlug');
      if (gameSlug) {
        this.game = this.games.find(g => g.slug === gameSlug);
      } else if (this.data) {
        this.game = this.games.find(g => g._id === this.data.gameId);
      }

      if (this.game) {
        this.releases = await this.releaseService.find({ where: { gameId: this.game._id } });
      }

      this.setupForm();

      this.form.get('gameId').valueChanges.subscribe(async v => {
        this.form.get('releaseId').setValue(null);
        this.releases = await this.releaseService.find({ where: { gameId: v } });
      });
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('description').markAsTouched();
      this.form.get('gameId').markAsTouched();
      this.form.get('name').markAsTouched();
      this.form.get('releaseId').markAsTouched();

      return;
    }

    const values: Partial<GameServer> = {
      description: this.form.get('description').value,
      gameId: this.form.get('gameId').value,
      name: this.form.get('name').value,
      releaseId: this.form.get('releaseId').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<GameServer>) {
    try {
      await this.gameServerService.create(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new GameServer();

    this.form = this.formBuilder.group({
      description: [this.data.description],
      gameId: [this.game ? this.game._id : null, Validators.required],
      name: [this.data.name, Validators.required],
      releaseId: [this.data.releaseId],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<GameServer>) {
    data._id = this.data._id;

    try {
      await this.gameServerService.update(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
