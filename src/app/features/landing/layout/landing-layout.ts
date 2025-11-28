import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Navbar } from "../components/navbar/navbar";
import { Inicio } from "../pages/inicio/inicio";
import { QuienesSomos } from "../pages/quienessomos/quienessomos";
import { LandingContacto } from "../pages/contacto/contacto";
import { LandingSectores } from "../pages/sectores/sectores";
import { LandingFaq } from "../pages/faq/faq";

@Component({
  selector: 'app-landing-layout',
  imports: [Navbar, Inicio, QuienesSomos, LandingContacto, LandingSectores, LandingFaq],
  templateUrl: './landing-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingLayout { }
