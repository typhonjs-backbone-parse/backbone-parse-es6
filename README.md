![Backbone-Parse-ES6](http://i.imgur.com/VNuAXXX.png)

[![Backbone](https://img.shields.io/badge/backbone-1.2.3-yellowgreen.svg?style=flat)](https://github.com/jashkenas/backbone)
[![Parse](https://img.shields.io/badge/parse-1.7.1-yellowgreen.svg?style=flat)](https://github.com/ParsePlatform/Parse-SDK-JS)
[![Documentation](http://js.docs.typhonrt.org/typhonjs-parse/backbone-parse-es6/badge.svg)](http://js.docs.typhonrt.org/typhonjs-parse/backbone-parse-es6/)
[![Code Style](https://img.shields.io/badge/code%20style-allman-yellowgreen.svg?style=flat)](https://en.wikipedia.org/wiki/Indent_style#Allman_style)
[![License](https://img.shields.io/badge/license-MPLv2-yellowgreen.svg?style=flat)](https://github.com/typhonjs-backbone-parse/backbone-parse-es6/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/typhonjs/TyphonJS.svg)](https://gitter.im/typhonjs/TyphonJS)

[![Build Status](https://travis-ci.org/typhonjs-backbone-parse/backbone-parse-es6.svg?branch=master)](https://travis-ci.org/typhonjs-backbone-parse/backbone-parse-es6)
[![Dependency Status](https://www.versioneye.com/user/projects/56eb9f644e714c004f4d0c66/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56eb9f644e714c004f4d0c66)


Backbone supplies structure to JavaScript-heavy applications by providing models with key-value binding and custom events, collections with a rich API of enumerable functions, views with declarative event handling.

backbone-parse-es6 is an extension to [backbone-es6](https://github.com/typhonjs-backbone/backbone-es6) which is a fork of [Backbone](https://github.com/jashkenas/backbone) converting and modularizing it into idiomatic ES6. The impetus for this fork is to experiment with modernizing and making Backbone easier to modify in a granular fashion. In particular the Parse JS SDK (http://www.parse.com) previously also was a fork of Backbone, but with the 1.6+ SDK release the Backbone API was unceremoniously removed. backbone-es6 provides the base for backbone-parse-es6  which provides a solution for Backbone dependent Parse users. 

Another reason for backbone-parse-es6 is supporting end to end documentation via ESDoc for ES6 frameworks and apps built on top of backbone-parse-es6. Two ESDoc plugins, [esdoc-plugin-jspm](https://github.com/typhonjs-node-esdoc/esdoc-plugin-jspm) & [esdoc-plugin-extends-replace](https://github.com/typhonjs-node-esdoc/esdoc-plugin-extends-replace) along with a complete integrated set of Gulp tasks, [typhonjs-core-gulptasks](https://github.com/typhonjs-node-gulp/typhonjs-core-gulptasks) provide documentation generation across multiple modules / source roots via JSPM along with ESLint and several JSPM & NPM tasks.

backbone-parse-es6 uses [JSPM](http://www.jspm.io) / [SystemJS](https://github.com/systemjs/systemjs) for dependency management and bundling distributions. For an example of using JSPM / SystemJS directly with backbone-parse-es6 including typhonjs-core-gulptasks support please see these demo repos:
- https://github.com/typhonjs-demos/backbone-parse-es6-todos
- https://github.com/typhonjs-demos/backbone-parse-es6-todos-improved

When a new Backbone release is made (next 1.3.2) backbone-es6 will be updated. Tests from Backbone will be ported to backbone-es6 with the upcoming 1.3.2 release. Forthcoming tests for Parse integration will be added to this repo. 

This repository contains several pre-packed downloads in the `dist/` directory. There are AMD, CJS, and Global distributions that contain the Backbone and Parse libraries. The "global-inclusive" bundle includes the latest Parse (1.7.1), jQuery (2.2.1) and Underscore (1.8.3) libraries.

API documentation can be found online here:
http://js.docs.typhonrt.org/typhonjs-parse/backbone-parse-es6/

For original Backbone Docs, License, Tests, pre-packed downloads, see:
http://backbonejs.org

To suggest a feature or report a bug:
https://github.com/typhonjs-backbone-parse/backbone-parse-es6/issues

Many thanks to DocumentCloud & all Backbone contributors.

Backbone (c) 2010-present Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors

backbone-parse-es6 (c) 2015-present Michael Leahy, TyphonRT Inc. 

Parse JS SDK (c) 2015-present Parse / Facebook 

backbone-parse-es6 may be freely distributed under the MIT license.
