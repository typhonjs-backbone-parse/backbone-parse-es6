![Backbone-Parse-ES6](http://i.imgur.com/VNuAXXX.png)

[![Backbone](https://img.shields.io/badge/backbone-1.2.3-brightgreen.svg?style=flat)](https://github.com/jashkenas/backbone)
[![Parse](https://img.shields.io/badge/parse-1.6.7-brightgreen.svg?style=flat)](https://github.com/ParsePlatform/Parse-SDK-JS)
[![Documentation](http://js.typhonrt.org/docs/backbone-parse-es6/badge.svg)](http://js.typhonrt.org/docs/backbone-parse-es6/)
[![Code Style](https://img.shields.io/badge/code%20style-allman-brightgreen.svg?style=flat)](https://en.wikipedia.org/wiki/Indent_style#Allman_style)

[![Build Status](https://travis-ci.org/typhonjs/backbone-parse-es6.svg?branch=master)](https://travis-ci.org/typhonjs/backbone-parse-es6)
[![Dependency Status](https://www.versioneye.com/user/projects/5627b8ff36d0ab0019000f7b/badge.svg?style=flat)](https://www.versioneye.com/user/projects/5627b8ff36d0ab0019000f7b)

Backbone supplies structure to JavaScript-heavy applications by providing models with key-value binding and custom events, collections with a rich API of enumerable functions, views with declarative event handling.

Backbone-Parse-ES6 is an extension to Backbone-ES6 (https://github.com/typhonjs/backbone-es6) which is a fork of Backbone (https://github.com/jashkenas/backbone) converting and modularizing it into idiomatic ES6. The impetus for this fork is to experiment with modernizing and making Backbone easier to modify in a granular fashion. In particular the Parse JS SDK (http://www.parse.com) previously also was a fork of Backbone, but with the 1.6+ SDK release the Backbone API was unceremoniously removed. Backbone-ES6 provides the base for Backbone-Parse-ES6  which provides a solution for Backbone dependent Parse users. Another reason for Backbone-Parse-ES6 is supporting end to end documentation via ESDoc for ES6 frameworks and apps built on top of Backbone-Parse-ES6. An experimental ESDoc plugin `esdoc-jspm-plugin.js` is being tested in this repo to integrate documentation generation across multiple modules / source roots via JSPM. 

Backbone-Parse-ES6 uses SystemJS / JSPM (www.jspm.io) for dependency management and bundling distributions. For an example of using SystemJS / JSPM directly with Backbone-Parse-ES6 please see this demo repo:
https://github.com/typhonjs/backbone-parse-es6-demo

When a new Backbone release is made (next 1.2.4) Backbone-ES6 will be updated. Tests from Backbone will be ported to Backbone-ES6 with the upcoming 1.2.4 release. Forthcoming tests for Parse integration will be added to this repo. 

This repository contains several pre-packed downloads in the `dist/` directory. There are AMD, CJS, and Global distributions that contain the Backbone and Parse libraries. The "global-inclusive" bundle includes the latest Parse, jQuery (2.1.4) and Underscore (1.8.3) libraries.

Please view the wiki for build instructions and other pertinent usage info:
https://github.com/typhonjs/backbone-parse-es6/wiki

API documentation can be found in the `docs/` directory and online here:
http://js.typhonrt.org/docs/backbone-parse-es6/

For original Backbone Docs, License, Tests, pre-packed downloads, see:
http://backbonejs.org

To suggest a feature or report a bug:
https://github.com/typhonjs/backbone-parse-es6/issues

Many thanks to DocumentCloud & all Backbone contributors.

Backbone (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors

Backbone-Parse-ES6 (c) 2015 Michael Leahy, TyphonRT, Inc. 

Parse JS SDK (c) 2015 Parse / Facebook 

Backbone / Backbone-Parse-ES6 may be freely distributed under the MIT license.
