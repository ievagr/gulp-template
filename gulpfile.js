'use strict';

const gulp = require('gulp'),
    del = require('del'),
    merge = require('merge-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    htmllint = require('gulp-html-lint'),
    htmlmin = require('gulp-htmlmin'),
    sassLint = require('gulp-sass-lint'),
    sass = require('gulp-sass'),
    cssComb = require('gulp-csscomb'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    eslint = require('gulp-eslint'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    browserSync = require('browser-sync').create(),
    htmlInjector = require("bs-html-injector"),
    gutil = require('gulp-util'),
    access = require('gulp-accessibility'),
    rename = require('gulp-rename'),
    gulpif = require('gulp-if'),
    webpack = require('webpack'),
    webpackStream = require('webpack-stream'),
    webpackConfig = require('./webpack.config.js'),
    prettify = require('gulp-jsbeautifier');

const htmlFiles = ['src/app/html/**/*.html'],
    cssFiles = ['src/app/scss/**/*.scss'],
    jsFiles = ['src/app/js/**/*.js'];

const htmlLintRules = {
    'attr-no-dup': true,
    'id-no-dup': true,
    'img-req-alt': true,
    'attr-name-style': 'dash',
    'doctype-html5': true,
    'line-end-style': false,
    'tag-bans': ['align', 'background', 'bgcolor', 'border', 'frameborder', 'longdesc', 'marginwidth', 'marginheight', 'scrolling', 'style', 'width'],
    'id-class-style': 'dash',
    'img-req-src': false,
    'input-radio-req-name': true,
    'input-req-label': true,
    'label-req-for': true,
    'spec-char-escape': true,
    'tag-close': true,
    'tag-name-lowercase': true,
    'tag-name-match': true,
    'title-no-dup': true
};

let env,
    pendingHTML = false,
    pendingCSS = false,
    pendingJS = false;

const arg = (argList => {
    let arg = {},
        a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {
        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');
        if (opt === thisOpt) {
            if (curOpt) arg[curOpt] = opt;
            curOpt = null;
        } else {
            curOpt = opt;
            arg[curOpt] = true;
        }
    }
    return arg;
})(process.argv);

gulp.task('clean', () => {
    /* del.sync(['web/*', 'web/media', '!/web/media/**', 'reports/*']); */
    del.sync(['www/*']);
});

gulp.task('copy', () => {
    let icons_1 = gulp.src('src/font-icons/css/*.min.css')
        .pipe(gulp.dest('web/font-icons/css')),
        icons_2 = gulp.src('src/font-icons/fonts/*')
            .pipe(gulp.dest('web/font-icons/fonts')),
        plugins = gulp.src('src/plugins/**/*')
            .pipe(gulp.dest('web/plugins'));
    merge(icons_1, icons_2, plugins);
});

gulp.task('build-html', () => {
    buildHTML().then(() => {
        return null;
    });
});

gulp.task('build-css', () => {
    buildCSS().then(() => {
        return null;
    });
});

gulp.task('build-js', () => {
    buildJS().then(() => {
        return null;
    });
});

function buildHTML(file = [...htmlFiles]) {
    pendingHTML = true;

    return new Promise((resolve) => {
        prettifyFiles(file).then(() => {
            new Promise((resolve) => {
                gulp.src(file, { base: './' })
                    .pipe(htmllint({
                        rules: htmlLintRules
                    }))
                    .pipe(htmllint.format())
                    .pipe(gulp.dest('./'))
                    .on('end', resolve);
            }).then(() => {
                setTimeout(() => {
                    pendingHTML = false;
                }, 100);

                gulp.src(file)
                    .pipe(gulpif(arg.sourcemap, sourcemaps.init()))
                    .pipe(htmlmin({ collapseWhitespace: true }))
                    .pipe(gulpif(arg.sourcemap, sourcemaps.write()))
                    .pipe(gulp.dest('www'))
                    .pipe(access({
                        force: true,
                        browser: false,
                        verbose: true,
                        accessibilityLevel: 'WCAG2A'
                    }))
                    .on('error', console.log)
                    .pipe(access.report({ reportType: 'json' }))
                    .pipe(rename({ extname: '.json' }))
                    .pipe(gulp.dest('reports/ada-compliance'))
                    .on('end', resolve);
            });
        });
    });
}

function buildCSS(file = [...cssFiles]) {
    pendingCSS = true;

    return new Promise((resolve) => {
        new Promise((resolve) => {
            prettifyFiles(file).then(() => {
                gulp.src(file, { base: './' })
                    .pipe(cssComb())
                    .pipe(sassLint())
                    .pipe(sassLint.format())
                    .pipe(cssComb())
                    .pipe(gulp.dest('./'))
                    .on('end', resolve);
            });
        }).then(() => {
            setTimeout(() => {
                pendingCSS = false;
            }, 100);

            gulp.src('src/app/scss/**/*.scss')
                .pipe(gulpif(arg.sourcemap, sourcemaps.init()))
                .pipe(concat('styles.scss'))
                .pipe(sass())
                .pipe(autoprefixer('last 10 versions'))
                .pipe(cssnano())
                .pipe(gulpif(arg.sourcemap, sourcemaps.write()))
                .pipe(gulp.dest('www/css'))
                .pipe(browserSync.stream({ match: '**/*.css' }))
                .on('end', resolve);
        });
    });
}

function buildJS(file = [...jsFiles]) {
    pendingJS = true;

    return new Promise((resolve) => {
        new Promise((resolve) => {
            prettifyFiles(file).then(() => {
                gulp.src(file, { base: './' })
                    .pipe(eslint({ fix: true }))
                    .pipe(eslint.format())
                    .pipe(gulp.dest('./'))
                    .on('end', resolve);
            });
        }).then(() => {
            setTimeout(() => {
                pendingJS = false;
            }, 100);

            gulp.src('src/app/js/index.js')
                .pipe(gulpif(arg.sourcemap, sourcemaps.init()))
                .pipe(webpackStream(webpackConfig), webpack)
                .pipe(concat('main.js')).pipe(babel({ presets: ['es2015'] }))
                .pipe(uglify())
                .pipe(gulpif(arg.sourcemap, sourcemaps.write()))
                .pipe(gulp.dest('www/js'))
                .on('end', resolve);
        });
    });
}

function prettifyFiles(files) {
    return new Promise((resolve) => {
        gulp.src(files, { base: './' })
            .pipe(prettify())
            .pipe(gulp.dest('./'))
            .on('end', resolve);
    });
}

gulp.task('serve', () => {
    browserSync.use(htmlInjector, {
        files: 'www/*.html'
    });
    browserSync.init({
        server: {
            baseDir: './www/',
            index: 'index.html'
        },

        /*Uncomment if injecting additional CSS into a proxied website.
        proxy: '~yourURL~',
        serveStatic: ["web/"],
        snippetOptions: {
            rule: {
                match: /<\/head>/i,
                fn: function (snippet, match) {
                    return '<link rel="stylesheet" type="text/css" href="/css/styles.css"/>' + snippet + match;
                }
            }
        },*/

        /*Uncomment to inject AND overwrite a CSS file.
        proxy: '~yourURL~',
        serveStatic: ['web/css'],
        rewriteRules: [{
            match: new RegExp('~what-to-match.css~'),
            fn: () => {
                return "styles.css"
            }
        }],*/

        reloadDelay: 50,
        reloadDebounce: 250
    });

    gulp.watch(htmlFiles).on('change', (e) => {
        if ((e.type === 'added' || e.type === 'changed') && !pendingHTML) {
            buildHTML(e.path).then(() => {
                // Uncomment if not using HTML injection.
                //browserSync.reload();
            });
        }
    });

    gulp.watch(cssFiles).on('change', (e) => {
        if ((e.type === 'added' || e.type === 'changed') && !pendingCSS) {
            buildCSS(e.path);
        }
    });

    gulp.watch(jsFiles).on('change', (e) => {
        if ((e.type === 'added' || e.type === 'changed') && !pendingJS) {
            buildJS(e.path).then(() => {
                browserSync.reload();
            });
        }
    });
});

gulp.task('develop', ['clean', 'copy', 'build-html', 'build-css', 'build-js', 'serve']);
gulp.task('build', ['clean', 'copy', 'build-html', 'build-css', 'build-js']);
