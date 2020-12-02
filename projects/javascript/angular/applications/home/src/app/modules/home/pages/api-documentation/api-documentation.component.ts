import { Component, OnInit } from '@angular/core';
import { UserService } from '@tenlastic/ng-http';

import { environment } from '../../../../../environments/environment';
import { ElectronService } from '../../../../core/services';

declare const SwaggerUIBundle: any;

@Component({
  templateUrl: 'api-documentation.component.html',
  styleUrls: ['./api-documentation.component.scss'],
})
export class ApiDocumentationComponent implements OnInit {
  public launcherUrl = environment.launcherUrl;

  constructor(public electronService: ElectronService, public userService: UserService) {}

  public ngOnInit() {
    SwaggerUIBundle({
      deepLinking: false,
      defaultModelsExpandDepth: -1,
      dom_id: '#swagger-ui',
      layout: 'BaseLayout',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      url: environment.swaggerUrl,
    });
  }
}
