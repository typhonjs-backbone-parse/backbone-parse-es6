/**
 * esdoc-jspm-plugin.js -- Provides support for JSPM packages adding them to ESDoc based on path substitution.
 *
 * As things go since ESDoc plugins can't perform asynchronous operations a two part setup is necessary. In this case
 * Gulp is used to preprocess the esdoc-jspm.json config file which contains a "jspm" section indicating which
 * JSPM packages are to be resolved. Here is an example entry:
 *
 *    "jspm": {
 *       "packages": ["backbone-es6", "backbone-parse-es6"]
 *     },
 *
 * The preprocessor in Gulp will attempt to resolve normalized paths using SystemJS and will add additional data to
 * the esdoc-jspm.json config file with the normalized paths. Also included is the full path from the OS root to
 * the actual locations of the JSPM normalized paths.
 *
 * In the `onHandleConfig` method below further construction of all resources necessary in code, import, and search
 * processing are constructed.
 */

/* eslint-disable */

var fs =    require('fs');
var path =  require('path');

var docDestination = null;
var docSearchScript = null;

// Stores all RegExp for JSPM packages to run against ES6 import statements.
var codeReplace = [];

// Stores all from -> to strings to replace to run against ES6 import statements.
var importReplace = [];

// Stores all RegExp for JSPM packages to run against generated HTML replacing normalized paths.
var htmlReplace = [];

// Stores all from -> to strings to replace for JSPM packages in generated search script data.
var searchReplace = [];

// Stores just the JSPM section from the passed in esdoc.json config file.
var configJSPM = {};

/**
 * Prepares additional config parameters for ESDoc. An all inclusive source root of "." is supplied, so an
 * "includes" array is constructed with all source roots for the local project and all associated jspm packages.
 *
 * Also all RegExp instances are created and stored for later usage.
 *
 * @param {object}   ev - Event from ESDoc containing data field
 */
exports.onHandleConfig = function(ev)
{
   if (ev.data.config.jspm)
   {
      docDestination = ev.data.config.destination;
      docSearchScript = docDestination + path.sep +'script' +path.sep +'search_index.js';

      ev.data.config.source = '.';

      configJSPM = ev.data.config.jspm;

      var packageData = configJSPM.packageData || [];
      var regex;

      // Process include paths --------------------------------------------------------------------------------------

      // Include the source root of this repos code.
      var includes = ['^' +configJSPM.localSrcRoot];

      // Add the source roots of all associated jspm packages.
      for (var cntr = 0; cntr < packageData.length; cntr++)
      {
         if (packageData[cntr].jspmPath)
         {
            includes.push('^' +packageData[cntr].jspmPath);
         }
      }

      ev.data.config.includes = includes;

      // Process code import replacements ---------------------------------------------------------------------------

      // Process all associated JSPM packages.
      for (cntr = 0; cntr < packageData.length; cntr++)
      {
         regex = new RegExp('from[\\s]+(\'|")' +packageData[cntr].normalizedPath, 'g');
         codeReplace.push({ from: regex, to: packageData[cntr].jspmFullPath });
      }

      // Process source code import replacements --------------------------------------------------------------------

      // Create import replacements.
      var wrongImportBase = configJSPM.rootDir +path.sep +configJSPM.rootDir +path.sep;

      var wrongImport = wrongImportBase +configJSPM.localSrcRoot;
      var actualImport = configJSPM.rootDir +path.sep +configJSPM.localSrcRoot;

      importReplace.push({ from: wrongImport, to: actualImport });

      // Process all associated JSPM packages.
      for (cntr = 0; cntr < packageData.length; cntr++)
      {
         wrongImport = wrongImportBase +packageData[cntr].jspmPath;
         actualImport = packageData[cntr].normalizedPath;

         importReplace.push({ from: wrongImport, to: actualImport });
      }

      // Process HTML replacements ----------------------------------------------------------------------------------

      // Process all associated JSPM packages.
      for (cntr = 0; cntr < packageData.length; cntr++)
      {
         regex = new RegExp('>' +configJSPM.rootDir +path.sep +packageData[cntr].jspmPath, 'g');
         htmlReplace.push({ from: regex, to: '>' +packageData[cntr].normalizedPath });

         regex = new RegExp('>' +packageData[cntr].jspmPath, 'g');
         htmlReplace.push({ from: regex, to: '>' +packageData[cntr].normalizedPath });
      }

      // Process HTML replacements ----------------------------------------------------------------------------------

      // Process all associated JSPM packages.
      for (cntr = 0; cntr < packageData.length; cntr++)
      {
         var fromValue = configJSPM.rootDir +path.sep +packageData[cntr].jspmPath;
         searchReplace.push({ from: fromValue, to: packageData[cntr].normalizedPath });
      }
   }
};

