import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Release, ReleaseTask, ReleaseService } from '@tenlastic/ng-http';

import { IdentityService, SelectedGameService } from '../../../../../../core/services';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class ReleasesFormPageComponent implements OnInit {
  public data: Release;
  public error: string;
  public form: FormGroup;
  public tasks: ReleaseTask[];
  public platforms = [
    { label: 'Windows Client (x64)', value: 'windows64' },
    { label: 'Linux Server (x64)', value: 'server64' },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
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
        this.data = await this.releaseService.findOne(_id);
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
      const result = await this.releaseService.create(data);
      this.matSnackBar.open('Release created successfully.', null, { duration: SNACKBAR_DURATION });
      this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That version is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Release();

    this.form = this.formBuilder.group({
      entrypoint: [this.data.entrypoint, Validators.required],
      gameId: [
        this.selectedGameService.game ? this.selectedGameService.game._id : null,
        Validators.required,
      ],
      version: [this.data.version, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Release>) {
    data._id = this.data._id;

    try {
      await this.releaseService.update(data);
      this.matSnackBar.open('Release updated successfully.', null, { duration: SNACKBAR_DURATION });
    } catch (e) {
      this.error = 'That version is already taken.';
    }
  }
}
