import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { INamespace, Namespace, NamespaceService, UserService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class NamespacesFormPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Namespace;
  public errors: string[] = [];
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
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private router: Router,
    private snackBar: MatSnackBar,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');

      this.breadcrumbs = [
        { label: 'Namespaces', link: '../' },
        { label: _id === 'new' ? 'Create Namespace' : 'Edit Namespace' },
      ];

      if (_id !== 'new') {
        this.data = await this.namespaceService.findOne(_id);
      }

      this.roles = Object.keys(INamespace.Role).map((key) => ({
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
    this.snackBar.open('API key copied to clipboard.');
  }

  public getKey() {
    const getRandomCharacter = () => Math.random().toString(36).charAt(2);
    const value = Array(64).fill(0).map(getRandomCharacter).join('');

    return this.formBuilder.group({
      description: [null, Validators.required],
      roles: null,
      value: { disabled: true, value },
    });
  }

  public getUser() {
    return this.formBuilder.group({ roles: null, user: null });
  }

  public navigateToJson() {
    if (this.form.dirty) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: 'Changes will not be saved. Is this OK?',
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          this.router.navigate([`json`], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.router.navigate([`json`], { relativeTo: this.activatedRoute });
    }
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
      this.form.markAllAsTouched();
      return;
    }

    const keys = this.form.getRawValue().keys;
    const users = this.form
      .get('users')
      .value.filter((u) => u.roles && u.user)
      .map((u) => ({ _id: u.user._id, roles: u.roles }));

    const values: Partial<Namespace> = {
      keys,
      limits: this.form.get('limits').value,
      name: this.form.get('name').value,
      users,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, {
        'keys.value': 'API Key',
        name: 'Name',
      });
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map((p) => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private async setupForm() {
    this.data = this.data || new Namespace();

    const array = this.data.keys || [];
    const keys = array.map((key) =>
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
    } else {
      users.push(
        this.formBuilder.group({
          roles: this.formBuilder.control([INamespace.Role.Namespaces]),
          user: this.formBuilder.control(this.identityService.user),
        }),
      );
    }

    const { limits } = this.data;
    this.form = this.formBuilder.group({
      keys: this.formBuilder.array(keys),
      limits: this.formBuilder.group({
        builds: this.formBuilder.group({
          count: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.builds && limits.builds.count) || 0,
            },
            Validators.required,
          ],
          size: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.builds && limits.builds.size) || 0,
            },
            Validators.required,
          ],
        }),
        databases: this.formBuilder.group({
          cpu: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.databases && limits.databases.cpu) || 0,
            },
            Validators.required,
          ],
          memory: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.databases && limits.databases.memory) || 0,
            },
            Validators.required,
          ],
          preemptible: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.databases && limits.databases.preemptible) || false,
            },
            Validators.required,
          ],
          replicas: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.databases && limits.databases.replicas) || 0,
            },
            Validators.required,
          ],
          storage: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.databases && limits.databases.storage) || 0,
            },
            Validators.required,
          ],
        }),
        gameServers: this.formBuilder.group({
          cpu: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.gameServers && limits.gameServers.cpu) || 0,
            },
            Validators.required,
          ],
          memory: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.gameServers && limits.gameServers.memory) || 0,
            },
            Validators.required,
          ],
          preemptible: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.gameServers && limits.gameServers.preemptible) || false,
            },
            Validators.required,
          ],
        }),
        games: this.formBuilder.group({
          count: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.games && limits.games.count) || 0,
            },
            Validators.required,
          ],
          images: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.games && limits.games.images) || 0,
            },
            Validators.required,
          ],
          public: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.games && limits.games.public) || 0,
            },
            Validators.required,
          ],
          size: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.games && limits.games.size) || 0,
            },
            Validators.required,
          ],
          videos: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.games && limits.games.videos) || 0,
            },
            Validators.required,
          ],
        }),
        queues: this.formBuilder.group({
          cpu: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.queues && limits.queues.cpu) || 0,
            },
            Validators.required,
          ],
          memory: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.queues && limits.queues.memory) || 0,
            },
            Validators.required,
          ],
          preemptible: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.queues && limits.queues.preemptible) || false,
            },
            Validators.required,
          ],
          replicas: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.queues && limits.queues.replicas) || 0,
            },
            Validators.required,
          ],
        }),
        workflows: this.formBuilder.group({
          count: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.workflows && limits.workflows.count) || 0,
            },
            Validators.required,
          ],
          cpu: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.workflows && limits.workflows.cpu) || 0,
            },
            Validators.required,
          ],
          memory: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.workflows && limits.workflows.memory) || 0,
            },
            Validators.required,
          ],
          parallelism: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.workflows && limits.workflows.parallelism) || 0,
            },
            Validators.required,
          ],
          preemptible: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.workflows && limits.workflows.preemptible) || false,
            },
            Validators.required,
          ],
          storage: [
            {
              disabled: !this.identityService.user.roles.includes('namespaces'),
              value: (limits && limits.workflows && limits.workflows.storage) || 0,
            },
            Validators.required,
          ],
        }),
      }),
      name: [this.data.name, Validators.required],
      users: this.formBuilder.array(users),
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Namespace>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.namespaceService.update(data);
    } else {
      await this.namespaceService.create(data);
    }

    this.matSnackBar.open('Namespace saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
