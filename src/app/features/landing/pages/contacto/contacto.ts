import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'landing-contacto',
  imports: [],
  templateUrl: './contacto.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingContacto implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const mapContainer = this.el.nativeElement.querySelector('.w-full.md\\:w-6\\/12.flex.justify-center');
    const textContainer = this.el.nativeElement.querySelector('.w-full.md\\:w-6\\/12.text-sm');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.el.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    });

    if (mapContainer) {
      tl.from(mapContainer, {
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    }

    if (textContainer) {
      tl.from(textContainer, {
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, mapContainer ? '-=0.6' : '0');
    }
  }
}
