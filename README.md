# NgxBugCatcher

Often bugs in the frontend are insufficiently reported by the users. This library aims to help here while providing a gamification element for the users. 

When a message to console.error() or console.warn() occurs or if an error is thrown and not caught it will trigger a moving bug image which wanders across the screen. 

If the user hovers above the icon the default mouse icon will change to a fly swatter. 

When the user then clicks on the bug it will be smashed and the bugCaught event is fired. 

You can then use the information provided in the $event (type string) property to send the gathered information via E-Mail or to your backend services.

## Include in the project

First install the library:

`npm i --save npx-bug-catcher`

and then add this to your AppComponent:

`<npx-bug-catcher [restartMovement$]="movement$" (bugCaught)="sendMail($event)"></npx-bug-catcher>`

* restartMovement is an input Subject<void> which will trigger the movement of the bug at any time - for example after the user has clicked on the bug icon.
* bugCaught is an output Subject<Array<string>> which will output all logs from console.warn and console.error


Next add
`import { BugCatcherComponent, BugCatcherModule } from 'ngx-bug-catcher/dist/ngx-bug-catcher';`

to your SharedModule and reexport `BugCatcherComponent` to use it in other Modules.



## Bug Reports

Feel free to submit a bug report [here](https://github.com/trayhem/npx-bug-catcher/issues)
