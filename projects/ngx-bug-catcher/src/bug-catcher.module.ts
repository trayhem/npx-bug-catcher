import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BugCatcherComponent } from './bug-catcher.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [ BugCatcherComponent ],
  imports: [ CommonModule, FontAwesomeModule, FormsModule ],
  exports: [
    BugCatcherComponent
  ],
})
export class BugCatcherModule {
}
