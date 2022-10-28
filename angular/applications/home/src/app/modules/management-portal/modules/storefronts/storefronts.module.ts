import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IArticle } from '@tenlastic/http';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent, MediaDialogComponent } from './components';
import {
  StorefrontsFormPageComponent,
  StorefrontsJsonPageComponent,
  StorefrontsMultimediaFormPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: StorefrontsFormPageComponent,
        data: { param: 'storefrontId', title: 'Storefront' },
        path: '',
        title: FormResolver,
      },
      {
        data: { type: IArticle.Type.Guide },
        path: 'guides',
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticleModule),
      },
      {
        component: StorefrontsJsonPageComponent,
        data: { param: 'storefrontId', title: 'Storefront' },
        path: 'json',
        title: FormResolver,
      },
      {
        component: StorefrontsMultimediaFormPageComponent,
        path: 'multimedia',
      },
      {
        data: { type: IArticle.Type.News },
        path: 'news',
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticleModule),
      },
      {
        data: { type: IArticle.Type.PatchNotes },
        path: 'patch-notes',
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticleModule),
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    LayoutComponent,
    MediaDialogComponent,

    StorefrontsFormPageComponent,
    StorefrontsJsonPageComponent,
    StorefrontsMultimediaFormPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StorefrontModule {}
