import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective {
  constructor(private host: ElementRef) {}

  public ngAfterViewInit() {
    this.host.nativeElement.focus();
  }
}
