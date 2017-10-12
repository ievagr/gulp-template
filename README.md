# gulp-template
A Gulp framework template to facilitate the development and building of front-end projects.

#### Functionality

* Markup: Markup is linted to ensure adherence to xHTML while maintaining best scripting practices. The linted process is extended by an additional step of scanning for ADA compliance. Only static ADA compliance violations are captured during this process. Users may define their preferred accessibility level in the gulpfile. Once completed, it is then minified and passed to the /web directory. BrowserSync is notified of any required page reloads. Source maps are generated.
* SCSS/CSS: SCSS is linted, concatenated, and then precompiled into CSS. Once completed, it is then minified and passed to the /web directory. BrowserSync is notified of any required injections. Source maps are generated.
* JS: ES6 is linted, concatenated, and then transcompiled into ES5. Once completed, it is then minified and passed to the /web directory. BrowserSync is notified of any required page reloads. Source maps are generated.
* Plugins: Any scripts housed in the /src/plugins folder will be migrated to /web/plugins without any file modifications. Additionally, the build script may be configured to extract and migrated any files required for the use of font icons.
* Media: Currently media housed in the /web/media folder remains untouched, while the rest of the /web folder is cleaned during the build process. No build tools do a sufficient job of media compression and consequently none have been included in this build script. It is up to the user to handle the compression process using well-performing, external tools such as <https://compressor.io/>.

#### Use

You may issue the following commands:

```sh 
$ gulp build
$ gulp develop
```

Issuing "build" will perform all of the tasks detailed above. The task "develop" will also launch BrowserSync and begin monitoring for changes. The argument "--sourcemap" may also be passed to generate source maps for HTML, CSS, and JS.

```sh
$ gulp develop --sourcemap
```




