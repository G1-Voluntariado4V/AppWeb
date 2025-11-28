import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'landing-faq',
  standalone: true,
  imports: [],
  templateUrl: './faq.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFaq implements AfterViewInit {
  private el = inject(ElementRef);
  faqItems: FaqItem[] = [
    {
      question: '¿Cómo puedo registrarme como voluntario?',
      answer: 'Para registrarte, haz clic en el botón "Únete como voluntario" en la página de inicio y completa el formulario con tus datos personales e intereses.'
    },
    {
      question: '¿Qué requisitos necesito para ser voluntario?',
      answer: 'Los requisitos varían según el programa, pero generalmente necesitas ser mayor de 16 años y tener ganas de ayudar. Algunos programas pueden requerir habilidades específicas.'
    },
    {
      question: '¿Puedo elegir en qué proyectos participar?',
      answer: '¡Sí! Una vez registrado, podrás ver una lista de proyectos disponibles y postularte a los que más te interesen y se ajusten a tu horario.'
    },
    {
      question: '¿Recibiré algún certificado por mi voluntariado?',
      answer: 'Sí, al finalizar tu participación en un proyecto, podrás solicitar un certificado que acredite las horas dedicadas y las actividades realizadas.'
    },
    {
      question: '¿Qué hago si tengo problemas con la plataforma?',
      answer: 'Si encuentras algún problema técnico, puedes contactarnos a través del formulario de contacto o enviarnos un correo electrónico a soporte@voluntariado4v.com.'
    }
  ];

  ngAfterViewInit() {
    gsap.registerPlugin(ScrollTrigger);
    const title = this.el.nativeElement.querySelector('h1');
    const description = this.el.nativeElement.querySelector('p');
    const items = this.el.nativeElement.querySelectorAll('.faq-item');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.el.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });

    if (title) {
      tl.from(title, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    }

    if (description) {
      tl.from(description, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.6');
    }

    if (items.length > 0) {
      tl.from(items, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'opacity,transform' // Ensure visibility after animation
      }, '-=0.6');
    }
  }
}
