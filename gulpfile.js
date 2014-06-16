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

gulp.task('copyToAdmin', function() {
  return gulp.src('./site/js/lib/rise.js')
  .pipe(concat('rise.js'))
  .pipe(gulp.dest('../admin/site/js/vendor'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(buildPaths, ['build']);
});

gulp.task('watchCp', function() {
  gulp.watch(buildPaths, ['build', 'copyToAdmin']);
});

gulp.task('default', ['build', 'watch']);
gulp.task('cp', ['build', 'copyToAdmin', 'watchCp']);
