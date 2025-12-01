import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './not-found.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
    constructor(private location: Location) { }

    goBack() {
        this.location.back();
    }
}
