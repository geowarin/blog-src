var gulp = require('gulp');
var requireDir = require('require-dir');

requireDir('_build/gulp/tasks');

gulp.task('build', ['style', 'categories', 'js']);
gulp.task('default', ['watch']);
