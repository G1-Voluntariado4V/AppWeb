import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'landing-quienes-somos',
  imports: [],
  templateUrl: './quienessomos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuienesSomos implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const image = this.el.nativeElement.querySelector('img');
    const textContent = this.el.nativeElement.querySelector('.w-12\\/12'); // Escaping slash for selector if needed, or just use div class

    // Using a more robust selector for text content since class name is weird "w-12/12"
    // Actually, I can select the second child of the flex container.
    // Or just select by tag hierarchy.
    const container = this.el.nativeElement.querySelector('.flex');
    const textDiv = container.children[1];

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.el.nativeElement,
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      }
    });

    if (image) {
      tl.from(image, {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
    }

    tl.from(textDiv, {
      x: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    }, image ? '-=0.8' : '0');
  }
}
