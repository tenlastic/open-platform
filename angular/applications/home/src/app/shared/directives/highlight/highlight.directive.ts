import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  constructor(private elementRef: ElementRef) {}

  @HostListener('mouseenter')
  private onMouseEnter() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.add('highlight');

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (element.hasAttribute && element.hasAttribute('appHighlight')) {
        element.classList.remove('highlight');
      }
    }
  }

  @HostListener('mouseleave')
  private onMouseLeave() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.remove('highlight');

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (element.hasAttribute && element.hasAttribute('appHighlight')) {
        element.classList.add('highlight');
      }
    }
  }
}
