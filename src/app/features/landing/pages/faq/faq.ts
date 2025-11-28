import { ChangeDetectionStrategy, Component } from '@angular/core';


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
export class LandingFaq {
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
}
