var gulp       = require('gulp');
var gutil      = require('gulp-util');
var concat     = require('gulp-concat');
var path       = require('path');

var buildPaths = [
  './lib/main.js',
  './lib/**/*'
];

gulp.task('build', function() {
  return gulp.src(buildPaths)
  .pipe(concat('rise.js'))
  .pipe(gulp.dest('./site/js/lib'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(buildPaths, ['build']);
});

gulp.task('default', ['build', 'watch']);
