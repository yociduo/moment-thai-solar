var fs = require("fs");
var rimraf = require("rimraf");
var gulp = require("gulp");
var header = require("gulp-header");
var sourcemaps = require("gulp-sourcemaps");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

var source = "src/moment-thai-solar.js";
var targetPath = "dist/";

var config = {
    pkg: JSON.parse(fs.readFileSync("./package.json")),
    banner: "/*!\n" +
        " * <%= pkg.name %>\n" +
        " * <%= pkg.homepage %>\n" +
        " * Version: <%= pkg.version %> - <%= timestamp %>\n" +
        " * License: <%= pkg.license %>\n" +
        " */\n\n\n"
};

gulp.task("clean", function (cb) {
    rimraf(targetPath + "*", cb);
});

gulp.task("build", function (cb) {
    return gulp.src(source)
        .pipe(header(config.banner, {
            timestamp: (new Date()).toISOString(),
            pkg: config.pkg
        }))
        .pipe(gulp.dest(targetPath))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(header(config.banner, {
            timestamp: (new Date()).toISOString(),
            pkg: config.pkg
        }))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(targetPath));
});

gulp.task("default", ["clean", "build"]);

gulp.task("watch", function () {
    gulp.watch(source, ["default"]);
});