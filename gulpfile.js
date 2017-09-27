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
    gutil = require('gulp-util');

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
    del.sync(['features/' + arg.feature + '/web/*', '!features/' + arg.feature + '/web/media', '!features/' + arg.feature + '/web/media/**']);
});

gulp.task('copy', () => {
    let icons_1 = gulp.src('features/' + arg.feature + '/src/font-icons/css/*.min.css')
        .pipe(gulp.dest('features/' + arg.feature + '/web/font-icons/css')),
        icons_2 = gulp.src('features/' + arg.feature + '/src/font-icons/fonts/*')
        .pipe(gulp.dest('features/' + arg.feature + '/web/font-icons/fonts')),
        plugins = gulp.src('features/' + arg.feature + '/src/plugins/**/*')
        .pipe(gulp.dest('features/' + arg.feature + '/web/plugins'));
    merge(icons_1, icons_2, plugins);
});

gulp.task('build-html', () => {
    return gulp.src('features/' + arg.feature + '/src/*.htm')
        .pipe(sourcemaps.init())
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
        .pipe(gulp.dest('features/' + arg.feature + '/web'));
});

gulp.task('build-css', () => {
    return gulp.src('features/' + arg.feature + '/src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sassLint())
        .pipe(concat('styles.scss'))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .pipe(sass())
        .pipe(autoprefixer('last 10 versions'))
        .pipe(cssnano())
        .pipe(gulp.dest('features/' + arg.feature + '/web/css'))
        .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('build-js', () => {
    return gulp.src('features/' + arg.feature + '/src/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(eslint())
        .pipe(concat('main.js'))
        .pipe(htmllint.format())
        .pipe(htmllint.failOnError())
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify())
        .pipe(gulp.dest('features/' + arg.feature + '/web/js'));
});

gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: './',
            index: 'index.htm'
        },
        reloadDelay: 50,
        reloadDebounce: 250
    });
    gulp.watch('features/' + arg.feature + '/src/*.htm', ['build-html']).on('change', (e) => {
        browserSync.reload();
    });
    gulp.watch('features/' + arg.feature + '/src/scss/**/*.scss', ['build-css']);
    gulp.watch('features/' + arg.feature + '/src/js/**/*.js', ['build-js']).on('change', (e) => {
        browserSync.reload();
    });
});

gulp.task('develop', ['clean', 'copy', 'build-html', 'build-css', 'build-js', 'serve']);
gulp.task('build', ['clean', 'copy', 'build-html', 'build-css', 'build-js']);
