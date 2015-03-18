var fs = require('fs'),
    gulp = require('gulp'),
    nib = require('nib'),
    stylus = require('gulp-stylus'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    bistre = require('bistre'),
    nodemon = require('gulp-nodemon'),
    rename = require('gulp-rename'),
    // imagemin = require('gulp-imagemin'),
    jshint = require('gulp-jshint'),
    pngcrush = require('imagemin-pngcrush');

var paths = {
  fonts: ['./assets/fonts/*', './__local/assets/fonts/*'],
  styles: ['./assets/styles/*.styl', './__local/assets/styles/*.styl'],
  images: ['./assets/images/*', './__local/assets/images/*'],
  misc: ['./assets/misc/*', './__local/assets/misc/*'],
  scripts: {
    browserify: ["./assets/scripts/*.js", "./__local/assets/scripts/*.js"],
    vendor: ["./assets/scripts/vendor/*.js", "./__local/assets/scripts/vendor/*.js"]
  },
  templates: ['./assets/templates/*.hbs', './__local/assets/templates/*.hbs'],
  lintables: [
    "./__local/assets/scripts/**/*.js",
    "./assets/scripts/**/*.js",
    "./adapters/**/*.js",
    "./facets/**/*.js",
    "./lib/**/*.js",
    "./locales/**/*.js",
    "./presenters/**/*.js",
    "./services/**/*.js",
    "./test/**/*.js",
  ]
};

gulp.task('watch', function(){
  gulp.watch(paths.fonts, ['fonts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts.browserify, ['browserify']);
  gulp.watch(paths.templates, ['browserify']);
  gulp.watch(paths.scripts.vendor, ['concat']);
});

gulp.task('styles', function () {
  gulp.src(['./assets/styles/index.styl', './__local/assets/styles/index.styl'])
    .pipe(stylus({use: [nib()]}))
    .pipe(concat('index.css'))
    .pipe(gulp.dest('static/css/'))
});

gulp.task('browserify', function () {
  var entries = ['./assets/scripts/index.js'],
      customJs = './__local/assets/scripts/index.js';

  // add custom js
  fs.exists(customJs, function (exists) {
    if (exists)
    {
      entries.push(customJs);
    }

    browserify({entries: entries})
      .bundle()
      .pipe(source('index.js'))
      .pipe(gulp.dest('static/js/'))
      .pipe(rename('index.min.js'))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest('static/js/'));
  });
});

gulp.task('concat', function () {
  gulp.src(paths.scripts.vendor)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('static/js/'))
});

gulp.task('fonts', function(){
  gulp.src(paths.fonts)
  .pipe(gulp.dest('static/fonts'));
})

gulp.task('images', function(){
  gulp.src(paths.images)
    // .pipe(imagemin({
    //     progressive: true,
    //     svgoPlugins: [{removeViewBox: false}],
    //     use: [pngcrush()]
    // }))
    .pipe(gulp.dest('static/images'));
})

gulp.task('misc', function(){
  gulp.src(paths.misc)
    .pipe(gulp.dest('static/misc'));
})

gulp.task('nodemon', function() {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs js',
    ignore: [
      'assets/',
      'facets/*/test/',
      'node_modules/',
      'static/',
      'test/',
    ],
    stdout: false,
  })
    .on('readable', function () {
      this.stdout
        .pipe(bistre({time: true}))
        .pipe(process.stdout);
      this.stderr
        .pipe(bistre({time: true}))
        .pipe(process.stderr);
    });
});

gulp.task('lint', function() {
  gulp.src(paths.lintables)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('build', ['fonts', 'images', 'misc', 'styles', 'browserify', 'concat']);
gulp.task('dev', ['build', 'nodemon', 'watch']);
gulp.task('default', ['build']);
