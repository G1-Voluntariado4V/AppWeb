import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, inject } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'landing-sectores',
  imports: [],
  templateUrl: './sectores.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingSectores implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const title = this.el.nativeElement.querySelector('h1');
    const description = this.el.nativeElement.querySelector('p');
    const cards = this.el.nativeElement.querySelectorAll('.cardSector');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.el.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    });

    tl.from(title, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
      .from(description, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.6')
      .from(cards, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      }, '-=0.6');
  }
}
