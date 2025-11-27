import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Navbar } from "../components/navbar/navbar";

@Component({
  selector: 'app-landing-layout',
  imports: [Navbar],
  templateUrl: './landing-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingLayout { }
