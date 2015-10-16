/**
 * ModuleRuntime.js (Parse) -- Provides the standard / default configuration that is the same as Backbone 1.2.3
 */

'use strict';

import Backbone      from 'backbone-es6/src/Backbone.js';
import Collection    from './ParseCollection.js';
import Events        from 'backbone-es6/src/Events.js';
import History       from 'backbone-es6/src/History.js';
import Model         from './ParseModel.js';
import Router        from 'backbone-es6/src/Router.js';
import View          from 'backbone-es6/src/View.js';

import parseSync     from './parseSync.js';

import parseExtend   from './parseExtend.js';

const options =
{
   // Current version of the library. Keep in sync with Backbone version supported.
   VERSION: '1.2.3'
};

const backbone = new Backbone(Collection, Events, History, Model, Router, View, parseSync, options);

parseExtend(backbone);

export default backbone;