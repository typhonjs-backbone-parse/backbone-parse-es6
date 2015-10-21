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
 * Create docs from ./src using ESDoc. The docs are located in ./docs. Note that experimental support for inclusion
 * of JSPM packages is provided below. This is a two step process including a preprocessing step in the Gulp task
 * to utilizing SystemJS to perform normalization of JSPM packages finding the full path and normalized paths for the
 * given packages in `esdoc-jspm.json` configuration.
 *
 * An experimental ESDoc plugin (`esdoc-jspm-plugin.js`) is provided in the root directory which uses the output of the
 * Gulp task to further process and link code found in JSPM packages with the source of this repo.
 */
gulp.task('docs', function()
{
   var path =        require('path');
   var url =         require('url');

   var esdocConfigLocation = '.' +path.sep +'esdoc.json';
   var esdocJSPMConfigLocation = '.' +path.sep +'esdoc-jspm.json';

   var esdocJSPMConfig = require(esdocJSPMConfigLocation);

   var localSrcRoot = require(esdocConfigLocation).source;

   var System = new jspm.Loader();

   var promises = [];
   var normalizedData = [];

   var rootDir = __dirname.split(path.sep).pop();

   if (esdocJSPMConfig.jspm && esdocJSPMConfig.jspm.packages)
   {
      for (var cntr = 0; cntr < esdocJSPMConfig.jspm.packages.length; cntr++)
      {
         (function (packageName) {
            promises.push(System.normalize(packageName).then(function(normalized)
            {
               // Only process valid JSPM packages
               if (normalized.indexOf('jspm_packages') >= 0)
               {
                  var parsedPath = path.parse(url.parse(normalized).pathname);
                  var fullPath = parsedPath.dir +path.sep +parsedPath.name;
                  var relativePath = path.relative(__dirname, parsedPath.dir) +path.sep +parsedPath.name;

                  try
                  {
                     // Lookup JSPM package esdoc.json to pull out the source location.
                     var packageESDocConfig = require(fullPath +path.sep +'esdoc.json');
                     relativePath += path.sep + packageESDocConfig.source;
                     fullPath += path.sep + packageESDocConfig.source;

                     normalizedData.push(
                     {
                        packageName: packageName,
                        jspmFullPath: fullPath,
                        jspmPath: relativePath,
                        normalizedPath: packageName +path.sep +packageESDocConfig.source,
                        source: packageESDocConfig.source
                     });
                  }
                  catch(err)
                  {
                     console.log('docs - failed to require JSPM package esdoc.json');
                  }
               }
            }));
         })(esdocJSPMConfig.jspm.packages[cntr]);
      }
   }

   Promise.all(promises).then(function()
   {
      // There are JSPM packages so add generated config data created above.
      if (promises.length > 0)
      {
         esdocJSPMConfig.jspm.localSrcRoot = localSrcRoot;
         esdocJSPMConfig.jspm.rootDir = rootDir;
         esdocJSPMConfig.jspm.packageData = normalizedData;
      }

      // Launch ESDoc with the generated config from above.
      gulp.src(localSrcRoot)
       .pipe(esdoc(esdocJSPMConfig));
   })
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
 * Runs "npm uninstall"
 */
gulp.task('npm-uninstall', function(cb)
{
   var exec = require('child_process').exec;
   exec('npm uninstall', function (err, stdout, stderr)
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