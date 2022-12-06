import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import {
  ArticleModel,
  ArticleService,
  AuthorizationQuery,
  IArticle,
  IAuthorization,
} from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class ArticlesFormPageComponent implements OnInit {
  public data: ArticleModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
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

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.data.subscribe((data) => (this.type = data.type));
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.ArticlesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<ArticleModel> = {
      _id: this.data._id,
      body: this.form.get('body').value,
      namespaceId: this.form.get('namespaceId').value,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
      type: this.form.get('type').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name' });
    }
  }

  private setupForm(): void {
    this.data = this.data || new ArticleModel();

    this.form = this.formBuilder.group({
      body: [this.data.body, Validators.required],
      namespaceId: [this.params.namespaceId, Validators.required],
      subtitle: [this.data.subtitle],
      title: [this.data.title, Validators.required],
      type: [this.type || this.types[0].value, Validators.required],
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<ArticleModel>) {
    const result = values._id
      ? await this.articleService.update(this.params.namespaceId, values._id, values)
      : await this.articleService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Article saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
