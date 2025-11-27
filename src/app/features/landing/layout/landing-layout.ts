import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Navbar } from "../components/navbar/navbar";
import { Inicio } from "../pages/inicio/inicio";
import { QuienesSomos } from "../pages/quienessomos/quienessomos";

@Component({
  selector: 'app-landing-layout',
  imports: [Navbar, Inicio, QuienesSomos],
  templateUrl: './landing-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingLayout { }
