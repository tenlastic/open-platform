import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { Namespace, NamespaceService, UserService } from '@tenlastic/ng-http';

export interface AccessControlListItem {
  roles: string[];
  username: string;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class NamespacesFormPageComponent implements OnInit {
  public accessControlListItems: AccessControlListItem[] = [];
  public error: string;
  public form: FormGroup;

  public data: Namespace;

  constructor(
    private activatedRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private namespaceService: NamespaceService,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRouter.paramMap.subscribe(async params => {
      const _id = params.get('_id');

      if (_id !== 'new') {
        this.data = await this.namespaceService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public addAccessControlListItem() {
    const accessControlListItem = this.getAccessControlListItem();
    const formArray = this.form.get('accessControlList') as FormArray;

    formArray.push(accessControlListItem);
  }

  public getAccessControlListItem() {
    return this.formBuilder.group({ roles: null, user: null });
  }

  public removeAccessControlListItem(index: number) {
    const formArray = this.form.get('accessControlList') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('name').markAsTouched();

      return;
    }

    const accessControlList = this.form
      .get('accessControlList')
      .value.filter(a => a.roles && a.user)
      .map(a => ({ roles: a.roles, userId: a.user._id }));

    const values: Partial<Namespace> = {
      accessControlList,
      name: this.form.get('name').value,
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
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private async setupForm() {
    this.data = this.data || new Namespace();

    const accessControlListItems = [];
    if (this.data.accessControlList && this.data.accessControlList.length > 0) {
      for (const element of this.data.accessControlList) {
        const user = await this.userService.findOne(element.userId);

        accessControlListItems.push(
          this.formBuilder.group({
            roles: this.formBuilder.control(element.roles),
            user: this.formBuilder.control(user),
          }),
        );
      }
    }

    if (accessControlListItems.length === 0) {
      accessControlListItems.push(this.getAccessControlListItem());
    }

    this.form = this.formBuilder.group({
      accessControlList: this.formBuilder.array(accessControlListItems),
      name: [this.data.name, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Namespace>) {
    data._id = this.data._id;

    try {
      await this.namespaceService.update(data);
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
