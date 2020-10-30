import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Collection, CollectionService } from '@tenlastic/ng-http';

import {
  CollectionFormService,
  IdentityService,
  SelectedNamespaceService,
} from '../../../../../../core/services';
import { TextAreaDialogComponent } from '../../../../../../shared/components';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class CollectionsFormPageComponent implements OnInit {
  public data: Collection;
  public error: string;
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private collectionFormService: CollectionFormService,
    private formBuilder: FormBuilder,
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
        this.data = await this.collectionService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public addProperty() {
    const property = this.collectionFormService.getDefaultPropertyFormGroup();
    const formArray = this.form.get('properties') as FormArray;

    formArray.push(property);
  }

  public addRole() {
    const role = this.collectionFormService.getDefaultRoleFormGroup();
    const formArray = this.form.get('roles') as FormArray;

    formArray.insert(formArray.length - 1, role);
  }

  public moveRoleDown(index: number) {
    const roles = this.form.get('roles') as FormArray;

    if (index >= roles.length - 2) {
      return;
    }

    const role = roles.at(index);

    roles.removeAt(index);
    roles.insert(index + 1, role);
  }

  public moveRoleUp(index: number) {
    if (index === 0) {
      return;
    }

    const roles = this.form.get('roles') as FormArray;
    const role = roles.at(index);

    roles.removeAt(index);
    roles.insert(index - 1, role);
  }

  public removeProperty(index: number) {
    const formArray = this.form.get('properties') as FormArray;
    formArray.removeAt(index);
  }

  public removeRole(index: number) {
    const formArray = this.form.get('roles') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('name').markAsTouched();

      return;
    }

    const jsonSchema = this.getJsonSchema();
    const permissions = this.getPermissions();

    const values: Partial<Collection> = {
      jsonSchema,
      name: this.form.get('name').value,
      namespaceId: this.selectedNamespaceService.namespaceId,
      permissions,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  public showImportCollectionPrompt() {
    const jsonSchema = this.getJsonSchema();
    const permissions = this.getPermissions();

    const dialogRef = this.matDialog.open(TextAreaDialogComponent, {
      data: {
        error: 'Invalid JSON.',
        label: 'Collection Schema',
        title: 'Import / Export Collection',
        validators: [this.jsonValidator],
        value: JSON.stringify({ jsonSchema, name: this.data.name, permissions }),
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) {
        return;
      }

      const data = JSON.parse(result);
      this.updateForm(data);

      this.matSnackBar.open('Collection imported successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
    });
  }

  private async create(data: Partial<Collection>) {
    try {
      await this.collectionService.create(data);
      this.matSnackBar.open('Collection created successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private getJsonSchema() {
    const properties = this.form.get('properties').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.collectionFormService.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const required = this.form
      .get('properties')
      .value.filter(p => p.required)
      .map(p => p.key);

    const jsonSchema = { properties, type: 'object' } as any;
    if (required.length > 0) {
      jsonSchema.required = required;
    }

    return jsonSchema;
  }

  private getPermissions() {
    const permissions = this.collectionFormService.getPermissionsJsonFromRoles(
      this.form.get('properties').value,
      this.form.getRawValue().roles,
    );

    const roles = this.form.getRawValue().roles.map(role => {
      return this.collectionFormService.getJsonFromRole(role, this.form.get('properties').value);
    });

    return { ...permissions, roles };
  }

  private jsonValidator(control: AbstractControl): ValidationErrors | null {
    try {
      JSON.parse(control.value);
    } catch (e) {
      return { jsonInvalid: true };
    }

    return null;
  }

  private setupForm(): void {
    this.data = this.data || new Collection();

    const properties = [];
    if (this.data.jsonSchema && this.data.jsonSchema.properties) {
      Object.entries(this.data.jsonSchema.properties).forEach(([key, property]) => {
        const required =
          this.data.jsonSchema.required && this.data.jsonSchema.required.includes(key);

        const formGroup = this.collectionFormService.getFormGroupFromProperty(
          key,
          property,
          required,
        );
        properties.push(formGroup);
      });
    }

    if (properties.length === 0) {
      properties.push(this.collectionFormService.getDefaultPropertyFormGroup());
    }

    const roles = [];
    if (
      this.data.permissions &&
      this.data.permissions.roles &&
      this.data.permissions.roles.length > 0
    ) {
      this.data.permissions.roles.forEach(role => {
        const formGroup = this.collectionFormService.getFormGroupFromRole(
          this.data.permissions,
          role,
        );
        roles.push(formGroup);
      });
    }

    if (roles.length === 0) {
      const role = this.collectionFormService.getDefaultRoleFormGroup();
      role.patchValue({ key: 'default' });

      roles.push(role);
    }

    this.form = this.formBuilder.group({
      name: [this.data.name, Validators.required],
      properties: this.formBuilder.array(properties),
      roles: this.formBuilder.array(roles),
    });

    const formArray = this.form.get('roles') as FormArray;
    const defaultRole = formArray.at(formArray.length - 1);
    defaultRole.get('key').disable();

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Collection>) {
    data._id = this.data._id;

    try {
      await this.collectionService.update(data);
      this.matSnackBar.open('Collection updated successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private updateForm(data: Collection): void {
    const properties = [];
    if (data.jsonSchema && data.jsonSchema.properties) {
      Object.entries(data.jsonSchema.properties).forEach(([key, property]) => {
        const required = data.jsonSchema.required && data.jsonSchema.required.includes(key);

        const formGroup = this.collectionFormService.getFormGroupFromProperty(
          key,
          property,
          required,
        );
        properties.push(formGroup);
      });
    }

    if (properties.length === 0) {
      properties.push(this.collectionFormService.getDefaultPropertyFormGroup());
    }

    const roles = [];
    if (data.permissions && data.permissions.roles && data.permissions.roles.length > 0) {
      data.permissions.roles.forEach(role => {
        const formGroup = this.collectionFormService.getFormGroupFromRole(data.permissions, role);
        roles.push(formGroup);
      });
    }

    if (roles.length === 0) {
      const role = this.collectionFormService.getDefaultRoleFormGroup();
      role.patchValue({ key: 'default' });

      roles.push(role);
    }

    this.form = this.formBuilder.group({
      name: [data.name, Validators.required],
      properties: this.formBuilder.array(properties),
      roles: this.formBuilder.array(roles),
    });

    const formArray = this.form.get('roles') as FormArray;
    const defaultRole = formArray.at(formArray.length - 1);
    defaultRole.get('key').disable();

    this.form.valueChanges.subscribe(() => (this.error = null));
  }
}
