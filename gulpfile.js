/**
 * Gulp operations for Backbone-Parse-ES6
 *
 * The following tasks are available:
 * bundle - Creates one or more bundles defined in './bundle-config.js'
 * docs - Creates documentation and outputs it in './docs'
 * lint - Runs ESLint outputting to console.
 * jspm-inspect - Executes 'jspm inspect'
 * jspm-install - Executes 'jspm install'
 * jspm-update - Executes 'jspm update'
 * npm-install - Executes 'npm install'
 * npm-uninstall - Executes 'npm uninstall'
 * test - Runs lint and bundle tasks.  (Add "--travis" argument to run minimal bundle op for Travis CI)
 */

/* eslint-disable */

var gulp =        require('gulp');

var argv =        require('yargs').argv;
var esdoc =       require('gulp-esdoc');
var eslint =      require('gulp-eslint');
var fs =          require('fs');
var jspm =        require('jspm');

var Promise =     require("bluebird");

// Set the package path to the local root where config.js is located.
jspm.setPackagePath('.');

/**
 * Bundles Backbone-Parse-ES6 via the config file found in './bundle-config.json'. This file contains an array of
 * parameters for invoking SystemJS Builder.
 *
 * An example entry:
 *    {
 *       "destBaseDir": "./dist/",        // Root destination directory for bundle output.
 *       "destFilename": "backbone.js",   // Destination bundle file name.
 *       "formats": ["amd", "cjs"],       // Module format to use / also defines destination sub-directory.
 *       "mangle": false,                 // Uglify mangle property used by SystemJS Builder.
 *       "minify": false,                 // Minify mangle property used by SystemJS Builder.
 *       "src": "src/ModuleRuntime.js",   // Source file for SystemJS Builder
 *       "extraConfig":                   // Defines additional config parameters to load after ./config.json is loaded.
 *       {
 *          "meta":
 *          {
 *             "jquery": { "build": false },
 *             "underscore": { "build": false }
 *          }
 *       }
 *    },
 */
gulp.task('bundle', function()
{
   var promiseList = [];

   // When testing the build in Travis CI we only need to run a single bundle operation.
   var bundleInfo = argv.travis ? require('./bundle-config-travis.json') : require('./bundle-config.json');

   // Attempt to create './dist' directory if it does not exist.
   if (!fs.existsSync('dist'))
   {
      fs.mkdirSync('dist');
   }

   for (var cntr = 0; cntr < bundleInfo.entryPoints.length; cntr++)
   {
      var entry = bundleInfo.entryPoints[cntr];

      var destBaseDir = entry.destBaseDir;
      var destFilename = entry.destFilename;
      var srcFilename = entry.src;
      var extraConfig = entry.extraConfig;
      var formats = entry.formats;
      var mangle = entry.mangle;
      var minify = entry.minify;

      for (var cntr2 = 0; cntr2 < formats.length; cntr2++)
      {
         var format = formats[cntr2];

         var destDir = destBaseDir +format;
         var destFilepath = destDir +'/' +destFilename;

         promiseList.push(buildStatic(srcFilename, destDir, destFilepath, minify, mangle, format, extraConfig));
      }
   }

   return Promise.all(promiseList).then(function()
   {
      console.log('All Bundle Tasks Complete');
   })
   .catch(function (err)
   {
      console.log('Bundle error: ' +err);
      process.exit(1);
   });
});

/**
 * Create docs from ./src using ESDoc. The docs are located in ./docs
 */
gulp.task('docs', function()
{
   var path = require('path');

   var esdocConfig = require('.' +path.sep +'esdoc.json');

   // Launch ESDoc
   return gulp.src(esdocConfig.source).pipe(esdoc(esdocConfig));
});

/**
 * Runs eslint
 */
gulp.task('lint', function()
{
   return gulp.src('./src/**/*.js')
    .pipe(eslint({ useEslintrc: true }))
    .pipe(eslint.formatEach('compact', process.stderr))
    .pipe(eslint.failOnError());
});

/**
 * Runs "jspm inspect"
 */
gulp.task('jspm-inspect', function(cb)
{
   var exec = require('child_process').exec;
   exec('jspm inspect', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "jspm install"
 */
gulp.task('jspm-install', function(cb)
{
   var exec = require('child_process').exec;
   exec('jspm install', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "jspm update"
 */
gulp.task('jspm-update', function(cb)
{
   var exec = require('child_process').exec;
   exec('jspm update', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "npm install"
 */
gulp.task('npm-install', function(cb)
{
   var exec = require('child_process').exec;
   exec('npm install', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "npm uninstall <package> for all node modules installed."
 */
gulp.task('npm-uninstall', function(cb)
{
   var exec = require('child_process').exec;
   exec('for package in `ls node_modules`; do npm uninstall $package; done;', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "lint" and "bundle"; useful for testing and Travis CI.
 */
gulp.task('test', ['lint', 'bundle']);

/**
 * Returns a Promise which encapsulates an execution of SystemJS Builder.
 *
 * @param srcFilename
 * @param destDir
 * @param destFilepath
 * @param minify
 * @param mangle
 * @param format
 * @param extraConfig
 * @returns {bluebird} Promise
 */
function buildStatic(srcFilename, destDir, destFilepath, minify, mangle, format, extraConfig)
{
   return new Promise(function(resolve, reject)
   {
      // Attempt to create destDir if it does not exist.
      if (!fs.existsSync(destDir))
      {
         fs.mkdirSync(destDir);
      }

      // Error out early if destDir does not exist.
      if (!fs.existsSync(destDir))
      {
         console.error('Could not create destination directory: ' +destDir);
         reject();
      }

      var builder = new jspm.Builder();
      builder.loadConfig('./config.js').then(function()
      {
         if (typeof extraConfig !== 'undefined')
         {
            builder.config(extraConfig);
         }

         console.log('Bundle queued - srcFilename: ' +srcFilename +'; format: ' +format  +'; mangle: ' +mangle
          +'; minify: ' +minify +'; destDir: ' +destDir +'; destFilepath: ' +destFilepath);

         builder.buildStatic(srcFilename, destFilepath,
         {
            minify: minify,
            mangle: mangle,
            format: format
         })
         .then(function ()
         {
            console.log('Bundle complete - filename: ' +destFilepath +' minify: ' +minify +'; mangle: ' +mangle
             +'; format: ' +format);

            resolve();
         })
         .catch(function (err)
         {
            console.log('Bundle error - filename: ' +destFilepath +' minify: ' +minify + '; mangle: ' +mangle
             +'; format: ' +format);

            console.log(err);

            resolve();
         });
      });
   });
}