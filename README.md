# NgxBugCatcher

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.0.

## Include in the project

First install the library:

`npm i --save @trayhem/npx-bug-catcher`

and then add this to your AppComponent:

`<npx-bug-catcher [restartMovement$]="movement$" (bugCaught)="sendMail($event)"></npx-bug-catcher>`

restartMovement is an input Subject<void> which will trigger the movement of the bug at any time - for example after the user has clicked on the bug icon.
bugCaught is an output Subject<Array<string>> which will output all logs from console.warn and console.error


## Bug Reports

Feel free to submit a bug report [here](https://github.com/trayhem/bug-catcher)
