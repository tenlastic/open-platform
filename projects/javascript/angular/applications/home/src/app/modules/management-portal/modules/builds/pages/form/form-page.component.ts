import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Build, BuildTask, BuildService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class BuildsFormPageComponent implements OnInit {
  public data: Build;
  public error: string;
  public form: FormGroup;
  public tasks: BuildTask[];
  public platforms = [
    { label: 'Windows Client (x64)', value: 'windows64' },
    { label: 'Linux Server (x64)', value: 'server64' },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private buildService: BuildService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.buildService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('entrypoint').markAsTouched();
      this.form.get('namespaceId').markAsTouched();
      this.form.get('version').markAsTouched();

      return;
    }

    const values: Partial<Build> = {
      entrypoint: this.form.get('entrypoint').value,
      namespaceId: this.form.get('namespaceId').value,
      version: this.form.get('version').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Build>) {
    try {
      const result = await this.buildService.create(data);
      this.matSnackBar.open('Build created successfully.', null, { duration: SNACKBAR_DURATION });
      this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That version is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Build();

    this.form = this.formBuilder.group({
      entrypoint: [this.data.entrypoint, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      version: [this.data.version, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Build>) {
    data._id = this.data._id;

    try {
      await this.buildService.update(data);
      this.matSnackBar.open('Build updated successfully.', null, { duration: SNACKBAR_DURATION });
    } catch (e) {
      this.error = 'That version is already taken.';
    }
  }
}
