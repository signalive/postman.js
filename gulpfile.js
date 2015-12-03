var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");

gulp.task('default', function() {
    return gulp.src('src/postman.js')
        .pipe(gulp.dest('dist/'))
        .pipe(rename('postman.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/'));
});
