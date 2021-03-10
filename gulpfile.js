// gulp v4.0.2

const gulp        = require("gulp"),
      sass        = require("gulp-sass"),
      uglify      = require("gulp-uglify"),
      cleanCSS    = require("gulp-clean-css"),
      plumber     = require("gulp-plumber"),
      mmq         = require("gulp-merge-media-queries");
 
const cleanCSS_1stSettings = 
  { // ref: https://outcloud.blogspot.com/2018/09/Minify-CSS-by-CleanCSS-MergeMediaQuery.html
    level: {
      1: {
        roundingPrecision : 3
      },
      2: {
        removeDuplicateFontRules: true,
        removeDuplicateMediaBlocks: true,
        removeDuplicateRules: true,
        mergeSemantically: true,
        removeUnusedAtRules: true,
        restructureRules: true
      }
    }
  };

const cleanCSS_2ndSettings =
  {
    level: {
      1: {
        all: false,
        removeWhitespace: true
      }
    }
  };

gulp.task("sass", function() {
  return gulp.src("./src/css/*.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(cleanCSS(cleanCSS_1stSettings))
    .pipe(mmq())
    .pipe(cleanCSS(cleanCSS_2ndSettings))
    .pipe(gulp.dest("./docs/css/"));
});

gulp.task("js", function() {
  return gulp.src("./src/js/*.js")
    .pipe(gulp.dest("./docs/js/"));
    // .pipe(uglify())
    
});

gulp.task("html", function() {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('./docs/'));
});

gulp.task("img", function() {
    return gulp.src('src/img/*')
        .pipe(gulp.dest('./docs/img/'));
});

gulp.task("data", function() {
  return gulp.src('src/data/**/*.csv')
      .pipe(gulp.dest('./docs/data/'));
});

// watch
gulp.task("watch", (done) => {
    gulp.watch("./src/js/*.js",    gulp.series("js"));
    gulp.watch("./src/css/*.scss", gulp.series("sass"));
    gulp.watch("./src/*.html", gulp.series("html"));
    gulp.watch("./src/img/", gulp.series("img"));
    gulp.watch("./src/data/", gulp.series("data"));
    done();
  });
  
  // scripts tasks
  gulp.task('default', gulp.task('watch'));
  
  