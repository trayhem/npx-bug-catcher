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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  styleUrls: [ './bug-catcher.component.scss' ],
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

  @ViewChild('bugElement') private readonly bugElement?: ElementRef<HTMLDivElement>;
  private readonly messages: Array<string> = [];
  private movingInterval?: number;
  private _prevYCoordinate = 120;
  private _prevXCoordinate = 20;
  private _destroy$ = new Subject<void>();

  constructor(
    private readonly sanitizer: DomSanitizer,
  ) {
    const originalConsole = { error: console.error, warn: console.warn };
    console.error = (title: string, error?: { code?: number, message?: string, stack: string }) => {
      this.messages.push(error?.stack ?? title);
      originalConsole.error(title, error);
      if (!this.movingInterval) {
        this.initBugMovement();
        this.moveBug();
      }
    };
    console.warn = message => {
      this.messages.push(message);
      originalConsole.warn(this.sanitizer.sanitize(SecurityContext.HTML, message));
      if (!this.movingInterval) {
        this.initBugMovement();
        this.moveBug();
      }
    };

    window.onerror = this.errorHandler;
    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.errorHandler);
  }

  @HostListener('window:error', [ '$event' ])
  public errorHandler($error: any): void {
    console.error('-----', $error);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public killBug(): void {
    this.icon = faBurst;
    this.stopMovement();
    clearInterval(this.movingInterval);

    this.bugCaught.next(this.messages);
  }

  private initBugMovement(): void {
    if (!this.bugElement) {
      throw new Error('Bugelement not found as ElementRef in Controller');
    }

    this.moveBug();
    this.bugElement.nativeElement.classList.remove('d-none');
    this.icon = faBug;
    this.movingInterval = setInterval(this.moveBug.bind(this), 12000);
  }

  private moveBug(): void {
    const bugElement = document.getElementById('bug-element');
    if (!bugElement) {
      throw new Error('Bugelement not found in html document');
    }
    const iconElement = bugElement.children.item(0) as HTMLElement;

    // @ts-ignore
    const maxHeight = document.querySelector('app-root')?.offsetHeight || window.innerHeight;
    const yCoordinate = this.limitNumberWithinRange(120, maxHeight - 40);
    const xCoordinate = this.limitNumberWithinRange(0, window.innerWidth - 80);
    const rotation = this.calculateRotation(yCoordinate, xCoordinate);

    iconElement.style.rotate = `${rotation}deg`;

    setTimeout(() => {
      bugElement.style.transform = `translate(${xCoordinate}px, ${yCoordinate}px)`;
      this._prevYCoordinate = yCoordinate;
      this._prevXCoordinate = xCoordinate;
    }, 1000);
  }

  private getOffset(el: HTMLElement): { left: number, top: number } {
    const rect = el.getBoundingClientRect();
    return {
      left: Math.round(rect.left + window.scrollX),
      top: Math.round(rect.top + window.scrollY)
    };
  }

  private stopMovement(): void {
    const bugElement = document.getElementById('bug-element');
    if (!bugElement) {
      throw new Error('Bugelement not found in html document');
    }
    const iconElement = bugElement.children.item(0) as HTMLElement;
    const position = this.getOffset(bugElement);

    bugElement.style.transform = `translate(${position.left}px, ${position.top}px)`;
    this._prevXCoordinate = position.left;
    this._prevYCoordinate = position.top;
    iconElement.style.rotate = `0deg`;
  }

  private limitNumberWithinRange(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private angle(origin: Coordinate, target: Coordinate): number {
    return Math.atan2((origin.y - 120) - target.y, (origin.x - 20) - target.x) * 180 / Math.PI - 90;
  }

  private calculateRotation(yCoordinate: number, xCoordinate: number): number {
    const angleDeg = this.angle({
      x: this._prevXCoordinate,
      y: this._prevYCoordinate
    }, {
      x: xCoordinate,
      y: yCoordinate
    });

    return Math.round(angleDeg);
  }
}
