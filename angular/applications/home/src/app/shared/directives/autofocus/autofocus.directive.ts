import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: false,
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}

  public ngAfterViewInit() {
    setTimeout(() => this.elementRef.nativeElement.focus(), 0);
  }
}
