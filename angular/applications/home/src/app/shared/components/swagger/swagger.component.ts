import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { environment } from '../../../../environments/environment';

declare const SwaggerUIBundle: any;

@Component({
  selector: 'app-swagger',
  standalone: false,
  styleUrls: ['swagger.component.scss'],
  templateUrl: 'swagger.component.html',
})
export class SwaggerComponent implements AfterViewInit {
  @Input() public url: string;
  @ViewChild('swagger') public swagger: ElementRef<HTMLDivElement>;

  public ngAfterViewInit() {
    SwaggerUIBundle({
      deepLinking: false,
      defaultModelsExpandDepth: -1,
      domNode: this.swagger.nativeElement,
      layout: 'BaseLayout',
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      tagsSorter: 'alpha',
      url: `${environment.swaggerUrl}${this.url}`,
    });
  }
}
