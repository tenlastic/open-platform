import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Build, BuildService, IGameServer, Queue, QueueService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

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
  public builds: Build[];
  public cpus = IGameServer.Cpu;
  public data: Queue;
  public errors: string[] = [];
  public form: FormGroup;
  public memories = IGameServer.Memory;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.queueService.findOne(_id);
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
    const formArray = this.form.get('gameServerTemplate').get('metadata') as FormArray;

    formArray.push(property);
  }

  public removeProperty(index: number) {
    const formArray = this.form.get('gameServerTemplate').get('metadata') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
      gameServerTemplate: {
        buildId: this.form.get('gameServerTemplate').get('buildId').value,
        cpu: this.form.get('gameServerTemplate').get('cpu').value,
        isPreemptible: this.form.get('gameServerTemplate').get('isPreemptible').value,
        memory: this.form.get('gameServerTemplate').get('memory').value,
        metadata,
      },
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      usersPerTeam: this.form.get('usersPerTeam').value,
      teams: this.form.get('teams').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { name: 'Name' });
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map(e => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map(p => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
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
        buildId: [this.data.gameServerTemplate.buildId, Validators.required],
        cpu: [this.data.gameServerTemplate.cpu || this.cpus[0]],
        isPreemptible: [this.data.gameServerTemplate.isPreemptible || false],
        memory: [this.data.gameServerTemplate.memory || this.memories[0]],
        metadata: this.formBuilder.array(properties),
      });
    } else {
      gameServerTemplateForm = this.formBuilder.group({
        buildId: [this.builds.length > 0 ? this.builds[0]._id : null, Validators.required],
        cpu: [this.cpus[0]],
        isPreemptible: [false],
        memory: [this.memories[0]],
        metadata: this.formBuilder.array(properties),
      });
    }

    this.form = this.formBuilder.group({
      description: [this.data.description],
      gameServerTemplate: gameServerTemplateForm,
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId],
      usersPerTeam: [this.data.usersPerTeam || 1, Validators.required],
      teams: [this.data.teams || 2, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Queue>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.queueService.update(data);
    } else {
      await this.queueService.create(data);
    }

    this.matSnackBar.open('Queue saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
