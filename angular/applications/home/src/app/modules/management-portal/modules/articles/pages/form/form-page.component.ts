import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArticleModel,
  ArticleService,
  AuthorizationState,
  IArticle,
  IAuthorization,
} from '@tenlastic/http';

import { FormService, IdentityService } from '@home/app/core/services';

export interface ArticleForm {
  body: FormControl<string>;
  subtitle: FormControl<string>;
  title: FormControl<string>;
  type: FormControl<IArticle.Type>;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class ArticlesFormPageComponent implements OnInit {
  public data: ArticleModel;
  public errors: string[] = [];
  public form: FormGroup<ArticleForm>;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;
  public get singular() {
    switch (this.type) {
      case IArticle.Type.Guide:
        return 'Guide';
      case IArticle.Type.News:
        return 'News';
      case IArticle.Type.PatchNotes:
        return 'Patch Notes';
      default:
        return 'Article';
    }
  }
  public type: IArticle.Type;
  public types = [
    { label: 'Guide', value: IArticle.Type.Guide },
    { label: 'News', value: IArticle.Type.News },
    { label: 'Patch Notes', value: IArticle.Type.PatchNotes },
  ];

  private namespaceId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private authorizationState: AuthorizationState,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.data.subscribe((data) => (this.type = data.type));
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.ArticlesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      if (params.articleId !== 'new') {
        this.data = await this.articleService.findOne(params.namespaceId, params.articleId);
      }

      this.setupForm();
    });
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const values: Partial<ArticleModel> = {
      _id: this.data._id,
      body: this.form.get('body').value,
      namespaceId: this.namespaceId,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
      type: this.form.get('type').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name' });
    }

    this.isSaving = false;
  }

  private setupForm() {
    this.data ??= new ArticleModel();

    this.form = this.formBuilder.group({
      body: this.formBuilder.control(this.data.body, Validators.required),
      subtitle: this.formBuilder.control(this.data.subtitle),
      title: this.formBuilder.control(this.data.title, Validators.required),
      type: this.formBuilder.control(this.type || this.types[0].value, Validators.required),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<ArticleModel>) {
    const result = values._id
      ? await this.articleService.update(this.namespaceId, values._id, values)
      : await this.articleService.create(this.namespaceId, values);

    this.matSnackBar.open(`Article saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
