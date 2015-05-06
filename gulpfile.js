'use strict';
//gulp
var gulp = require('gulp'),
    fs = require('fs');

//task
var uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    mocha = require('gulp-mocha'),
    pkg = require('./package.json'),
    replace = require('gulp-replace-task');

var cfg = {
    version: pkg.version,
    src: './dist/' + pkg.version
};

gulp.task('lint', function() {
    return gulp.src('./src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build', function() {
    return gulp.src('./src/hui.template.js')
        .pipe(replace({
            patterns: [{
                match: 'VERSION',
                replacement: cfg.version
            }]
        }))
        .pipe(gulp.dest(cfg.src))
        .pipe(rename('hui.template.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(cfg.src));
});

gulp.task('dot', function() {
    return gulp.src('./src/hui.template.js')
        .pipe(rename('hui.template.dot.js'))
        .pipe(replace({
            patterns: [{
                match: 'VERSION',
                replacement: cfg.version
            }]
        }))      
        .pipe(replace({
            patterns: [{
                match: /\/\*\@\@REPLACE_TAG_BEGIN\*\/[\s\S]*?\/\*\@\@REPLACE_TAG_END\*\//g,
                replacement: function(){
                    var data = fs.readFileSync('./src/dot.ext.js');
                    return data.toString().replace(/HUI\.template/g, 'tmplEngine');
                }
            }]
        }))
        .pipe(gulp.dest(cfg.src))
        .pipe(rename('hui.template.dot.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(cfg.src));
});

gulp.task('mocha', function() {
    gulp.src('./test/hui_tmpl_test.js')
        .pipe(mocha({
            reporter: 'nyan'
        }));
});

//gulp.task('default', ['lint', 'minify', 'mocha']);
gulp.task('default', ['build', 'dot', 'mocha']);
