var vueify = require("vueify");

var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var sourcemaps = require("gulp-sourcemaps");
var buffer = require("vinyl-buffer");

var sass = require("gulp-sass");
var minify = require("gulp-minify-css");
// var prefix = require("gulp-autoprefixer");
// var concat = require("gulp-concat");
// var uglify = require("gulp-uglify");
// var gutil = require("gulp-util");

var paths = {
    pages: ["src/**/*.html"],
    styles: ["src/sass/**/*.sass"],
    scripts: ["src/**/*.js"]
};

gulp.task("html", function() {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("."));
});

gulp.task("styles", function() {
    return gulp.src(paths.styles)
        .pipe(sass({
            "includePaths": [
                "./node_modules"
            ]
        }).on("error", sass.logError))
        // .pipe(prefix({cascade: true}))
        .pipe(minify())
        .pipe(gulp.dest("./css/"));
});

gulp.task("scripts", function() {
    return browserify({
        basedir: ".",
        debug: true,
        entries: ["src/main.js"],
        cache: {},
        packageCache: {},
        insertGlobals: true
    })
    .transform(vueify)
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    // .pipe(uglify())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./js/"));
});

gulp.task("watch", function() {
    gulp.watch(paths.scripts, ["scripts"]);
    gulp.watch(paths.styles, ["styles"]);
    gulp.watch(paths.pages, ["html"]);
});

gulp.task("default", gulp.series("scripts", "styles", "html"));
