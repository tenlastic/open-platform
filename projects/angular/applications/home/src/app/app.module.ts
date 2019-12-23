import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HttpServicesModule } from '@tenlastic/http-services';

import { CoreModule } from '@app/core/core.module';
import { LayoutComponent } from '@app/shared/components';
import { SharedModule } from '@app/shared/shared.module';
import { environment } from '@env';

import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LayoutComponent,
    loadChildren: './modules/home/home.module#HomeModule',
  },
  {
    path: 'contact-us',
    component: LayoutComponent,
    loadChildren: './modules/contact-us/contact-us.module#ContactUsModule',
  },
  {
    path: 'patch-notes',
    component: LayoutComponent,
    loadChildren: './modules/patch-notes/patch-notes.module#PatchNotesModule',
  },
  {
    path: 'play-now',
    component: LayoutComponent,
    loadChildren: './modules/play-now/play-now.module#PlayNowModule',
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    CoreModule,
    HttpServicesModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES),
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
