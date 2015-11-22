/**
 * ModuleRuntime.js (Parse) -- Provides the standard / default configuration that is the same as Backbone 1.2.3
 */

'use strict';

import Backbone         from 'backbone-es6/src/Backbone.js';
import ParseCollection  from './ParseCollection.js';
import TyphonEvents     from 'typhonjs-backbone-common/src/TyphonEvents.js';
import History          from 'backbone-es6/src/History.js';
import Model            from './ParseModel.js';
import Router           from 'backbone-es6/src/Router.js';
import View             from 'backbone-es6/src/View.js';

import parseSync        from './parseSync.js';

import parseExtend      from './parseExtend.js';
import typhonExtend     from 'typhonjs-backbone-common/src/typhonExtend.js';

const options =
{
   // Current version of the library. Keep in sync with Backbone version supported.
   VERSION: '1.2.3'
};

const backbone = new Backbone(ParseCollection, TyphonEvents, History, Model, Router, View, parseSync, options);

parseExtend(backbone);
typhonExtend(backbone);

export default backbone;