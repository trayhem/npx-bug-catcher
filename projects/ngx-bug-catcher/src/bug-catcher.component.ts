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
        this._restartMovement$?.pipe(takeUntil(this._destroy$)).subscribe(() => this.initBugMovement());
    }

    private _restartMovement$?: Subject<void>;

    @Output('bugCaught') public readonly bugCaught = new Subject<Array<string>>();

    public icon: IconDefinition = faBug;
    public timeMovingInSeconds = 5;
    public timeWaitingInSeconds = 1;

    @ViewChild('bugElement') private readonly bugElement?: ElementRef<HTMLDivElement>;
    private readonly messages: Array<string> = [];
    private movingInterval?: number;
    private currentTimeout?: number;
    private _prevYCoordinate = 100;
    private _prevXCoordinate = 100;
    private _destroy$ = new Subject<void>();
    private _velocityX = 0;
    private _velocityY = 0;
    private mouseX = 0;
    private mouseY = 0;

    constructor(
        private readonly sanitizer: DomSanitizer
    ) {
        const originalConsole = { error: console.error, warn: console.warn };
        console.error = (title: string, error?: { code?: number, message?: string, stack: string }) => {
            this.messages.push(error?.stack ?? title);
            originalConsole.error(title, error);
            if (!this.movingInterval) {
                this.initBugMovement();
            }
        };
        console.warn = message => {
            this.messages.push(message);
            originalConsole.warn(this.sanitizer.sanitize(SecurityContext.HTML, message));
            if (!this.movingInterval) {
                this.initBugMovement();
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

        this.bugCaught.next(this.messages);
    }

    private initBugMovement(): void {
        if (!this.bugElement) {
            throw new Error('Bugelement not found as ElementRef in Controller');
        }

        this.getTheFuckMovingBitch();
        this.bugElement.nativeElement.classList.remove('d-none');
        this.icon = faBug;
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        })
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

        let rotation = this.calculateAngle(yCoordinate, xCoordinate);

        iconElement.style.rotate = `${rotation}deg`;
        // vector numbers are speeds in pixels per newton-meter-seconds per Joule
        this._velocityX = (xCoordinate - this._prevXCoordinate) / (this.timeMovingInSeconds);
        this._velocityY = (yCoordinate - this._prevYCoordinate) / (this.timeMovingInSeconds);


        const distanceToTriggerDeflection = 500;
        const distanceOneDimensionToTriggerDeflection = Math.sqrt(distanceToTriggerDeflection ** 2 / 2);
        //start rotating
        this.currentTimeout = setTimeout(() => {
            bugElement.classList.add('wiggle');
            const millisBetweenFrames = 1000 / 50;
            this.movingInterval = setInterval(() => {
                const xDif = this._prevXCoordinate - this.mouseX;
                const yDif = this._prevYCoordinate - this.mouseY;
                if (Math.abs(xDif) < distanceOneDimensionToTriggerDeflection && Math.abs(yDif) < distanceOneDimensionToTriggerDeflection) {
                    // deflect bug path
                    const dist = Math.sqrt(xDif ** 2 + yDif ** 2);
                    const intensity = Math.max(0, (distanceToTriggerDeflection - dist)) / distanceToTriggerDeflection;
                    if (intensity !== 0) {
/*
                        THIS IS AN ALTERNATIVE METHOD TO CALCULATING THE MOUSE-DEFLECTION (BASED ON CHANGING INDIVIDUAL VELOCITY COMPONENTS)
                        const easeFactor = .05 * millisBetweenFrames;
                        this._velocityX = this._velocityX * (1 - easeFactor) + xDif * intensity * (easeFactor)
                        this._velocityY = this._velocityY * (1 - easeFactor) + yDif * intensity * (easeFactor);

                        const newRotation = this.vectorsToAngle({
                            x: 0,
                            y: 0
                        }, {
                            x: this._velocityX,
                            y: this._velocityY
                        });

                        iconElement.style.rotate = `${newRotation}deg`;
*/
                        // THIS CALCULATES MOUSE-DEFLECTION BY ALTERING THE MOVEMENT ANGLE BASED ON MOUSE POSITION
                        const directionX = this.mouseX - this._prevXCoordinate;
                        const directionY = this.mouseY - this._prevYCoordinate;

                        const velocityAngle = Math.atan2(this._velocityY, this._velocityX);
                        const targetAngle = Math.atan2(directionY, directionX);

                        let angleDiff = targetAngle - velocityAngle;

                        if (angleDiff > Math.PI) {
                            angleDiff -= 2 * Math.PI;
                        } else if (angleDiff < -Math.PI) {
                            angleDiff += 2 * Math.PI;
                        }

                        console.log(intensity)
                        const rotationChange = 0.1 * intensity * millisBetweenFrames * (angleDiff > 0 ? -1 : 1);
                        rotation += rotationChange;
                        console.log(rotationChange)
                        const rotationChangeRads = Math.PI * rotationChange / 180
                        this._velocityX = Math.cos(rotationChangeRads) * this._velocityX - Math.sin(rotationChangeRads) * this._velocityY
                        this._velocityY = Math.sin(rotationChangeRads) * this._velocityX + Math.cos(rotationChangeRads) * this._velocityY
                        iconElement.style.rotate = `${rotation}deg`
                    }
                }

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
                this.currentTimeout = setTimeout(this.getTheFuckMovingBitch.bind(this), this.timeWaitingInSeconds * 1000)
            }, this.timeMovingInSeconds * 1000)
        }, this.timeWaitingInSeconds * 1000);
    }

    private randomNumberBetween(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private vectorsToAngle(origin: Coordinate, target: Coordinate): number {
        return Math.atan2(origin.y - target.y, origin.x - target.x) * 180 / Math.PI - 90;
    }

    private calculateAngle(yCoordinate: number, xCoordinate: number): number {
        const angleDeg = this.vectorsToAngle({
            x: this._prevXCoordinate,
            y: this._prevYCoordinate
        }, {
            x: xCoordinate,
            y: yCoordinate
        });

        return Math.round(angleDeg);
    }
}
