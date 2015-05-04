'use strict';
//gulp
var gulp = require('gulp');

//task
var gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    watch = require('gulp-watch'),
    open = require('gulp-open'),
    connect = require('gulp-connect'),
    changed = require('gulp-changed'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    combine = require('stream-combiner'),
    pkg = require('./package.json'),
    replace = require('gulp-replace-task');

var cfg = {
    version: pkg.version,
    src: './dist'
};

gulp.task('lint', function() {
    return gulp.src('./src/*.js')
        .pipe(watch())
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('minify', function() {
    console.dir(cfg);
    return gulp.src('./src/*.js')
        .pipe(concat('hui.template.' + cfg.version + '.js'))
        .pipe(replace({
            patterns: [
                {
                    match: 'VERSION',
                    replacement: cfg.version
                }
            ]
        }))
        .pipe(gulp.dest(cfg.src))
        .pipe(rename('hui.template.' + cfg.version + '.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(cfg.src));
});

gulp.task('jsmin', function() {
    return gulp.src('./src/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(cfg.src));
});

gulp.task('all', function() {
    gulp.src('./src/**')
        .pipe(connect.reload());
});


gulp.task('mocha', function() {
    gulp.src('./test/hui_tmpl_test.js')
        .pipe(mocha({
            reporter: 'nyan'
        }));
});

gulp.task('watch', function() {
    gulp.watch([cfg.src + '/**'], ['all']);
});

//gulp.task('default', ['lint', 'minify', 'mocha']);
gulp.task('default', ['minify', 'mocha']);