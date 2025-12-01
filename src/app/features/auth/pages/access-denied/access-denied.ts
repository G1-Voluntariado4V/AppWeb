import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-access-denied',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './access-denied.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedPage {
    constructor(private location: Location) { }

    goBack() {
        this.location.back();
    }
}
