import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Queue, QueueService, Release, ReleaseService } from '@tenlastic/ng-http';

import {
  IdentityService,
  SelectedGameService,
  SelectedNamespaceService,
} from '../../../../../../core/services';
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
export class QueuesFormPageComponent implements OnInit {
  public data: Queue;
  public error: string;
  public form: FormGroup;
  public releases: Release[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private releaseService: ReleaseService,
    private router: Router,
    private selectedGameService: SelectedGameService,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.queueService.findOne(_id);
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
    const formArray = this.form.get('gameServerTemplate').get('metadata') as FormArray;

    formArray.push(property);
  }

  public removeProperty(index: number) {
    const formArray = this.form.get('gameServerTemplate').get('metadata') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('description').markAsTouched();
      this.form.get('name').markAsTouched();
      this.form.get('usersPerTeam').markAsTouched();
      this.form.get('teams').markAsTouched();

      this.form
        .get('gameServerTemplate')
        .get('description')
        .markAsTouched();
      this.form
        .get('gameServerTemplate')
        .get('isPreemptible')
        .markAsTouched();
      this.form
        .get('gameServerTemplate')
        .get('name')
        .markAsTouched();
      this.form
        .get('gameServerTemplate')
        .get('releaseId')
        .markAsTouched();

      return;
    }

    const metadata = this.form
      .get('gameServerTemplate')
      .get('metadata')
      .value.reduce((accumulator, property) => {
        accumulator[property.key] = this.getJsonFromProperty(property);
        return accumulator;
      }, {});

    const values: Partial<Queue> = {
      description: this.form.get('description').value,
      gameId: this.form.get('gameId').value,
      gameServerTemplate: {
        description: this.form.get('gameServerTemplate').get('description').value,
        isPreemptible: this.form.get('gameServerTemplate').get('isPreemptible').value,
        metadata,
        name: this.form.get('gameServerTemplate').get('name').value,
        releaseId: this.form.get('gameServerTemplate').get('releaseId').value,
      },
      name: this.form.get('name').value,
      usersPerTeam: this.form.get('usersPerTeam').value,
      teams: this.form.get('teams').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Queue>) {
    try {
      await this.queueService.create(data);
      this.matSnackBar.open('Queue created successfully.', null, { duration: SNACKBAR_DURATION });
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
    this.data = this.data || new Queue();

    const properties = [];
    if (this.data.gameServerTemplate && this.data.gameServerTemplate.metadata) {
      Object.entries(this.data.gameServerTemplate.metadata).forEach(([key, property]) => {
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

    let gameServerTemplateForm: FormGroup;
    if (this.data.gameServerTemplate) {
      gameServerTemplateForm = this.formBuilder.group({
        description: [this.data.gameServerTemplate.description],
        isPreemptible: [this.data.gameServerTemplate.isPreemptible || false],
        metadata: this.formBuilder.array(properties),
        name: [this.data.gameServerTemplate.name, Validators.required],
        releaseId: [this.data.gameServerTemplate.releaseId],
      });
    } else {
      gameServerTemplateForm = this.formBuilder.group({
        description: [''],
        isPreemptible: [false],
        metadata: this.formBuilder.array(properties),
        name: ['', Validators.required],
        releaseId: [this.releases.length > 0 ? this.releases[0]._id : null],
      });
    }

    this.form = this.formBuilder.group({
      description: [this.data.description],
      gameId: [this.selectedGameService.game._id],
      gameServerTemplate: gameServerTemplateForm,
      name: [this.data.name, Validators.required],
      usersPerTeam: [this.data.usersPerTeam || 1, Validators.required],
      teams: [this.data.teams || 2, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Queue>) {
    data._id = this.data._id;

    try {
      await this.queueService.update(data);
      this.matSnackBar.open('Queue updated successfully.', null, { duration: SNACKBAR_DURATION });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
