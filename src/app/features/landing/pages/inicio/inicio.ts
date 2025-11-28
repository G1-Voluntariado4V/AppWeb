import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, inject } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'landing-inicio',
  imports: [],
  templateUrl: './inicio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio implements AfterViewInit {
  private el = inject(ElementRef);
  anio = new Date().getFullYear();

  ngAfterViewInit() {
    const textElements = this.el.nativeElement.querySelectorAll('.text-center > *');
    const image = this.el.nativeElement.querySelector('img');

    gsap.from(textElements, {
      duration: 1,
      y: 50,
      opacity: 0,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.2
    });

    gsap.from(image, {
      duration: 1.2,
      x: 50,
      opacity: 0,
      ease: 'power3.out',
      delay: 0.5
    });
  }
}
