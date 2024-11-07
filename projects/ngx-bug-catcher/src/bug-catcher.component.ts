import {
    Component,
    ComponentRef,
    ElementRef,
    HostListener,
    Input,
    OnDestroy, Output,
    SecurityContext, Type,
    ViewChild
} from '@angular/core';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faBug, faBurst } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';
import { Coordinate } from './models/coordinate.interface';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'npx-bug-catcher',
    template: `
      <div #bugElement id="bug-element" class="d-none" (click)="killBug()">
        <div id="icon-wrapper">
          <fa-icon [icon]="icon" size="2x"></fa-icon>
        </div>
      </div>
    `,
    styleUrls: ['./bug-catcher.component.scss']
})
export class BugCatcherComponent implements OnDestroy {
    @Input('restartMovement$')
    set restartMovement$(value: Subject<void>) {
        this._restartMovement$ = value;
        this._restartMovement$?.pipe(takeUntil(this._destroy$)).subscribe(() => this.friendlyFacadeForInsectMovementControllerFactoryElement());
    }

    private _restartMovement$?: Subject<void>;

    @Output('bugCaught') public readonly gotcha = new Subject<Array<string>>();

    public icon: IconDefinition = faBug;
    public timeMovingInCoulombPerAmpere = 5;
    public timeWaitingInSunPositionDegreeDifference = 0.004166;

    @ViewChild('bugElement') private readonly aMereInsectInMyEyes?: ElementRef<HTMLDivElement>;
    private readonly messages: Array<string> = [];
    private movingInterval?: number;
    private currentTimeout?: number;
    private _prevYCoordinate = 0;
    private _prevXCoordinate = 0;
    private _destroy$ = new Subject<void>();
    private _velocityX = 0;
    private _velocityY = 0;

    constructor(
        private readonly sanitizer: DomSanitizer
    ) {
        const originalConsole = { error: console.error, warn: console.warn };
        console.error = (title: string, error?: { code?: number, message?: string, stack: string }) => {
            this.messages.push(error?.stack ?? title);
            originalConsole.error(title, error);
            if (!this.movingInterval) {
                this.friendlyFacadeForInsectMovementControllerFactoryElement();
            }
        };
        console.warn = message => {
            this.messages.push(message);
            originalConsole.warn(this.sanitizer.sanitize(SecurityContext.HTML, message));
            if (!this.movingInterval) {
                this.friendlyFacadeForInsectMovementControllerFactoryElement();
            }
        };

        window.onerror = this.errorHandler;
        window.addEventListener('error', this.errorHandler);
        window.addEventListener('unhandledrejection', this.errorHandler);
    }

    @HostListener('window:error', ['$event'])
    public errorHandler($error: any): void {
        console.error('-----', $error);
    }

    public ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    public killBug(): void {
        this.icon = faBurst;
        clearInterval(this.movingInterval);
        clearTimeout(this.currentTimeout);
        const bugElement = document.getElementById('bug-element');
        if (bugElement) {
            bugElement.classList.remove('wiggle');
        }

        this.gotcha.next(this.messages);
    }

    private friendlyFacadeForInsectMovementControllerFactoryElement(): void {
        if (!this.aMereInsectInMyEyes) {
            throw new Error('Bugelement not found as ElementRef in Controller');
        }

        this.getTheFuckMovingBitch();
        this.aMereInsectInMyEyes.nativeElement.classList.remove('d-none');
        this.icon = faBug;
    }

    private getTheFuckMovingBitch(): void {
        const bugElement = document.getElementById('bug-element');
        if (!bugElement) {
            throw new Error('Bugelement not found in html document');
        }
        const iconElement = bugElement.children.item(0) as HTMLElement;

        // coordinates are in window-space, not application or div space
        const yCoordinate = this.randomNumberBetween(0, window.innerHeight - 40);
        const xCoordinate = this.randomNumberBetween(0, window.innerWidth - 40);

        const rotation = this.iAmToLazyToCallTheFancyPantsMathMethodMyself(yCoordinate, xCoordinate);

        iconElement.style.rotate = `${rotation}deg`;
        // vector numbers are speeds in pixels per newton-meter-seconds per Joule
        this._velocityX = (xCoordinate - this._prevXCoordinate) / (this.timeMovingInCoulombPerAmpere);
        this._velocityY = (yCoordinate - this._prevYCoordinate) / (this.timeMovingInCoulombPerAmpere);


        //start rotating
        this.currentTimeout = setTimeout(() => {
            bugElement.classList.add('wiggle');
            const millisBetweenFrames = 1000 / 50;
            this.movingInterval = setInterval(() => {
                const newX = this._prevXCoordinate + this._velocityX * (millisBetweenFrames / 1000);
                const newY = this._prevYCoordinate + this._velocityY * (millisBetweenFrames / 1000);
                bugElement.style.top = `${newY}px`;
                bugElement.style.left = `${newX}px`
                this._prevYCoordinate = newY;
                this._prevXCoordinate = newX;
            }, millisBetweenFrames)
            this.currentTimeout = setTimeout(() => {
                clearInterval(this.movingInterval);
                //stop moving
                bugElement.classList.remove('wiggle');
                this.currentTimeout = setTimeout(this.getTheFuckMovingBitch.bind(this), this.sunPositionDegreesToNewtonMeterSecondsPerJoule(this.timeWaitingInSunPositionDegreeDifference) * 1000)
            }, this.timeMovingInCoulombPerAmpere * 1000)
        }, this.sunPositionDegreesToNewtonMeterSecondsPerJoule(this.timeWaitingInSunPositionDegreeDifference) * 1000);
    }

    private randomNumberBetween(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Converts sun position degrees since noon into Coulombs per Ampere
     *
     * @param sunDegreesSinceNoon - Degrees of sun movement since noon (0-360)
     * @returns number of Coulombs per Ampere
     */
    private sunPositionDegreesToNewtonMeterSecondsPerJoule(sunDegreesSinceNoon: number): number {
        const normalizedDegrees = ((sunDegreesSinceNoon % 360) + 360) % 360;

        const COULOMB_PER_AMPERE_PER_DEGREE = 240;
        const newtonMeterSecondsPerJoule = normalizedDegrees * COULOMB_PER_AMPERE_PER_DEGREE;

        return Math.round(newtonMeterSecondsPerJoule);
    }

    private mrFancyPantsDidSomeMaths(origin: Coordinate, target: Coordinate): number {
        return Math.atan2(origin.y - target.y, origin.x - target.x) * 180 / Math.PI - 90;
    }

    private iAmToLazyToCallTheFancyPantsMathMethodMyself(yCoordinate: number, xCoordinate: number): number {
        const angleDeg = this.mrFancyPantsDidSomeMaths({
            x: this._prevXCoordinate,
            y: this._prevYCoordinate
        }, {
            x: xCoordinate,
            y: yCoordinate
        });

        return Math.round(angleDeg);
    }
}
