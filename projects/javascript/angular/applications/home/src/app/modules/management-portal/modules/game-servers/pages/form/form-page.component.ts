import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { GameServer, GameServerService, Build, BuildService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
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
  public builds: Build[];
  public data: GameServer;
  public error: string;
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private gameServerService: GameServerService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.gameServerService.findOne(_id);
      }

      this.builds = await this.buildService.find({
        sort: '-publishedAt',
        where: { namespaceId: this.selectedNamespaceService.namespaceId },
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
      this.form.get('buildId').markAsTouched();
      this.form.get('description').markAsTouched();
      this.form.get('isPersistent').markAsTouched();
      this.form.get('isPreemptible').markAsTouched();
      this.form.get('name').markAsTouched();
      this.form.get('namespaceId').markAsTouched();

      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<GameServer> = {
      buildId: this.form.get('buildId').value,
      description: this.form.get('description').value,
      isPersistent: this.form.get('isPersistent').value,
      isPreemptible: this.form.get('isPreemptible').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
    };

    if (this.data._id) {
      if (
        this.form.get('buildId').dirty ||
        this.form.get('isPersistent').dirty ||
        this.form.get('isPreemptible').dirty ||
        this.form.get('metadata').dirty
      ) {
        const dialogRef = this.matDialog.open(PromptComponent, {
          data: {
            buttons: [
              { color: 'primary', label: 'No' },
              { color: 'accent', label: 'Yes' },
            ],
            message: `These changes may require the Game Server to be restarted. Is this OK?`,
          },
        });

        dialogRef.afterClosed().subscribe(async (result: string) => {
          if (result === 'Yes') {
            this.update(values);
          }
        });
      } else {
        this.update(values);
      }
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
      buildId: [this.data.buildId || this.builds.length > 0 ? this.builds[0]._id : null],
      description: [this.data.description],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      isPersistent: [this.data.isPersistent || false],
      isPreemptible: [this.data.isPreemptible || false],
      metadata: this.formBuilder.array(properties),
      name: [this.data.name, Validators.required],
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