/**
 * For all imports in all source files replace any normalized JSPM package paths with the actual full path to the source
 * file in 'jspm_packages'.
 *
 * @param ev
 */
exports.onHandleCode = function(ev) {

   for (var cntr = 0; cntr < codeReplace.length; cntr++)
   {
      (function(codeReplace)
      {
         // Must construct the replacement as either `'` or `"` can be used to surround the import statement.
         // `p1` is the quote format captured by the regex.
         ev.data.code = ev.data.code.replace(codeReplace.from, function(match, p1)
         {
            return 'from ' +p1 +codeReplace.to;
         });
      })(codeReplace[cntr]);
   }
};

/**
 * Since the source root is "." / the base root of the repo ESDoc currently creates the wrong import path, so they
 * need to be corrected. ESDoc fabricates "<base root>/<base root>" when we want just "<base root>/" for the local
 * project code. For the JSPM packages the import statement is "<base root>/<base root>/<JSPM path>" where
 * the desired path is the just the normalized JSPM path to the associated package.
 *
 * @param {object}   ev - Event from ESDoc containing data field
 */
exports.onHandleTag = function(ev)
{
   // Perform import replacement.
   for (var cntr = 0; cntr < ev.data.tag.length; cntr++)
   {
      var tag = ev.data.tag[cntr];

      if (tag.importPath)
      {
         for (var cntr2 = 0; cntr2 < importReplace.length; cntr2++)
         {
            tag.importPath = tag.importPath.replace(importReplace[cntr2].from, importReplace[cntr2].to);
         }
      }
   }
};

/**
 * The generated HTML also includes the full JSPM path, so various RegExp substitutions are run to transform the
 * full paths to the normalized JSPM package paths.
 *
 * @param {object}   ev - Event from ESDoc containing data field
 */
exports.onHandleHTML = function(ev)
{
   for (var cntr = 0; cntr < htmlReplace.length; cntr++)
   {
      ev.data.html = ev.data.html.replace(htmlReplace[cntr].from, htmlReplace[cntr].to);
   }
};

/**
 * The search data file must have JSPM package paths replaced with normalized versions.
 *
 * @param {object}   ev - Event from ESDoc containing data field
 */
exports.onComplete = function(ev)
{
   var buffer = fs.readFileSync(docSearchScript, 'utf8');

   // Remove the leading Javascript assignment so we are left with a JSON file.
   buffer = buffer.replace('window.esdocSearchIndex = ', '');

   var json = JSON.parse(buffer);

   // Replace all long JSPM paths with normalized paths.
   for (var cntr = 0; cntr < json.length; cntr++)
   {
      // Index 2 is the name of the entry.
      var entry = json[cntr];
      if (entry.length >= 2)
      {
         for (var cntr2 = 0; cntr2 < searchReplace.length; cntr2++)
         {
            entry[2] = entry[2].replace(searchReplace[cntr2].from, searchReplace[cntr2].to);
         }
      }
   }

   // Rewrite the search_index.js file
   buffer = 'window.esdocSearchIndex = ' + JSON.stringify(json, null, 2);

   fs.writeFileSync(docSearchScript, buffer);
};