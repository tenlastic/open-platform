import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { Game, GameService, Release, ReleaseService } from '@tenlastic/ng-http';

import { SelectedNamespaceService } from '../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class ReleasesFormPageComponent implements OnInit {
  public data: Release;
  public error: string;
  public form: FormGroup;
  public games: Game[];
  public platforms = [
    { label: 'Windows (x64)', value: 'windows64' },
    { label: 'Windows (x32)', value: 'windows32' },
  ];

  private game: Game;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameService: GameService,
    public identityService: IdentityService,
    private releaseService: ReleaseService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const { namespaceId } = this.selectedNamespaceService;
      this.games = await this.gameService.find({ where: { namespaceId } });

      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.releaseService.findOne(_id);
      }

      const gameSlug = params.get('gameSlug');
      if (gameSlug) {
        this.game = this.games.find(g => g.slug === gameSlug);
      } else if (this.data) {
        this.game = this.games.find(g => g._id === this.data.gameId);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('entrypoint').markAsTouched();
      this.form.get('gameId').markAsTouched();
      this.form.get('version').markAsTouched();

      return;
    }

    const values: Partial<Release> = {
      entrypoint: this.form.get('entrypoint').value,
      gameId: this.form.get('gameId').value,
      version: this.form.get('version').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Release>) {
    try {
      await this.releaseService.create(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That slug is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Release();

    this.form = this.formBuilder.group({
      entrypoint: [this.data.entrypoint, Validators.required],
      gameId: [this.game ? this.game._id : null, Validators.required],
      version: [this.data.version, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Release>) {
    data._id = this.data._id;

    try {
      await this.releaseService.update(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That slug is already taken.';
    }
  }
}
