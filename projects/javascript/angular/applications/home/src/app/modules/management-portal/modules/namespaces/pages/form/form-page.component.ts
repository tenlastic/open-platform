import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { INamespace, Namespace, NamespaceService, UserService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../../../core/services';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class NamespacesFormPageComponent implements OnInit {
  public data: Namespace;
  public error: string;
  public form: FormGroup;
  public get keys(): FormArray {
    return this.form.get('keys') as FormArray;
  }
  public roles: any[];
  public get users(): FormArray {
    return this.form.get('users') as FormArray;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private router: Router,
    private snackBar: MatSnackBar,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');

      if (_id !== 'new') {
        this.data = await this.namespaceService.findOne(_id);
      }

      this.roles = Object.keys(INamespace.Role).map(key => ({
        label: key.replace(/([A-Z])/g, ' $1').trim(),
        value: INamespace.Role[key],
      }));

      this.setupForm();
    });
  }

  public addKey() {
    const key = this.getKey();
    const formArray = this.form.get('keys') as FormArray;

    formArray.push(key);
  }

  public addUser() {
    const user = this.getUser();
    const formArray = this.form.get('users') as FormArray;

    formArray.push(user);
  }

  public copyToClipboard(index: number) {
    const keys = this.form.get('keys') as FormArray;

    // Create dummy element to copy.
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.opacity = '0';
    selBox.style.top = '0';
    selBox.value = keys.at(index).get('value').value;

    // Copy contents of created element.
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    // Let the user know the copy was successful.
    this.snackBar.open('API key copied to clipboard.', null, {
      duration: SNACKBAR_DURATION,
    });
  }

  public getKey() {
    const getRandomCharacter = () =>
      Math.random()
        .toString(36)
        .charAt(2);
    const value = Array(64)
      .fill(0)
      .map(getRandomCharacter)
      .join('');

    return this.formBuilder.group({
      description: [null, Validators.required],
      roles: null,
      value: { disabled: true, value },
    });
  }

  public getUser() {
    return this.formBuilder.group({ roles: null, user: null });
  }

  public removeKey(index: number) {
    const formArray = this.form.get('keys') as FormArray;
    formArray.removeAt(index);
  }

  public removeUser(index: number) {
    const formArray = this.form.get('users') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('name').markAsTouched();

      return;
    }

    const keys = this.form.getRawValue().keys;
    const users = this.form
      .get('users')
      .value.filter(u => u.roles && u.user)
      .map(u => ({ _id: u.user._id, roles: u.roles }));

    const values: Partial<Namespace> = {
      keys,
      name: this.form.get('name').value,
      users,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Namespace>) {
    try {
      await this.namespaceService.create(data);
      this.matSnackBar.open('Namespace created successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private async setupForm() {
    this.data = this.data || new Namespace();

    const array = this.data.keys || [];
    const keys = array.map(key =>
      this.formBuilder.group({
        description: this.formBuilder.control(key.description),
        roles: this.formBuilder.control(key.roles),
        value: this.formBuilder.control({ disabled: true, value: key.value }),
      }),
    );

    const users = [];
    if (this.data.users && this.data.users.length > 0) {
      for (const element of this.data.users) {
        const user = await this.userService.findOne(element._id);

        users.push(
          this.formBuilder.group({
            roles: this.formBuilder.control(element.roles),
            user: this.formBuilder.control(user),
          }),
        );
      }
    }

    this.form = this.formBuilder.group({
      keys: this.formBuilder.array(keys),
      name: [this.data.name, Validators.required],
      users: this.formBuilder.array(users),
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Namespace>) {
    data._id = this.data._id;

    try {
      await this.namespaceService.update(data);
      this.matSnackBar.open('Namespace updated successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
