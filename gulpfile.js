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
    gulpif = require('gulp-if');

let env;

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
    del.sync(['web/*', 'web/media', '!/web/media/**', 'reports/*']);
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
    return gulp.src('src/*.htm')
        .pipe(gulpif(arg.sourcemap, sourcemaps.init()))
        .pipe(htmllint({
            rules: {
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
            }
        }))
        .pipe(htmllint.format())
        .pipe(htmllint.failOnError())
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('web'))
        .pipe(access({
            force: true,
            browser: false,
            verbose: true,
            accessibilityLevel: 'WCAG2A'
        }))
        .on('error', console.log)
        .pipe(access.report({ reportType: 'json' }))
        .pipe(rename({ extname: '.json' }))
        .pipe(gulp.dest('reports/ada-compliance'));
});

gulp.task('build-css', () => {
    return gulp.src('src/scss/**/*.scss')
        .pipe(gulpif(arg.sourcemap, sourcemaps.init()))
        .pipe(sassLint())
        .pipe(concat('styles.scss'))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .pipe(sass())
        .pipe(autoprefixer('last 10 versions'))
        .pipe(cssnano())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('web/css'))
        .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('build-js', () => {
    return gulp.src('src/js/**/*.js')
        .pipe(gulpif(arg.sourcemap, sourcemaps.init()))
        .pipe(eslint())
        .pipe(concat('main.js'))
        .pipe(htmllint.format())
        .pipe(htmllint.failOnError())
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('web/js'));
});

gulp.task('serve', () => {
    browserSync.use(htmlInjector, {
        files: 'web/*.htm'
    });
    browserSync.init({
        server: {
            baseDir: './web/',
            index: 'index.htm'
        },
        /*Uncomment if using a proxy and injecting CSS.
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
    gulp.watch('src/*.htm', ['build-html']);
    /*Uncomment if not using HTML injection.
    gulp.watch('src/*.htm', ['build-html']).on('change', (e) => {
        browserSync.reload();
    });*/
    gulp.watch('src/scss/**/*.scss', ['build-css']);
    gulp.watch('src/js/**/*.js', ['build-js']).on('change', (e) => {
        browserSync.reload();
    });
});

gulp.task('develop', ['clean', 'copy', 'build-html', 'build-css', 'build-js', 'serve']);
gulp.task('build', ['clean', 'copy', 'build-html', 'build-css', 'build-js']);
