import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-swagger',
  styleUrls: ['swagger.component.scss'],
  templateUrl: 'swagger.component.html',
})
export class SwaggerComponent implements AfterViewInit {
  @Input() public url: string;
  @ViewChild('swagger') swagger: ElementRef<HTMLDivElement>;

  public ngAfterViewInit() {
    SwaggerUIBundle({
      deepLinking: false,
      defaultModelsExpandDepth: -1,
      domNode: this.swagger.nativeElement,
      layout: 'BaseLayout',
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      tagsSorter: 'alpha',
      tryItOutEnabled: true,
      url: `${environment.swaggerUrl}${this.url}`,
    });
  }
}
