gulp = require("gulp")
es = require("event-stream")
serve = require("gulp-serve")
watch = require("gulp-watch")
coffee = require("gulp-coffee")
less = require("gulp-less")
paths =
  scripts: ["src/**/*.coffee"]
  less: ["src/**/*.less"]
  copy: [
    "src/**/*.css"
    "src/**/*.js"
    "src/**/*.html"
    "src/**/*.*{cts,ttf,ico}"
  ]

gulp.task "scripts", ->
  gulp.src(paths.scripts)
    .pipe(watch())
    .pipe(coffee(sourceMap: true))
    .pipe gulp.dest("build")

gulp.task "less", ->
  gulp.src(paths.less)
    .pipe(less(
      sourceMap: true
      outputSourceFiles: true
  ))
    .pipe gulp.dest("build")

gulp.task "copy", ->
  gulp.src(paths.copy)
    .pipe gulp.dest("build")

gulp.task "serve", serve(
  root: [
    "build"
    "src"
  ]
  port: 8000
)
gulp.task "watch", ->
  gulp.watch paths.less, ["less"]
  gulp.watch paths.copy, ["copy"]
  return

gulp.task "default", [
  "scripts"
  "less"
  "copy"
  "serve"
  "watch"
]