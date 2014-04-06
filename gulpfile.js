var gulp = require('gulp');
var es = require('event-stream');

var serve = require('gulp-serve');
var watch = require('gulp-watch');
var coffee = require('gulp-coffee');
var less = require('gulp-less');

var paths = {
	scripts: ['src/**/*.coffee'],
	styles: ['src/**/*.less'],
	copy: ['src/**/*.css', 'src/**/*.js', 'src/**/*.html', 'src/**/*.*{cts,ttf,ico}']
};

gulp.task('scripts', function() {
	return gulp.src(paths.scripts)
		.pipe(watch())
		.pipe(coffee({
			sourceMap: true
		}))
		.pipe(gulp.dest('build'));
});

gulp.task('styles', function() {
	return es.merge(
		gulp.src(paths.styles)

		.pipe(less({
			sourceMap: true,
			outputSourceFiles: true
		}))
		.pipe(gulp.dest('build')),
		gulp.src('src/**/*.css')
		.pipe(gulp.dest('build'))
	);
});

gulp.task('copy', function() {
	return gulp.src(paths.copy)
		.pipe(gulp.dest('build'));
})

gulp.task('serve', serve({
	root: ['build', 'src'],
	port: 9000
}));


gulp.task('watch', function() {
	gulp.watch(paths.scripts, ['scripts']);
	gulp.watch(paths.styles, ['styles']);
	gulp.watch(paths.copy, ['copy']);
});


gulp.task('default', ['scripts', 'styles', 'copy', 'serve', 'watch']);