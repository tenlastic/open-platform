import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Database, DatabaseService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class DatabasesFormPageComponent implements OnInit {
  public data: Database;
  public error: string;
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const name = params.get('name');

      if (name !== 'new') {
        this.data = await this.databaseService.findOne(name);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('name').markAsTouched();

      return;
    }

    const values: Partial<Database> = {
      name: this.form.get('name').value,
      namespaceId: this.selectedNamespaceService.namespaceId,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Database>) {
    try {
      await this.databaseService.create(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Database();

    this.form = this.formBuilder.group({
      name: [this.data.name, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Database>) {
    data._id = this.data._id;

    try {
      await this.databaseService.update(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
