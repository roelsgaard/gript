'use strict';

module.exports = function (gulp) {

    var angularFilesort = require('gulp-angular-filesort'),
        bower = require('gulp-bower'),
        filter = require('gulp-filter'),
        flatten = require('gulp-flatten'),
        fs = require('fs'),
        gulpInject = require('gulp-inject'),
        htmlmin = require('gulp-htmlmin'),
        naturalSort = require('gulp-natural-sort'),
        ngHtml2js = require('gulp-ng-html2js'),
        path = require('path'),
        sass = require('gulp-sass'),
        sequence = require('run-sequence').use(gulp),
        size = require('gulp-size'),
        util = require('gulp-util'),
        wiredep = require('wiredep').stream,
        _ = require('lodash'),
        partialsMinifyDefaults = {
            html: {
                removeEmptyAttributes: true,
                collapseBooleanAttributes: false,
                collapseWhitespace: true,
                caseSensitive: true
            }
        },
        javaScriptToInject = [
            'app/**/*.js', //javascript source
            'target/tmp/js/**/*.js', //compiled TypeScript
            '!target/tmp/js/**/*Test.js',
            '!target/tmp/js/**/*test.js',
            '!app/**/*Test.js',
            '!app/**/*test.js'],
        projectRoot = process.cwd();

    gulp.task('inject', function (callback) {
        sequence('check', 'config', 'inject-bower', 'inject-styles', 'inject-partials', 'modernizr', 'inject-js', callback);
    });

    gulp.task('inject-bower', ['bower-download'], function () {
        return gulp.src('app/index.html')
            .pipe(wiredep({
                directory: 'bower_components'
            }))
            .pipe(gulp.dest('app'));
    });

    gulp.task('bower-download', function () {
        return bower(path.join(projectRoot, 'bower_components'));
    });

    gulp.task('inject-styles', ['styles'], function () {
        return gulp.src('app/index.html')
            .pipe(gulpInject(gulp.src('target/tmp/styles/**/*.css', {read: false}),
                {
                    relative: true
                }))
            .pipe(gulp.dest('app'));
    });

    gulp.task('styles', ['lint-scss'], function () {
        return gulp.src(['app/app.scss'])
            .pipe(sass())
            .pipe(gulp.dest('target/tmp/styles'));
    });

    gulp.task('inject-partials', ['partials'], function () {
        return gulp.src('app/index.html')
            .pipe(gulpInject(
                gulp.src('target/tmp/partials/**/*.js', {read: false}),
                {
                    starttag: '<!-- inject:partials -->',
                    relative: true
                }
            ))
            .pipe(gulp.dest('app'));
    });

    gulp.task('partials', ['lint-html'], function () {
        var minificationOptions = _.merge({}, partialsMinifyDefaults, gulp.config.minification);

        return gulp.src(['app/**/*.html', '!app/index.html'])
            .pipe(htmlmin(minificationOptions.html))
            .pipe(ngHtml2js({
                moduleName: gulp.config.app.module
            }))
            .pipe(gulp.dest('target/tmp/partials'))
            .pipe(size());
    });

    gulp.task('inject-js', ['test'], function () {
        return gulp.src('app/index.html')
            .pipe(gulpInject(
                gulp.src(javaScriptToInject)
                    .pipe(naturalSort())
                    .pipe(angularFilesort()),
                {
                    relative: true
                }
            ))
            .pipe(gulp.dest('app'));
    });

    gulp.task('fonts', function () {
        return gulp.src('bower_components/**/*')
            .pipe(filter('**/*.{eot,ttf,woff,woff2}'))
            .pipe(flatten())
            .pipe(gulp.dest('target/tmp/fonts'))
            .pipe(gulp.dest('target/dist/fonts'))
            .pipe(size());
    });

    gulp.task('images', function () {
        return gulp.src('app/**/img/**/*')
            .pipe(gulp.dest('target/dist'))
            .pipe(gulp.dest('target/tmp'))
            .pipe(size());
    });

    gulp.task('resources', function () {
        return gulp.src('app/resources/**/*')
            .pipe(gulp.dest('target/dist/resources'))
            .pipe(gulp.dest('target/tmp/resources'))
            .pipe(size());
    });

    gulp.task('lib', function () {
        return gulp.src('app/lib/**/*')
            .pipe(gulp.dest('target/dist/lib'))
            .pipe(gulp.dest('target/tmp/lib'))
            .pipe(size());
    });

    gulp.task('build', ['version', 'inject', 'images', 'fonts', 'resources', 'lib', 'lint-js'], function (callback) {
        callback();
    });

    gulp.task('version', function () {
        var json = JSON.parse(fs.readFileSync('./package.json'));
        util.log(util.colors.blue.bold("Gript building " + json.name + " " + json.version + "..."));
    });
};

