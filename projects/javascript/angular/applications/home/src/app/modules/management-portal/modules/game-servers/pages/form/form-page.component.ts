import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { GameServer, GameServerService, Release, ReleaseService } from '@tenlastic/ng-http';

import { IdentityService, SelectedGameService } from '../../../../../../core/services';
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
  public releases: Release[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameServerService: GameServerService,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private releaseService: ReleaseService,
    private router: Router,
    private selectedGameService: SelectedGameService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.gameServerService.findOne(_id);
      }

      const gameId = this.selectedGameService.game && this.selectedGameService.game._id;
      this.releases = await this.releaseService.find({
        sort: '-publishedAt',
        where: { gameId },
      });

      this.setupForm();
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
      this.form.get('isPersistent').markAsTouched();
      this.form.get('isPreemptible').markAsTouched();
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
      isPersistent: this.form.get('isPersistent').value,
      isPreemptible: this.form.get('isPreemptible').value,
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

    this.form = this.formBuilder.group({
      description: [this.data.description],
      gameId: [
        this.selectedGameService.game ? this.selectedGameService.game._id : null,
        Validators.required,
      ],
      isPersistent: [this.data.isPersistent || false],
      isPreemptible: [this.data.isPreemptible || false],
      metadata: this.formBuilder.array(properties),
      name: [this.data.name, Validators.required],
      releaseId: [this.data.releaseId || this.releases.length > 0 ? this.releases[0]._id : null],
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
