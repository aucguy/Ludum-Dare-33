const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rimraf = require('rimraf');
const babel = require('gulp-babel');
const path = require('path');
const jshint = require('gulp-jshint');

function copyJs(folder) {
  return new Promise((resolve, reject) => {
    gulp.src(path.join(folder, '**/*.js'))
       .pipe(babel({
          presets: ['@babel/env']
       }))
      .pipe(uglify())
      .pipe(gulp.dest(path.join('build/release', folder)))
      .on('end', resolve)
      .on('error', reject);
  });
}

gulp.task('build', async () => {
  rimraf.sync('build/release');
  await copyJs('scripts/canvg');
  await copyJs('scripts/zeploid/src');
  await copyJs('scripts/LD33');
  
  await new Promise((resolve, reject) => {
    gulp.src('assets/**/*')
      .pipe(gulp.dest('build/release/assets'))
      .on('end', resolve)
      .on('error', reject);
  });
  
  await new Promise((resolve, reject) => {
    gulp.src('run.html')
      .pipe(gulp.dest('build/release/'))
      .on('end', resolve)
      .on('error', reject);
  });
});

gulp.task('lint', function() {
  return gulp.src('scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('gulp-jshint-html-reporter'));
});