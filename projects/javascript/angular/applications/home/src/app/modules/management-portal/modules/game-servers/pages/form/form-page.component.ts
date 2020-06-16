import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Game,
  GameServer,
  GameServerService,
  GameService,
  Release,
  ReleaseService,
} from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

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
    private matSnackBar: MatSnackBar,
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

      this.getReleases(this.game && this.game._id);

      this.setupForm();
      this.form.get('gameId').valueChanges.subscribe(gameId => this.getReleases(gameId));
    });
  }

  public addProperty() {
    const property = this.getDefaultPropertyFormGroup();
    const formArray = this.form.get('metadata') as FormArray;

    formArray.push(property);
  }

  public removeProperty(index: number) {
    const formArray = this.form.get('metadata') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('description').markAsTouched();
      this.form.get('gameId').markAsTouched();
      this.form.get('name').markAsTouched();
      this.form.get('releaseId').markAsTouched();

      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<GameServer> = {
      description: this.form.get('description').value,
      gameId: this.form.get('gameId').value,
      metadata,
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
      this.matSnackBar.open('Game Server created successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private getDefaultPropertyFormGroup() {
    return this.formBuilder.group({
      key: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
      value: false,
      type: 'boolean',
    });
  }

  private getJsonFromProperty(property: PropertyFormGroup): any {
    switch (property.type) {
      case 'boolean':
        return property.value || false;

      case 'number':
        return isNaN(parseFloat(property.value)) ? 0 : parseFloat(property.value);

      default:
        return property.value || '';
    }
  }

  private async getReleases(gameId: string) {
    if (gameId) {
      this.releases = await this.releaseService.find({
        sort: '-publishedAt',
        where: { gameId },
      });
    } else {
      this.releases = [];
    }

    if (this.form) {
      this.form.get('releaseId').setValue(this.releases.length > 0 ? this.releases[0]._id : null);
    }
  }

  private setupForm(): void {
    this.data = this.data || new GameServer();

    const properties = [];
    if (this.data.metadata) {
      Object.entries(this.data.metadata).forEach(([key, property]) => {
        let type = 'boolean';
        if (typeof property === 'string' || property instanceof String) {
          type = 'string';
        } else if (typeof property === 'number') {
          type = 'number';
        }

        const formGroup = this.formBuilder.group({
          key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
          value: property,
          type,
        });
        properties.push(formGroup);
      });
    }

    if (properties.length === 0) {
      properties.push(this.getDefaultPropertyFormGroup());
    }

    this.form = this.formBuilder.group({
      description: [this.data.description],
      gameId: [this.game ? this.game._id : null, Validators.required],
      metadata: this.formBuilder.array(properties),
      name: [this.data.name, Validators.required],
      releaseId: [this.data.releaseId],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<GameServer>) {
    data._id = this.data._id;

    try {
      await this.gameServerService.update(data);
      this.matSnackBar.open('Game Server updated successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
