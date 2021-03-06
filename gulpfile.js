var bg = require('gulp-bg')
var gulp = require('gulp')
var harmonize = require('harmonize')
var jest = require('jest-cli')
var makeWebpackConfig = require('./webpack/makeconfig')
var runSequence = require('run-sequence')
var webpackBuild = require('./webpack/build')
var webpackDevServer = require('./webpack/devserver')
var yargs = require('yargs')

// Enables node's --harmony flag programmatically for jest.
harmonize()

var args = yargs
  .alias('p', 'production')
  .argv

gulp.task('env', function() {
  process.env.NODE_ENV = args.production ? 'production' : 'development'
})

gulp.task('build-webpack-production', webpackBuild(makeWebpackConfig(false)))
gulp.task('build-webpack-dev', webpackDevServer(makeWebpackConfig(true)))
gulp.task('build-webpack', [args.production ? 'build-webpack-production' : 'build-webpack-dev'])
gulp.task('build', ['build-webpack'])

gulp.task('jest', function(done) {
  var rootDir = './src'
  function onComplete(success) {
    done(success ? null : 'jest failed')
    process.on('exit', function() {
      process.exit(success ? 0 : 1)
    })
  }
  jest.runCLI({config: {
    'rootDir': rootDir,
    'scriptPreprocessor': '../node_modules/babel-jest',
    'testFileExtensions': ['es6', 'js'],
    'moduleFileExtensions': ['js', 'json', 'es6']
  }}, rootDir, onComplete)
})

// TODO: Add es6lint.
gulp.task('test', function(done) {
  // Run test tasks serially, because it doesn't make sense to build when tests
  // are not passing, and it doesn't make sense to run tests, if lint has failed.
  // Gulp deps aren't helpful, because we want to run tasks without deps as well.
  runSequence('jest', 'build-webpack-production', done)
});

gulp.task('server', ['env', 'build'], bg('node', 'src/server'))

gulp.task('default', ['server'])
