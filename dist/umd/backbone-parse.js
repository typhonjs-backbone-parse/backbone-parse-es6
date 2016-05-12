!function(e){function r(e,r,o){return 4===arguments.length?t.apply(this,arguments):void n(e,{declarative:!0,deps:r,declare:o})}function t(e,r,t,o){n(e,{declarative:!1,deps:r,executingRequire:t,execute:o})}function n(e,r){r.name=e,e in p||(p[e]=r),r.normalizedDeps=r.deps}function o(e,r){if(r[e.groupIndex]=r[e.groupIndex]||[],-1==v.call(r[e.groupIndex],e)){r[e.groupIndex].push(e);for(var t=0,n=e.normalizedDeps.length;n>t;t++){var a=e.normalizedDeps[t],u=p[a];if(u&&!u.evaluated){var d=e.groupIndex+(u.declarative!=e.declarative);if(void 0===u.groupIndex||u.groupIndex<d){if(void 0!==u.groupIndex&&(r[u.groupIndex].splice(v.call(r[u.groupIndex],u),1),0==r[u.groupIndex].length))throw new TypeError("Mixed dependency cycle detected");u.groupIndex=d}o(u,r)}}}}function a(e){var r=p[e];r.groupIndex=0;var t=[];o(r,t);for(var n=!!r.declarative==t.length%2,a=t.length-1;a>=0;a--){for(var u=t[a],i=0;i<u.length;i++){var s=u[i];n?d(s):l(s)}n=!n}}function u(e){return x[e]||(x[e]={name:e,dependencies:[],exports:{},importers:[]})}function d(r){if(!r.module){var t=r.module=u(r.name),n=r.module.exports,o=r.declare.call(e,function(e,r){if(t.locked=!0,"object"==typeof e)for(var o in e)n[o]=e[o];else n[e]=r;for(var a=0,u=t.importers.length;u>a;a++){var d=t.importers[a];if(!d.locked)for(var i=0;i<d.dependencies.length;++i)d.dependencies[i]===t&&d.setters[i](n)}return t.locked=!1,r},r.name);t.setters=o.setters,t.execute=o.execute;for(var a=0,i=r.normalizedDeps.length;i>a;a++){var l,s=r.normalizedDeps[a],c=p[s],v=x[s];v?l=v.exports:c&&!c.declarative?l=c.esModule:c?(d(c),v=c.module,l=v.exports):l=f(s),v&&v.importers?(v.importers.push(t),t.dependencies.push(v)):t.dependencies.push(null),t.setters[a]&&t.setters[a](l)}}}function i(e){var r,t=p[e];if(t)t.declarative?c(e,[]):t.evaluated||l(t),r=t.module.exports;else if(r=f(e),!r)throw new Error("Unable to load dependency "+e+".");return(!t||t.declarative)&&r&&r.__useDefault?r["default"]:r}function l(r){if(!r.module){var t={},n=r.module={exports:t,id:r.name};if(!r.executingRequire)for(var o=0,a=r.normalizedDeps.length;a>o;o++){var u=r.normalizedDeps[o],d=p[u];d&&l(d)}r.evaluated=!0;var c=r.execute.call(e,function(e){for(var t=0,n=r.deps.length;n>t;t++)if(r.deps[t]==e)return i(r.normalizedDeps[t]);throw new TypeError("Module "+e+" not declared as a dependency.")},t,n);c&&(n.exports=c),t=n.exports,t&&t.__esModule?r.esModule=t:r.esModule=s(t)}}function s(r){if(r===e)return r;var t={};if("object"==typeof r||"function"==typeof r)if(g){var n;for(var o in r)(n=Object.getOwnPropertyDescriptor(r,o))&&h(t,o,n)}else{var a=r&&r.hasOwnProperty;for(var o in r)(!a||r.hasOwnProperty(o))&&(t[o]=r[o])}return t["default"]=r,h(t,"__useDefault",{value:!0}),t}function c(r,t){var n=p[r];if(n&&!n.evaluated&&n.declarative){t.push(r);for(var o=0,a=n.normalizedDeps.length;a>o;o++){var u=n.normalizedDeps[o];-1==v.call(t,u)&&(p[u]?c(u,t):f(u))}n.evaluated||(n.evaluated=!0,n.module.execute.call(e))}}function f(e){if(D[e])return D[e];if("@node/"==e.substr(0,6))return y(e.substr(6));var r=p[e];if(!r)throw"Module "+e+" not present.";return a(e),c(e,[]),p[e]=void 0,r.declarative&&h(r.module.exports,"__esModule",{value:!0}),D[e]=r.declarative?r.module.exports:r.esModule}var p={},v=Array.prototype.indexOf||function(e){for(var r=0,t=this.length;t>r;r++)if(this[r]===e)return r;return-1},g=!0;try{Object.getOwnPropertyDescriptor({a:0},"a")}catch(m){g=!1}var h;!function(){try{Object.defineProperty({},"a",{})&&(h=Object.defineProperty)}catch(e){h=function(e,r,t){try{e[r]=t.value||t.get.call(e)}catch(n){}}}}();var x={},y="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&require.resolve&&"undefined"!=typeof process&&require,D={"@empty":{}};return function(e,n,o){return function(a){a(function(a){for(var u={_nodeRequire:y,register:r,registerDynamic:t,get:f,set:function(e,r){D[e]=r},newModule:function(e){return e}},d=0;d<n.length;d++)(function(e,r){r&&r.__esModule?D[e]=r:D[e]=s(r)})(n[d],arguments[d]);o(u);var i=f(e[0]);if(e.length>1)for(var d=1;d<e.length;d++)f(e[d]);return i.__useDefault?i["default"]:i})}}}("undefined"!=typeof self?self:global)

(["1"], ["3","47","48","6"], function($__System, require) {

$__System.register('2', ['3', '4', '5', '6'], function (_export) {
  var $, _classCallCheck, BackboneProxy, _, Backbone;

  return {
    setters: [function (_3) {
      $ = _3['default'];
    }, function (_2) {
      _classCallCheck = _2['default'];
    }, function (_5) {
      BackboneProxy = _5['default'];
    }, function (_4) {
      _ = _4['default'];
    }],
    execute: function () {

      /**
       * Backbone.js
       *
       * (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
       * Backbone may be freely distributed under the MIT license.
       *
       * For all details and documentation:
       * http://backbonejs.org
       *
       * ---------
       *
       * backbone-es6
       * https://github.com/typhonjs/backbone-es6
       * (c) 2015 Michael Leahy
       * backbone-es6 may be freely distributed under the MPLv2 license.
       *
       * This fork of Backbone converts it to ES6 and provides extension through constructor injection for easy modification.
       * The only major difference from Backbone is that Backbone itself is not a global Events instance anymore. Please
       * see @link{Events.js} for documentation on easily setting up an ES6 event module for global usage.
       *
       * @see http://backbonejs.org
       * @see https://github.com/typhonjs/backbone-es6
       * @author Michael Leahy
       * @version 1.3.3
       * @copyright Michael Leahy 2015
       */
      'use strict';

      Backbone =
      /**
       * Initializes Backbone by constructor injection. You may provide variations on any component below by passing
       * in a different version. The "runtime" initializing Backbone is responsible for further modification like
       * supporting the older "extend" support. See backbone-es6/src/ModuleRuntime.js and backbone-es6/src/extend.js
       * for an example on composing Backbone for usage.
       *
       * @param {Collection}  Collection  - A class defining Backbone.Collection.
       * @param {Events}      Events      - A class defining Backbone.Events.
       * @param {History}     History     - A class defining Backbone.History.
       * @param {Model}       Model       - A class defining Backbone.Model.
       * @param {Router}      Router      - A class defining Backbone.Router.
       * @param {View}        View        - A class defining Backbone.View.
       * @param {function}    sync        - A function defining synchronization for Collection & Model.
       * @param {object}      options     - Options to mixin to Backbone.
       * @constructor
       */
      function Backbone(Collection, Events, History, Model, Router, View, sync) {
        var _this = this,
            _arguments = arguments;

        var options = arguments.length <= 7 || arguments[7] === undefined ? {} : arguments[7];

        _classCallCheck(this, Backbone);

        /**
         * Establish the root object, `window` (`self`) in the browser, or `global` on the server.
         * We use `self` instead of `window` for `WebWorker` support.
         *
         * @type {object|global}
         */
        var root = typeof self === 'object' && self.self === self && self || typeof global === 'object' && global.global === global && global;

        /**
         * jQuery or equivalent
         * @type {*}
         */
        this.$ = $ || root.jQuery || root.Zepto || root.ender || root.$;

        if (typeof this.$ === 'undefined') {
          throw new Error("Backbone - ctor - could not locate global '$' (jQuery or equivalent).");
        }

        /**
         * Initial setup. Mixin options and set the BackboneProxy instance to this.
         */
        if (_.isObject(options)) {
          _.extend(this, options);
        }

        BackboneProxy.backbone = this;

        /**
         * A public reference of the Collection class.
         * @class
         */
        this.Collection = Collection;

        /**
         * A public reference of the Events class.
         * @class
         */
        this.Events = Events;

        /**
         * A public reference of the History class.
         * @class
         */
        this.History = History;

        /**
         * A public reference of the Model class.
         * @class
         */
        this.Model = Model;

        /**
         * A public reference of the Router class.
         * @class
         */
        this.Router = Router;

        /**
         * A public reference of the View class.
         * @class
         */
        this.View = View;

        /**
         * A public instance of History.
         * @instance
         */
        this.history = new History();

        /**
         * A public instance of the sync function.
         * @instance
         */
        this.sync = sync;

        /**
         * Set the default implementation of `Backbone.ajax` to proxy through to `$`.
         * Override this if you'd like to use a different library.
         *
         * @returns {XMLHttpRequest}   XMLHttpRequest
         */
        this.ajax = function () {
          var _$;

          return (_$ = _this.$).ajax.apply(_$, _arguments);
        };
      };

      _export('default', Backbone);
    }
  };
});

$__System.register('7', ['4', '5', '6', '8', '9', 'a', 'e', 'b', 'c', 'd'], function (_export) {
   var _classCallCheck, BackboneProxy, _, _get, _inherits, _createClass, Events, Model, Utils, Debug, Collection, collectionMethods, s_ADD_OPTIONS, s_SET_OPTIONS, s_ADD_REFERENCE, s_ON_MODEL_EVENT, s_REMOVE_MODELS, s_REMOVE_REFERENCE, s_SPLICE;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_6) {
         BackboneProxy = _6['default'];
      }, function (_5) {
         _ = _5['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_e) {
         Events = _e['default'];
      }, function (_b) {
         Model = _b['default'];
      }, function (_c) {
         Utils = _c['default'];
      }, function (_d) {
         Debug = _d['default'];
      }],
      execute: function () {

         /**
          * Backbone.Collection - Collections are ordered sets of models. (http://backbonejs.org/#Collection)
          * -------------------
          *
          * You can bind "change" events to be notified when any model in the collection has been modified, listen for "add"
          * and "remove" events, fetch the collection from the server, and use a full suite of Underscore.js methods.
          *
          * Any event that is triggered on a model in a collection will also be triggered on the collection directly, for
          * convenience. This allows you to listen for changes to specific attributes in any model in a collection, for
          * example: documents.on("change:selected", ...)
          *
          * ---------
          *
          * Underscore methods available to Collection (including aliases):
          *
          * @see http://underscorejs.org/#chain
          * @see http://underscorejs.org/#contains
          * @see http://underscorejs.org/#countBy
          * @see http://underscorejs.org/#difference
          * @see http://underscorejs.org/#each
          * @see http://underscorejs.org/#every
          * @see http://underscorejs.org/#filter
          * @see http://underscorejs.org/#find
          * @see http://underscorejs.org/#findIndex
          * @see http://underscorejs.org/#findLastIndex
          * @see http://underscorejs.org/#first
          * @see http://underscorejs.org/#groupBy
          * @see http://underscorejs.org/#indexBy
          * @see http://underscorejs.org/#indexOf
          * @see http://underscorejs.org/#initial
          * @see http://underscorejs.org/#invoke
          * @see http://underscorejs.org/#isEmpty
          * @see http://underscorejs.org/#last
          * @see http://underscorejs.org/#lastIndexOf
          * @see http://underscorejs.org/#map
          * @see http://underscorejs.org/#max
          * @see http://underscorejs.org/#min
          * @see http://underscorejs.org/#partition
          * @see http://underscorejs.org/#reduce
          * @see http://underscorejs.org/#reduceRight
          * @see http://underscorejs.org/#reject
          * @see http://underscorejs.org/#rest
          * @see http://underscorejs.org/#sample
          * @see http://underscorejs.org/#shuffle
          * @see http://underscorejs.org/#some
          * @see http://underscorejs.org/#sortBy
          * @see http://underscorejs.org/#size
          * @see http://underscorejs.org/#toArray
          * @see http://underscorejs.org/#without
          *
          * @example
          *
          * If using Backbone-ES6 by ES6 source one can create a module for a Backbone.Collection:
          *
          * export default new Backbone.Collection(null,
          * {
          *    model: Backbone.Model.extend(...)
          * });
          *
          * or if importing a specific model class
          *
          * import Model from '<MY-BACKBONE-MODEL>'
          *
          * export default new Backbone.Collection(null,
          * {
          *    model: Model
          * });
          *
          * or use full ES6 style by using a getter for "model":
          *
          * import Model from '<MY-BACKBONE-MODEL>'
          *
          * class MyCollection extends Backbone.Collection
          * {
          *    get model() { return Model; }
          * }
          *
          * export default new MyCollection();   // If desired drop "new" to export the class itself and not an instance.
          */
         'use strict';

         Collection = (function (_Events) {
            _inherits(Collection, _Events);

            /**
             * When creating a Collection, you may choose to pass in the initial array of models. The collection's comparator
             * may be included as an option. Passing `false` as the comparator option will prevent sorting. If you define an
             * initialize function, it will be invoked when the collection is created. There are a couple of options that, if
             * provided, are attached to the collection directly: `model` and `comparator`.
             *
             * Pass `null` for `models` to create an empty Collection with options.
             *
             * @see http://backbonejs.org/#Collection-constructor
             *
             * @param {Array<Model>}   models   - An optional array of models to set.
             * @param {object}         options  - Optional parameters
             */

            function Collection() {
               var models = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
               var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

               _classCallCheck(this, Collection);

               _get(Object.getPrototypeOf(Collection.prototype), 'constructor', this).call(this);

               // Allows child classes to abort constructor execution.
               if (_.isBoolean(options.abortCtor) && options.abortCtor) {
                  return;
               }

               // Must detect if there are any getters defined in order to skip setting these values.
               var hasModelGetter = !_.isUndefined(this.model);
               var hasComparatorGetter = !_.isUndefined(this.comparator);

               // The default model for a collection is just a **Backbone.Model**. This should be overridden in most cases.
               if (!hasModelGetter) {
                  /**
                   * The default Backbone.Model class to use as a prototype for this collection.
                   * @type {Model}
                   */
                  this.model = Model;
               }

               if (options.model && !hasModelGetter) {
                  this.model = options.model;
               }

               if (options.comparator !== void 0 && !hasComparatorGetter) {
                  /**
                   * A comparator string indicating the attribute to sort.
                   * @type {string}
                   */
                  this.comparator = options.comparator;
               }

               // Allows child classes to postpone initialization.
               if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) {
                  return;
               }

               this._reset();

               this.initialize.apply(this, arguments);

               if (models) {
                  this.reset(models, _.extend({ silent: true }, options));
               }
            }

            // Underscore methods that we want to implement on the Collection. 90% of the core usefulness of Backbone Collections
            // is actually implemented right here:

            /**
             * Add a model (or an array of models) to the collection, firing an "add" event for each model, and an "update"
             * event afterwards. If a model property is defined, you may also pass raw attributes objects, and have them be
             * vivified as instances of the model. Returns the added (or preexisting, if duplicate) models. Pass {at: index} to
             * splice the model into the collection at the specified index. If you're adding models to the collection that are
             * already in the collection, they'll be ignored, unless you pass {merge: true}, in which case their attributes will
             * be merged into the corresponding models, firing any appropriate "change" events.
             *
             * Note that adding the same model (a model with the same id) to a collection more than once is a no-op.
             *
             * @example
             * var ships = new Backbone.Collection;
             *
             * ships.on("add", function(ship) {
             *    alert("Ahoy " + ship.get("name") + "!");
             * });
             *
             * ships.add([
             *    {name: "Flying Dutchman"},
             *    {name: "Black Pearl"}
             * ]);
             *
             * @see http://backbonejs.org/#Collection-add
             *
             * @param {Model|Array<Model>}   models   - A single model or an array of models to add.
             * @param {object}               options  - Optional parameters
             * @returns {*}
             */

            _createClass(Collection, [{
               key: 'add',
               value: function add(models, options) {
                  return this.set(models, _.extend({ merge: false }, options, s_ADD_OPTIONS));
               }

               /**
                * Get a model from a collection, specified by index. Useful if your collection is sorted, and if your collection
                * isn't sorted, at will still retrieve models in insertion order. When passed a negative index, it will retrieve
                * the model from the back of the collection.
                *
                * @see http://backbonejs.org/#Collection-at
                *
                * @param {number}   index - Index for model to retrieve.
                * @returns {*}
                */
            }, {
               key: 'at',
               value: function at(index) {
                  if (index < 0) {
                     index += this.length;
                  }
                  return this.models[index];
               }

               /**
                * Returns a new instance of the collection with an identical list of models.
                *
                * @see http://backbonejs.org/#Collection-clone
                *
                * @returns {Collection} Returns a new collection with shared models.
                */
            }, {
               key: 'clone',
               value: function clone() {
                  return new this.constructor(this.models, {
                     model: this.model,
                     comparator: this.comparator
                  });
               }

               /**
                * Convenience to create a new instance of a model within a collection. Equivalent to instantiating a model with a
                * hash of attributes, saving the model to the server, and adding the model to the set after being successfully
                * created. Returns the new model. If client-side validation failed, the model will be unsaved, with validation
                * errors. In order for this to work, you should set the model property of the collection. The create method can
                * accept either an attributes hash or an existing, unsaved model object.
                *
                * Creating a model will cause an immediate "add" event to be triggered on the collection, a "request" event as the
                * new model is sent to the server, as well as a "sync" event, once the server has responded with the successful
                * creation of the model. Pass {wait: true} if you'd like to wait for the server before adding the new model to the
                * collection.
                *
                * @example
                * var Library = Backbone.Collection.extend({
                *     model: Book
                * });
                *
                * var nypl = new Library;
                *
                * var othello = nypl.create({
                *    title: "Othello",
                *    author: "William Shakespeare"
                * });
                *
                * @see http://backbonejs.org/#Collection-create
                *
                * @param {Model}    attrs    - Attributes hash for the new model
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'create',
               value: function create(attrs, options) {
                  options = options ? _.clone(options) : {};
                  var wait = options.wait;
                  var model = this._prepareModel(attrs, options);

                  if (!model) {
                     return false;
                  }
                  if (!wait) {
                     this.add(model, options);
                  }

                  var collection = this;
                  var success = options.success;

                  options.success = function (m, resp, callbackOpts) {
                     if (wait) {
                        collection.add(m, callbackOpts);
                     }
                     if (success) {
                        success.call(callbackOpts.context, m, resp, callbackOpts);
                     }
                  };

                  model.save(null, options);

                  return model;
               }

               /**
                * Fetch the default set of models for this collection from the server, setting them on the collection when they
                * arrive. The options hash takes success and error callbacks which will both be passed (collection, response,
                * options) as arguments. When the model data returns from the server, it uses set to (intelligently) merge the
                * fetched models, unless you pass {reset: true}, in which case the collection will be (efficiently) reset.
                * Delegates to Backbone.sync under the covers for custom persistence strategies and returns a jqXHR. The server
                * handler for fetch requests should return a JSON array of models.
                *
                * The behavior of fetch can be customized by using the available set options. For example, to fetch a collection,
                * getting an "add" event for every new model, and a "change" event for every changed existing model, without
                * removing anything: collection.fetch({remove: false})
                *
                * jQuery.ajax options can also be passed directly as fetch options, so to fetch a specific page of a paginated
                * collection: Documents.fetch({data: {page: 3}})
                *
                * Note that fetch should not be used to populate collections on page load — all models needed at load time should
                * already be bootstrapped in to place. fetch is intended for lazily-loading models for interfaces that are not
                * needed immediately: for example, documents with collections of notes that may be toggled open and closed.
                *
                * @example
                * Backbone.sync = function(method, model) {
                *    alert(method + ": " + model.url);
                * };
                *
                * var accounts = new Backbone.Collection;
                * accounts.url = '/accounts';
                *
                * accounts.fetch();
                *
                * @see http://backbonejs.org/#Collection-fetch
                *
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'fetch',
               value: function fetch(options) {
                  var _this = this;

                  options = _.extend({ parse: true }, options);
                  var success = options.success;

                  options.success = function (resp) {
                     var method = options.reset ? 'reset' : 'set';
                     Debug.log('Collection - fetch - success callback - method: ' + method, true);
                     _this[method](resp, options);

                     if (success) {
                        success.call(options.context, _this, resp, options);
                     }

                     _this.trigger('sync', _this, resp, options);
                  };

                  Utils.wrapError(this, options);

                  return this.sync('read', this, options);
               }

               /**
                * Just like `where`, but directly returns only the first model in the collection that matches the passed
                * attributes.
                *
                * @see http://backbonejs.org/#Collection-findWhere
                *
                * @param {object}   attrs - Attribute hash to match.
                * @returns {*}
                */
            }, {
               key: 'findWhere',
               value: function findWhere(attrs) {
                  return this.where(attrs, true);
               }

               /**
                * Get a model from the set by id, cid, model object with id or cid properties, or an attributes object that is
                * transformed through modelId.
                *
                * @example
                * var book = library.get(110);
                *
                * @see http://backbonejs.org/#Collection-get
                *
                * @param {Model} obj   - An instance of a model to search for by object, id, or cid.
                * @returns {*}
                */
            }, {
               key: 'get',
               value: function get(obj) {
                  if (Utils.isNullOrUndef(obj)) {
                     return void 0;
                  }

                  var id = this.modelId(obj.attributes || obj);

                  Debug.log('Collection - get - id: ' + id);

                  return this._byId[obj] || this._byId[id] || obj.cid && this._byId[obj.cid];
               }

               /**
                * Returns `true` if the model is in the collection.
                *
                * @param {Model} obj   - An instance of a model.
                * @returns {boolean}
                */
            }, {
               key: 'has',
               value: function has(obj) {
                  return !Utils.isNullOrUndef(this.get(obj));
               }

               /**
                * Initialize is an empty function by default. Override it with your own initialization logic.
                *
                * @see http://backbonejs.org/#Collection-constructor
                * @abstract
                */
            }, {
               key: 'initialize',
               value: function initialize() {}

               /**
                * Override this method to return the value the collection will use to identify a model given its attributes. Useful
                * for combining models from multiple tables with different `idAttribute` values into a single collection.
                *
                * By default returns the value of the attributes' `idAttribute` from the collection's model class or failing that,
                * `id`. If your collection uses a model factory and those models have an `idAttribute` other than `id` you must
                * override this method.
                *
                * @example
                * var Library = Backbone.Collection.extend({
                *   modelId: function(attrs) {
                *      return attrs.type + attrs.id;
                *   }
                * });
                *
                * var library = new Library([
                *   {type: 'dvd', id: 1},
                *   {type: 'vhs', id: 1}
                * ]);
                *
                * var dvdId = library.get('dvd1').id;
                * var vhsId = library.get('vhs1').id;
                * alert('dvd: ' + dvdId + ', vhs: ' + vhsId);
                *
                * @see http://backbonejs.org/#Collection-modelId
                *
                * @param {object}   attrs - Attributes hash
                * @returns {*}
                */
            }, {
               key: 'modelId',
               value: function modelId(attrs) {
                  Debug.log('Collection - modelId - 0 - this.model.prototype.idAttribute: ' + this.model.prototype.idAttribute, true);
                  Debug.log('Collection - modelId - 1 - attrs: ' + JSON.stringify(attrs));

                  return attrs[this.model.prototype.idAttribute || 'id'];
               }

               /* eslint-disable no-unused-vars */
               /**
                * `parse` is called by Backbone whenever a collection's models are returned by the server, in fetch. The function is
                * passed the raw response object, and should return the array of model attributes to be added to the collection.
                * The default implementation is a no-op, simply passing through the JSON response. Override this if you need to
                * work with a preexisting API, or better namespace your responses.
                *
                * @example
                * var Tweets = Backbone.Collection.extend({
                *    // The Twitter Search API returns tweets under "results".
                *    parse: function(response) {
                *       return response.results;
                *    }
                * });
                *
                * @see http://backbonejs.org/#Collection-parse
                *
                * @param {object}   resp - Usually a JSON object.
                * @param {object}   options - Unused optional parameters.
                * @returns {object} Pass through to set the attributes hash on the model.
                */
            }, {
               key: 'parse',
               value: function parse(resp, options) {
                  /* eslint-enable no-unused-vars */
                  return resp;
               }

               /**
                * Pluck an attribute from each model in the collection. Equivalent to calling map and returning a single attribute
                * from the iterator.
                *
                * @example
                * var stooges = new Backbone.Collection([
                *    {name: "Curly"},
                *    {name: "Larry"},
                *    {name: "Moe"}
                * ]);
                *
                * var names = stooges.pluck("name");
                *
                * alert(JSON.stringify(names));
                *
                * @see http://backbonejs.org/#Collection-pluck
                *
                * @param {string}   attr  - Attribute key
                * @returns {*}
                */
            }, {
               key: 'pluck',
               value: function pluck(attr) {
                  return this.map('' + attr);
               }

               /**
                * Remove and return the last model from a collection. Takes the same options as remove.
                *
                * @see http://backbonejs.org/#Collection-pop
                *
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'pop',
               value: function pop(options) {
                  var model = this.at(this.length - 1);
                  return this.remove(model, options);
               }

               /**
                * Prepare a hash of attributes (or other model) to be added to this collection.
                *
                * @protected
                * @param {object}         attrs       - Attribute hash
                * @param {object}         options     - Optional parameters
                * @returns {*}
                */
            }, {
               key: '_prepareModel',
               value: function _prepareModel(attrs, options) {
                  if (Utils.isModel(attrs)) {
                     Debug.log('Collection - _prepareModel - 0', true);
                     if (!attrs.collection) {
                        attrs.collection = this;
                     }
                     return attrs;
                  }

                  options = options ? _.clone(options) : {};
                  options.collection = this;

                  Debug.log('Collection - _prepareModel - 1 - attrs.parseObject: ' + attrs.parseObject);

                  var model = new this.model(attrs, options);

                  if (!model.validationError) {
                     return model;
                  }

                  this.trigger('invalid', this, model.validationError, options);

                  return false;
               }

               /**
                * Add a model at the end of a collection. Takes the same options as `add`.
                *
                * @see http://backbonejs.org/#Collection-push
                *
                * @param {Model}    model    - A Model instance
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'push',
               value: function push(model, options) {
                  return this.add(model, _.extend({ at: this.length }, options));
               }

               /**
                * Remove a model (or an array of models) from the collection, and return them. Each model can be a Model instance,
                * an id string or a JS object, any value acceptable as the id argument of collection.get. Fires a "remove" event
                * for each model, and a single "update" event afterwards, unless  {silent: true}  is passed. The model's index
                * before removal is available to listeners as options.index.
                *
                * @see http://backbonejs.org/#Collection-remove
                *
                * @param {Model|Array<Model>}   models   - An single model or an array of models to remove.
                * @param {object}               options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'remove',
               value: function remove(models, options) {
                  options = _.extend({}, options);
                  var singular = !_.isArray(models);
                  models = singular ? [models] : models.slice();
                  var removed = s_REMOVE_MODELS(this, models, options);

                  if (!options.silent && removed.length) {
                     options.changes = { added: [], merged: [], removed: removed };
                     this.trigger('update', this, options);
                  }

                  return singular ? removed[0] : removed;
               }

               /**
                * Resets all internal state. Called when the collection is first initialized or reset.
                * @protected
                */
            }, {
               key: '_reset',
               value: function _reset() {
                  /**
                   * The length of the models array.
                   * @type {number}
                   */
                  this.length = 0;

                  /**
                   * An array of models in the collection.
                   * @type {Array<Model>}
                   */
                  this.models = [];

                  this._byId = {};
               }

               /**
                * Adding and removing models one at a time is all well and good, but sometimes you have so many models to change
                * that you'd rather just update the collection in bulk. Use reset to replace a collection with a new list of models
                * (or attribute hashes), triggering a single "reset" event on completion, and without triggering any add or remove
                * events on any models. Returns the newly-set models. For convenience, within a "reset" event, the list of any
                * previous models is available as options.previousModels.
                * Pass null for models to empty your Collection with options.
                *
                * Calling collection.reset() without passing any models as arguments will empty the entire collection.
                *
                * Here's an example using reset to bootstrap a collection during initial page load, in a Rails application:
                * @example
                * <script>
                *    var accounts = new Backbone.Collection;
                *    accounts.reset(<%= @accounts.to_json %>);
                * </script>
                *
                * @see http://backbonejs.org/#Collection-reset
                *
                * @param {Array<Model>}   models   - An array of models to add silently after resetting.
                * @param {object}         options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'reset',
               value: function reset(models, options) {
                  options = options ? _.clone(options) : {};

                  for (var i = 0; i < this.models.length; i++) {
                     s_REMOVE_REFERENCE(this, this.models[i]);
                  }

                  options.previousModels = this.models;

                  this._reset();

                  models = this.add(models, _.extend({ silent: true }, options));

                  if (!options.silent) {
                     this.trigger('reset', this, options);
                  }

                  return models;
               }

               /**
                * The set method performs a "smart" update of the collection with the passed list of models. If a model in the list
                * isn't yet in the collection it will be added; if the model is already in the collection its attributes will be
                * merged; and if the collection contains any models that aren't present in the list, they'll be removed. All of the
                * appropriate "add", "remove", and "change" events are fired as this happens. Returns the touched models in the
                * collection. If you'd like to customize the behavior, you can disable it with options: {add: false},
                * {remove: false}, or {merge: false}.
                *
                * @example
                * var vanHalen = new Backbone.Collection([eddie, alex, stone, roth]);
                *
                * vanHalen.set([eddie, alex, stone, hagar]);
                *
                * // Fires a "remove" event for roth, and an "add" event for "hagar".
                * // Updates any of stone, alex, and eddie's attributes that may have
                * // changed over the years.
                *
                * @see http://backbonejs.org/#Collection-set
                *
                * @param {Array<Model>}   models   - An array of models to set.
                * @param {object}         options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'set',
               value: function set(models, options) {
                  Debug.log('Collection - set - 0', true);
                  if (Utils.isNullOrUndef(models)) {
                     return;
                  }

                  options = _.extend({}, s_SET_OPTIONS, options);
                  if (options.parse && !Utils.isModel(models)) {
                     models = this.parse(models, options) || [];
                  }

                  var singular = !_.isArray(models);
                  models = singular ? [models] : models.slice();

                  var at = options.at;
                  if (!Utils.isNullOrUndef(at)) {
                     at = +at;
                  }
                  if (at > this.length) {
                     at = this.length;
                  }
                  if (at < 0) {
                     at += this.length + 1;
                  }

                  Debug.log('Collection - set - 1 - at: ' + at + '; models.length: ' + models.length);

                  var set = [];
                  var toAdd = [];
                  var toMerge = [];
                  var toRemove = [];
                  var modelMap = {};

                  var add = options.add;
                  var merge = options.merge;
                  var remove = options.remove;

                  var sort = false;
                  var sortable = this.comparator && Utils.isNullOrUndef(at) && options.sort !== false;
                  var sortAttr = _.isString(this.comparator) ? this.comparator : null;

                  // Turn bare objects into model references, and prevent invalid models from being added.
                  var model = undefined;

                  for (var i = 0; i < models.length; i++) {
                     model = models[i];

                     // If a duplicate is found, prevent it from being added and optionally merge it into the existing model.
                     var existing = this.get(model);
                     if (existing) {
                        Debug.log('Collection - set - 2 - existing');

                        if (merge && model !== existing) {
                           Debug.log('Collection - set - 3 - merge && model !== existing');

                           var attrs = Utils.isModel(model) ? model.attributes : model;
                           if (options.parse) {
                              attrs = existing.parse(attrs, options);
                           }
                           existing.set(attrs, options);
                           toMerge.push(existing);
                           if (sortable && !sort) {
                              sort = existing.hasChanged(sortAttr);
                           }
                        }

                        if (!modelMap[existing.cid]) {
                           Debug.log('Collection - set - 4 - !modelMap[existing.cid]');

                           modelMap[existing.cid] = true;
                           set.push(existing);
                        }

                        models[i] = existing;

                        // If this is a new, valid model, push it to the `toAdd` list.
                     } else if (add) {
                           Debug.log('Collection - set - 5 - add');

                           model = models[i] = this._prepareModel(model, options);

                           if (model) {
                              Debug.log('Collection - set - 6 - toAdd');

                              toAdd.push(model);
                              s_ADD_REFERENCE(this, model);
                              modelMap[model.cid] = true;
                              set.push(model);
                           }
                        }
                  }

                  // Remove stale models.
                  if (remove) {
                     for (var i = 0; i < this.length; i++) {
                        model = this.models[i];
                        if (!modelMap[model.cid]) {
                           Debug.log('Collection - set - 7 - toRemove push');
                           toRemove.push(model);
                        }
                     }

                     if (toRemove.length) {
                        Debug.log('Collection - set - 8 - before invoking s_REMOVE_MODELS');
                        s_REMOVE_MODELS(this, toRemove, options);
                     }
                  }

                  // See if sorting is needed, update `length` and splice in new models.
                  var orderChanged = false;
                  var replace = !sortable && add && remove;

                  if (set.length && replace) {
                     orderChanged = this.length !== set.length || _.some(this.models, function (m, index) {
                        return m !== set[index];
                     });

                     Debug.log('Collection - set - 9 - set.length > 0 && replace - orderChanged: ' + orderChanged);

                     this.models.length = 0;

                     s_SPLICE(this.models, set, 0);

                     this.length = this.models.length;
                  } else if (toAdd.length) {
                     if (sortable) {
                        sort = true;
                     }

                     Debug.log('Collection - set - 10 - toAdd.length > 0 - sort: ' + sort + '; at: ' + at);

                     s_SPLICE(this.models, toAdd, Utils.isNullOrUndef(at) ? this.length : at);

                     this.length = this.models.length;
                  }

                  // Silently sort the collection if appropriate.
                  if (sort) {
                     Debug.log('Collection - set - 11 - sorting silent');

                     this.sort({ silent: true });
                  }

                  // Unless silenced, it's time to fire all appropriate add/sort/update events.
                  if (!options.silent) {
                     Debug.log('Collection - set - 12 - !options.silent: ' + !options.silent);

                     for (var i = 0; i < toAdd.length; i++) {
                        if (!Utils.isNullOrUndef(at)) {
                           options.index = at + i;
                        }

                        model = toAdd[i];
                        model.trigger('add', model, this, options);
                     }

                     if (sort || orderChanged) {
                        this.trigger('sort', this, options);
                     }

                     if (toAdd.length || toRemove.length || toMerge.length) {
                        options.changes = { added: toAdd, removed: toRemove, merged: toMerge };
                        this.trigger('update', this, options);
                     }
                  }

                  // Return the added (or merged) model (or models).
                  return singular ? models[0] : models;
               }

               /**
                * Remove and return the first model from a collection. Takes the same options as `remove`.
                *
                * @see http://backbonejs.org/#Collection-shift
                *
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'shift',
               value: function shift(options) {
                  var model = this.at(0);
                  return this.remove(model, options);
               }

               /**
                * Return a shallow copy of this collection's models, using the same options as native `Array#slice`.
                *
                * @see http://backbonejs.org/#Collection-slice
                *
                * @returns {*}
                */
            }, {
               key: 'slice',
               value: function slice() {
                  return Array.prototype.slice.apply(this.models, arguments);
               }

               /**
                * Force a collection to re-sort itself. You don't need to call this under normal circumstances, as a collection
                * with a comparator will sort itself whenever a model is added. To disable sorting when adding a model, pass
                * {sort: false} to add. Calling sort triggers a "sort" event on the collection.
                *
                * @see http://backbonejs.org/#Collection-sort
                *
                * @param {object}   options  - Optional parameters
                * @returns {Collection}
                */
            }, {
               key: 'sort',
               value: function sort() {
                  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                  var comparator = this.comparator;

                  if (!comparator) {
                     throw new Error('Cannot sort a set without a comparator');
                  }

                  var length = comparator.length;

                  if (_.isFunction(comparator)) {
                     comparator = _.bind(comparator, this);
                  }

                  // Run sort based on type of `comparator`.
                  if (length === 1 || _.isString(comparator)) {
                     this.models = this.sortBy(comparator);
                  } else {
                     this.models.sort(comparator);
                  }

                  if (!options.silent) {
                     this.trigger('sort', this, options);
                  }

                  return this;
               }

               /**
                * Uses Backbone.sync to persist the state of a collection to the server. Can be overridden for custom behavior.
                *
                * @see http://backbonejs.org/#Collection-sync
                *
                * @returns {*}
                */
            }, {
               key: 'sync',
               value: function sync() {
                  Debug.log("Collection - sync", true);
                  return BackboneProxy.backbone.sync.apply(this, arguments);
               }

               /**
                * Return an array containing the attributes hash of each model (via toJSON) in the collection. This can be used to
                * serialize and persist the collection as a whole. The name of this method is a bit confusing, because it conforms
                * to JavaScript's JSON API.
                *
                * @example
                * var collection = new Backbone.Collection([
                *    {name: "Tim", age: 5},
                *    {name: "Ida", age: 26},
                *    {name: "Rob", age: 55}
                * ]);
                *
                * alert(JSON.stringify(collection));
                *
                * @see http://backbonejs.org/#Collection-toJSON
                *
                * @param {object}   options  - Optional parameters
                * @returns {object} JSON
                */
            }, {
               key: 'toJSON',
               value: function toJSON(options) {
                  return this.map(function (model) {
                     return model.toJSON(options);
                  });
               }

               /**
                * Add a model at the beginning of a collection. Takes the same options as `add`.
                *
                * @see http://backbonejs.org/#Collection-unshift
                *
                * @param {Model}    model    - A Model instance
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'unshift',
               value: function unshift(model, options) {
                  return this.add(model, _.extend({ at: 0 }, options));
               }

               /**
                * Return an array of all the models in a collection that match the passed attributes. Useful for simple cases of
                * filter.
                *
                * @example
                * var friends = new Backbone.Collection([
                *    {name: "Athos",      job: "Musketeer"},
                *    {name: "Porthos",    job: "Musketeer"},
                *    {name: "Aramis",     job: "Musketeer"},
                *    {name: "d'Artagnan", job: "Guard"},
                * ]);
                *
                * var musketeers = friends.where({job: "Musketeer"});
                *
                * alert(musketeers.length);
                *
                * @see http://backbonejs.org/#Collection-where
                *
                * @param {object}   attrs - Attribute hash to match.
                * @param {boolean}  first - Retrieve first match or all matches.
                * @returns {*}
                */
            }, {
               key: 'where',
               value: function where(attrs, first) {
                  return this[first ? 'find' : 'filter'](attrs);
               }
            }]);

            return Collection;
         })(Events);

         collectionMethods = {
            forEach: 3, each: 3, map: 3, collect: 3, reduce: 0,
            foldl: 0, inject: 0, reduceRight: 0, foldr: 0, find: 3, detect: 3, filter: 3,
            select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
            contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
            head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
            without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
            isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
            sortBy: 3, indexBy: 3, findIndex: 3, findLastIndex: 3
         };

         // Mix in each Underscore method as a proxy to `Collection#models`.
         Utils.addUnderscoreMethods(Collection, collectionMethods, 'models');

         // Private / internal methods ---------------------------------------------------------------------------------------

         /**
          * Default options for `Collection#add`.
          * @type {{add: boolean, remove: boolean}}
          */
         s_ADD_OPTIONS = { add: true, remove: false };

         /**
          * Default options for `Collection#set`.
          * @type {{add: boolean, remove: boolean}}
          */
         s_SET_OPTIONS = { add: true, remove: true, merge: true };

         /**
          * Internal method to create a model's ties to a collection.
          *
          * @param {Collection}  collection  - A collection instance
          * @param {Model}       model       - A model instance
          */

         s_ADD_REFERENCE = function s_ADD_REFERENCE(collection, model) {
            collection._byId[model.cid] = model;
            var id = collection.modelId(model.attributes);

            Debug.log('Collection - s_ADD_REFERENCE - id: ' + id + '; model.cid: ' + model.cid, true);

            if (!Utils.isNullOrUndef(id)) {
               collection._byId[id] = model;
            }
            model.on('all', s_ON_MODEL_EVENT, collection);
         };

         /**
          * Internal method called every time a model in the set fires an event. Sets need to update their indexes when models
          * change ids. All other events simply proxy through. "add" and "remove" events that originate in other collections
          * are ignored.
          *
          * Note: Because this is the callback added to the model via Events the "this" context is associated with the model.
          *
          * @param {string}      event       - Event name
          * @param {Model}       model       - A model instance
          * @param {Collection}  collection  - A collection instance
          * @param {object}      options     - Optional parameters
          */

         s_ON_MODEL_EVENT = function s_ON_MODEL_EVENT(event, model, collection, options) {
            if (model) {
               Debug.log('Collection - s_ON_MODEL_EVENT - 0 - event: ' + event, true);

               if ((event === 'add' || event === 'remove') && collection !== this) {
                  return;
               }
               if (event === 'destroy') {
                  this.remove(model, options);
               }
               if (event === 'change') {
                  var prevId = this.modelId(model.previousAttributes());
                  var id = this.modelId(model.attributes);

                  Debug.log('Collection - s_ON_MODEL_EVENT - 1 - change - id: ' + id + '; prevId: ' + prevId);

                  if (prevId !== id) {
                     if (!Utils.isNullOrUndef(prevId)) {
                        delete this._byId[prevId];
                     }
                     if (!Utils.isNullOrUndef(id)) {
                        this._byId[id] = model;
                     }
                  }
               }

               this.trigger.apply(this, arguments);
            }
         };

         /**
          * Internal method called by both remove and set.
          *
          * @param {Collection}     collection  - A collection instance
          * @param {Array<Model>}   models      - A model instance
          * @param {object}         options     - Optional parameters
          * @returns {*}
          */

         s_REMOVE_MODELS = function s_REMOVE_MODELS(collection, models, options) {
            var removed = [];

            for (var i = 0; i < models.length; i++) {
               var model = collection.get(models[i]);

               Debug.log('Collection - s_REMOVE_MODELS - 0 - model: ' + model, true);

               if (!model) {
                  continue;
               }

               Debug.log('Collection - s_REMOVE_MODELS - 1 - model: ' + model.toJSON());

               var index = collection.indexOf(model);

               Debug.log('Collection - s_REMOVE_MODELS - 2 - index: ' + index);

               collection.models.splice(index, 1);
               collection.length--;

               // Remove references before triggering 'remove' event to prevent an infinite loop. #3693
               delete collection._byId[model.cid];
               var id = collection.modelId(model.attributes);
               if (!Utils.isNullOrUndef(id)) {
                  delete collection._byId[id];
               }

               if (!options.silent) {
                  options.index = index;
                  model.trigger('remove', model, collection, options);
               }

               removed.push(model);
               s_REMOVE_REFERENCE(collection, model, options);
            }

            return removed;
         };

         /**
          * Internal method to sever a model's ties to a collection.
          *
          * @param {Collection}  collection  - A collection instance
          * @param {Model}       model       - A model instance
          */

         s_REMOVE_REFERENCE = function s_REMOVE_REFERENCE(collection, model) {
            delete collection._byId[model.cid];
            var id = collection.modelId(model.attributes);

            Debug.log('Collection - s_REMOVE_REFERENCE - id: ' + id + '; model.cid: ' + model.cid);

            if (!Utils.isNullOrUndef(id)) {
               delete collection._byId[id];
            }
            if (collection === model.collection) {
               delete model.collection;
            }
            model.off('all', s_ON_MODEL_EVENT, collection);
         };

         /**
          * Splices `insert` into `array` at index `at`.
          *
          * @param {Array}    array    - Target array to splice into
          * @param {Array}    insert   - Array to insert
          * @param {number}   at       - Index to splice at
          */

         s_SPLICE = function s_SPLICE(array, insert, at) {
            at = Math.min(Math.max(at, 0), array.length);
            var tail = new Array(array.length - at);
            var length = insert.length;

            for (var i = 0; i < tail.length; i++) {
               tail[i] = array[i + at];
            }
            for (var i = 0; i < length; i++) {
               array[i + at] = insert[i];
            }
            for (var i = 0; i < tail.length; i++) {
               array[i + length + at] = tail[i];
            }
         };

         /**
          * Exports the Collection class.
          */

         _export('default', Collection);
      }
   };
});

$__System.register('f', ['4', '6', 'a'], function (_export) {
   var _classCallCheck, _, _createClass, BackboneQuery, __slice, __hasProp, __indexOf, s_DETECT, s_FILTER, s_GET_CACHE, s_GET_SORTED_MODELS, s_GET_TYPE, s_ITERATOR, s_MAKE_OBJ, s_PAGE_MODELS, s_PARSE_SUB_QUERY, s_PARSE_QUERY, s_PERFORM_QUERY, s_PROCESS_QUERY, s_REJECT, s_RUN_QUERY, s_SORT_MODELS, s_TEST_MODEL_ATTRIBUTE, s_TEST_QUERY_VALUE;

   return {
      setters: [function (_2) {
         _classCallCheck = _2['default'];
      }, function (_3) {
         _ = _3['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }],
      execute: function () {
         /**
          * A fork of Backbone Query...
          *
          * Backbone Query - A lightweight query API for Backbone Collections
          * (c)2012 - Dave Tonge
          * May be freely distributed according to MIT license.
          * https://github.com/davidgtonge/backbone_query
          *
          *
          * (c)2015-present Michael Leahy
          * https://github.com/typhonjs/typhonjs-core-backbone-query
          */

         /**
          * BackboneQuery -- Provides client side sorting based on a query API.
          * -------------
          *
          * Forked from https://github.com/davidgtonge/backbone_query
          *
          * A lightweight (3KB minified) utility for Backbone projects, that works in the Browser and on the Server. Adds the
          * ability to search for models with a Query API similar to MongoDB.
          *
          * The huge benefit of using BackboneQuery is that queries can be stored as JSON.
          *
          * Usage
          * -----
          *
          * The major difference of this implementation is that the API is not attached to a collection, but can be run against
          * any collection by invoking the methods with a target collection.
          *
          * Find
          * -----
          * **_ $equal _**
          *
          * Performs a strict equality test using ===. If no operator is provided and the query value isn't a regex then `$equal`
          * is assumed.
          *
          * If the attribute in the model is an array then the query value is searched for in the array in the same way as
          * `$contains`.
          *
          * If the query value is an object (including array) then a deep comparison is performed using underscores `_.isEqual`.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { title: "Test" });
          * // Returns all models which have a "title" attribute of "Test"
          *
          *
          * BackboneQuery.find(collection, { title: { $equal: "Test" } }); // Same as above
          * BackboneQuery.find(collection, { colors: "red" });
          * // Returns models which contain the value "red" in a "colors" attribute that is an array.
          *
          *
          * BackboneQuery.find(collection, { colors: ["red", "yellow"] });
          * // Returns models which contain a colors attribute with the array ["red", "yellow"]
          * ```
          *
          * **_ $contains _**
          *
          * Assumes that the model property is an array and searches for the query value in the array.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { colors: { $contains: "red" } });
          * // Returns models which contain the value "red" in a "colors" attribute that is an array.
          * e.g. a model with this attribute colors:["red", "yellow", "blue"] would be returned.
          * ```
          *
          *
          * **_ $ne _**
          *
          * "Not equal", the opposite of $equal, returns all models which don't have the query value
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { title: { $ne: "Test" } });
          * // Returns all models which don't have a "title" attribute of "Test"
          * ```
          *
          *
          * **_ $lt, $lte, $gt, $gte _**
          *
          * These conditional operators can be used for greater than and less than comparisons in queries
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { likes: { $lt:10 } });
          * // Returns all models which have a "likes" attribute of less than 10
          *
          *
          * BackboneQuery.find(collection, { likes: { $lte:10 } });
          * // Returns all models which have a "likes" attribute of less than or equal to 10
          *
          *
          * BackboneQuery.find(collection, { likes: { $gt:10 } });
          * // Returns all models which have a "likes" attribute of greater than 10
          *
          *
          * BackboneQuery.find(collection, { likes: { $gte:10 } });
          * // Returns all models which have a "likes" attribute of greater than or equal to 10
          * ```
          *
          *
          * **_ $between _**
          *
          * To check if a value is in-between 2 query values use the $between operator and supply an array with the min and max
          * value.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { likes: { $between: [5, 15] } });
          * // Returns all models which have a "likes" attribute of greater than 5 and less then 15
          * ```
          *
          *
          * **_ $in _**
          *
          * An array of possible values can be supplied using $in, a model will be returned if any of the supplied values is
          * matched.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { title: { $in: ["About", "Home", "Contact"] } });
          * // Returns all models which have a title attribute of either "About", "Home", or "Contact"
          * ```
          *
          *
          * **_ $nin _**
          *
          * "Not in", the opposite of $in. A model will be returned if none of the supplied values is matched.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { title: { $nin: ["About", "Home", "Contact"] } });
          * // Returns all models which don't have a title attribute of either "About", "Home", or "Contact"
          * ```
          *
          *
          * **_ $all _**
          *
          * Assumes the model property is an array and only returns models where all supplied values are matched.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { colors: { $all: ["red", "yellow"] } });
          * // Returns all models which have "red" and "yellow" in their colors attribute.
          * // A model with the attribute colors:["red","yellow","blue"] would be returned.
          * // But a model with the attribute colors:["red","blue"] would not be returned.
          * ```
          *
          *
          * **_ $any _**
          *
          * Assumes the model property is an array and returns models where any of the supplied values are matched.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { colors: { $any: ["red", "yellow"] } });
          * // Returns models which have either "red" or "yellow" in their colors attribute.
          * ```
          *
          *
          * **_ $size _**
          *
          * Assumes the model property has a length (i.e. is either an array or a string). Only returns models the model
          * property's length matches the supplied values.
          *
          * ** Example: **
          * ```
          * BackboneQuery.find(collection, { colors: { $size:2 } });
          * // Returns all models which 2 values in the colors attribute
          * ```
          *
          *
          * $exists or $has
          *
          * Checks for the existence of an attribute. Can be supplied either true or false.
          *
          * Example:
          *
          * BackboneQuery.find(collection, { title: { $exists: true } });
          *
          * // Returns all models which have a "title" attribute
          *
          * BackboneQuery.find(collection, { title: { $has: false } });
          *
          * // Returns all models which don't have a "title" attribute
          *
          *
          *
          * $like
          *
          * Assumes the model attribute is a string and checks if the supplied query value is a substring of the property.
          * Uses indexOf rather than regex for performance reasons.
          *
          * Example:
          *
          * BackboneQuery.find(collection, { title: { $like: "Test" } });
          *
          * //Returns all models which have a "title" attribute that
          *
          * //contains the string "Test", e.g. "Testing", "Tests", "Test", etc.
          *
          *
          *
          * $likeI
          *
          * The same as above but performs a case insensitive search using indexOf and toLowerCase (still faster than Regex).
          *
          * Example:
          *
          * BackboneQuery.find(collection, { title: { $likeI: "Test" } });
          *
          * //Returns all models which have a "title" attribute that
          *
          * //contains the string "Test", "test", "tEst","tesT", etc.
          *
          *
          *
          * $regex
          *
          * Checks if the model attribute matches the supplied regular expression. The regex query can be supplied without
          * the `$regex` keyword.
          *
          * Example:
          *
          * BackboneQuery.find(collection, { content: { $regex: /coffeescript/gi } });
          *
          * // Checks for a regex match in the content attribute
          *
          * BackboneQuery.find(collection, { content: /coffeescript/gi });
          *
          * // Same as above
          *
          *
          *
          * $cb
          *
          * A callback function can be supplied as a test. The callback will receive the attribute and should return either
          * true or false. `this` will be set to the current model, this can help with tests against computed properties.
          *
          * Example:
          *
          * BackboneQuery.find(collection, { title: { $cb: function(attr){ return attr.charAt(0) === "c"; } } });
          *
          * // Returns all models that have a title attribute that starts with "c"
          *
          * BackboneQuery.find(collection, { computed_test: { $cb: function(){ return this.computed_property() > 10; } } });
          *
          * // Returns all models where the computed_property method returns a value greater than 10.
          *
          * For callbacks that use `this` rather than the model attribute, the key name supplied is arbitrary and has no
          * effect on the results. If the only test you were performing was like the above test it would make more sense to
          * simply use `Collection.filter`. However if you are performing other tests or are using the
          * paging / sorting / caching options of backbone query, then this functionality is useful.
          *
          *
          *
          * $elemMatch
          *
          * This operator allows you to perform queries in nested arrays similar to MongoDB For example you may have a
          * collection of models in with this kind of data structure:
          *
          * Example:
          *
          * let posts = new Collection([
          *
          *    {title: "Home", comments:[
          *
          *       {text:"I like this post"},
          *
          *       {text:"I love this post"},
          *
          *       {text:"I hate this post"}
          *
          *    ]},
          *
          *    {title: "About", comments:[
          *
          *       {text:"I like this page"},
          *
          *       {text:"I love this page"},
          *
          *       {text:"I really like this page"}
          *
          *    ]}
          *
          * ]);
          *
          *
          * To search for posts which have the text "really" in any of the comments you could search like this:
          *
          * BackboneQuery.find(posts, {
          *
          *    comments: {
          *
          *       $elemMatch: {
          *
          *          text: /really/i
          *
          *       }
          *
          *    }
          *
          * });
          *
          *
          * All of the operators above can be performed on `$elemMatch` queries, e.g. `$all`, `$size` or `$lt`. `$elemMatch`
          * queries also accept compound operators, for example this query searches for all posts that have at least one
          * comment without the word "really" and with the word "totally".
          *
          * BackboneQuery.find(posts, {
          *
          *    comments: {
          *
          *       $elemMatch: {
          *
          *          $not: {
          *
          *             text: /really/i
          *
          *          },
          *
          *          $and: {
          *
          *             text: /totally/i
          *
          *          }
          *       }
          *
          *    }
          *
          * });
          *
          *
          *
          * $computed
          *
          * This operator allows you to perform queries on computed properties. For example you may want to perform a query
          * for a persons full name, even though the first and last name are stored separately in your db / model. For
          * example:
          *
          * Example:
          *
          * class TestModel extends Backbone.Model {
          *
          *    full_name() {
          *
          *       return (this.get('first_name')) + " " + (this.get('last_name'));
          *
          *    }
          *
          * });
          *
          * let a = new TestModel({
          *
          *    first_name: "Dave",
          *
          *    last_name: "Tonge"
          *
          * });
          *
          * let b = new TestModel({
          *
          *    first_name: "John",
          *
          *    last_name: "Smith"
          *
          * });
          *
          * let collection = new Collection([a, b]);
          *
          * BackboneQuery.find(collection, { full_name: { $computed: "Dave Tonge" } });
          *
          * // Returns the model with the computed `full_name` equal to Dave Tonge
          *
          * BackboneQuery.find(collection, { full_name: { $computed: { $likeI: "john smi" } } });
          *
          * // Any of the previous operators can be used (including elemMatch is required)
          *
          *
          *
          * Combined Queries
          * ----------------
          * Multiple queries can be combined together. By default all supplied queries use the `$and` operator. However it is
          * possible to specify either `$or`, `$nor`, `$not` to implement alternate logic.
          *
          *
          * $and
          *
          * BackboneQuery.find(collection, { $and: { title: { $like: "News" }, likes: { $gt: 10 }}});
          *
          * // Returns all models that contain "News" in the title and have more than 10 likes.
          *
          * BackboneQuery.find(collection, { title: { $like: "News" }, likes: { $gt: 10 } });
          *
          * // Same as above as $and is assumed if not supplied
          *
          *
          *
          * $or
          *
          * BackboneQuery.find(collection, { $or: { title: { $like: "News" }, likes: { $gt: 10 } } });
          *
          * // Returns all models that contain "News" in the title OR have more than 10 likes.
          *
          *
          * $nor
          *
          * The opposite of `$or`
          *
          * BackboneQuery.find(collection, { $nor: { title: { $like: "News" }, likes: { $gt: 10 } } });
          *
          * // Returns all models that don't contain "News" in the title NOR have more than 10 likes.
          *
          *
          * $not
          *
          * The opposite of `$and`
          *
          * BackboneQuery.find(collection, { $not: { title: { $like: "News" }, likes: { $gt: 10 } } });
          *
          * // Returns all models that don't contain "News" in the title AND DON'T have more than 10 likes.
          *
          *
          * If you need to perform multiple queries on the same key, then you can supply the query as an array:
          *
          * BackboneQuery.find(collection, {
          *
          *    $or:[
          *
          *       {title:"News"},
          *
          *       {title:"About"}
          *
          *    ]
          *
          * });
          *
          * // Returns all models with the title "News" or "About".
          *
          *
          * Compound Queries
          * ----------------
          * It is possible to use multiple combined queries, for example searching for models that have a specific title
          * attribute, and either a category of "abc" or a tag of "xyz".
          *
          * BackboneQuery.find(collection, {
          *
          *    $and: { title: { $like: "News" } },
          *
          *    $or: {likes: { $gt: 10 }, color: { $contains:"red" } }
          *
          * });
          *
          * //Returns models that have "News" in their title and either have more than 10 likes or contain the color red.
          *
          *
          * Sorting
          * -------
          * Optional `sortBy` and `order` attributes can be supplied as part of an options object. `sortBy` can either be a
          * model key or a callback function which will be called with each model in the array.
          *
          * BackboneQuery.find(collection, { title: { $like: "News" } }, { sortBy: "likes" });
          *
          * // Returns all models that contain "News" in the title, sorted according to their "likes" attribute (ascending)
          *
          * BackboneQuery.find(collection, { title: { $like: "News" } }, { sortBy: "likes", order: "desc" });
          *
          * // Same as above, but "descending"
          *
          * BackboneQuery.find(collection,
          *
          *    { title: { $like: "News" } },
          *
          *    { sortBy: function(model){ return model.get("title").charAt(1); } }
          *
          * );
          *
          * // Results sorted according to 2nd character of the title attribute
          *
          *
          *
          * Paging
          * ------
          * To return only a subset of the results paging properties can be supplied as part of an options object. A limit
          * property must be supplied and optionally a offset or a page property can be supplied.
          *
          * BackboneQuery.find(collection, { likes:{ $gt: 10 } }, { limit: 10 });
          *
          * // Returns the first 10 models that have more than 10 likes.
          *
          * BackboneQuery.find(collection, { likes:{ $gt: 10 } }, { limit: 10, offset: 5 });
          *
          * // Returns 10 models that have more than 10 likes starting at the 6th model in the results.
          *
          * BackboneQuery.find(collection, { likes: { $gt: 10 } }, { limit: 10, page: 2 });
          *
          * // Returns 10 models that have more than 10 likes starting at the 11th model in the results (page 2).
          *
          *
          * When using the paging functionality, you will normally need to know the number of pages so that you can render
          * the correct interface for the user. Backbone Query can send the number of pages of results to a supplied callback.
          * The callback should be passed as a pager property on the options object. This callback will also receive the
          * sliced models as a second variable.
          *
          * Here is an example of a simple paging setup using the pager callback option:
          *
          * TODO Provide example!
          *
          * Caching Results
          * ---------------
          * To enable caching set the cache flag to true in the options object. This can greatly improve performance when
          * paging through results as the unpaged results will be saved. This options is not enabled by default as if models
          * are changed, added to, or removed from the collection, then the query cache will be out of date. If you know that
          * your data is static and won't change then caching can be enabled without any problems. If your data is dynamic
          * (as in most Backbone Apps) then a helper cache reset method is provided: `reset_query_cache`. This method should
          * be bound to your collections change, add and remove events (depending on how your data can be changed).
          *
          * Cache will be saved in a `_query_cache` property on each collection where a cache query is performed.
          *
          * @example
          * BackboneQuery.find(collection, { likes:{ $gt: 10 } }, { limit: 10, page: 1, cache: true });
          * //The first query will operate as normal and return the first page of results
          *
          * BackboneQuery.find(collection, { likes:{ $gt: 10 } }, { limit:10, page: 2, cache: true });
          * //The second query has an identical query object to the first query, so therefore the results will be retrieved
          * //from the cache, before the paging parameters are applied.
          *
          * // Binding the reset_query_cache method
          * MyCollection extends Backbone.Collection {
          *    initialize() {
          *       this.bind("change", () => { BackboneQuery.resetQueryCache(this) }, this);
          *    }
          * });
          */
         'use strict';

         BackboneQuery = (function () {
            function BackboneQuery() {
               _classCallCheck(this, BackboneQuery);
            }

            // Private / internal methods ---------------------------------------------------------------------------------------

            _createClass(BackboneQuery, null, [{
               key: 'find',

               /**
                * Returns a sorted array of models from the collection that match the query.
                *
                * @param {Collection}  collection  - Target collection
                * @param {string}      query       - Query string
                * @param {Object}      options     - Optional parameters
                * @returns {*}
                */
               value: function find(collection, query) {
                  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

                  var models = undefined;

                  if (options.cache) {
                     models = s_GET_CACHE(collection, query, options);
                  } else {
                     models = s_GET_SORTED_MODELS(collection, query, options);
                  }

                  if (options.limit) {
                     models = s_PAGE_MODELS(models, options);
                  }

                  return models;
               }

               /**
                * Returns the first model that matches the query.
                *
                * @param {Collection}  collection  - Target collection
                * @param {string}      query       - Query string
                * @returns {*}
                */
            }, {
               key: 'findOne',
               value: function findOne(collection, query) {
                  return BackboneQuery.find(collection, query)[0];
               }

               /**
                * Resets the query cache of the target collection.
                *
                * @param {Collection}  collection  - Target collection
                */
            }, {
               key: 'resetQueryCache',
               value: function resetQueryCache(collection) {
                  collection._queryCache = {};
               }

               /**
                * Returns a sorted array of all models from the collection that match the query.
                *
                * @param {Collection}  collection  - Target collection
                * @param {string}      query       - Query string
                * @returns {Array<*>}
                */
            }, {
               key: 'sortAll',
               value: function sortAll(collection, query) {
                  return s_SORT_MODELS(collection.models, query);
               }

               /**
                * Runs a query and returns a new collection with the results. Useful for chaining.
                *
                * @param {Collection}  collection     - Target collection
                * @param {string}      query          - Query string
                * @param {Object}      queryOptions   - Optional parameters for query.
                * @param {Object}      options        - Optional parameters (used to construct the new collection).
                * @returns {Collection}
                */
            }, {
               key: 'whereBy',
               value: function whereBy(collection, query) {
                  var queryOptions = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
                  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

                  return new collection.constructor(BackboneQuery.find(collection, query, queryOptions), options);
               }
            }]);

            return BackboneQuery;
         })();

         _export('default', BackboneQuery);

         __slice = [].slice;
         __hasProp = ({}).hasOwnProperty;

         __indexOf = [].indexOf || function (item) {
            for (var i = 0, l = this.length; i < l; i++) {
               if (i in this && this[i] === item) {
                  return i;
               }
            }

            return -1;
         };

         /**
          * Detects if any value in the array matches a test.
          *
          * @param {Array<*>} array - An array to detect.
          * @param {function} test  - A test function.
          * @returns {boolean}
          */

         s_DETECT = function s_DETECT(array, test) {
            var _i = undefined,
                _len = undefined;

            for (_i = 0, _len = array.length; _i < _len; _i++) {
               var val = array[_i];
               if (test(val)) {
                  return true;
               }
            }

            return false;
         };

         /**
          * Filters an array only adding results that `test` passes.
          *
          * @param {Array<*>} array - An array to filter.
          * @param {function} test  - A test function.
          * @returns {Array<*>}
          */

         s_FILTER = function s_FILTER(array, test) {
            var _results = [];
            var _i = undefined,
                _len = undefined;

            for (_i = 0, _len = array.length; _i < _len; _i++) {
               var val = array[_i];
               if (test(val)) {
                  _results.push(val);
               }
            }

            return _results;
         };

         /**
          * Gets the query cache from a collection.
          *
          * @param {Collection}  collection  - Target collection
          * @param {string}      query       - A query
          * @param {Object}      options     - Optional parameters
          * @returns {*}
          */

         s_GET_CACHE = function s_GET_CACHE(collection, query, options) {
            var models = undefined;
            var _ref = collection._queryCache;
            var queryString = JSON.stringify(query);
            var cache = _ref !== null ? _ref : collection._queryCache = {};
            models = cache[queryString];

            if (!models) {
               models = s_GET_SORTED_MODELS(collection, query, options);
               cache[queryString] = models;
            }

            return models;
         };

         /**
          * Runs a query then sorts the models.
          *
          * @param {Collection}  collection  - Target collection
          * @param {string}      query       - A query
          * @param {Object}      options     - Optional parameters
          * @returns {*}
          */

         s_GET_SORTED_MODELS = function s_GET_SORTED_MODELS(collection, query, options) {
            var models = undefined;
            models = s_RUN_QUERY(collection.models, query);

            if (options.sortBy) {
               models = s_SORT_MODELS(models, options);
            }

            return models;
         };

         /**
          * Tests an item and returns a string representation of the type or `false` if no type matched.
          *
          * @param {*}  item  - Item to test.
          * @returns {string|boolean}
          */

         s_GET_TYPE = function s_GET_TYPE(item) {
            if (_.isRegExp(item)) {
               return '$regex';
            }

            if (_.isDate(item)) {
               return '$date';
            }

            if (_.isObject(item) && !_.isArray(item)) {
               return 'object';
            }

            if (_.isArray(item)) {
               return 'array';
            }

            if (_.isString(item)) {
               return 'string';
            }

            if (_.isNumber(item)) {
               return 'number';
            }

            if (_.isBoolean(item)) {
               return 'boolean';
            }

            if (_.isFunction(item)) {
               return 'function';
            }

            return false;
         };

         /**
          *
          * @param {Array<Model>}   models         -
          * @param {Array<*>}       query          - An array of sub-queries.
          * @param {boolean}        andOr          -
          * @param {function}       filterFunction -
          * @param {string}         itemType       -
          * @returns {*}
          */

         s_ITERATOR = function s_ITERATOR(models, query, andOr, filterFunction, itemType) {
            if (itemType === null) {
               itemType = false;
            }

            return filterFunction(models, function (model) {
               var _i = undefined,
                   _len = undefined,
                   test = undefined;

               var _loop = function () {
                  var q = query[_i];

                  var attr = (function () {
                     switch (itemType) {
                        case 'elemMatch':
                           return model[q.key];

                        case 'computed':

                           return model[q.key]();

                        default:
                           return model.get(q.key);
                     }
                  })();

                  test = s_TEST_MODEL_ATTRIBUTE(q.type, attr);

                  if (test) {
                     test = s_PERFORM_QUERY(q.type, q.value, attr, model, q.key);
                  }

                  if (andOr === test) {
                     return {
                        v: andOr
                     };
                  }
               };

               for (_i = 0, _len = query.length; _i < _len; _i++) {
                  var _ret = _loop();

                  if (typeof _ret === 'object') return _ret.v;
               }
               return !andOr;
            });
         };

         /**
          * @returns {{}|*}
          */

         s_MAKE_OBJ = function s_MAKE_OBJ() {
            var current = undefined;
            var args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            var o = {};
            current = o;

            while (args.length) {
               var key = args.shift();
               var val = args.length === 1 ? args.shift() : {};
               current = current[key] = val;
            }

            return o;
         };

         /**
          * Pages models
          *
          * @param {Array<Model>}   models   - Array of models to page.
          * @param {Object}         options  - Optional parameters
          * @returns {*}
          */

         s_PAGE_MODELS = function s_PAGE_MODELS(models, options) {
            var start = undefined;

            if (options.offset) {
               start = options.offset;
            } else if (options.page) {
               start = (options.page - 1) * options.limit;
            } else {
               start = 0;
            }

            var end = start + options.limit;
            var sliced_models = models.slice(start, end);

            if (options.pager && _.isFunction(options.pager)) {
               var total_pages = Math.ceil(models.length / options.limit);
               options.pager(total_pages, sliced_models);
            }

            return sliced_models;
         };

         /**
          * Function to parse raw queries
          *
          * Allows queries of the following forms:
          * query
          * name: "test"
          * id: $gte: 10
          *
          * query [
          *    {name:"test"}
          *    {id:$gte:10}
          * ]
          *
          * @param {*}  rawQuery - raw query
          * @return {Array} parsed query
          */

         s_PARSE_SUB_QUERY = function s_PARSE_SUB_QUERY(rawQuery) {
            var _i = undefined,
                _len = undefined,
                key = undefined,
                o = undefined,
                queryArray = undefined;

            if (_.isArray(rawQuery)) {
               queryArray = rawQuery;
            } else {
               queryArray = (function () {
                  var _results = [];

                  for (key in rawQuery) {
                     if (!__hasProp.call(rawQuery, key)) {
                        continue;
                     }
                     var val = rawQuery[key];
                     _results.push(s_MAKE_OBJ(key, val));
                  }
                  return _results;
               })();
            }

            var _results = [];

            for (_i = 0, _len = queryArray.length; _i < _len; _i++) {
               var query = queryArray[_i];

               for (key in query) {
                  if (!__hasProp.call(query, key)) {
                     continue;
                  }

                  var queryParam = query[key];
                  o = { key: key };

                  var paramType = s_GET_TYPE(queryParam);
                  switch (paramType) {
                     case '$regex':
                     case '$date':
                        o.type = paramType;
                        o.value = queryParam;
                        break;
                     case 'object':
                        if (key === '$and' || key === '$or' || key === '$nor' || key === '$not') {
                           o.value = s_PARSE_SUB_QUERY(queryParam);
                           o.type = key;
                           o.key = null;
                        } else {
                           for (var type in queryParam) {
                              var value = queryParam[type];
                              if (s_TEST_QUERY_VALUE(type, value)) {
                                 var test = type;
                                 o.type = type;
                                 switch (test) {
                                    case '$elemMatch':
                                    case '$relationMatch':
                                       o.value = s_PARSE_QUERY(value);
                                       break;

                                    case '$computed':
                                       {
                                          var q = s_MAKE_OBJ(key, value);
                                          o.value = s_PARSE_SUB_QUERY(q);
                                          break;
                                       }

                                    default:
                                       o.value = value;
                                 }
                              }
                           }
                        }
                        break;
                     default:
                        o.type = '$equal';
                        o.value = queryParam;
                  }

                  if (o.type === '$equal' && (paramType === 'object' || paramType === 'array')) {
                     o.type = '$oEqual';
                  }
               }
               _results.push(o);
            }

            return _results;
         };

         /**
          * Parses query string.
          *
          * @param {string}   query - A query
          * @returns {*[]}
          */

         s_PARSE_QUERY = function s_PARSE_QUERY(query) {
            var key = undefined;
            var queryKeys = _(query).keys();
            var compoundKeys = ["$and", "$not", "$or", "$nor"];
            var compoundQuery = _.intersection(compoundKeys, queryKeys);

            if (compoundQuery.length === 0) {
               return [{ type: "$and", parsedQuery: s_PARSE_SUB_QUERY(query) }];
            } else {
               if (compoundQuery.length !== queryKeys.length) {
                  if (__indexOf.call(compoundQuery, "$and") < 0) {
                     query.$and = {};
                     compoundQuery.unshift("$and");
                  }
                  for (key in query) {
                     if (!__hasProp.call(query, key)) {
                        continue;
                     }
                     var val = query[key];

                     if (!(__indexOf.call(compoundKeys, key) < 0)) {
                        continue;
                     }

                     query.$and[key] = val;
                     delete query[key];
                  }
               }

               return (function () {
                  var _i = undefined,
                      _len = undefined;
                  var _results = [];

                  for (_i = 0, _len = compoundQuery.length; _i < _len; _i++) {
                     var type = compoundQuery[_i];
                     _results.push({ type: type, parsedQuery: s_PARSE_SUB_QUERY(query[type]) });
                  }
                  return _results;
               })();
            }
         };

         /**
          * Performs a query
          *
          * @param {string}   type  -
          * @param {*}        value -
          * @param {*}        attr  -
          * @param {*}        model -
          * @returns {*}
          */

         s_PERFORM_QUERY = function s_PERFORM_QUERY(type, value, attr, model) {
            switch (type) {
               case '$equal':
                  if (_(attr).isArray()) {
                     return __indexOf.call(attr, value) >= 0;
                  } else {
                     return attr === value;
                  }

               case '$oEqual':
                  return _(attr).isEqual(value);

               case '$contains':
                  return __indexOf.call(attr, value) >= 0;

               case '$ne':
                  return attr !== value;

               case '$lt':
                  return attr < value;

               case '$gt':
                  return attr > value;

               case '$lte':
                  return attr <= value;

               case '$gte':
                  return attr >= value;

               case '$between':
                  return value[0] < attr && attr < value[1];

               case '$in':
                  return __indexOf.call(value, attr) >= 0;

               case '$nin':
                  return __indexOf.call(value, attr) < 0;

               case '$all':
                  return _(value).all(function (item) {
                     return __indexOf.call(attr, item) >= 0;
                  });

               case '$any':
                  return _(attr).any(function (item) {
                     return __indexOf.call(value, item) >= 0;
                  });

               case '$size':
                  return attr.length === value;

               case '$exists':
               case '$has':
                  return attr !== null === value;

               case '$like':
                  return attr.includes(value);

               case '$likeI':
                  return attr.toLowerCase().includes(value.toLowerCase());

               case '$regex':
                  return value.test(attr);

               case '$cb':
                  return value.call(model, attr);

               case '$elemMatch':
                  return s_RUN_QUERY(attr, value, 'elemMatch').length > 0;

               case '$relationMatch':
                  return s_RUN_QUERY(attr.models, value, 'relationMatch').length > 0;

               case '$computed':
                  return s_ITERATOR([model], value, false, s_DETECT, 'computed');

               case '$and':
               case '$or':
               case '$nor':
               case '$not':
                  return s_PROCESS_QUERY[type]([model], value).length === 1;

               default:
                  return false;
            }
         };

         /**
          * @type {{$and: Function, $or: Function, $nor: Function, $not: Function}}
          */
         s_PROCESS_QUERY = {
            $and: function $and(models, query, itemType) {
               return s_ITERATOR(models, query, false, s_FILTER, itemType);
            },
            $or: function $or(models, query, itemType) {
               return s_ITERATOR(models, query, true, s_FILTER, itemType);
            },
            $nor: function $nor(models, query, itemType) {
               return s_ITERATOR(models, query, true, s_REJECT, itemType);
            },
            $not: function $not(models, query, itemType) {
               return s_ITERATOR(models, query, false, s_REJECT, itemType);
            }
         };

         /**
          * Creates an array of rejected values of an array that doesn't match a test function.
          *
          * @param {Array<*>} array - An array to reject.
          * @param {function} test  - A test function.
          * @returns {Array<*>}
          */

         s_REJECT = function s_REJECT(array, test) {
            var _results = [];
            var _i = undefined,
                _len = undefined;

            for (_i = 0, _len = array.length; _i < _len; _i++) {
               var val = array[_i];

               if (!test(val)) {
                  _results.push(val);
               }
            }

            return _results;
         };

         /**
          * Runs a query.
          *
          * @param {*}        items    -
          * @param {string}   query    - A query
          * @param {*}        itemType -
          * @returns {*}
          */

         s_RUN_QUERY = function s_RUN_QUERY(items, query, itemType) {
            if (!itemType) {
               query = s_PARSE_QUERY(query);
            }

            var reduceIterator = function reduceIterator(memo, queryItem) {
               return s_PROCESS_QUERY[queryItem.type](memo, queryItem.parsedQuery, itemType);
            };

            return _.reduce(query, reduceIterator, items);
         };

         /**
          * Sorts models.
          *
          * @param {Array<Model>}   models   -
          * @param {string}         query    - A query
          * @returns {*}
          */

         s_SORT_MODELS = function s_SORT_MODELS(models, query) {
            if (_(query.sortBy).isString()) {
               var first = _(models).first();
               if (_.isUndefined(first) || first === null) {
                  return [];
               }

               var firstValue = first.get(query.sortBy);

               if (_.isString(firstValue)) {
                  models = _(models).sortBy(function (model) {
                     return model.get(query.sortBy).toLocaleLowerCase();
                  });
               } else {
                  models = _(models).sortBy(function (model) {
                     return model.get(query.sortBy);
                  });
               }
            } else if (_(query.sortBy).isFunction()) {
               models = _(models).sortBy(query.sortBy);
            }

            if (query.order === 'desc') {
               models = models.reverse();
            } else if (query.order === false) {
               models = models.reverse();
            }

            return models;
         };

         /**
          * Tests a model attribute based on the query type.
          *
          * @param {string}   type  - Query type
          * @param {*}        value - A value
          * @returns {*}
          */

         s_TEST_MODEL_ATTRIBUTE = function s_TEST_MODEL_ATTRIBUTE(type, value) {
            switch (type) {
               case '$like':
               case '$likeI':
               case '$regex':
                  return _(value).isString();
               case '$contains':
               case '$all':
               case '$any':
               case '$elemMatch':
                  return _(value).isArray();
               case '$size':
                  return _(value).isArray() || _(value).isString();
               case '$in':
               case '$nin':
                  return value !== null;
               case '$relationMatch':
                  return value !== null && value.models;
               default:
                  return true;
            }
         };

         /**
          * Tests a value based on the query type.
          *
          * @param {string}   type  - Query type
          * @param {*}        value - A value
          * @returns {*}
          */

         s_TEST_QUERY_VALUE = function s_TEST_QUERY_VALUE(type, value) {
            switch (type) {
               case '$in':
               case '$nin':
               case '$all':
               case '$any':
                  return _(value).isArray();

               case '$size':
                  return _(value).isNumber();

               case '$regex':
                  return _(value).isRegExp();

               case '$like':
               case '$likeI':
                  return _(value).isString();

               case '$between':
                  return _(value).isArray() && value.length === 2;

               case '$cb':
                  return _(value).isFunction();

               default:
                  return true;
            }
         };
      }
   };
});

$__System.register("10", ["f"], function (_export) {
  "use strict";

  return {
    setters: [function (_f) {
      var _exportObj = {};

      for (var _key in _f) {
        if (_key !== "default") _exportObj[_key] = _f[_key];
      }

      _exportObj["default"] = _f["default"];

      _export(_exportObj);
    }],
    execute: function () {}
  };
});

$__System.register('11', ['4', '6', '7', '8', '9', '10', '12', 'a', 'd'], function (_export) {
   var _classCallCheck, _, Collection, _get, _inherits, BackboneQuery, Model, _createClass, Debug, ParseCollection;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_5) {
         _ = _5['default'];
      }, function (_7) {
         Collection = _7['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_8) {
         BackboneQuery = _8['default'];
      }, function (_6) {
         Model = _6['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_d) {
         Debug = _d['default'];
      }],
      execute: function () {

         /**
          * ParseCollection - Collections are ordered sets of models. (http://backbonejs.org/#Collection)
          * -------------------
          *
          * This implementation of Backbone.Collection provides a `parse` method which coverts the response of a Parse.Query
          * to ParseModels. One must set a Parse.Query instance as options.query or use a getter method such as "get query()".
          *
          * Please see the `Collection` documentation for relevant information about the parent class / implementation.
          *
          * In addition ParseCollection includes BackboneQuery support which supports local query / sorting of collections.
          * Additional methods: `find, findOne, resetQueryCache, sortAll, whereBy`.
          *
          * @example
          *
          * If using Backbone-ES6 by ES6 source one can create a module for a Backbone.Collection:
          * import Backbone   from 'backbone';
          * import Parse      from 'parse';
          *
          * export default new Backbone.Collection(null,
          * {
          *    model: Backbone.Model.extend(...),
          *    query: new Parse.Query('<TABLE_NAME>')
          * });
          *
          * or if importing a specific model class
          *
          * import Backbone   from 'backbone';
          * import Parse      from 'parse';
          * import Model      from '<MY-BACKBONE-MODEL>'
          *
          * export default new Backbone.Collection(null,
          * {
          *    model: Model,
          *    query: new Parse.Query('<TABLE_NAME>')
          * });
          *
          * or use full ES6 style by using a getter for "model":
          *
          * import Backbone   from 'backbone';
          * import Parse      from 'parse';
          * import Model      from '<MY-BACKBONE-MODEL>'
          *
          * const s_QUERY = new Parse.Query('<TABLE_NAME>');
          *
          * class MyCollection extends Backbone.Collection
          * {
          *    get model() { return Model; }
          *    get query() { return s_QUERY; }
          * }
          *
          * export default new MyCollection();   // If desired drop "new" to export the class itself and not an instance.
          */
         'use strict';

         ParseCollection = (function (_Collection) {
            _inherits(ParseCollection, _Collection);

            /**
             * When creating a Collection, you may choose to pass in the initial array of models. The collection's comparator
             * may be included as an option. Passing false as the comparator option will prevent sorting. If you define an
             * initialize function, it will be invoked when the collection is created. There are a couple of options that, if
             * provided, are attached to the collection directly: model, comparator and query.
             *
             * Pass null for models to create an empty Collection with options.
             *
             * @see http://backbonejs.org/#Collection-constructor
             *
             * @param {Array<Model>}   models   - An optional array of models to set.
             * @param {object}         options  - Optional parameters
             */

            function ParseCollection() {
               var models = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
               var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

               _classCallCheck(this, ParseCollection);

               _get(Object.getPrototypeOf(ParseCollection.prototype), 'constructor', this).call(this, models, _.extend({ abortCtor: true }, options));

               // Allows child classes to abort constructor execution.
               if (_.isBoolean(options.abortCtor) && options.abortCtor) {
                  return;
               }

               // Must detect if there are any getters defined in order to skip setting these values directly.
               var hasComparatorGetter = !_.isUndefined(this.comparator);
               var hasModelGetter = !_.isUndefined(this.model);
               var hasQueryGetter = !_.isUndefined(this.query);

               if (options.comparator !== void 0 && !hasComparatorGetter) {
                  /**
                   * A comparator string indicating the attribute to sort.
                   * @type {string}
                   */
                  this.comparator = options.comparator;
               }

               // The default model for a collection is just a **Backbone.Model**. This should be overridden in most cases.
               if (!hasModelGetter) {
                  /**
                   * The default Backbone.Model class to use as a prototype for this collection.
                   * @type {Model}
                   */
                  this.model = Model;
               }

               if (options.model && !hasModelGetter) {
                  if (!(options.model instanceof Model)) {
                     throw new TypeError('options.model is not an instance of ParseModel.');
                  }

                  this.model = options.model;
               }

               if (options.query && !hasQueryGetter) {
                  /**
                   * A Parse.Query instance
                   * @type {Parse.Query}
                   */
                  this.query = options.query;
               }

               // Allows child classes to postpone initialization.
               if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) {
                  return;
               }

               this._reset();

               this.initialize.apply(this, arguments);

               if (models) {
                  this.reset(models, _.extend({ silent: true }, options));
               }
            }

            /**
             * Returns a new instance of the collection with an identical list of models.
             *
             * @see http://backbonejs.org/#Collection-clone
             *
             * @returns {Collection} Returns a new collection with shared models.
             */

            _createClass(ParseCollection, [{
               key: 'clone',
               value: function clone() {
                  return new this.constructor(this.models, {
                     comparator: this.comparator,
                     model: this.model,
                     query: this.query
                  });
               }

               /**
                * Delegates to `BackboneQuery.find` to return an array of models that match the sort query.
                *
                * @param {string}   query    - A query string.
                * @param {Object}   options  - Optional parameters
                * @returns {Array<Model>}
                */
            }, {
               key: 'find',
               value: function find(query, options) {
                  return BackboneQuery.find(this, query, options);
               }

               /**
                * Delegates to `BackboneQuery.findOne` to return the first model that matches the sort query.
                *
                * @param {string}   query    - A query string.
                * @returns {Model}
                */
            }, {
               key: 'findOne',
               value: function findOne(query) {
                  return BackboneQuery.findOne(this, query);
               }

               /* eslint-disable no-unused-vars */
               /**
                * `parse` is called by Backbone whenever a collection's models are returned by the server, in fetch. The function is
                * passed the raw response object, and should return the array of model attributes to be added to the collection.
                * This implementation depends on `parseSync` which utilizes the Parse.Query attached to this collection to return
                * a response of Parse.Object(s) which are then parsed into ParseModels.
                *
                * @param {object}   resp - An array of Parse.Object(s).
                * @param {object}   options - Unused optional parameters.
                * @returns {object|Array[]} An array or single ParseModel(s).
                */
            }, {
               key: 'parse',
               value: function parse(resp, options) {
                  var _this = this;

                  /* eslint-enable no-unused-vars */

                  var output = undefined;

                  Debug.log('ParseCollection - parse - 0', true);

                  if (!_.isArray(resp)) {
                     var parseObject = resp;
                     output = new this.model({}, { parseObject: parseObject, updateParseObject: false });

                     Debug.log('ParseCollection - parse - 1 - toJSON: ' + JSON.stringify(parseObject.toJSON()));
                  } else {
                     output = [];

                     Debug.log('ParseCollection - parse - 2 - resp.length: ' + resp.length);

                     _.each(resp, function (parseObject) {
                        var model = new _this.model({}, { parseObject: parseObject, updateParseObject: false });
                        output.push(model);

                        Debug.log('ParseCollection - parse - 3 - parseObject: ' + JSON.stringify(model.toJSON()));
                     });
                  }

                  return output;
               }

               /**
                * Delegates to `BackboneQuery.resetQueryCache` to reset this collections query cache.
                */
            }, {
               key: 'resetQueryCache',
               value: function resetQueryCache() {
                  BackboneQuery.resetQueryCache(this);
               }

               /**
                * Delegates to `BackboneQuery.sortAll` to return all models that match the sort query.
                *
                * @param {string}   query    - A query string.
                * @returns {Array<Model>}
                */
            }, {
               key: 'sortAll',
               value: function sortAll(query) {
                  return BackboneQuery.sortAll(this, query);
               }

               /**
                * Delegates to `BackboneQuery.whereBy` to return a new collection with the models that match the sort query.
                *
                * @param {string}   query    - A query string.
                * @param {Object}   options  - Optional parameters
                * @returns {Collection}
                */
            }, {
               key: 'whereBy',
               value: function whereBy(query, options) {
                  return BackboneQuery.whereBy(this, query, options, {
                     model: this.model,
                     query: this.query,
                     comparator: this.comparator
                  });
               }
            }]);

            return ParseCollection;
         })(Collection);

         _export('default', ParseCollection);
      }
   };
});

$__System.register('13', ['4', '6', '8', '9', '14', 'a', 'e'], function (_export) {
   var _classCallCheck, _, _get, _inherits, _Promise, _createClass, Events, TyphonEvents, s_EVENT_SPLITTER, s_EVENTS_API, s_TRIGGER_API, s_TRIGGER_FIRST_EVENTS, s_TRIGGER_RESULTS_EVENTS, s_TRIGGER_THEN_EVENTS;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_6) {
         _ = _6['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_5) {
         _Promise = _5['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_e) {
         Events = _e['default'];
      }],
      execute: function () {

         /**
          * TyphonEvents adds new functionality for trigger events. The following are new trigger mechanisms:
          *
          * Please refer to the Events documentation for all inherited functionality.
          *
          * `triggerDefer` - Defers invoking `trigger`.
          *
          * `triggerFirst` - Only invokes the first target matched and passes back any result to the callee.
          *
          * `triggerResults` - Invokes all targets matched and passes back an array of results in an array to the callee.
          *
          * `triggerThen` - Invokes all targets matched and adds any returned results through `Promise.all` which returns
          *  a single promise to the callee.
          */
         'use strict';

         TyphonEvents = (function (_Events) {
            _inherits(TyphonEvents, _Events);

            function TyphonEvents() {
               _classCallCheck(this, TyphonEvents);

               _get(Object.getPrototypeOf(TyphonEvents.prototype), 'constructor', this).apply(this, arguments);
            }

            // Private / internal methods ---------------------------------------------------------------------------------------

            /**
             * Regular expression used to split event strings.
             * @type {RegExp}
             */

            _createClass(TyphonEvents, [{
               key: 'getEventbusName',

               /**
                * Returns the current eventbusName.
                *
                * @returns {string|*}
                */
               value: function getEventbusName() {
                  return this._eventbusName;
               }

               /**
                * Sets the eventbus name.
                *
                * @param {string}   name - The name for this eventbus.
                */
            }, {
               key: 'setEventbusName',
               value: function setEventbusName(name) {
                  this._eventbusName = name;
               }

               /**
                * Defers invoking `trigger`.
                *
                * @returns {TyphonEvents}
                */
            }, {
               key: 'triggerDefer',
               value: function triggerDefer() {
                  var _this = this,
                      _arguments = arguments;

                  setTimeout(function () {
                     _get(Object.getPrototypeOf(TyphonEvents.prototype), 'trigger', _this).apply(_this, _arguments);
                  }, 0);

                  return this;
               }

               /**
                * Provides `trigger` functionality that only invokes the first target matched and passes back any result to
                * the callee.
                *
                * @param {string}   name  - Event name(s)
                * @returns {*}
                */
            }, {
               key: 'triggerFirst',
               value: function triggerFirst(name) {
                  /* istanbul ignore if */
                  if (!this._events) {
                     return null;
                  }

                  var length = Math.max(0, arguments.length - 1);
                  var args = new Array(length);
                  for (var i = 0; i < length; i++) {
                     args[i] = arguments[i + 1];
                  }

                  return s_EVENTS_API(s_TRIGGER_API, s_TRIGGER_FIRST_EVENTS, this._events, name, void 0, args);
               }

               /**
                * Provides `trigger` functionality, but collects any returned results from invoked targets in an array and passes
                * back this array to the callee.
                *
                * @param {string}   name  - Event name(s)
                * @returns {Array<*>}
                */
            }, {
               key: 'triggerResults',
               value: function triggerResults(name) {
                  /* istanbul ignore if */
                  if (!this._events) {
                     return [];
                  }

                  var length = Math.max(0, arguments.length - 1);
                  var args = new Array(length);
                  for (var i = 0; i < length; i++) {
                     args[i] = arguments[i + 1];
                  }

                  return s_EVENTS_API(s_TRIGGER_API, s_TRIGGER_RESULTS_EVENTS, this._events, name, void 0, args);
               }

               /**
                * Provides `trigger` functionality, but collects any returned Promises from invoked targets and returns a
                * single Promise generated by `Promise.all`. This is a very useful mechanism to invoke asynchronous operations
                * over an eventbus.
                *
                * @param {string}   name  - Event name(s)
                * @returns {Promise}
                */
            }, {
               key: 'triggerThen',
               value: function triggerThen(name) {
                  /* istanbul ignore if */
                  if (!this._events) {
                     _Promise.all([]);
                  }

                  var length = Math.max(0, arguments.length - 1);
                  var args = new Array(length);
                  for (var i = 0; i < length; i++) {
                     args[i] = arguments[i + 1];
                  }

                  return s_EVENTS_API(s_TRIGGER_API, s_TRIGGER_THEN_EVENTS, this._events, name, void 0, args);
               }
            }]);

            return TyphonEvents;
         })(Events);

         _export('default', TyphonEvents);

         s_EVENT_SPLITTER = /\s+/;

         /**
          * Iterates over the standard `event, callback` (as well as the fancy multiple space-separated events `"change blur",
          * callback` and jQuery-style event maps `{event: callback}`).
          *
          * @param {function} iteratee       - Trigger API
          * @param {function} iterateeTarget - Internal function which is dispatched to.
          * @param {Array<*>} events         - Array of stored event callback data.
          * @param {string}   name           - Event name(s)
          * @param {function} callback       - callback
          * @param {Object}   opts           - Optional parameters
          * @returns {*}
          */

         s_EVENTS_API = function s_EVENTS_API(iteratee, iterateeTarget, events, name, callback, opts) {
            var i = 0,
                names = undefined;

            if (name && typeof name === 'object') {
               // Handle event maps.
               if (callback !== void 0 && 'context' in opts && opts.context === void 0) {
                  opts.context = callback;
               }
               for (names = _.keys(name); i < names.length; i++) {
                  events = s_EVENTS_API(iteratee, iterateeTarget, events, names[i], name[names[i]], opts);
               }
            } else if (name && s_EVENT_SPLITTER.test(name)) {
               // Handle space-separated event names by delegating them individually.
               for (names = name.split(s_EVENT_SPLITTER); i < names.length; i++) {
                  events = iteratee(iterateeTarget, events, names[i], callback, opts);
               }
            } else {
               // Finally, standard events.
               events = iteratee(iterateeTarget, events, name, callback, opts);
            }

            return events;
         };

         /**
          * Handles triggering the appropriate event callbacks.
          *
          * @param {function} iterateeTarget - Internal function which is dispatched to.
          * @param {Array<*>} objEvents      - Array of stored event callback data.
          * @param {string}   name           - Event name(s)
          * @param {function} cb             - callback
          * @param {Array<*>} args           - Arguments supplied to a trigger method.
          * @returns {*}
          */

         s_TRIGGER_API = function s_TRIGGER_API(iterateeTarget, objEvents, name, cb, args) {
            var result = undefined;

            if (objEvents) {
               var events = objEvents[name];
               var allEvents = objEvents.all;
               if (events && allEvents) {
                  allEvents = allEvents.slice();
               }
               if (events) {
                  result = iterateeTarget(events, args);
               }
               if (allEvents) {
                  result = iterateeTarget(allEvents, [name].concat(args));
               }
            }

            return result;
         };

         /**
          * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
          * cases speedy (most internal Backbone events have 3 arguments). This method stop event propagation after the first
          * target is invoked. It also passes back a return value from the target.
          *
          * @param {Array<*>} events   -  Array of stored event callback data.
          * @param {Array<*>} args     -  Arguments supplied to `triggerFirst`.
          * @returns {*}
          */

         s_TRIGGER_FIRST_EVENTS = function s_TRIGGER_FIRST_EVENTS(events, args) {
            var ev = undefined,
                i = -1;
            var a1 = args[0],
                a2 = args[1],
                a3 = args[2],
                l = events.length;

            var result = undefined;

            switch (args.length) {
               case 0:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        return result;
                     }
                  }
                  return;
               case 1:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx, a1);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        return result;
                     }
                  }
                  return;
               case 2:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        return result;
                     }
                  }
                  return;
               case 3:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        return result;
                     }
                  }
                  return;
               default:
                  while (++i < l) {
                     result = (ev = events[i]).callback.apply(ev.ctx, args);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        return result;
                     }
                  }
                  return;
            }
         };

         /**
          * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
          * cases speedy (most internal Backbone events have 3 arguments). This dispatch method passes back an array with
          * all results returned by any invoked targets.
          *
          * @param {Array<*>} events   -  Array of stored event callback data.
          * @param {Array<*>} args     -  Arguments supplied to `triggerResults`.
          * @returns {Array<*>}
          */

         s_TRIGGER_RESULTS_EVENTS = function s_TRIGGER_RESULTS_EVENTS(events, args) {
            var ev = undefined,
                i = -1;
            var a1 = args[0],
                a2 = args[1],
                a3 = args[2],
                l = events.length;

            var result = undefined;
            var results = [];

            switch (args.length) {
               case 0:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        results.push(result);
                     }
                  }
                  return results;
               case 1:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx, a1);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        results.push(result);
                     }
                  }
                  return results;
               case 2:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        results.push(result);
                     }
                  }
                  return results;
               case 3:
                  while (++i < l) {
                     result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        results.push(result);
                     }
                  }
                  return results;
               default:
                  while (++i < l) {
                     result = (ev = events[i]).callback.apply(ev.ctx, args);

                     // If we received a valid result return immediately.
                     if (!_.isUndefined(result)) {
                        results.push(result);
                     }
                  }
                  return results;
            }
         };

         /**
          * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
          * cases speedy (most internal Backbone events have 3 arguments). This dispatch method uses ES6 Promises and adds
          * any returned results to an array which is added to a Promise.all construction which passes back a Promise which
          * waits until all Promises complete. Any target invoked may return a Promise or any result. This is very useful to
          * use for any asynchronous operations.
          *
          * @param {Array<*>} events   -  Array of stored event callback data.
          * @param {Array<*>} args     -  Arguments supplied to `triggerThen`.
          * @returns {Promise}
          */

         s_TRIGGER_THEN_EVENTS = function s_TRIGGER_THEN_EVENTS(events, args) {
            var ev = undefined,
                i = -1;
            var a1 = args[0],
                a2 = args[1],
                a3 = args[2],
                l = events.length;

            var result = undefined;
            var results = [];

            try {
               switch (args.length) {
                  case 0:
                     while (++i < l) {
                        result = (ev = events[i]).callback.call(ev.ctx);

                        // If we received a valid result add it to the promises array.
                        if (!_.isUndefined(result)) {
                           results.push(result);
                        }
                     }
                     break;

                  case 1:
                     while (++i < l) {
                        result = (ev = events[i]).callback.call(ev.ctx, a1);

                        // If we received a valid result add it to the promises array.
                        if (!_.isUndefined(result)) {
                           results.push(result);
                        }
                     }
                     break;

                  case 2:
                     while (++i < l) {
                        result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

                        // If we received a valid result add it to the promises array.
                        if (!_.isUndefined(result)) {
                           results.push(result);
                        }
                     }
                     break;

                  case 3:
                     while (++i < l) {
                        result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

                        // If we received a valid result add it to the promises array.
                        if (!_.isUndefined(result)) {
                           results.push(result);
                        }
                     }
                     break;

                  default:
                     while (++i < l) {
                        result = (ev = events[i]).callback.apply(ev.ctx, args);

                        // If we received a valid result add it to the promises array.
                        if (!_.isUndefined(result)) {
                           results.push(result);
                        }
                     }
                     break;
               }
            } catch (error) {
               return _Promise.reject(error);
            }

            return _Promise.all(results);
         };
      }
   };
});

$__System.register('15', ['4', '6', '8', '9', 'a', 'e', 'c'], function (_export) {
   var _classCallCheck, _, _get, _inherits, _createClass, Events, Utils, History, s_ROUTE_STRIPPER, s_ROOT_STRIPPER, s_PATH_STRIPPER, s_UPDATE_HASH;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_5) {
         _ = _5['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_e) {
         Events = _e['default'];
      }, function (_c) {
         Utils = _c['default'];
      }],
      execute: function () {

         /**
          * Backbone.History - History serves as a global router. (http://backbonejs.org/#History)
          * ----------------
          *
          * History serves as a global router (per frame) to handle hashchange events or pushState, match the appropriate route,
          * and trigger callbacks. You shouldn't ever have to create one of these yourself since Backbone.history already
          * contains one.
          *
          * pushState support exists on a purely opt-in basis in Backbone. Older browsers that don't support pushState will
          * continue to use hash-based URL fragments, and if a hash URL is visited by a pushState-capable browser, it will be
          * transparently upgraded to the true URL. Note that using real URLs requires your web server to be able to correctly
          * render those pages, so back-end changes are required as well. For example, if you have a route of /documents/100,
          * your web server must be able to serve that page, if the browser visits that URL directly. For full search-engine
          * crawlability, it's best to have the server generate the complete HTML for the page ... but if it's a web application,
          * just rendering the same content you would have for the root URL, and filling in the rest with Backbone Views and
          * JavaScript works fine.
          *
          * Handles cross-browser history management, based on either [pushState](http://diveintohtml5.info/history.html) and
          * real URLs, or [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange) and URL fragments.
          * If the browser supports neither (old IE, natch), falls back to polling.
          */
         'use strict';

         History = (function (_Events) {
            _inherits(History, _Events);

            /** */

            function History() {
               _classCallCheck(this, History);

               _get(Object.getPrototypeOf(History.prototype), 'constructor', this).call(this);

               /**
                * Stores route / callback pairs for validation.
                * @type {Array<Object<string, function>>}
                */
               this.handlers = [];
               this.checkUrl = _.bind(this.checkUrl, this);

               // Ensure that `History` can be used outside of the browser.
               if (typeof window !== 'undefined') {
                  /**
                   * Browser Location or URL string.
                   * @type {Location|String}
                   */
                  this.location = window.location;

                  /**
                   * Browser history
                   * @type {History}
                   */
                  this.history = window.history;
               }

               /**
                * Has the history handling already been started?
                * @type {boolean}
                */
               this.started = false;

               /**
                * The default interval to poll for hash changes, if necessary, is twenty times a second.
                * @type {number}
                */
               this.interval = 50;
            }

            // Private / internal methods ---------------------------------------------------------------------------------------

            /**
             * Cached regex for stripping a leading hash/slash and trailing space.
             */

            /**
             * Are we at the app root?
             *
             * @returns {boolean}
             */

            _createClass(History, [{
               key: 'atRoot',
               value: function atRoot() {
                  var path = this.location.pathname.replace(/[^\/]$/, '$&/');
                  return path === this.root && !this.getSearch();
               }

               /**
                * Checks the current URL to see if it has changed, and if it has, calls `loadUrl`, normalizing across the
                * hidden iframe.
                *
                * @returns {boolean}
                */
            }, {
               key: 'checkUrl',
               value: function checkUrl() {
                  var current = this.getFragment();

                  // If the user pressed the back button, the iframe's hash will have changed and we should use that for comparison.
                  if (current === this.fragment && this.iframe) {
                     current = this.getHash(this.iframe.contentWindow);
                  }

                  if (current === this.fragment) {
                     return false;
                  }
                  if (this.iframe) {
                     this.navigate(current);
                  }
                  this.loadUrl();
               }

               /**
                * Unicode characters in `location.pathname` are percent encoded so they're decoded for comparison. `%25` should
                * not be decoded since it may be part of an encoded parameter.
                *
                * @param {string}   fragment - URL fragment
                * @return {string}
                */
            }, {
               key: 'decodeFragment',
               value: function decodeFragment(fragment) {
                  return decodeURI(fragment.replace(/%25/g, '%2525'));
               }

               /**
                * Get the cross-browser normalized URL fragment from the path or hash.
                *
                * @param {string} fragment   -- URL fragment
                * @returns {*|void|string|XML}
                */
            }, {
               key: 'getFragment',
               value: function getFragment(fragment) {
                  if (Utils.isNullOrUndef(fragment)) {
                     if (this._usePushState || !this._wantsHashChange) {
                        fragment = this.getPath();
                     } else {
                        fragment = this.getHash();
                     }
                  }
                  return fragment.replace(s_ROUTE_STRIPPER, '');
               }

               /**
                * Gets the true hash value. Cannot use location.hash directly due to bug in Firefox where location.hash will
                * always be decoded.
                *
                * @param {object}   window   - Browser `window`
                * @returns {*}
                */
            }, {
               key: 'getHash',
               value: function getHash(window) {
                  var match = (window || this).location.href.match(/#(.*)$/);
                  return match ? match[1] : '';
               }

               /**
                * Get the pathname and search params, without the root.
                *
                * @returns {*}
                */
            }, {
               key: 'getPath',
               value: function getPath() {
                  var path = this.decodeFragment(this.location.pathname + this.getSearch()).slice(this.root.length - 1);
                  return path.charAt(0) === '/' ? path.slice(1) : path;
               }

               /**
                * In IE6, the hash fragment and search params are incorrect if the fragment contains `?`.
                *
                * @returns {string}
                */
            }, {
               key: 'getSearch',
               value: function getSearch() {
                  var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
                  return match ? match[0] : '';
               }

               /**
                * Attempt to load the current URL fragment. If a route succeeds with a match, returns `true`. If no defined routes
                * matches the fragment, returns `false`.
                *
                * @param {string}   fragment - URL fragment
                * @returns {boolean}
                */
            }, {
               key: 'loadUrl',
               value: function loadUrl(fragment) {
                  // If the root doesn't match, no routes can match either.
                  if (!this.matchRoot()) {
                     return false;
                  }
                  fragment = this.fragment = this.getFragment(fragment);
                  return _.some(this.handlers, function (handler) {
                     if (handler.route.test(fragment)) {
                        handler.callback(fragment);
                        return true;
                     }
                  });
               }

               /**
                * Does the pathname match the root?
                *
                * @returns {boolean}
                */
            }, {
               key: 'matchRoot',
               value: function matchRoot() {
                  var path = this.decodeFragment(this.location.pathname);
                  var rootPath = path.slice(0, this.root.length - 1) + '/';
                  return rootPath === this.root;
               }

               /**
                * Save a fragment into the hash history, or replace the URL state if the 'replace' option is passed. You are
                * responsible for properly URL-encoding the fragment in advance.
                *
                * The options object can contain `trigger: true` if you wish to have the route callback be fired (not usually
                * desirable), or `replace: true`, if you wish to modify the current URL without adding an entry to the history.
                *
                * @param {string}   fragment - String representing an URL fragment.
                * @param {object}   options - Optional hash containing parameters for navigate.
                * @returns {*}
                */
            }, {
               key: 'navigate',
               value: function navigate(fragment, options) {
                  if (!History.started) {
                     return false;
                  }
                  if (!options || options === true) {
                     options = { trigger: !!options };
                  }

                  // Normalize the fragment.
                  fragment = this.getFragment(fragment || '');

                  // Don't include a trailing slash on the root.
                  var rootPath = this.root;

                  if (fragment === '' || fragment.charAt(0) === '?') {
                     rootPath = rootPath.slice(0, -1) || '/';
                  }

                  var url = rootPath + fragment;

                  // Strip the hash and decode for matching.
                  fragment = this.decodeFragment(fragment.replace(s_PATH_STRIPPER, ''));

                  if (this.fragment === fragment) {
                     return;
                  }

                  /**
                   * URL fragment
                   * @type {*|void|string|XML}
                   */
                  this.fragment = fragment;

                  // If pushState is available, we use it to set the fragment as a real URL.
                  if (this._usePushState) {
                     this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                     // If hash changes haven't been explicitly disabled, update the hash fragment to store history.
                  } else if (this._wantsHashChange) {
                        s_UPDATE_HASH(this.location, fragment, options.replace);

                        if (this.iframe && fragment !== this.getHash(this.iframe.contentWindow)) {
                           var iWindow = this.iframe.contentWindow;

                           // Opening and closing the iframe tricks IE7 and earlier to push a history
                           // entry on hash-tag change.  When replace is true, we don't want this.
                           if (!options.replace) {
                              iWindow.document.open();
                              iWindow.document.close();
                           }

                           s_UPDATE_HASH(iWindow.location, fragment, options.replace);
                        }

                        // If you've told us that you explicitly don't want fallback hashchange-
                        // based history, then `navigate` becomes a page refresh.
                     } else {
                           return this.location.assign(url);
                        }

                  if (options.trigger) {
                     return this.loadUrl(fragment);
                  }
               }

               /**
                * When all of your Routers have been created, and all of the routes are set up properly, call
                * Backbone.history.start() to begin monitoring hashchange events, and dispatching routes. Subsequent calls to
                * Backbone.history.start() will throw an error, and Backbone.History.started is a boolean value indicating whether
                * it has already been called.
                *
                * To indicate that you'd like to use HTML5 pushState support in your application, use
                * Backbone.history.start({pushState: true}). If you'd like to use pushState, but have browsers that don't support
                * it natively use full page refreshes instead, you can add {hashChange: false} to the options.
                *
                * If your application is not being served from the root url / of your domain, be sure to tell History where the
                * root really is, as an option: Backbone.history.start({pushState: true, root: "/public/search/"})
                *
                * When called, if a route succeeds with a match for the current URL, Backbone.history.start() returns true. If no
                * defined route matches the current URL, it returns false.
                *
                * If the server has already rendered the entire page, and you don't want the initial route to trigger when starting
                * History, pass silent: true.
                *
                * Because hash-based history in Internet Explorer relies on an <iframe>, be sure to call start() only after the DOM
                * is ready.
                *
                * @example
                * import WorkspaceRouter from 'WorkspaceRouter.js';
                * import HelpPaneRouter  from 'HelpPaneRouter.js';
                *
                * new WorkspaceRouter();
                * new HelpPaneRouter();
                * Backbone.history.start({pushState: true});
                *
                * @param {object}   options  - Optional parameters
                * @returns {*}
                */
            }, {
               key: 'start',
               value: function start(options) {
                  if (History.started) {
                     throw new Error('Backbone.history has already been started');
                  }

                  History.started = true;

                  /**
                   * Figure out the initial configuration. Do we need an iframe?
                   * @type {Object}
                   */
                  this.options = _.extend({ root: '/' }, this.options, options);

                  /**
                   * URL root
                   * @type {string}
                   */
                  this.root = this.options.root;

                  this._wantsHashChange = this.options.hashChange !== false;
                  this._hasHashChange = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
                  this._useHashChange = this._wantsHashChange && this._hasHashChange;

                  // Is pushState desired ... is it available?
                  this._wantsPushState = !!this.options.pushState;
                  this._hasPushState = !!(this.history && this.history.pushState);
                  this._usePushState = this._wantsPushState && this._hasPushState;

                  this.fragment = this.getFragment();

                  // Normalize root to always include a leading and trailing slash.
                  this.root = ('/' + this.root + '/').replace(s_ROOT_STRIPPER, '/');

                  // Transition from hashChange to pushState or vice versa if both are requested.
                  if (this._wantsHashChange && this._wantsPushState) {

                     // If we've started off with a route from a `pushState`-enabled
                     // browser, but we're currently in a browser that doesn't support it...
                     if (!this._hasPushState && !this.atRoot()) {
                        var rootPath = this.root.slice(0, -1) || '/';
                        this.location.replace(rootPath + '#' + this.getPath());

                        // Return immediately as browser will do redirect to new url
                        return true;

                        // Or if we've started out with a hash-based route, but we're currently
                        // in a browser where it could be `pushState`-based instead...
                     } else if (this._hasPushState && this.atRoot()) {
                           this.navigate(this.getHash(), { replace: true });
                        }
                  }

                  // Proxy an iframe to handle location events if the browser doesn't support the `hashchange` event, HTML5
                  // history, or the user wants `hashChange` but not `pushState`.
                  if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
                     /**
                      * Proxy iframe
                      * @type {Element}
                      */
                     this.iframe = document.createElement('iframe');
                     this.iframe.src = 'javascript:0';
                     this.iframe.style.display = 'none';
                     this.iframe.tabIndex = -1;

                     var body = document.body;

                     // Using `appendChild` will throw on IE < 9 if the document is not ready.
                     var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
                     iWindow.document.open();
                     iWindow.document.close();
                     iWindow.location.hash = '#' + this.fragment;
                  }

                  // Add a cross-platform `addEventListener` shim for older browsers.
                  var addEventListener = window.addEventListener || function (eventName, listener) {
                     /* eslint-disable no-undef */
                     return attachEvent('on' + eventName, listener);
                     /* eslint-enable no-undef */
                  };

                  // Depending on whether we're using pushState or hashes, and whether
                  // 'onhashchange' is supported, determine how we check the URL state.
                  if (this._usePushState) {
                     addEventListener('popstate', this.checkUrl, false);
                  } else if (this._useHashChange && !this.iframe) {
                     addEventListener('hashchange', this.checkUrl, false);
                  } else if (this._wantsHashChange) {
                     this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
                  }

                  if (!this.options.silent) {
                     return this.loadUrl();
                  }
               }

               /**
                * Disable Backbone.history, perhaps temporarily. Not useful in a real app, but possibly useful for unit
                * testing Routers.
                */
            }, {
               key: 'stop',
               value: function stop() {
                  // Add a cross-platform `removeEventListener` shim for older browsers.
                  var removeEventListener = window.removeEventListener || function (eventName, listener) {
                     /* eslint-disable no-undef */
                     return detachEvent('on' + eventName, listener);
                     /* eslint-enable no-undef */
                  };

                  // Remove window listeners.
                  if (this._usePushState) {
                     removeEventListener('popstate', this.checkUrl, false);
                  } else if (this._useHashChange && !this.iframe) {
                     removeEventListener('hashchange', this.checkUrl, false);
                  }

                  // Clean up the iframe if necessary.
                  if (this.iframe) {
                     document.body.removeChild(this.iframe);
                     this.iframe = null;
                  }

                  // Some environments will throw when clearing an undefined interval.
                  if (this._checkUrlInterval) {
                     clearInterval(this._checkUrlInterval);
                  }
                  History.started = false;
               }

               /**
                * Add a route to be tested when the fragment changes. Routes added later may override previous routes.
                *
                * @param {string}   route    -  Route to add for checking.
                * @param {function} callback -  Callback function to invoke on match.
                */
            }, {
               key: 'route',
               value: function route(_route, callback) {
                  this.handlers.unshift({ route: _route, callback: callback });
               }
            }]);

            return History;
         })(Events);

         _export('default', History);

         s_ROUTE_STRIPPER = /^[#\/]|\s+$/g;

         /**
          * Cached regex for stripping leading and trailing slashes.
          */
         s_ROOT_STRIPPER = /^\/+|\/+$/g;

         /**
          * Cached regex for stripping urls of hash.
          */
         s_PATH_STRIPPER = /#.*$/;

         /**
          * Update the hash location, either replacing the current entry, or adding a new one to the browser history.
          *
          * @param {object}   location - URL / current location
          * @param {string}   fragment - URL fragment
          * @param {boolean}  replace  - conditional replace
          */

         s_UPDATE_HASH = function s_UPDATE_HASH(location, fragment, replace) {
            if (replace) {
               var href = location.href.replace(/(javascript:|#).*$/, '');
               location.replace(href + '#' + fragment);
            } else {
               // Some browsers require that `hash` contains a leading #.
               location.hash = '#' + fragment;
            }
         };
      }
   };
});

$__System.registerDynamic("16", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  "format cjs";
  return module.exports;
});

$__System.registerDynamic("17", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function() {};
  return module.exports;
});

$__System.registerDynamic("18", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(done, value) {
    return {
      value: value,
      done: !!done
    };
  };
  return module.exports;
});

$__System.registerDynamic("19", ["17", "18", "1a", "1b", "1c"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var addToUnscopables = $__require('17'),
      step = $__require('18'),
      Iterators = $__require('1a'),
      toIObject = $__require('1b');
  module.exports = $__require('1c')(Array, 'Array', function(iterated, kind) {
    this._t = toIObject(iterated);
    this._i = 0;
    this._k = kind;
  }, function() {
    var O = this._t,
        kind = this._k,
        index = this._i++;
    if (!O || index >= O.length) {
      this._t = undefined;
      return step(1);
    }
    if (kind == 'keys')
      return step(0, index);
    if (kind == 'values')
      return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'values');
  Iterators.Arguments = Iterators.Array;
  addToUnscopables('keys');
  addToUnscopables('values');
  addToUnscopables('entries');
  return module.exports;
});

$__System.registerDynamic("1d", ["19", "1a"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  $__require('19');
  var Iterators = $__require('1a');
  Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
  return module.exports;
});

$__System.registerDynamic("1e", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(it, Constructor, name) {
    if (!(it instanceof Constructor))
      throw TypeError(name + ": use the 'new' operator!");
    return it;
  };
  return module.exports;
});

$__System.registerDynamic("1f", ["20", "21", "22", "23", "24", "25"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ctx = $__require('20'),
      call = $__require('21'),
      isArrayIter = $__require('22'),
      anObject = $__require('23'),
      toLength = $__require('24'),
      getIterFn = $__require('25');
  module.exports = function(iterable, entries, fn, that) {
    var iterFn = getIterFn(iterable),
        f = ctx(fn, that, entries ? 2 : 1),
        index = 0,
        length,
        step,
        iterator;
    if (typeof iterFn != 'function')
      throw TypeError(iterable + ' is not iterable!');
    if (isArrayIter(iterFn))
      for (length = toLength(iterable.length); length > index; index++) {
        entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
      }
    else
      for (iterator = iterFn.call(iterable); !(step = iterator.next()).done; ) {
        call(iterator, f, step.value, entries);
      }
  };
  return module.exports;
});

$__System.registerDynamic("26", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = Object.is || function is(x, y) {
    return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
  };
  return module.exports;
});

$__System.registerDynamic("27", ["23", "28", "29"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var anObject = $__require('23'),
      aFunction = $__require('28'),
      SPECIES = $__require('29')('species');
  module.exports = function(O, D) {
    var C = anObject(O).constructor,
        S;
    return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
  };
  return module.exports;
});

$__System.registerDynamic("2a", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(fn, args, that) {
    var un = that === undefined;
    switch (args.length) {
      case 0:
        return un ? fn() : fn.call(that);
      case 1:
        return un ? fn(args[0]) : fn.call(that, args[0]);
      case 2:
        return un ? fn(args[0], args[1]) : fn.call(that, args[0], args[1]);
      case 3:
        return un ? fn(args[0], args[1], args[2]) : fn.call(that, args[0], args[1], args[2]);
      case 4:
        return un ? fn(args[0], args[1], args[2], args[3]) : fn.call(that, args[0], args[1], args[2], args[3]);
    }
    return fn.apply(that, args);
  };
  return module.exports;
});

$__System.registerDynamic("2b", ["2c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = $__require('2c').document && document.documentElement;
  return module.exports;
});

$__System.registerDynamic("2d", ["2e", "2c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var isObject = $__require('2e'),
      document = $__require('2c').document,
      is = isObject(document) && isObject(document.createElement);
  module.exports = function(it) {
    return is ? document.createElement(it) : {};
  };
  return module.exports;
});

$__System.registerDynamic("2f", ["20", "2a", "2b", "2d", "2c", "30", "31"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(process) {
    var ctx = $__require('20'),
        invoke = $__require('2a'),
        html = $__require('2b'),
        cel = $__require('2d'),
        global = $__require('2c'),
        process = global.process,
        setTask = global.setImmediate,
        clearTask = global.clearImmediate,
        MessageChannel = global.MessageChannel,
        counter = 0,
        queue = {},
        ONREADYSTATECHANGE = 'onreadystatechange',
        defer,
        channel,
        port;
    var run = function() {
      var id = +this;
      if (queue.hasOwnProperty(id)) {
        var fn = queue[id];
        delete queue[id];
        fn();
      }
    };
    var listner = function(event) {
      run.call(event.data);
    };
    if (!setTask || !clearTask) {
      setTask = function setImmediate(fn) {
        var args = [],
            i = 1;
        while (arguments.length > i)
          args.push(arguments[i++]);
        queue[++counter] = function() {
          invoke(typeof fn == 'function' ? fn : Function(fn), args);
        };
        defer(counter);
        return counter;
      };
      clearTask = function clearImmediate(id) {
        delete queue[id];
      };
      if ($__require('30')(process) == 'process') {
        defer = function(id) {
          process.nextTick(ctx(run, id, 1));
        };
      } else if (MessageChannel) {
        channel = new MessageChannel;
        port = channel.port2;
        channel.port1.onmessage = listner;
        defer = ctx(port.postMessage, port, 1);
      } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
        defer = function(id) {
          global.postMessage(id + '', '*');
        };
        global.addEventListener('message', listner, false);
      } else if (ONREADYSTATECHANGE in cel('script')) {
        defer = function(id) {
          html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function() {
            html.removeChild(this);
            run.call(id);
          };
        };
      } else {
        defer = function(id) {
          setTimeout(ctx(run, id, 1), 0);
        };
      }
    }
    module.exports = {
      set: setTask,
      clear: clearTask
    };
  })($__require('31'));
  return module.exports;
});

$__System.registerDynamic("32", ["2c", "2f", "30", "31"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(process) {
    var global = $__require('2c'),
        macrotask = $__require('2f').set,
        Observer = global.MutationObserver || global.WebKitMutationObserver,
        process = global.process,
        Promise = global.Promise,
        isNode = $__require('30')(process) == 'process',
        head,
        last,
        notify;
    var flush = function() {
      var parent,
          domain,
          fn;
      if (isNode && (parent = process.domain)) {
        process.domain = null;
        parent.exit();
      }
      while (head) {
        domain = head.domain;
        fn = head.fn;
        if (domain)
          domain.enter();
        fn();
        if (domain)
          domain.exit();
        head = head.next;
      }
      last = undefined;
      if (parent)
        parent.enter();
    };
    if (isNode) {
      notify = function() {
        process.nextTick(flush);
      };
    } else if (Observer) {
      var toggle = 1,
          node = document.createTextNode('');
      new Observer(flush).observe(node, {characterData: true});
      notify = function() {
        node.data = toggle = -toggle;
      };
    } else if (Promise && Promise.resolve) {
      notify = function() {
        Promise.resolve().then(flush);
      };
    } else {
      notify = function() {
        macrotask.call(global, flush);
      };
    }
    module.exports = function asap(fn) {
      var task = {
        fn: fn,
        next: undefined,
        domain: isNode && process.domain
      };
      if (last)
        last.next = task;
      if (!head) {
        head = task;
        notify();
      }
      last = task;
    };
  })($__require('31'));
  return module.exports;
});

$__System.registerDynamic("33", ["34"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var redefine = $__require('34');
  module.exports = function(target, src) {
    for (var key in src)
      redefine(target, key, src[key]);
    return target;
  };
  return module.exports;
});

$__System.registerDynamic("35", ["36", "37", "38", "29"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core = $__require('36'),
      $ = $__require('37'),
      DESCRIPTORS = $__require('38'),
      SPECIES = $__require('29')('species');
  module.exports = function(KEY) {
    var C = core[KEY];
    if (DESCRIPTORS && C && !C[SPECIES])
      $.setDesc(C, SPECIES, {
        configurable: true,
        get: function() {
          return this;
        }
      });
  };
  return module.exports;
});

$__System.registerDynamic("39", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
    draining = false;
    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }
    if (queue.length) {
      drainQueue();
    }
  }
  function drainQueue() {
    if (draining) {
      return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;
    var len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex].run();
        }
      }
      queueIndex = -1;
      len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
  }
  process.nextTick = function(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
      setTimeout(drainQueue, 0);
    }
  };
  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }
  Item.prototype.run = function() {
    this.fun.apply(null, this.array);
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = '';
  process.versions = {};
  function noop() {}
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.binding = function(name) {
    throw new Error('process.binding is not supported');
  };
  process.cwd = function() {
    return '/';
  };
  process.chdir = function(dir) {
    throw new Error('process.chdir is not supported');
  };
  process.umask = function() {
    return 0;
  };
  return module.exports;
});

$__System.registerDynamic("3a", ["39"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = $__require('39');
  return module.exports;
});

$__System.registerDynamic("3b", ["3a"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = $__System._nodeRequire ? process : $__require('3a');
  return module.exports;
});

$__System.registerDynamic("31", ["3b"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = $__require('3b');
  return module.exports;
});

$__System.registerDynamic("3c", ["37", "3d", "2c", "20", "3e", "3f", "2e", "23", "28", "1e", "1f", "40", "26", "29", "27", "32", "38", "33", "41", "35", "36", "42", "31"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(process) {
    'use strict';
    var $ = $__require('37'),
        LIBRARY = $__require('3d'),
        global = $__require('2c'),
        ctx = $__require('20'),
        classof = $__require('3e'),
        $export = $__require('3f'),
        isObject = $__require('2e'),
        anObject = $__require('23'),
        aFunction = $__require('28'),
        strictNew = $__require('1e'),
        forOf = $__require('1f'),
        setProto = $__require('40').set,
        same = $__require('26'),
        SPECIES = $__require('29')('species'),
        speciesConstructor = $__require('27'),
        asap = $__require('32'),
        PROMISE = 'Promise',
        process = global.process,
        isNode = classof(process) == 'process',
        P = global[PROMISE],
        Wrapper;
    var testResolve = function(sub) {
      var test = new P(function() {});
      if (sub)
        test.constructor = Object;
      return P.resolve(test) === test;
    };
    var USE_NATIVE = function() {
      var works = false;
      function P2(x) {
        var self = new P(x);
        setProto(self, P2.prototype);
        return self;
      }
      try {
        works = P && P.resolve && testResolve();
        setProto(P2, P);
        P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
        if (!(P2.resolve(5).then(function() {}) instanceof P2)) {
          works = false;
        }
        if (works && $__require('38')) {
          var thenableThenGotten = false;
          P.resolve($.setDesc({}, 'then', {get: function() {
              thenableThenGotten = true;
            }}));
          works = thenableThenGotten;
        }
      } catch (e) {
        works = false;
      }
      return works;
    }();
    var sameConstructor = function(a, b) {
      if (LIBRARY && a === P && b === Wrapper)
        return true;
      return same(a, b);
    };
    var getConstructor = function(C) {
      var S = anObject(C)[SPECIES];
      return S != undefined ? S : C;
    };
    var isThenable = function(it) {
      var then;
      return isObject(it) && typeof(then = it.then) == 'function' ? then : false;
    };
    var PromiseCapability = function(C) {
      var resolve,
          reject;
      this.promise = new C(function($$resolve, $$reject) {
        if (resolve !== undefined || reject !== undefined)
          throw TypeError('Bad Promise constructor');
        resolve = $$resolve;
        reject = $$reject;
      });
      this.resolve = aFunction(resolve), this.reject = aFunction(reject);
    };
    var perform = function(exec) {
      try {
        exec();
      } catch (e) {
        return {error: e};
      }
    };
    var notify = function(record, isReject) {
      if (record.n)
        return;
      record.n = true;
      var chain = record.c;
      asap(function() {
        var value = record.v,
            ok = record.s == 1,
            i = 0;
        var run = function(reaction) {
          var handler = ok ? reaction.ok : reaction.fail,
              resolve = reaction.resolve,
              reject = reaction.reject,
              result,
              then;
          try {
            if (handler) {
              if (!ok)
                record.h = true;
              result = handler === true ? value : handler(value);
              if (result === reaction.promise) {
                reject(TypeError('Promise-chain cycle'));
              } else if (then = isThenable(result)) {
                then.call(result, resolve, reject);
              } else
                resolve(result);
            } else
              reject(value);
          } catch (e) {
            reject(e);
          }
        };
        while (chain.length > i)
          run(chain[i++]);
        chain.length = 0;
        record.n = false;
        if (isReject)
          setTimeout(function() {
            var promise = record.p,
                handler,
                console;
            if (isUnhandled(promise)) {
              if (isNode) {
                process.emit('unhandledRejection', value, promise);
              } else if (handler = global.onunhandledrejection) {
                handler({
                  promise: promise,
                  reason: value
                });
              } else if ((console = global.console) && console.error) {
                console.error('Unhandled promise rejection', value);
              }
            }
            record.a = undefined;
          }, 1);
      });
    };
    var isUnhandled = function(promise) {
      var record = promise._d,
          chain = record.a || record.c,
          i = 0,
          reaction;
      if (record.h)
        return false;
      while (chain.length > i) {
        reaction = chain[i++];
        if (reaction.fail || !isUnhandled(reaction.promise))
          return false;
      }
      return true;
    };
    var $reject = function(value) {
      var record = this;
      if (record.d)
        return;
      record.d = true;
      record = record.r || record;
      record.v = value;
      record.s = 2;
      record.a = record.c.slice();
      notify(record, true);
    };
    var $resolve = function(value) {
      var record = this,
          then;
      if (record.d)
        return;
      record.d = true;
      record = record.r || record;
      try {
        if (record.p === value)
          throw TypeError("Promise can't be resolved itself");
        if (then = isThenable(value)) {
          asap(function() {
            var wrapper = {
              r: record,
              d: false
            };
            try {
              then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
            } catch (e) {
              $reject.call(wrapper, e);
            }
          });
        } else {
          record.v = value;
          record.s = 1;
          notify(record, false);
        }
      } catch (e) {
        $reject.call({
          r: record,
          d: false
        }, e);
      }
    };
    if (!USE_NATIVE) {
      P = function Promise(executor) {
        aFunction(executor);
        var record = this._d = {
          p: strictNew(this, P, PROMISE),
          c: [],
          a: undefined,
          s: 0,
          d: false,
          v: undefined,
          h: false,
          n: false
        };
        try {
          executor(ctx($resolve, record, 1), ctx($reject, record, 1));
        } catch (err) {
          $reject.call(record, err);
        }
      };
      $__require('33')(P.prototype, {
        then: function then(onFulfilled, onRejected) {
          var reaction = new PromiseCapability(speciesConstructor(this, P)),
              promise = reaction.promise,
              record = this._d;
          reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
          reaction.fail = typeof onRejected == 'function' && onRejected;
          record.c.push(reaction);
          if (record.a)
            record.a.push(reaction);
          if (record.s)
            notify(record, false);
          return promise;
        },
        'catch': function(onRejected) {
          return this.then(undefined, onRejected);
        }
      });
    }
    $export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: P});
    $__require('41')(P, PROMISE);
    $__require('35')(PROMISE);
    Wrapper = $__require('36')[PROMISE];
    $export($export.S + $export.F * !USE_NATIVE, PROMISE, {reject: function reject(r) {
        var capability = new PromiseCapability(this),
            $$reject = capability.reject;
        $$reject(r);
        return capability.promise;
      }});
    $export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, {resolve: function resolve(x) {
        if (x instanceof P && sameConstructor(x.constructor, this))
          return x;
        var capability = new PromiseCapability(this),
            $$resolve = capability.resolve;
        $$resolve(x);
        return capability.promise;
      }});
    $export($export.S + $export.F * !(USE_NATIVE && $__require('42')(function(iter) {
      P.all(iter)['catch'](function() {});
    })), PROMISE, {
      all: function all(iterable) {
        var C = getConstructor(this),
            capability = new PromiseCapability(C),
            resolve = capability.resolve,
            reject = capability.reject,
            values = [];
        var abrupt = perform(function() {
          forOf(iterable, false, values.push, values);
          var remaining = values.length,
              results = Array(remaining);
          if (remaining)
            $.each.call(values, function(promise, index) {
              var alreadyCalled = false;
              C.resolve(promise).then(function(value) {
                if (alreadyCalled)
                  return;
                alreadyCalled = true;
                results[index] = value;
                --remaining || resolve(results);
              }, reject);
            });
          else
            resolve(results);
        });
        if (abrupt)
          reject(abrupt.error);
        return capability.promise;
      },
      race: function race(iterable) {
        var C = getConstructor(this),
            capability = new PromiseCapability(C),
            reject = capability.reject;
        var abrupt = perform(function() {
          forOf(iterable, false, function(promise) {
            C.resolve(promise).then(capability.resolve, reject);
          });
        });
        if (abrupt)
          reject(abrupt.error);
        return capability.promise;
      }
    });
  })($__require('31'));
  return module.exports;
});

$__System.registerDynamic("43", ["16", "44", "1d", "3c", "36"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  $__require('16');
  $__require('44');
  $__require('1d');
  $__require('3c');
  module.exports = $__require('36').Promise;
  return module.exports;
});

$__System.registerDynamic("14", ["43"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    "default": $__require('43'),
    __esModule: true
  };
  return module.exports;
});

$__System.register('b', ['4', '5', '6', '8', '9', 'a', 'e', 'c'], function (_export) {
   var _classCallCheck, BackboneProxy, _, _get, _inherits, _createClass, Events, Utils, Model, modelMethods;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_6) {
         BackboneProxy = _6['default'];
      }, function (_5) {
         _ = _5['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_e) {
         Events = _e['default'];
      }, function (_c) {
         Utils = _c['default'];
      }],
      execute: function () {

         /**
          * Backbone.Model - Models are the heart of any JavaScript application. (http://backbonejs.org/#Model)
          * --------------
          *
          * Models are the heart of any JavaScript application, containing the interactive data as well as a large part of the
          * logic surrounding it: conversions, validations, computed properties, and access control.
          *
          * Backbone-ES6 supports the older "extend" functionality of Backbone. You can still use "extend" to extend
          * Backbone.Model with your domain-specific methods, and Model provides a basic set of functionality for managing
          * changes.
          *
          * It is recommended though to use ES6 syntax for working with Backbone-ES6 foregoing the older "extend" mechanism.
          *
          * Create a new model with the specified attributes. A client id (`cid`) is automatically generated & assigned for you.
          *
          * If you pass a {collection: ...} as the options, the model gains a collection property that will be used to indicate
          * which collection the model belongs to, and is used to help compute the model's url. The model.collection property is
          * normally created automatically when you first add a model to a collection. Note that the reverse is not true, as
          * passing this option to the constructor will not automatically add the model to the collection. Useful, sometimes.
          *
          * If {parse: true} is passed as an option, the attributes will first be converted by parse before being set on the
          * model.
          *
          * Underscore methods available to Model:
          * @see http://underscorejs.org/#chain
          * @see http://underscorejs.org/#keys
          * @see http://underscorejs.org/#invert
          * @see http://underscorejs.org/#isEmpty
          * @see http://underscorejs.org/#omit
          * @see http://underscorejs.org/#pairs
          * @see http://underscorejs.org/#pick
          * @see http://underscorejs.org/#values
          *
          * @example
          * import Backbone from 'backbone';
          *
          * export default class MyModel extends Backbone.Model
          * {
          *    initialize() { alert('initialized!); }
          * }
          *
          * older extend example:
          * export default Backbone.Model.extend(
          * {
          *    initialize: { alert('initialized!); }
          * });
          *
          * @example
          * Another older extend example... The following is a contrived example, but it demonstrates defining a model with a
          * custom method, setting an attribute, and firing an event keyed to changes in that specific attribute. After running
          * this code once, sidebar will be available in your browser's console, so you can play around with it.
          *
          * var Sidebar = Backbone.Model.extend({
          *    promptColor: function() {
          *       var cssColor = prompt("Please enter a CSS color:");
          *       this.set({color: cssColor});
          *    }
          * });
          *
          * window.sidebar = new Sidebar;
          *
          * sidebar.on('change:color', function(model, color) {
          *    $('#sidebar').css({ background: color });
          * });
          *
          * sidebar.set({color: 'white'});
          *
          * sidebar.promptColor();
          *
          * @example
          * The above extend example converted to ES6:
          *
          * class Sidebar extends Backbone.Model {
          *    promptColor() {
          *       const cssColor = prompt("Please enter a CSS color:");
          *       this.set({ color: cssColor });
          *    }
          * }
          *
          * window.sidebar = new Sidebar();
          *
          * sidebar.on('change:color', (model, color) => {
          *    $('#sidebar').css({ background: color });
          * });
          *
          * sidebar.set({ color: 'white' });
          *
          * sidebar.promptColor();
          *
          * @example
          * Another older extend example:
          * extend correctly sets up the prototype chain, so subclasses created with extend can be further extended and
          * sub-classed as far as you like.
          *
          * var Note = Backbone.Model.extend({
          *    initialize: function() { ... },
          *
          *    author: function() { ... },
          *
          *    coordinates: function() { ... },
          *
          *    allowedToEdit: function(account) {
          *       return true;
          *    }
          * });
          *
          * var PrivateNote = Note.extend({
          *    allowedToEdit: function(account) {
          *       return account.owns(this);
          *    }
          * });
          *
          * @example
          * Converting the above example to ES6:
          *
          * class Note extends Backbone.Model {
          *    initialize() { ... }
          *
          *    author() { ... }
          *
          *    coordinates() { ... }
          *
          *    allowedToEdit(account) {
          *       return true;
          *    }
          * }
          *
          * class PrivateNote extends Note {
          *    allowedToEdit(account) {
          *       return account.owns(this);
          *    }
          * });
          *
          * let privateNote = new PrivateNote();
          *
          * @example
          * A huge benefit of using ES6 syntax is that one has access to 'super'
          *
          * class Note extends Backbone.Model {
          *    set(attributes, options) {
          *       super.set(attributes, options);
          *       ...
          *    }
          * });
          */
         'use strict';

         Model = (function (_Events) {
            _inherits(Model, _Events);

            /**
             * When creating an instance of a model, you can pass in the initial values of the attributes, which will be set on
             * the model. If you define an initialize function, it will be invoked when the model is created.
             *
             * @example
             * new Book({
             *    title: "One Thousand and One Nights",
             *    author: "Scheherazade"
             * });
             *
             * @example
             * ES6 example: If you're looking to get fancy, you may want to override constructor, which allows you to replace
             * the actual constructor function for your model.
             *
             * class Library extends Backbone.Model {
             *    constructor() {
             *       super(...arguments);
             *       this.books = new Books();
             *    }
             *
             *    parse(data, options) {
             *       this.books.reset(data.books);
             *       return data.library;
             *    }
             * }
             *
             * @see http://backbonejs.org/#Model-constructor
             *
             * @param {object} attributes - Optional attribute hash of original keys / values to set.
             * @param {object} options    - Optional parameters
             */

            function Model() {
               var attributes = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
               var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

               _classCallCheck(this, Model);

               _get(Object.getPrototypeOf(Model.prototype), 'constructor', this).call(this);

               // Allows child classes to abort constructor execution.
               if (_.isBoolean(options.abortCtor) && options.abortCtor) {
                  return;
               }

               var attrs = attributes;

               /**
                * The prefix is used to create the client id which is used to identify models locally.
                * You may want to override this if you're experiencing name clashes with model ids.
                *
                * @type {string}
                */
               this.cidPrefix = 'c';

               /**
                * Client side ID
                * @type {number}
                */
               this.cid = _.uniqueId(this.cidPrefix);

               /**
                * The hash of attributes for this model.
                * @type {object}
                */
               this.attributes = {};

               if (options.collection) {
                  /**
                   * A potentially associated collection.
                   * @type {Collection}
                   */
                  this.collection = options.collection;
               }

               /**
                * A hash of attributes whose current and previous value differ.
                * @type {object}
                */
               this.changed = {};

               /**
                * The value returned during the last failed validation.
                * @type {*}
                */
               this.validationError = null;

               // Allows child classes to postpone initialization.
               if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) {
                  return;
               }

               if (options.parse) {
                  attrs = this.parse(attrs, options) || {};
               }

               var defaults = _.result(this, 'defaults');
               attrs = _.defaults(_.extend({}, defaults, attrs), defaults);

               this.set(attrs, options);

               this.initialize(this, arguments);
            }

            // The default name for the JSON `id` attribute is `"id"`. MongoDB and CouchDB users may want to set this to `"_id"`.

            /**
             * Retrieve a hash of only the model's attributes that have changed since the last set, or false if there are none.
             * Optionally, an external attributes hash can be passed in, returning the attributes in that hash which differ from
             * the model. This can be used to figure out which portions of a view should be updated, or what calls need to be
             * made to sync the changes to the server.
             *
             * @see http://backbonejs.org/#Model-changedAttributes
             *
             * @param {object}   diff  - A hash of key / values to diff against this models attributes.
             * @returns {object|boolean}
             */

            _createClass(Model, [{
               key: 'changedAttributes',
               value: function changedAttributes(diff) {
                  if (!diff) {
                     return this.hasChanged() ? _.clone(this.changed) : false;
                  }
                  var old = this._changing ? this._previousAttributes : this.attributes;
                  var changed = {};
                  for (var attr in diff) {
                     var val = diff[attr];
                     if (_.isEqual(old[attr], val)) {
                        continue;
                     }
                     changed[attr] = val;
                  }
                  return _.size(changed) ? changed : false;
               }

               /**
                * Removes all attributes from the model, including the id attribute. Fires a "change" event unless silent is
                * passed as an option.
                *
                * @see http://backbonejs.org/#Model-clear
                *
                * @param {object}   options - Optional parameters.
                * @returns {*}
                */
            }, {
               key: 'clear',
               value: function clear(options) {
                  var attrs = {};
                  for (var key in this.attributes) {
                     attrs[key] = void 0;
                  }
                  return this.set(attrs, _.extend({}, options, { unset: true }));
               }

               /**
                * Returns a new instance of the model with identical attributes.
                *
                * @see http://backbonejs.org/#Model-clone
                *
                * @returns {*}
                */
            }, {
               key: 'clone',
               value: function clone() {
                  return new this.constructor(this.attributes);
               }

               /**
                * Destroys the model on the server by delegating an HTTP DELETE request to Backbone.sync. Returns a jqXHR object,
                * or false if the model isNew. Accepts success and error callbacks in the options hash, which will be passed
                * (model, response, options). Triggers a "destroy" event on the model, which will bubble up through any collections
                * that contain it, a "request" event as it begins the Ajax request to the server, and a "sync" event, after the
                * server has successfully acknowledged the model's deletion. Pass {wait: true} if you'd like to wait for the server
                * to respond before removing the model from the collection.
                *
                * @example
                * book.destroy({success: function(model, response) {
                *    ...
                * }});
                *
                * @see http://backbonejs.org/#Model-destroy
                *
                * @param {object}   options - Provides optional properties used in destroying a model.
                * @returns {boolean|XMLHttpRequest}
                */
            }, {
               key: 'destroy',
               value: function destroy(options) {
                  var _this = this;

                  options = options ? _.clone(options) : {};
                  var success = options.success;
                  var wait = options.wait;

                  var destroy = function destroy() {
                     _this.stopListening();
                     _this.trigger('destroy', _this, _this.collection, options);
                  };

                  options.success = function (resp) {
                     if (wait) {
                        destroy();
                     }
                     if (success) {
                        success.call(options.context, _this, resp, options);
                     }
                     if (!_this.isNew()) {
                        _this.trigger('sync', _this, resp, options);
                     }
                  };

                  var xhr = false;

                  if (this.isNew()) {
                     _.defer(options.success);
                  } else {
                     Utils.wrapError(this, options);
                     xhr = this.sync('delete', this, options);
                  }

                  if (!wait) {
                     destroy();
                  }

                  return xhr;
               }

               /**
                * Similar to get, but returns the HTML-escaped version of a model's attribute. If you're interpolating data from
                * the model into HTML, using escape to retrieve attributes will prevent XSS attacks.
                *
                * @example
                * let hacker = new Backbone.Model({
                *    name: "<script>alert('xss')</script>"
                * });
                *
                * alert(hacker.escape('name'));
                *
                * @see http://backbonejs.org/#Model-escape
                *
                * @param {*}  attr  - Defines a single attribute key to get and escape via Underscore.
                * @returns {string}
                */
            }, {
               key: 'escape',
               value: function escape(attr) {
                  return _.escape(this.get(attr));
               }

               /**
                * Merges the model's state with attributes fetched from the server by delegating to Backbone.sync. Returns a jqXHR.
                * Useful if the model has never been populated with data, or if you'd like to ensure that you have the latest
                * server state. Triggers a "change" event if the server's state differs from the current attributes. fetch accepts
                * success and error callbacks in the options hash, which are both passed (model, response, options) as arguments.
                *
                * @example
                * // Poll every 10 seconds to keep the channel model up-to-date.
                * setInterval(function() {
                *    channel.fetch();
                * }, 10000);
                *
                * @see http://backbonejs.org/#Model-fetch
                *
                * @param {object}   options  - Optional parameters.
                * @returns {*}
                */
            }, {
               key: 'fetch',
               value: function fetch(options) {
                  var _this2 = this;

                  options = _.extend({ parse: true }, options);
                  var success = options.success;
                  options.success = function (resp) {
                     var serverAttrs = options.parse ? _this2.parse(resp, options) : resp;
                     if (!_this2.set(serverAttrs, options)) {
                        return false;
                     }
                     if (success) {
                        success.call(options.context, _this2, resp, options);
                     }
                     _this2.trigger('sync', _this2, resp, options);
                  };
                  Utils.wrapError(this, options);
                  return this.sync('read', this, options);
               }

               /**
                * Get the current value of an attribute from the model.
                *
                * @example
                * For example:
                * note.get("title")
                *
                * @see http://backbonejs.org/#Model-get
                *
                * @param {*}  attr  - Defines a single attribute key to get a value from the model attributes.
                * @returns {*}
                */
            }, {
               key: 'get',
               value: function get(attr) {
                  return this.attributes[attr];
               }

               /**
                * Returns true if the attribute is set to a non-null or non-undefined value.
                *
                * @example
                * if (note.has("title")) {
                *    ...
                * }
                *
                * @see http://backbonejs.org/#Model-has
                *
                * @param {string}   attr  - Attribute key.
                * @returns {boolean}
                */
            }, {
               key: 'has',
               value: function has(attr) {
                  return !Utils.isNullOrUndef(this.get(attr));
               }

               /**
                * Has the model changed since its last set? If an attribute is passed, returns true if that specific attribute has
                * changed.
                *
                * Note that this method, and the following change-related ones, are only useful during the course of a "change"
                * event.
                *
                * @example
                * book.on("change", function() {
                *    if (book.hasChanged("title")) {
                *       ...
                *    }
                * });
                *
                * @see http://backbonejs.org/#Model-hasChanged
                *
                * @param {string}   attr  - Optional attribute key.
                * @returns {*}
                */
            }, {
               key: 'hasChanged',
               value: function hasChanged(attr) {
                  if (Utils.isNullOrUndef(attr)) {
                     return !_.isEmpty(this.changed);
                  }
                  return _.has(this.changed, attr);
               }

               /**
                * Initialize is an empty function by default. Override it with your own initialization logic.
                *
                * @see http://backbonejs.org/#Model-constructor
                * @abstract
                */
            }, {
               key: 'initialize',
               value: function initialize() {}

               /**
                * Has this model been saved to the server yet? If the model does not yet have an id, it is considered to be new.
                *
                * @see http://backbonejs.org/#Model-isNew
                *
                * @returns {boolean}
                */
            }, {
               key: 'isNew',
               value: function isNew() {
                  return !this.has(this.idAttribute);
               }

               /**
                * Run validate to check the model state.
                *
                * @see http://backbonejs.org/#Model-validate
                *
                * @example
                * class Chapter extends Backbone.Model {
                *    validate(attrs, options) {
                *       if (attrs.end < attrs.start) {
                *       return "can't end before it starts";
                *    }
                * }
                *
                * let one = new Chapter({
                *    title : "Chapter One: The Beginning"
                * });
                *
                * one.set({
                *    start: 15,
                *    end:   10
                * });
                *
                * if (!one.isValid()) {
                *    alert(one.get("title") + " " + one.validationError);
                * }
                *
                * @see http://backbonejs.org/#Model-isValid
                *
                * @param {object}   options  - Optional hash that may provide a `validationError` field to pass to `invalid` event.
                * @returns {boolean}
                */
            }, {
               key: 'isValid',
               value: function isValid(options) {
                  return this._validate({}, _.extend({}, options, { validate: true }));
               }

               /**
                * Special-cased proxy to the `_.matches` function from Underscore.
                *
                * @see http://underscorejs.org/#iteratee
                *
                * @param {object|string}  attrs - Predicates to match
                * @returns {boolean}
                */
            }, {
               key: 'matches',
               value: function matches(attrs) {
                  return !!_.iteratee(attrs, this)(this.attributes);
               }

               /* eslint-disable no-unused-vars */
               /**
                * parse is called whenever a model's data is returned by the server, in fetch, and save. The function is passed the
                * raw response object, and should return the attributes hash to be set on the model. The default implementation is
                * a no-op, simply passing through the JSON response. Override this if you need to work with a preexisting API, or
                * better namespace your responses.
                *
                * @see http://backbonejs.org/#Model-parse
                *
                * @param {object}   resp - Usually a JSON object.
                * @param {object}   options - Unused
                * @returns {object} Pass through to set the attributes hash on the model.
                */
            }, {
               key: 'parse',
               value: function parse(resp, options) {
                  /* eslint-enable no-unused-vars */
                  return resp;
               }

               /**
                * During a "change" event, this method can be used to get the previous value of a changed attribute.
                *
                * @example
                * let bill = new Backbone.Model({
                *    name: "Bill Smith"
                * });
                *
                * bill.on("change:name", function(model, name) {
                *    alert("Changed name from " + bill.previous("name") + " to " + name);
                * });
                *
                * bill.set({name : "Bill Jones"});
                *
                * @see http://backbonejs.org/#Model-previous
                *
                * @param {string}   attr  - Attribute key used for lookup.
                * @returns {*}
                */
            }, {
               key: 'previous',
               value: function previous(attr) {
                  if (Utils.isNullOrUndef(attr) || !this._previousAttributes) {
                     return null;
                  }
                  return this._previousAttributes[attr];
               }

               /**
                * Return a copy of the model's previous attributes. Useful for getting a diff between versions of a model, or
                * getting back to a valid state after an error occurs.
                *
                * @see http://backbonejs.org/#Model-previousAttributes
                *
                * @returns {*}
                */
            }, {
               key: 'previousAttributes',
               value: function previousAttributes() {
                  return _.clone(this._previousAttributes);
               }

               /**
                * Save a model to your database (or alternative persistence layer), by delegating to Backbone.sync. Returns a jqXHR
                * if validation is successful and false otherwise. The attributes hash (as in set) should contain the attributes
                * you'd like to change — keys that aren't mentioned won't be altered — but, a complete representation of the
                * resource will be sent to the server. As with set, you may pass individual keys and values instead of a hash. If
                * the model has a validate method, and validation fails, the model will not be saved. If the model isNew, the save
                * will be a "create" (HTTP POST), if the model already exists on the server, the save will be an "update"
                * (HTTP PUT).
                *
                * If instead, you'd only like the changed attributes to be sent to the server, call model.save(attrs,
                * {patch: true}). You'll get an HTTP PATCH request to the server with just the passed-in attributes.
                *
                * Calling save with new attributes will cause a "change" event immediately, a "request" event as the Ajax request
                * begins to go to the server, and a "sync" event after the server has acknowledged the successful change. Pass
                * {wait: true} if you'd like to wait for the server before setting the new attributes on the model.
                *
                * In the following example, notice how our overridden version of Backbone.sync receives a "create" request the
                * first time the model is saved and an "update" request the second time.
                *
                * @example
                * Backbone.sync = (method, model) => {
                *    alert(method + ": " + JSON.stringify(model));
                *    model.set('id', 1);
                * };
                *
                * let book = new Backbone.Model({
                *    title: "The Rough Riders",
                *    author: "Theodore Roosevelt"
                * });
                *
                * book.save();
                *
                * book.save({author: "Teddy"});
                *
                * @see http://backbonejs.org/#Model-save
                *
                * @param {key|object}  key - Either a key defining the attribute to store or a hash of keys / values to store.
                * @param {*}           val - Any type to store in model.
                * @param {object}      options - Optional parameters.
                * @returns {*}
                */
            }, {
               key: 'save',
               value: function save(key, val, options) {
                  var _this3 = this;

                  // Handle both `"key", value` and `{key: value}` -style arguments.
                  var attrs = undefined;
                  if (Utils.isNullOrUndef(key) || typeof key === 'object') {
                     attrs = key;
                     options = val;
                  } else {
                     (attrs = {})[key] = val;
                  }

                  options = _.extend({ validate: true, parse: true }, options);
                  var wait = options.wait;

                  // If we're not waiting and attributes exist, save acts as
                  // `set(attr).save(null, opts)` with validation. Otherwise, check if
                  // the model will be valid when the attributes, if any, are set.
                  if (attrs && !wait) {
                     if (!this.set(attrs, options)) {
                        return false;
                     }
                  } else if (!this._validate(attrs, options)) {
                     return false;
                  }

                  // After a successful server-side save, the client is (optionally)
                  // updated with the server-side state.
                  var success = options.success;
                  var attributes = this.attributes;
                  options.success = function (resp) {
                     // Ensure attributes are restored during synchronous saves.
                     _this3.attributes = attributes;
                     var serverAttrs = options.parse ? _this3.parse(resp, options) : resp;
                     if (wait) {
                        serverAttrs = _.extend({}, attrs, serverAttrs);
                     }
                     if (serverAttrs && !_this3.set(serverAttrs, options)) {
                        return false;
                     }
                     if (success) {
                        success.call(options.context, _this3, resp, options);
                     }
                     _this3.trigger('sync', _this3, resp, options);
                  };
                  Utils.wrapError(this, options);

                  // Set temporary attributes if `{wait: true}` to properly find new ids.
                  if (attrs && wait) {
                     this.attributes = _.extend({}, attributes, attrs);
                  }

                  var method = this.isNew() ? 'create' : options.patch ? 'patch' : 'update';
                  if (method === 'patch' && !options.attrs) {
                     options.attrs = attrs;
                  }
                  var xhr = this.sync(method, this, options);

                  // Restore attributes.
                  this.attributes = attributes;

                  return xhr;
               }

               /**
                * Set a hash of attributes (one or many) on the model. If any of the attributes change the model's state, a "change"
                * event will be triggered on the model. Change events for specific attributes are also triggered, and you can bind
                * to those as well, for example: change:title, and change:content. You may also pass individual keys and values.
                *
                * @example
                * note.set({ title: "March 20", content: "In his eyes she eclipses..." });
                *
                * book.set("title", "A Scandal in Bohemia");
                *
                * @see http://backbonejs.org/#Model-set
                *
                * @param {object|string}  key      - Either a string defining a key or a key / value hash.
                * @param {*|object}       val      - Either any type to store or the shifted options hash.
                * @param {object}         options  - Optional parameters.
                * @returns {*}
                */
            }, {
               key: 'set',
               value: function set(key, val) {
                  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

                  if (Utils.isNullOrUndef(key)) {
                     return this;
                  }

                  // Handle both `"key", value` and `{key: value}` -style arguments.
                  var attrs = undefined;
                  if (typeof key === 'object') {
                     attrs = key;
                     options = val || {};
                  } else {
                     (attrs = {})[key] = val;
                  }

                  // Run validation.
                  if (!this._validate(attrs, options)) {
                     return false;
                  }

                  // Extract attributes and options.
                  var unset = options.unset;
                  var silent = options.silent;
                  var changes = [];
                  var changing = this._changing;
                  this._changing = true;

                  if (!changing) {
                     this._previousAttributes = _.clone(this.attributes);
                     this.changed = {};
                  }

                  var current = this.attributes;
                  var changed = this.changed;
                  var prev = this._previousAttributes;

                  // For each `set` attribute, update or delete the current value.
                  for (var attr in attrs) {
                     val = attrs[attr];
                     if (!_.isEqual(current[attr], val)) {
                        changes.push(attr);
                     }

                     if (!_.isEqual(prev[attr], val)) {
                        changed[attr] = val;
                     } else {
                        delete changed[attr];
                     }

                     if (unset) {
                        delete current[attr];
                     } else {
                        current[attr] = val;
                     }
                  }

                  if (this.idAttribute in attrs) {
                     /**
                      * Update the `id`.
                      * @type {*}
                      */
                     this.id = this.get(this.idAttribute);
                  }

                  // Trigger all relevant attribute changes.
                  if (!silent) {
                     if (changes.length) {
                        this._pending = options;
                     }
                     for (var i = 0; i < changes.length; i++) {
                        this.trigger('change:' + changes[i], this, current[changes[i]], options);
                     }
                  }

                  // You might be wondering why there's a `while` loop here. Changes can
                  // be recursively nested within `"change"` events.
                  if (changing) {
                     return this;
                  }
                  if (!silent) {
                     while (this._pending) {
                        options = this._pending;
                        this._pending = false;
                        this.trigger('change', this, options);
                     }
                  }
                  this._pending = false;
                  this._changing = false;
                  return this;
               }

               /**
                * Uses Backbone.sync to persist the state of a model to the server. Can be overridden for custom behavior.
                *
                * @see http://backbonejs.org/#Model-sync
                *
                * @returns {*}
                */
            }, {
               key: 'sync',
               value: function sync() {
                  return BackboneProxy.backbone.sync.apply(this, arguments);
               }

               /**
                * Return a shallow copy of the model's attributes for JSON stringification. This can be used for persistence,
                * serialization, or for augmentation before being sent to the server. The name of this method is a bit confusing,
                * as it doesn't actually return a JSON string — but I'm afraid that it's the way that the JavaScript API for
                * JSON.stringify works.
                *
                * @example
                * let artist = new Backbone.Model({
                *    firstName: "Wassily",
                *    lastName: "Kandinsky"
                * });
                *
                * artist.set({ birthday: "December 16, 1866" });
                *
                * alert(JSON.stringify(artist));
                *
                * @see http://backbonejs.org/#Model-toJSON
                *
                * @returns {object} JSON representation of this model.
                */
            }, {
               key: 'toJSON',
               value: function toJSON() {
                  return _.clone(this.attributes);
               }

               /**
                * Remove an attribute by deleting it from the internal attributes hash. Fires a "change" event unless silent is
                * passed as an option.
                *
                * @see http://backbonejs.org/#Model-unset
                *
                * @param {object|string}  attr - Either a key defining the attribute or a hash of keys / values to unset.
                * @param {object}         options - Optional parameters.
                * @returns {*}
                */
            }, {
               key: 'unset',
               value: function unset(attr, options) {
                  return this.set(attr, void 0, _.extend({}, options, { unset: true }));
               }

               /**
                * Returns the relative URL where the model's resource would be located on the server. If your models are located
                * somewhere else, override this method with the correct logic. Generates URLs of the form: "[collection.url]/[id]"
                * by default, but you may override by specifying an explicit urlRoot if the model's collection shouldn't be taken
                * into account.
                *
                * Delegates to Collection#url to generate the URL, so make sure that you have it defined, or a urlRoot property,
                * if all models of this class share a common root URL. A model with an id of 101, stored in a Backbone.Collection
                * with a url of "/documents/7/notes", would have this URL: "/documents/7/notes/101"
                *
                * @see http://backbonejs.org/#Model-url
                * @see http://backbonejs.org/#Model-urlRoot
                *
                * @returns {string}
                */
            }, {
               key: 'url',
               value: function url() {
                  var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || Utils.urlError();
                  if (this.isNew()) {
                     return base;
                  }
                  var id = this.get(this.idAttribute);
                  return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
               }

               /**
                * Run validation against the next complete set of model attributes, returning `true` if all is well. Otherwise,
                * fire an `"invalid"` event.
                *
                * @protected
                * @param {object}   attrs    - attribute hash
                * @param {object}   options  - Optional parameters
                * @returns {boolean}
                */
            }, {
               key: '_validate',
               value: function _validate(attrs, options) {
                  if (!options.validate || !this.validate) {
                     return true;
                  }
                  attrs = _.extend({}, this.attributes, attrs);
                  var error = this.validationError = this.validate(attrs, options) || null;
                  if (!error) {
                     return true;
                  }
                  this.trigger('invalid', this, error, _.extend(options, { validationError: error }));
                  return false;
               }
            }]);

            return Model;
         })(Events);

         Model.prototype.idAttribute = 'id';

         // Underscore methods that we want to implement on the Model, mapped to the number of arguments they take.
         modelMethods = {
            keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
            omit: 0, chain: 1, isEmpty: 1
         };

         // Mix in each Underscore method as a proxy to `Model#attributes`.
         Utils.addUnderscoreMethods(Model, modelMethods, 'attributes');

         /**
          * Exports the Model class.
          */

         _export('default', Model);
      }
   };
});

$__System.register('c', ['4', '5', '6', '45', 'a'], function (_export) {
   var _classCallCheck, BackboneProxy, _, _toConsumableArray, _createClass, Utils, s_ADD_METHOD, s_CB, s_MODEL_MATCHER;

   return {
      setters: [function (_2) {
         _classCallCheck = _2['default'];
      }, function (_5) {
         BackboneProxy = _5['default'];
      }, function (_4) {
         _ = _4['default'];
      }, function (_3) {
         _toConsumableArray = _3['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }],
      execute: function () {

         /**
          * Provides static utility functions.
          * --------
          *
          * Proxy Backbone class methods to Underscore functions, wrapping the model's `attributes` object or collection's
          * `models` array behind the scenes.
          *
          * `Function#apply` can be slow so we use the method's arg count, if we know it.
          *
          * @example
          * collection.filter(function(model) { return model.get('age') > 10 });
          * collection.each(this.addView);
          */
         'use strict';

         Utils = (function () {
            function Utils() {
               _classCallCheck(this, Utils);
            }

            // Private / internal methods ---------------------------------------------------------------------------------------

            /**
             * Creates an optimized function that dispatches to an associated Underscore function.
             *
             * @param {number}   length      - Length of variables for given Underscore method to dispatch.
             * @param {string}   method      - Function name of Underscore to invoke.
             * @param {string}   attribute   - Attribute to associate with the Underscore function invoked.
             * @returns {Function}
             */

            _createClass(Utils, null, [{
               key: 'addUnderscoreMethods',

               /**
                * Adds Underscore methods if they exist from keys of the `methods` hash to `Class` running against the variable
                * defined by `attribute`
                *
                * @param {Class}    Class       -  Class to add Underscore methods to.
                * @param {object}   methods     -  Hash with keys as method names and values as argument length.
                * @param {string}   attribute   -  The variable to run Underscore methods against. Often "attributes"
                */
               value: function addUnderscoreMethods(Class, methods, attribute) {
                  _.each(methods, function (length, method) {
                     if (_[method]) {
                        Class.prototype[method] = s_ADD_METHOD(length, method, attribute);
                     }
                  });
               }

               /**
                * Method for checking whether an unknown variable is an instance of `Backbone.Model`.
                *
                * @param {*}  unknown - Variable to test.
                * @returns {boolean}
                */
            }, {
               key: 'isModel',
               value: function isModel(unknown) {
                  return unknown instanceof BackboneProxy.backbone.Model;
               }

               /**
                * Method for checking whether a variable is undefined or null.
                *
                * @param {*}  unknown - Variable to test.
                * @returns {boolean}
                */
            }, {
               key: 'isNullOrUndef',
               value: function isNullOrUndef(unknown) {
                  return unknown === null || typeof unknown === 'undefined';
               }

               /**
                * Throw an error when a URL is needed, and none is supplied.
                */
            }, {
               key: 'urlError',
               value: function urlError() {
                  throw new Error('A "url" property or function must be specified');
               }

               /**
                * Wrap an optional error callback with a fallback error event.
                *
                * @param {Model|Collection}  model    - Model or Collection target to construct and error callback against.
                * @param {object}            options  - Options hash to store error callback inside.
                */
            }, {
               key: 'wrapError',
               value: function wrapError(model, options) {
                  var error = options.error;
                  options.error = function (resp) {
                     if (error) {
                        error.call(options.context, model, resp, options);
                     }
                     model.trigger('error', model, resp, options);
                  };
               }
            }]);

            return Utils;
         })();

         _export('default', Utils);

         s_ADD_METHOD = function s_ADD_METHOD(length, method, attribute) {
            switch (length) {
               case 1:
                  return function () {
                     return _[method](this[attribute]);
                  };
               case 2:
                  return function (value) {
                     return _[method](this[attribute], value);
                  };
               case 3:
                  return function (iteratee, context) {
                     return _[method](this[attribute], s_CB(iteratee), context);
                  };
               case 4:
                  return function (iteratee, defaultVal, context) {
                     return _[method](this[attribute], s_CB(iteratee), defaultVal, context);
                  };
               default:
                  return function () {
                     var args = Array.prototype.slice.call(arguments);
                     args.unshift(this[attribute]);
                     return _[method].apply(_, _toConsumableArray(args));
                  };
            }
         };

         /**
          * Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
          *
          * @param {*} iteratee  -
          * @returns {*}
          */

         s_CB = function s_CB(iteratee) {
            if (_.isFunction(iteratee)) {
               return iteratee;
            }
            if (_.isObject(iteratee) && !Utils.isModel(iteratee)) {
               return s_MODEL_MATCHER(iteratee);
            }
            if (_.isString(iteratee)) {
               return function (model) {
                  return model.get(iteratee);
               };
            }
            return iteratee;
         };

         /**
          * Creates a matching function against `attrs`.
          *
          * @param {*} attrs -
          * @returns {Function}
          */

         s_MODEL_MATCHER = function s_MODEL_MATCHER(attrs) {
            var matcher = _.matches(attrs);
            return function (model) {
               return matcher(model.attributes);
            };
         };
      }
   };
});

$__System.register('46', ['4', '8', '9', '47', '48', 'a'], function (_export) {
   var _classCallCheck, _get, _inherits, Parse, encode, _createClass, BackboneParseObject;

   return {
      setters: [function (_3) {
         _classCallCheck = _3['default'];
      }, function (_) {
         _get = _['default'];
      }, function (_2) {
         _inherits = _2['default'];
      }, function (_4) {
         Parse = _4['default'];
      }, function (_5) {
         encode = _5['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }],
      execute: function () {

         /**
          * Provides overrides necessary to integrate Parse serialization / deserialization with Backbone.
          */
         'use strict';

         BackboneParseObject = (function (_Parse$Object) {
            _inherits(BackboneParseObject, _Parse$Object);

            /**
             * Provides a constructor for clone.
             *
             * @param {string | object}   className - class name of object that has className field.
             * @param {object}            attributes - attributes hash.
             * @param {object}            options - Optional parameters
             */

            function BackboneParseObject(className, attributes, options) {
               _classCallCheck(this, BackboneParseObject);

               _get(Object.getPrototypeOf(BackboneParseObject.prototype), 'constructor', this).call(this, className, attributes, options);
            }

            /**
             * Creates a new BackboneParseObject with identical attributes to this one.
             * @method clone
             * @return {BackboneParseObject}
             */

            _createClass(BackboneParseObject, [{
               key: 'clone',
               value: function clone() {
                  var clone = new this.constructor();

                  if (!clone.className) {
                     clone.className = this.className;
                  }
                  if (clone.set) {
                     clone.set(this.attributes);
                  }

                  return clone;
               }

               /**
                * Defers to Parse.Object _getSaveJSON for serializing and then filters all results assigning associated
                * `parseObject` entries which indicate a serialized Backbone.Model (ParseModel) to the entry itself which is
                * what Parse expects to receive.
                *
                * @returns {*}
                * @private
                */
            }, {
               key: '_getSaveJSON',
               value: function _getSaveJSON() {
                  var json = _get(Object.getPrototypeOf(BackboneParseObject.prototype), '_getSaveJSON', this).call(this);

                  for (var attr in json) {
                     if (typeof json[attr].parseObject === 'object') {
                        json[attr] = json[attr].parseObject;
                     }
                  }

                  return json;
               }

               /**
                * Returns a JSON version of the object suitable for saving to Parse.
                *
                * There is a subtle difference in this version which is if `attrs[attr].parseObject === 'object'` then the
                * associated `parseObject` is encoded directly.
                *
                * @param {*}  seen - Provides an array of previously seen entries.
                * @return {Object}
                * @override
                */
            }, {
               key: 'toJSON',
               value: function toJSON(seen) {
                  var seenEntry = this.id ? this.className + ':' + this.id : this;
                  seen = seen || [seenEntry];

                  var json = {};
                  var attrs = this.attributes;

                  for (var attr in attrs) {
                     if ((attr === 'createdAt' || attr === 'updatedAt') && attrs[attr].toJSON) {
                        json[attr] = attrs[attr].toJSON();
                     } else if (typeof attrs[attr].parseObject === 'object') {
                        json[attr] = encode(attrs[attr].parseObject, false, false, seen);
                     } else {
                        json[attr] = encode(attrs[attr], false, false, seen);
                     }
                  }
                  var pending = this._getPendingOps();
                  for (var attr in pending[0]) {
                     json[attr] = pending[0][attr].toJSON();
                  }

                  if (this.id) {
                     json.objectId = this.id;
                  }
                  return json;
               }
            }]);

            return BackboneParseObject;
         })(Parse.Object);

         _export('default', BackboneParseObject);
      }
   };
});

$__System.register('12', ['4', '6', '8', '9', '14', '46', '47', '49', 'a', 'b', 'c', 'd'], function (_export) {
   var _classCallCheck, _, _get, _inherits, _Promise, BackboneParseObject, Parse, Utils, _createClass, Model, BBUtils, Debug, ParseModel;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_6) {
         _ = _6['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_5) {
         _Promise = _5['default'];
      }, function (_8) {
         BackboneParseObject = _8['default'];
      }, function (_7) {
         Parse = _7['default'];
      }, function (_9) {
         Utils = _9['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_b) {
         Model = _b['default'];
      }, function (_c) {
         BBUtils = _c['default'];
      }, function (_d) {
         Debug = _d['default'];
      }],
      execute: function () {

         /**
          * ParseModel - Models are the heart of any JavaScript application. (http://backbonejs.org/#Model)
          * --------------
          *
          * This implementation of Backbone.Model is backed by a ParseObject. If a ParseObject is not provided in `options`
          * then a `className` for the associated table must be defined as options.className or a getter method such as
          * `get className() { return '<CLASSNAME>'; }`. All methods that trigger synchronization return an ES6 Promise or a
          * ParsePromise. This includes the following methods: destroy, fetch, save. Rather than passing in a error or success
          * callback one can use promises to post a follow up chain of actions to complete.
          *
          * Models are the heart of any JavaScript application, containing the interactive data as well as a large part of the
          * logic surrounding it: conversions, validations, computed properties, and access control.
          *
          * Backbone-Parse-ES6 supports the older "extend" functionality of the Parse SDK. You can still use "extend" to extend
          * Backbone.Model with your domain-specific methods, and Model provides a basic set of functionality for managing
          * changes. Refer to `modelExtend` which provides the "extend" functionality for ParseModel. It differs from the
          * standard Backbone extend functionality such that the first parameter requires a class name string for the
          * associated table.
          *
          * It is recommended though to use ES6 syntax for working with Backbone-Parse-ES6 foregoing the older "extend"
          * mechanism.
          *
          * Create a new model with the specified attributes. A client id (`cid`) is automatically generated & assigned for you.
          *
          * If you pass a {collection: ...} as the options, the model gains a collection property that will be used to indicate
          * which collection the model belongs to, and is used to help compute the model's url. The model.collection property is
          * normally created automatically when you first add a model to a collection. Note that the reverse is not true, as
          * passing this option to the constructor will not automatically add the model to the collection. Useful, sometimes.
          *
          * If {parse: true} is passed as an option, the attributes will first be converted by parse before being set on the
          * model.
          *
          * Please see the `Model` documentation for relevant information about the parent class / implementation.
          *
          * @example
          * import Backbone from 'backbone';
          *
          * export default class MyModel extends Backbone.Model
          * {
          *    initialize() { alert('initialized!); }
          * }
          *
          * older extend example:
          * export default Backbone.Model.extend('<CLASSNAME>',
          * {
          *    initialize: { alert('initialized!); }
          * });
          *
          * @example
          * The following methods return a promise - destroy, fetch, save. An example on using promises for save:
          *
          * model.save().then(() =>
          * {
          *    // success
          * },
          * (error) =>
          * {
          *    // error
          * });
          */
         'use strict';

         ParseModel = (function (_Model) {
            _inherits(ParseModel, _Model);

            /**
             * When creating an instance of a model, you can pass in the initial values of the attributes, which will be set on
             * the model. If you define an initialize function, it will be invoked when the model is created.
             *
             * @param {object}   attributes - Optional attribute hash of original values to set.
             * @param {object}   options    - Optional parameters
             */

            function ParseModel() {
               var attributes = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
               var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

               _classCallCheck(this, ParseModel);

               _get(Object.getPrototypeOf(ParseModel.prototype), 'constructor', this).call(this, attributes, _.extend({ abortCtor: true }, options));

               // Allows child classes to abort constructor execution.
               if (_.isBoolean(options.abortCtor) && options.abortCtor) {
                  return;
               }

               var hasClassNameGetter = !_.isUndefined(this.className);
               var hasCollectionGetter = !_.isUndefined(this.collection);
               var hasSubclassGetter = !_.isUndefined(this.subClasses);

               if (hasClassNameGetter) {
                  if (!_.isString(this.className)) {
                     throw new TypeError('ctor - getter for className is not a string.');
                  }
               }

               if (options.subClasses && !hasSubclassGetter) {
                  /**
                   * Object hash of name / class to register as sub classes.
                   * @type {object}
                   */
                  this.subClasses = options.subClasses;
               }

               // Verify any sub class data.
               if (this.subClasses) {
                  if (!_.isObject(this.subClasses)) {
                     throw new TypeError('ctor - subClasses is not an object hash.');
                  }

                  _.each(this.subClasses, function (value, key) {
                     if (!_.isString(key)) {
                        throw new TypeError('ctor - subClass key is not a string.');
                     }

                     if (!Utils.isTypeOf(value, ParseModel)) {
                        throw new TypeError('ctor - subClass is not a sub class of ParseModel for key: ' + key);
                     }
                  });
               }

               var adjustedClassName = undefined;

               var classNameOrParseObject = options.parseObject || options.className;

               Debug.log('ParseModel - ctor - 0 - options.parseObject: ' + options.parseObject, true);

               if (classNameOrParseObject instanceof Parse.Object) {
                  var parseObject = classNameOrParseObject;

                  // Insure that any getter for className is the same as the Parse.Object
                  if (hasClassNameGetter && this.className !== parseObject.className) {
                     throw new Error('ctor - getter className \'' + this.className + '\n             \' does not equal \'parseObject\' className \'' + parseObject.className + '\'.');
                  }

                  if (!(parseObject instanceof BackboneParseObject)) {
                     /**
                      * Parse proxy ParseObject
                      * @type {BackboneParseObject}
                      */
                     this.parseObject = new BackboneParseObject(parseObject.className, parseObject.attributes);
                     this.parseObject.id = parseObject.id;
                     this.parseObject._localId = parseObject._localId;
                  } else {
                     this.parseObject = parseObject;
                  }

                  adjustedClassName = this.parseObject.className;
               } else // Attempt to create Parse.Object from classNameOrParseObject, getter, or from "extend" construction.
                  {
                     if (_.isString(classNameOrParseObject)) {
                        adjustedClassName = classNameOrParseObject;
                        this.parseObject = new BackboneParseObject(adjustedClassName, attributes);
                     }
                     // Check for getter "get className()" usage.
                     else if (hasClassNameGetter) {
                           this.parseObject = new BackboneParseObject(this.className, attributes);
                        }
                        // Check for className via "extend" usage.
                        else if (!_.isUndefined(this.__proto__ && _.isString(this.__proto__.constructor.className))) {
                              adjustedClassName = this.__proto__.constructor.className;
                              this.parseObject = new BackboneParseObject(adjustedClassName, attributes);
                           }
                  }

               if (_.isUndefined(this.parseObject)) {
                  throw new TypeError('ctor - classNameOrParseObject is not a string or BackboneParseObject.');
               }

               if (!hasClassNameGetter) {
                  /**
                   * Parse class name
                   * @type {string}
                   */
                  this.className = adjustedClassName;
               }

               // Register the given subClasses if an object hash exists.
               if (this.subClasses) {
                  _.each(this.subClasses, function (value, key) {
                     Parse.Object.registerSubclass(key, value);
                  });
               }

               var attrs = attributes || {};

               options.parse = true;
               options.updateParseObject = _.isBoolean(options.updateParseObject) ? options.updateParseObject : true;

               /**
                * The prefix is used to create the client id which is used to identify models locally.
                * You may want to override this if you're experiencing name clashes with model ids.
                *
                * @type {string}
                */
               this.cidPrefix = 'c';

               /**
                * Client side ID
                * @type {number}
                */
               this.cid = _.uniqueId(this.cidPrefix);

               /**
                * The hash of attributes for this model.
                * @type {object}
                */
               this.attributes = {};

               if (options.collection && !hasCollectionGetter) {
                  /**
                   * A potentially associated collection.
                   * @type {Collection}
                   */
                  this.collection = options.collection;
               }

               /**
                * A hash of attributes whose current and previous value differ.
                * @type {object}
                */
               this.changed = {};

               /**
                * The value returned during the last failed validation.
                * @type {*}
                */
               this.validationError = null;

               // Allows child classes to postpone initialization.
               if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) {
                  return;
               }

               if (options.parse) {
                  attrs = this.parse(this.parseObject, options) || {};
               }

               attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

               this.set(attrs, options);

               this.initialize(this, arguments);
            }

            // The Parse.Object id is set in Backbone.Model attributes to _parseObjectId. In set any change to _parseObjectId is not
            // propagated to the associated Parse.Object. Note that the Parse.Object id is also set to this.id in "parse()".

            /**
             * Returns a new instance of the model with identical attributes.
             *
             * @see http://backbonejs.org/#Model-clone
             *
             * @returns {*}
             */

            _createClass(ParseModel, [{
               key: 'clone',
               value: function clone() {
                  return new this.constructor({}, { parseObject: this.parseObject.clone() });
               }

               /**
                * Destroys the model on the server by delegating delete request to Backbone.sync and the associated ParseObject.
                * Returns ParsePromise or ES6 Promise if the model isNew. Accepts success and error callbacks in the options hash,
                * which will be passed (model, response, options). Triggers a "destroy" event on the model, which will bubble up
                * through any collections that contain it, and a "sync" event, after the server has successfully acknowledged the
                * model's deletion. Pass {wait: true} if you'd like to wait for the server to respond before removing the model
                * from the collection.
                *
                * @example
                * book.destroy().then(() => {
                *    // do something
                * };
                *
                * @see http://backbonejs.org/#Model-destroy
                *
                * @param {object}   options - Provides optional properties used in destroying a model.
                * @returns {Promise|ParsePromise}
                */
            }, {
               key: 'destroy',
               value: function destroy(options) {
                  var _this = this;

                  options = options ? _.clone(options) : {};
                  var success = options.success;
                  var wait = options.wait;

                  var destroy = function destroy() {
                     _this.stopListening();
                     _this.trigger('destroy', _this, _this.collection, options);
                  };

                  options.success = function (resp) {
                     if (wait) {
                        destroy();
                     }
                     if (success) {
                        success.call(options.context, _this, resp, options);
                     }
                     if (!_this.isNew()) {
                        _this.trigger('sync', _this, resp, options);
                     }
                  };

                  var xhr = undefined;

                  if (this.isNew()) {
                     xhr = new _Promise(function (resolve) {
                        _.defer(options.success);
                        resolve();
                     });
                  } else {
                     BBUtils.wrapError(this, options);
                     xhr = this.sync('delete', this, options);
                  }

                  if (!wait) {
                     destroy();
                  }

                  return xhr;
               }

               /**
                * Has this model been saved to the server yet? If the model does not yet have an id, it is considered to be new.
                *
                * @see http://backbonejs.org/#Model-isNew
                *
                * @returns {boolean}
                */
            }, {
               key: 'isNew',
               value: function isNew() {
                  return _.isUndefined(this.id);
               }

               /* eslint-disable no-unused-vars */
               /**
                * parse is called whenever a model's data is returned by the server, in fetch, and save. The function is passed the
                * raw response object, and should return the attributes hash to be set on the model. This implementation
                * requires a ParseObject and the attributes are directly taken from the attributes of the ParseObject. To keep
                * parity with the Parse SDK the ID of the ParseObject is set as `this.id`.
                *
                * @see http://backbonejs.org/#Model-parse
                *
                * @param {object}   resp - ParseObject
                * @param {object}   options - May include options.parseObject.
                * @returns {object} Attributes from the ParseObject.
                */
            }, {
               key: 'parse',
               value: function parse(resp, options) {
                  /* eslint-enable no-unused-vars */

                  Debug.log('ParseModel - parse - 0 - resp instanceof Parse.Object: ' + (resp instanceof Parse.Object), true);
                  Debug.log('ParseModel - parse - 1 - ParseModel.prototype.idAttribute: ' + ParseModel.prototype.idAttribute);

                  var merged = undefined;

                  if (resp instanceof Parse.Object) {
                     /**
                      * Update the `id`.
                      * @type {*}
                      */
                     this.id = resp._getId();

                     // Store the parse ID in local attributes; Note that it won't be propagated in "set()"
                     var mergeId = {};
                     mergeId[ParseModel.prototype.idAttribute] = this.id;

                     Debug.log('ParseModel - parse - 2 - mergeId: ' + mergeId[ParseModel.prototype.idAttribute]);

                     merged = _.extend(mergeId, resp.attributes);

                     Debug.log('ParseModel - parse - 3 - merged: ' + JSON.stringify(merged));
                  } else if (_.isObject(resp)) {
                     var parseObjectId = resp[ParseModel.prototype.idAttribute];

                     Debug.log('ParseModel - parse - 4 - resp is an Object / existing model - parseObjectId: ' + parseObjectId + '; resp: ' + JSON.stringify(resp));

                     if (!_.isUndefined(parseObjectId) && this.id !== parseObjectId) {
                        Debug.log('ParseModel - parse - 5 - this.id !== parseObjectId; this.id: ' + this.id + '; parseObjectId: ' + parseObjectId);

                        this.id = parseObjectId;
                     }

                     merged = resp;
                  }

                  return merged;
               }

               /**
                * Save a model to your database (or alternative persistence layer), by delegating to Backbone.sync. Returns a
                * Promise. The attributes hash (as in set) should contain the attributes you'd like to change — keys that aren't
                * mentioned won't be altered — but, a complete representation of the resource will be sent to the server. As with
                * set, you may pass individual keys and values instead of a hash. If the model has a validate method, and validation
                * fails, the model will not be saved. If the model isNew, the save will be a "create" (HTTP POST), if the model
                * already exists on the server, the save will be an "update" (HTTP PUT).
                *
                * If instead, you'd only like the changed attributes to be sent to the server, call model.save(attrs,
                * {patch: true}). You'll get an HTTP PATCH request to the server with just the passed-in attributes.
                *
                * Calling save with new attributes will cause a "change" event immediately, a "request" event as the Ajax request
                * begins to go to the server, and a "sync" event after the server has acknowledged the successful change. Pass
                * {wait: true} if you'd like to wait for the server before setting the new attributes on the model.
                *
                * In particular this method is overridden to be able to support resolving Parse.Pointer deserializing which
                * requires the deserialized data to be parsed by the associated models.
                *
                * @example
                * const book = new Backbone.Model({
                *    title: 'The Rough Riders',
                *    author: 'Theodore Roosevelt'
                *    className: 'Book'
                * });
                *
                * book.save();
                *
                * book.save({author: "Teddy"});
                *
                * or use full ES6 syntax:
                *
                * class Book extends Backbone.Model
                * {
                *    get className() { return 'Book'; }
                *    get subClass() { return Book; }     // If subClass is set this class will be registered with Parse.
                * }                                      // Object.registerSubclass()
                *
                * const book = new Book({
                *    title: 'The Rough Riders',
                *    author: 'Theodore Roosevelt'
                * });
                *
                * @see http://backbonejs.org/#Model-save
                *
                * @param {key|object}  key - Either a key defining the attribute to store or a hash of keys / values to store.
                * @param {*}           val - Any type to store in model.
                * @param {object}      options - Optional parameters.
                * @returns {Promise}
                */
            }, {
               key: 'save',
               value: function save(key, val, options) {
                  var _this2 = this;

                  var attrs = undefined;

                  if (Utils.isNullOrUndef(key) || typeof key === 'object') {
                     Debug.log('ParseModel - save - 0');

                     attrs = key;
                     options = val;
                  } else {
                     Debug.log('ParseModel - save - 1');

                     (attrs = {})[key] = val;
                  }

                  // Save any previous options.success function.
                  var success = !Utils.isNullOrUndef(options) ? options.success : undefined;

                  Debug.log('ParseModel - save - 2 - options.success defined: ' + (success !== undefined));

                  options = options || {};

                  options.success = function (model, resp, options) {
                     // Execute previously cached success function. Must do this first before resolving any potential
                     // child object changes.
                     if (success) {
                        Debug.log('ParseModel - save - 3 - invoking original options.success.');
                        success.call(options.context, _this2, resp, options);
                     }

                     Debug.log('ParseModel - save - 4 - invoking ParseModel success.');

                     var modelAttrs = _this2.attributes;
                     for (var attr in modelAttrs) {
                        var field = modelAttrs[attr];

                        // Here is the key part as if the associated Parse.Object id is different than the model id it
                        // needs to be parsed and data set to the Backbone.Model.
                        if (field.parseObject && field.parseObject.id !== field.id) {
                           field.set(field.parse(field.parseObject), options);
                        }
                     }
                  };

                  return _get(Object.getPrototypeOf(ParseModel.prototype), 'save', this).call(this, attrs, options);
               }

               /**
                * Set a hash of attributes (one or many) on the model and potentially on the associated ParseObject. If any of the
                * attributes change the model's state, a "change" event will be triggered on the model. Change events for specific
                * attributes are also triggered, and you can bind to those as well, for example: change:title, and change:content.
                * You may also pass individual keys and values. In addition option.updateParseObject may contain a boolean to
                * indicate whether the associated ParseObject should be updated.
                *
                * @example
                * note.set({ title: "March 20", content: "In his eyes she eclipses..." });
                *
                * book.set("title", "A Scandal in Bohemia");
                *
                * @see http://backbonejs.org/#Model-set
                *
                * @param {object|string}  key      - Either a string defining a key or a key / value hash.
                * @param {*|object}       val      - Either any type to store or the shifted options hash.
                * @param {object}         options  - Optional parameters.
                * @returns {*}
                */
            }, {
               key: 'set',
               value: function set(key, val) {
                  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

                  if (Utils.isNullOrUndef(key)) {
                     return this;
                  }

                  // Handle both `"key", value` and `{key: value}` -style arguments.
                  var attrs = undefined;
                  if (typeof key === 'object') {
                     attrs = key;
                     options = val || {};
                  } else {
                     (attrs = {})[key] = val;
                  }

                  // Run validation.
                  if (!this._validate(attrs, options)) {
                     return false;
                  }

                  // Extract attributes and options.
                  var unset = options.unset;
                  var silent = options.silent;
                  var updateParseObject = !_.isUndefined(options.updateParseObject) ? options.updateParseObject : true;

                  var changes = [];
                  var changing = this._changing;
                  this._changing = true;

                  Debug.log('ParseModel - set - 0 - changing: ' + changing + '; attrs: ' + JSON.stringify(attrs) + '; options: ' + JSON.stringify(options), true);

                  if (!changing) {
                     this._previousAttributes = _.clone(this.attributes);
                     this.changed = {};
                  }

                  var current = this.attributes;
                  var changed = this.changed;
                  var prev = this._previousAttributes;

                  // For each `set` attribute, update or delete the current value.
                  for (var attr in attrs) {
                     val = attrs[attr];

                     if (!_.isEqual(current[attr], val)) {
                        Debug.log('ParseModel - set - 1 - current[attr] != val for key: ' + attr);
                        changes.push(attr);
                     }

                     var actuallyChanged = false;

                     if (!_.isEqual(prev[attr], val)) {
                        Debug.log('ParseModel - set - 2 - prev[attr] != val for key: ' + attr);

                        changed[attr] = val;
                        actuallyChanged = true;
                     } else {
                        Debug.log('ParseModel - set - 3 - prev[attr] == val delete changed for key: ' + attr);
                        delete changed[attr];
                     }

                     if (unset) {
                        var unsetSuccess = !updateParseObject;

                        // Ignore any change to the Parse.Object id
                        if (attr === ParseModel.prototype.idAttribute) {
                           continue;
                        }

                        if (updateParseObject && this.parseObject !== null && attr !== ParseModel.prototype.idAttribute) {
                           // Parse.Object returns itself on success
                           unsetSuccess = this.parseObject === this.parseObject.unset(attr);

                           Debug.log('ParseModel - set - 4 - unset Parse.Object - attr: ' + attr + '; unsetSuccess: ' + unsetSuccess);
                        }

                        if (unsetSuccess) {
                           delete current[attr];
                        }
                     } else {
                        var setSuccess = !updateParseObject || attr === ParseModel.prototype.idAttribute;

                        if (actuallyChanged && updateParseObject && this.parseObject !== null && attr !== ParseModel.prototype.idAttribute) {
                           // Parse.Object returns itself on success
                           setSuccess = this.parseObject === this.parseObject.set(attr, val, options);

                           Debug.log('ParseModel - set - 5 - set Parse.Object - attr: ' + attr + '; setSuccess: ' + setSuccess);
                        }

                        if (actuallyChanged && setSuccess) {
                           current[attr] = val;
                        }
                     }
                  }

                  // Trigger all relevant attribute changes.
                  if (!silent) {
                     if (changes.length) {
                        this._pending = options;
                     }
                     for (var i = 0; i < changes.length; i++) {
                        this.trigger('change:' + changes[i], this, current[changes[i]], options);
                        Debug.log('ParseModel - set - 6 - trigger - changeKey: ' + changes[i]);
                     }
                  }

                  // You might be wondering why there's a `while` loop here. Changes can
                  // be recursively nested within `"change"` events.
                  if (changing) {
                     return this;
                  }
                  if (!silent) {
                     while (this._pending) {
                        options = this._pending;
                        this._pending = false;
                        this.trigger('change', this, options);
                        Debug.log('ParseModel - set - 7 - trigger - change');
                     }
                  }
                  this._pending = false;
                  this._changing = false;
                  return this;
               }

               /**
                * Return a copy of the model's `attributes` object.
                *
                * @returns {object} JSON representation of this model.
                */
            }, {
               key: 'toJSON',
               value: function toJSON() {
                  return this.parseObject.toJSON();
               }

               /**
                * This is an unsupported operation for backbone-parse-es6.
                */
            }, {
               key: 'url',
               value: function url() {
                  throw new Error('ParseModel - url() - Unsupported Operation.');
               }
            }]);

            return ParseModel;
         })(Model);

         ParseModel.prototype.idAttribute = '_parseObjectId';

         /**
          * Exports the ParseModel class.
          */

         _export('default', ParseModel);
      }
   };
});

$__System.registerDynamic("4a", ["4b", "4c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var toInteger = $__require('4b'),
      defined = $__require('4c');
  module.exports = function(TO_STRING) {
    return function(that, pos) {
      var s = String(defined(that)),
          i = toInteger(pos),
          l = s.length,
          a,
          b;
      if (i < 0 || i >= l)
        return TO_STRING ? '' : undefined;
      a = s.charCodeAt(i);
      return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
    };
  };
  return module.exports;
});

$__System.registerDynamic("3d", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = true;
  return module.exports;
});

$__System.registerDynamic("34", ["4d"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = $__require('4d');
  return module.exports;
});

$__System.registerDynamic("4e", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };
  return module.exports;
});

$__System.registerDynamic("38", ["4f"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = !$__require('4f')(function() {
    return Object.defineProperty({}, 'a', {get: function() {
        return 7;
      }}).a != 7;
  });
  return module.exports;
});

$__System.registerDynamic("4d", ["37", "4e", "38"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $ = $__require('37'),
      createDesc = $__require('4e');
  module.exports = $__require('38') ? function(object, key, value) {
    return $.setDesc(object, key, createDesc(1, value));
  } : function(object, key, value) {
    object[key] = value;
    return object;
  };
  return module.exports;
});

$__System.registerDynamic("50", ["37", "4e", "41", "4d", "29"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $ = $__require('37'),
      descriptor = $__require('4e'),
      setToStringTag = $__require('41'),
      IteratorPrototype = {};
  $__require('4d')(IteratorPrototype, $__require('29')('iterator'), function() {
    return this;
  });
  module.exports = function(Constructor, NAME, next) {
    Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
    setToStringTag(Constructor, NAME + ' Iterator');
  };
  return module.exports;
});

$__System.registerDynamic("51", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var hasOwnProperty = {}.hasOwnProperty;
  module.exports = function(it, key) {
    return hasOwnProperty.call(it, key);
  };
  return module.exports;
});

$__System.registerDynamic("41", ["37", "51", "29"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var def = $__require('37').setDesc,
      has = $__require('51'),
      TAG = $__require('29')('toStringTag');
  module.exports = function(it, tag, stat) {
    if (it && !has(it = stat ? it : it.prototype, TAG))
      def(it, TAG, {
        configurable: true,
        value: tag
      });
  };
  return module.exports;
});

$__System.registerDynamic("1c", ["3d", "3f", "34", "4d", "51", "1a", "50", "41", "37", "29"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var LIBRARY = $__require('3d'),
      $export = $__require('3f'),
      redefine = $__require('34'),
      hide = $__require('4d'),
      has = $__require('51'),
      Iterators = $__require('1a'),
      $iterCreate = $__require('50'),
      setToStringTag = $__require('41'),
      getProto = $__require('37').getProto,
      ITERATOR = $__require('29')('iterator'),
      BUGGY = !([].keys && 'next' in [].keys()),
      FF_ITERATOR = '@@iterator',
      KEYS = 'keys',
      VALUES = 'values';
  var returnThis = function() {
    return this;
  };
  module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
    $iterCreate(Constructor, NAME, next);
    var getMethod = function(kind) {
      if (!BUGGY && kind in proto)
        return proto[kind];
      switch (kind) {
        case KEYS:
          return function keys() {
            return new Constructor(this, kind);
          };
        case VALUES:
          return function values() {
            return new Constructor(this, kind);
          };
      }
      return function entries() {
        return new Constructor(this, kind);
      };
    };
    var TAG = NAME + ' Iterator',
        DEF_VALUES = DEFAULT == VALUES,
        VALUES_BUG = false,
        proto = Base.prototype,
        $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
        $default = $native || getMethod(DEFAULT),
        methods,
        key;
    if ($native) {
      var IteratorPrototype = getProto($default.call(new Base));
      setToStringTag(IteratorPrototype, TAG, true);
      if (!LIBRARY && has(proto, FF_ITERATOR))
        hide(IteratorPrototype, ITERATOR, returnThis);
      if (DEF_VALUES && $native.name !== VALUES) {
        VALUES_BUG = true;
        $default = function values() {
          return $native.call(this);
        };
      }
    }
    if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
      hide(proto, ITERATOR, $default);
    }
    Iterators[NAME] = $default;
    Iterators[TAG] = returnThis;
    if (DEFAULT) {
      methods = {
        values: DEF_VALUES ? $default : getMethod(VALUES),
        keys: IS_SET ? $default : getMethod(KEYS),
        entries: !DEF_VALUES ? $default : getMethod('entries')
      };
      if (FORCED)
        for (key in methods) {
          if (!(key in proto))
            redefine(proto, key, methods[key]);
        }
      else
        $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
    }
    return methods;
  };
  return module.exports;
});

$__System.registerDynamic("44", ["4a", "1c"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $at = $__require('4a')(true);
  $__require('1c')(String, 'String', function(iterated) {
    this._t = String(iterated);
    this._i = 0;
  }, function() {
    var O = this._t,
        index = this._i,
        point;
    if (index >= O.length)
      return {
        value: undefined,
        done: true
      };
    point = $at(O, index);
    this._i += point.length;
    return {
      value: point,
      done: false
    };
  });
  return module.exports;
});

$__System.registerDynamic("52", ["4c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var defined = $__require('4c');
  module.exports = function(it) {
    return Object(defined(it));
  };
  return module.exports;
});

$__System.registerDynamic("21", ["23"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var anObject = $__require('23');
  module.exports = function(iterator, fn, value, entries) {
    try {
      return entries ? fn(anObject(value)[0], value[1]) : fn(value);
    } catch (e) {
      var ret = iterator['return'];
      if (ret !== undefined)
        anObject(ret.call(iterator));
      throw e;
    }
  };
  return module.exports;
});

$__System.registerDynamic("22", ["1a", "29"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var Iterators = $__require('1a'),
      ITERATOR = $__require('29')('iterator'),
      ArrayProto = Array.prototype;
  module.exports = function(it) {
    return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
  };
  return module.exports;
});

$__System.registerDynamic("4b", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ceil = Math.ceil,
      floor = Math.floor;
  module.exports = function(it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  };
  return module.exports;
});

$__System.registerDynamic("24", ["4b"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var toInteger = $__require('4b'),
      min = Math.min;
  module.exports = function(it) {
    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0;
  };
  return module.exports;
});

$__System.registerDynamic("3e", ["30", "29"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var cof = $__require('30'),
      TAG = $__require('29')('toStringTag'),
      ARG = cof(function() {
        return arguments;
      }()) == 'Arguments';
  module.exports = function(it) {
    var O,
        T,
        B;
    return it === undefined ? 'Undefined' : it === null ? 'Null' : typeof(T = (O = Object(it))[TAG]) == 'string' ? T : ARG ? cof(O) : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
  };
  return module.exports;
});

$__System.registerDynamic("1a", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {};
  return module.exports;
});

$__System.registerDynamic("25", ["3e", "29", "1a", "36"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var classof = $__require('3e'),
      ITERATOR = $__require('29')('iterator'),
      Iterators = $__require('1a');
  module.exports = $__require('36').getIteratorMethod = function(it) {
    if (it != undefined)
      return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
  };
  return module.exports;
});

$__System.registerDynamic("53", ["2c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var global = $__require('2c'),
      SHARED = '__core-js_shared__',
      store = global[SHARED] || (global[SHARED] = {});
  module.exports = function(key) {
    return store[key] || (store[key] = {});
  };
  return module.exports;
});

$__System.registerDynamic("54", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var id = 0,
      px = Math.random();
  module.exports = function(key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
  };
  return module.exports;
});

$__System.registerDynamic("29", ["53", "54", "2c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var store = $__require('53')('wks'),
      uid = $__require('54'),
      Symbol = $__require('2c').Symbol;
  module.exports = function(name) {
    return store[name] || (store[name] = Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
  };
  return module.exports;
});

$__System.registerDynamic("42", ["29"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ITERATOR = $__require('29')('iterator'),
      SAFE_CLOSING = false;
  try {
    var riter = [7][ITERATOR]();
    riter['return'] = function() {
      SAFE_CLOSING = true;
    };
    Array.from(riter, function() {
      throw 2;
    });
  } catch (e) {}
  module.exports = function(exec, skipClosing) {
    if (!skipClosing && !SAFE_CLOSING)
      return false;
    var safe = false;
    try {
      var arr = [7],
          iter = arr[ITERATOR]();
      iter.next = function() {
        safe = true;
      };
      arr[ITERATOR] = function() {
        return iter;
      };
      exec(arr);
    } catch (e) {}
    return safe;
  };
  return module.exports;
});

$__System.registerDynamic("55", ["20", "3f", "52", "21", "22", "24", "25", "42"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ctx = $__require('20'),
      $export = $__require('3f'),
      toObject = $__require('52'),
      call = $__require('21'),
      isArrayIter = $__require('22'),
      toLength = $__require('24'),
      getIterFn = $__require('25');
  $export($export.S + $export.F * !$__require('42')(function(iter) {
    Array.from(iter);
  }), 'Array', {from: function from(arrayLike) {
      var O = toObject(arrayLike),
          C = typeof this == 'function' ? this : Array,
          $$ = arguments,
          $$len = $$.length,
          mapfn = $$len > 1 ? $$[1] : undefined,
          mapping = mapfn !== undefined,
          index = 0,
          iterFn = getIterFn(O),
          length,
          result,
          step,
          iterator;
      if (mapping)
        mapfn = ctx(mapfn, $$len > 2 ? $$[2] : undefined, 2);
      if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
        for (iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++) {
          result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
        }
      } else {
        length = toLength(O.length);
        for (result = new C(length); length > index; index++) {
          result[index] = mapping ? mapfn(O[index], index) : O[index];
        }
      }
      result.length = index;
      return result;
    }});
  return module.exports;
});

$__System.registerDynamic("56", ["44", "55", "36"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  $__require('44');
  $__require('55');
  module.exports = $__require('36').Array.from;
  return module.exports;
});

$__System.registerDynamic("57", ["56"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    "default": $__require('56'),
    __esModule: true
  };
  return module.exports;
});

$__System.registerDynamic("45", ["57"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _Array$from = $__require('57')["default"];
  exports["default"] = function(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0,
          arr2 = Array(arr.length); i < arr.length; i++)
        arr2[i] = arr[i];
      return arr2;
    } else {
      return _Array$from(arr);
    }
  };
  exports.__esModule = true;
  return module.exports;
});

$__System.register('58', ['4', '5', '6', '8', '9', '45', 'a', 'e'], function (_export) {
   var _classCallCheck, BackboneProxy, _, _get, _inherits, _toConsumableArray, _createClass, Events, Router, s_ESCAPE_REGEX, s_NAMED_PARAM, s_OPTIONAL_PARAM, s_SPLAT_PARAM, s_BIND_ROUTES, s_EXTRACT_PARAMETERS, s_ROUTE_TO_REGEX;

   return {
      setters: [function (_4) {
         _classCallCheck = _4['default'];
      }, function (_7) {
         BackboneProxy = _7['default'];
      }, function (_6) {
         _ = _6['default'];
      }, function (_2) {
         _get = _2['default'];
      }, function (_3) {
         _inherits = _3['default'];
      }, function (_5) {
         _toConsumableArray = _5['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }, function (_e) {
         Events = _e['default'];
      }],
      execute: function () {

         /**
          * Backbone.Router - Provides methods for routing client-side pages, and connecting them to actions and events.
          * (http://backbonejs.org/#Router)
          * ---------------
          * Web applications often provide linkable, bookmarkable, shareable URLs for important locations in the app. Until
          * recently, hash fragments (#page) were used to provide these permalinks, but with the arrival of the History API,
          * it's now possible to use standard URLs (/page). Backbone.Router provides methods for routing client-side pages, and
          * connecting them to actions and events. For browsers which don't yet support the History API, the Router handles
          * graceful fallback and transparent translation to the fragment version of the URL.
          *
          * During page load, after your application has finished creating all of its routers, be sure to call
          * Backbone.history.start() or Backbone.history.start({pushState: true}) to route the initial URL.
          *
          * routes - router.routes
          * The routes hash maps URLs with parameters to functions on your router (or just direct function definitions, if you
          * prefer), similar to the View's events hash. Routes can contain parameter parts, :param, which match a single URL
          * component between slashes; and splat parts *splat, which can match any number of URL components. Part of a route can
          * be made optional by surrounding it in parentheses (/:optional).
          *
          * For example, a route of "search/:query/p:page" will match a fragment of #search/obama/p2, passing "obama" and "2" to
          * the action.
          *
          * A route of "file/*path" will match #file/folder/file.txt, passing "folder/file.txt" to the action.
          *
          * A route of "docs/:section(/:subsection)" will match #docs/faq and #docs/faq/installing, passing "faq" to the action
          * in the first case, and passing "faq" and "installing" to the action in the second.
          *
          * A nested optional route of "docs(/:section)(/:subsection)" will match #docs, #docs/faq, and #docs/faq/installing,
          * passing "faq" to the action in the second case, and passing "faq" and "installing" to the action in the third.
          *
          * Trailing slashes are treated as part of the URL, and (correctly) treated as a unique route when accessed. docs and
          * docs/ will fire different callbacks. If you can't avoid generating both types of URLs, you can define a "docs(/)"
          * matcher to capture both cases.
          *
          * When the visitor presses the back button, or enters a URL, and a particular route is matched, the name of the action
          * will be fired as an event, so that other objects can listen to the router, and be notified. In the following example,
          * visiting #help/uploading will fire a route:help event from the router.
          *
          * @example
          * routes: {
          *    "help/:page":         "help",
          *    "download/*path":     "download",
          *    "folder/:name":       "openFolder",
          *    "folder/:name-:mode": "openFolder"
          * }
          *
          * router.on("route:help", function(page) {
          *    ...
          * });
          *
          * @example
          * Old extend - Backbone.Router.extend(properties, [classProperties])
          * Get started by creating a custom router class. Define actions that are triggered when certain URL fragments are
          * matched, and provide a routes hash that pairs routes to actions. Note that you'll want to avoid using a leading
          * slash in your route definitions:
          *
          * var Workspace = Backbone.Router.extend({
          *    routes: {
          *       "help":                 "help",    // #help
          *       "search/:query":        "search",  // #search/kiwis
          *       "search/:query/p:page": "search"   // #search/kiwis/p7
          *    },
          *
          *    help: function() {
          *       ...
          *    },
          *
          *    search: function(query, page) {
          *       ...
          *    }
          * });
          *
          * @example
          * Converting the above example to ES6 using a getter method for `routes`:
          * class Workspace extends Backbone.Router {
          *    get routes() {
          *       return {
          *          "help":                 "help",    // #help
          *          "search/:query":        "search",  // #search/kiwis
          *          "search/:query/p:page": "search"   // #search/kiwis/p7
          *       };
          *    }
          *
          *    help() {
          *       ...
          *    },
          *
          *    search(query, page) {
          *       ...
          *    }
          * }
          *
          * @example
          * Basic default "no route router":
          * new Backbone.Router({ routes: { '*actions': 'defaultRoute' } });
          */
         'use strict';

         Router = (function (_Events) {
            _inherits(Router, _Events);

            /**
             * When creating a new router, you may pass its routes hash directly as an option, if you choose. All options will
             * also be passed to your initialize function, if defined.
             *
             * @see http://backbonejs.org/#Router-constructor
             *
             * @param {object}   options  - Optional parameters which may contain a "routes" object literal.
             */

            function Router() {
               var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

               _classCallCheck(this, Router);

               _get(Object.getPrototypeOf(Router.prototype), 'constructor', this).call(this);

               // Must detect if there are any getters defined in order to skip setting this value.
               var hasRoutesGetter = !_.isUndefined(this.routes);

               if (!hasRoutesGetter && options.routes) {
                  /**
                   * Stores the routes hash.
                   * @type {object}
                   */
                  this.routes = options.routes;
               }

               s_BIND_ROUTES(this);

               this.initialize.apply(this, arguments);
            }

            // Private / internal methods ---------------------------------------------------------------------------------------

            /**
             * Cached regular expressions for matching named param parts and splatted parts of route strings.
             * @type {RegExp}
             */

            /* eslint-disable no-unused-vars */
            /**
             * Execute a route handler with the provided parameters.  This is an excellent place to do pre-route setup or
             * post-route cleanup.
             *
             * @see http://backbonejs.org/#Router-execute
             *
             * @param {function} callback - Callback function to execute.
             * @param {*[]}      args     - Arguments to apply to callback.
             * @param {string}   name     - Named route.
             */

            _createClass(Router, [{
               key: 'execute',
               value: function execute(callback, args, name) {
                  /* eslint-enable no-unused-vars */
                  if (callback) {
                     callback.apply(this, args);
                  }
               }

               /**
                * Initialize is an empty function by default. Override it with your own initialization logic.
                *
                * @see http://backbonejs.org/#Router-constructor
                * @abstract
                */
            }, {
               key: 'initialize',
               value: function initialize() {}

               /**
                * Simple proxy to `Backbone.history` to save a fragment into the history.
                *
                * @see http://backbonejs.org/#Router-navigate
                * @see History
                *
                * @param {string}   fragment - String representing an URL fragment.
                * @param {object}   options - Optional hash containing parameters for navigate.
                * @returns {Router}
                */
            }, {
               key: 'navigate',
               value: function navigate(fragment, options) {
                  BackboneProxy.backbone.history.navigate(fragment, options);
                  return this;
               }

               /**
                * Manually bind a single named route to a callback. For example:
                *
                * @example
                * this.route('search/:query/p:num', 'search', function(query, num)
                * {
                *    ...
                * });
                *
                * @see http://backbonejs.org/#Router-route
                *
                * @param {string|RegExp}  route    -  A route string or regex.
                * @param {string}         name     -  A name for the route.
                * @param {function}       callback -  A function to invoke when the route is matched.
                * @returns {Router}
                */
            }, {
               key: 'route',
               value: function route(_route, name, callback) {
                  var _this = this;

                  if (!_.isRegExp(_route)) {
                     _route = s_ROUTE_TO_REGEX(_route);
                  }
                  if (_.isFunction(name)) {
                     callback = name;
                     name = '';
                  }
                  if (!callback) {
                     callback = this[name];
                  }

                  BackboneProxy.backbone.history.route(_route, function (fragment) {
                     var args = s_EXTRACT_PARAMETERS(_route, fragment);

                     if (_this.execute(callback, args, name) !== false) {
                        _this.trigger.apply(_this, _toConsumableArray(['route:' + name].concat(args)));
                        _this.trigger('route', name, args);
                        BackboneProxy.backbone.history.trigger('route', _this, name, args);
                     }
                  });

                  return this;
               }
            }]);

            return Router;
         })(Events);

         _export('default', Router);

         s_ESCAPE_REGEX = /[\-{}\[\]+?.,\\\^$|#\s]/g;
         s_NAMED_PARAM = /(\(\?)?:\w+/g;
         s_OPTIONAL_PARAM = /\((.*?)\)/g;
         s_SPLAT_PARAM = /\*\w+/g;

         /**
          * Bind all defined routes to `Backbone.history`. We have to reverse the order of the routes here to support behavior
          * where the most general routes can be defined at the bottom of the route map.
          *
          * @param {Router}   router   - Instance of `Backbone.Router`.
          */

         s_BIND_ROUTES = function s_BIND_ROUTES(router) {
            if (!router.routes) {
               return;
            }

            router.routes = _.result(router, 'routes');

            _.each(_.keys(router.routes), function (route) {
               router.route(route, router.routes[route]);
            });
         };

         /**
          * Given a route, and a URL fragment that it matches, return the array of extracted decoded parameters. Empty or
          * unmatched parameters will be treated as `null` to normalize cross-browser behavior.
          *
          * @param {string}   route - A route string or regex.
          * @param {string}   fragment - URL fragment.
          * @returns {*}
          */

         s_EXTRACT_PARAMETERS = function s_EXTRACT_PARAMETERS(route, fragment) {
            var params = route.exec(fragment).slice(1);

            return _.map(params, function (param, i) {
               // Don't decode the search params.
               if (i === params.length - 1) {
                  return param || null;
               }
               return param ? decodeURIComponent(param) : null;
            });
         };

         /**
          * Convert a route string into a regular expression, suitable for matching against the current location hash.
          *
          * @param {string}   route - A route string or regex.
          * @returns {RegExp}
          */

         s_ROUTE_TO_REGEX = function s_ROUTE_TO_REGEX(route) {
            route = route.replace(s_ESCAPE_REGEX, '\\$&').replace(s_OPTIONAL_PARAM, '(?:$1)?').replace(s_NAMED_PARAM, function (match, optional) {
               return optional ? match : '([^/?]+)';
            }).replace(s_SPLAT_PARAM, '([^?]*?)');
            return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
         };
      }
   };
});

$__System.registerDynamic("30", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var toString = {}.toString;
  module.exports = function(it) {
    return toString.call(it).slice(8, -1);
  };
  return module.exports;
});

$__System.registerDynamic("59", ["30"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var cof = $__require('30');
  module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it) {
    return cof(it) == 'String' ? it.split('') : Object(it);
  };
  return module.exports;
});

$__System.registerDynamic("4c", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(it) {
    if (it == undefined)
      throw TypeError("Can't call method on  " + it);
    return it;
  };
  return module.exports;
});

$__System.registerDynamic("1b", ["59", "4c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var IObject = $__require('59'),
      defined = $__require('4c');
  module.exports = function(it) {
    return IObject(defined(it));
  };
  return module.exports;
});

$__System.registerDynamic("4f", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(exec) {
    try {
      return !!exec();
    } catch (e) {
      return true;
    }
  };
  return module.exports;
});

$__System.registerDynamic("5a", ["3f", "36", "4f"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $export = $__require('3f'),
      core = $__require('36'),
      fails = $__require('4f');
  module.exports = function(KEY, exec) {
    var fn = (core.Object || {})[KEY] || Object[KEY],
        exp = {};
    exp[KEY] = exec(fn);
    $export($export.S + $export.F * fails(function() {
      fn(1);
    }), 'Object', exp);
  };
  return module.exports;
});

$__System.registerDynamic("5b", ["1b", "5a"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var toIObject = $__require('1b');
  $__require('5a')('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor) {
    return function getOwnPropertyDescriptor(it, key) {
      return $getOwnPropertyDescriptor(toIObject(it), key);
    };
  });
  return module.exports;
});

$__System.registerDynamic("5c", ["37", "5b"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $ = $__require('37');
  $__require('5b');
  module.exports = function getOwnPropertyDescriptor(it, key) {
    return $.getDesc(it, key);
  };
  return module.exports;
});

$__System.registerDynamic("5d", ["5c"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    "default": $__require('5c'),
    __esModule: true
  };
  return module.exports;
});

$__System.registerDynamic("8", ["5d"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _Object$getOwnPropertyDescriptor = $__require('5d')["default"];
  exports["default"] = function get(_x, _x2, _x3) {
    var _again = true;
    _function: while (_again) {
      var object = _x,
          property = _x2,
          receiver = _x3;
      _again = false;
      if (object === null)
        object = Function.prototype;
      var desc = _Object$getOwnPropertyDescriptor(object, property);
      if (desc === undefined) {
        var parent = Object.getPrototypeOf(object);
        if (parent === null) {
          return undefined;
        } else {
          _x = parent;
          _x2 = property;
          _x3 = receiver;
          _again = true;
          desc = parent = undefined;
          continue _function;
        }
      } else if ("value" in desc) {
        return desc.value;
      } else {
        var getter = desc.get;
        if (getter === undefined) {
          return undefined;
        }
        return getter.call(receiver);
      }
    }
  };
  exports.__esModule = true;
  return module.exports;
});

$__System.registerDynamic("5e", ["37"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $ = $__require('37');
  module.exports = function create(P, D) {
    return $.create(P, D);
  };
  return module.exports;
});

$__System.registerDynamic("5f", ["5e"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    "default": $__require('5e'),
    __esModule: true
  };
  return module.exports;
});

$__System.registerDynamic("2c", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
  if (typeof __g == 'number')
    __g = global;
  return module.exports;
});

$__System.registerDynamic("3f", ["2c", "36", "20"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var global = $__require('2c'),
      core = $__require('36'),
      ctx = $__require('20'),
      PROTOTYPE = 'prototype';
  var $export = function(type, name, source) {
    var IS_FORCED = type & $export.F,
        IS_GLOBAL = type & $export.G,
        IS_STATIC = type & $export.S,
        IS_PROTO = type & $export.P,
        IS_BIND = type & $export.B,
        IS_WRAP = type & $export.W,
        exports = IS_GLOBAL ? core : core[name] || (core[name] = {}),
        target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE],
        key,
        own,
        out;
    if (IS_GLOBAL)
      source = name;
    for (key in source) {
      own = !IS_FORCED && target && key in target;
      if (own && key in exports)
        continue;
      out = own ? target[key] : source[key];
      exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key] : IS_BIND && own ? ctx(out, global) : IS_WRAP && target[key] == out ? (function(C) {
        var F = function(param) {
          return this instanceof C ? new C(param) : C(param);
        };
        F[PROTOTYPE] = C[PROTOTYPE];
        return F;
      })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
      if (IS_PROTO)
        (exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
    }
  };
  $export.F = 1;
  $export.G = 2;
  $export.S = 4;
  $export.P = 8;
  $export.B = 16;
  $export.W = 32;
  module.exports = $export;
  return module.exports;
});

$__System.registerDynamic("2e", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };
  return module.exports;
});

$__System.registerDynamic("23", ["2e"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var isObject = $__require('2e');
  module.exports = function(it) {
    if (!isObject(it))
      throw TypeError(it + ' is not an object!');
    return it;
  };
  return module.exports;
});

$__System.registerDynamic("28", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = function(it) {
    if (typeof it != 'function')
      throw TypeError(it + ' is not a function!');
    return it;
  };
  return module.exports;
});

$__System.registerDynamic("20", ["28"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var aFunction = $__require('28');
  module.exports = function(fn, that, length) {
    aFunction(fn);
    if (that === undefined)
      return fn;
    switch (length) {
      case 1:
        return function(a) {
          return fn.call(that, a);
        };
      case 2:
        return function(a, b) {
          return fn.call(that, a, b);
        };
      case 3:
        return function(a, b, c) {
          return fn.call(that, a, b, c);
        };
    }
    return function() {
      return fn.apply(that, arguments);
    };
  };
  return module.exports;
});

$__System.registerDynamic("40", ["37", "2e", "23", "20"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var getDesc = $__require('37').getDesc,
      isObject = $__require('2e'),
      anObject = $__require('23');
  var check = function(O, proto) {
    anObject(O);
    if (!isObject(proto) && proto !== null)
      throw TypeError(proto + ": can't set as prototype!");
  };
  module.exports = {
    set: Object.setPrototypeOf || ('__proto__' in {} ? function(test, buggy, set) {
      try {
        set = $__require('20')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) {
        buggy = true;
      }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy)
          O.__proto__ = proto;
        else
          set(O, proto);
        return O;
      };
    }({}, false) : undefined),
    check: check
  };
  return module.exports;
});

$__System.registerDynamic("60", ["3f", "40"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $export = $__require('3f');
  $export($export.S, 'Object', {setPrototypeOf: $__require('40').set});
  return module.exports;
});

$__System.registerDynamic("36", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core = module.exports = {version: '1.2.6'};
  if (typeof __e == 'number')
    __e = core;
  return module.exports;
});

$__System.registerDynamic("61", ["60", "36"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  $__require('60');
  module.exports = $__require('36').Object.setPrototypeOf;
  return module.exports;
});

$__System.registerDynamic("62", ["61"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    "default": $__require('61'),
    __esModule: true
  };
  return module.exports;
});

$__System.registerDynamic("9", ["5f", "62"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _Object$create = $__require('5f')["default"];
  var _Object$setPrototypeOf = $__require('62')["default"];
  exports["default"] = function(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = _Object$create(superClass && superClass.prototype, {constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }});
    if (superClass)
      _Object$setPrototypeOf ? _Object$setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };
  exports.__esModule = true;
  return module.exports;
});

$__System.register('e', ['4', '6', 'a'], function (_export) {
   var _classCallCheck, _, _createClass, Events, s_EVENT_SPLITTER, s_EVENTS_API, s_INTERNAL_ON, s_OFF_API, s_ON_API, s_ONCE_MAP, s_TRIGGER_API, s_TRIGGER_EVENTS;

   return {
      setters: [function (_2) {
         _classCallCheck = _2['default'];
      }, function (_3) {
         _ = _3['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }],
      execute: function () {

         /**
          * Backbone.Events - Provides the ability to bind and trigger custom named events. (http://backbonejs.org/#Events)
          * ---------------
          *
          * An important consideration of Backbone-ES6 is that Events are no longer an object literal, but a full blown ES6
          * class. This is the biggest potential breaking change for Backbone-ES6 when compared to the original Backbone.
          *
          * Previously Events could be mixed in to any object. This is no longer possible with Backbone-ES6 when working from
          * source or the bundled versions. It should be noted that Events is also no longer mixed into Backbone itself, so
          * Backbone is not a Global events instance.
          *
          * Catalog of Events:
          * Here's the complete list of built-in Backbone events, with arguments. You're also free to trigger your own events on
          * Models, Collections and Views as you see fit.
          *
          * "add" (model, collection, options) — when a model is added to a collection.
          * "remove" (model, collection, options) — when a model is removed from a collection.
          * "update" (collection, options) — single event triggered after any number of models have been added or removed from a
          * collection.
          * "reset" (collection, options) — when the collection's entire contents have been reset.
          * "sort" (collection, options) — when the collection has been re-sorted.
          * "change" (model, options) — when a model's attributes have changed.
          * "change:[attribute]" (model, value, options) — when a specific attribute has been updated.
          * "destroy" (model, collection, options) — when a model is destroyed.
          * "request" (model_or_collection, xhr, options) — when a model or collection has started a request to the server.
          * "sync" (model_or_collection, response, options) — when a model or collection has been successfully synced with the
          * server.
          * "error" (model_or_collection, response, options) — when a model's or collection's request to the server has failed.
          * "invalid" (model, error, options) — when a model's validation fails on the client.
          * "route:[name]" (params) — Fired by the router when a specific route is matched.
          * "route" (route, params) — Fired by the router when any route has been matched.
          * "route" (router, route, params) — Fired by history when any route has been matched.
          * "all" — this special event fires for any triggered event, passing the event name as the first argument followed by
          * all trigger arguments.
          *
          * Generally speaking, when calling a function that emits an event (model.set, collection.add, and so on...), if you'd
          * like to prevent the event from being triggered, you may pass {silent: true} as an option. Note that this is rarely,
          * perhaps even never, a good idea. Passing through a specific flag in the options for your event callback to look at,
          * and choose to ignore, will usually work out better.
          *
          * @example
          * This no longer works:
          *
          * let object = {};
          * _.extend(object, Backbone.Events);
          * object.on('expand', function(){ alert('expanded'); });
          * object.trigger('expand');
          *
          * One must now use ES6 extends syntax for Backbone.Events when inheriting events functionality:
          * import Backbone from 'backbone';
          *
          * class MyClass extends Backbone.Events {}
          *
          * @example
          * A nice ES6 pattern for creating a named events instance is the following:
          *
          * import Backbone from 'backbone';
          *
          * export default new Backbone.Events();
          *
          * This module / Events instance can then be imported by full path or if consuming in a modular runtime by creating
          * a mapped path to it.
          */
         'use strict';

         Events = (function () {
            /** */

            function Events() {
               _classCallCheck(this, Events);
            }

            // Private / internal methods ---------------------------------------------------------------------------------------

            /**
             * Regular expression used to split event strings.
             * @type {RegExp}
             */

            /**
             * Delegates to `on`.
             *
             * @returns {*}
             */

            _createClass(Events, [{
               key: 'bind',
               value: function bind() {
                  return this.on.apply(this, arguments);
               }

               /**
                * Tell an object to listen to a particular event on an other object. The advantage of using this form, instead of
                * other.on(event, callback, object), is that listenTo allows the object to keep track of the events, and they can
                * be removed all at once later on. The callback will always be called with object as context.
                *
                * @example
                * view.listenTo(model, 'change', view.render);
                *
                * @see http://backbonejs.org/#Events-listenTo
                *
                * @param {object}   obj      - Event context
                * @param {string}   name     - Event name(s)
                * @param {function} callback - Event callback function
                * @returns {Events}
                */
            }, {
               key: 'listenTo',
               value: function listenTo(obj, name, callback) {
                  if (!obj) {
                     return this;
                  }
                  var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
                  var listeningTo = this._listeningTo || (this._listeningTo = {});
                  var listening = listeningTo[id];

                  // This object is not listening to any other events on `obj` yet.
                  // Setup the necessary references to track the listening callbacks.
                  if (!listening) {
                     var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
                     listening = listeningTo[id] = { obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0 };
                  }

                  // Bind callbacks on obj, and keep track of them on listening.
                  s_INTERNAL_ON(obj, name, callback, this, listening);
                  return this;
               }

               /**
                * Just like `listenTo`, but causes the bound callback to fire only once before being removed.
                *
                * @see http://backbonejs.org/#Events-listenToOnce
                *
                * @param {object}   obj      - Event context
                * @param {string}   name     - Event name(s)
                * @param {function} callback - Event callback function
                * @returns {Events}
                */
            }, {
               key: 'listenToOnce',
               value: function listenToOnce(obj, name, callback) {
                  // Map the event into a `{event: once}` object.
                  var events = s_EVENTS_API(s_ONCE_MAP, {}, name, callback, _.bind(this.stopListening, this, obj));
                  return this.listenTo(obj, events, void 0);
               }

               /**
                * Remove a previously-bound callback function from an object. If no context is specified, all of the versions of
                * the callback with different contexts will be removed. If no callback is specified, all callbacks for the event
                * will be removed. If no event is specified, callbacks for all events will be removed.
                *
                * Note that calling model.off(), for example, will indeed remove all events on the model — including events that
                * Backbone uses for internal bookkeeping.
                *
                * @example
                * // Removes just the `onChange` callback.
                * object.off("change", onChange);
                *
                * // Removes all "change" callbacks.
                * object.off("change");
                *
                * // Removes the `onChange` callback for all events.
                * object.off(null, onChange);
                *
                * // Removes all callbacks for `context` for all events.
                * object.off(null, null, context);
                *
                * // Removes all callbacks on `object`.
                * object.off();
                *
                * @see http://backbonejs.org/#Events-off
                *
                * @param {string}   name     - Event name(s)
                * @param {function} callback - Event callback function
                * @param {object}   context  - Event context
                * @returns {Events}
                */
            }, {
               key: 'off',
               value: function off(name, callback, context) {
                  /* istanbul ignore if */
                  if (!this._events) {
                     return this;
                  }
                  this._events = s_EVENTS_API(s_OFF_API, this._events, name, callback, { context: context, listeners: this._listeners });
                  return this;
               }

               /**
                * Bind a callback function to an object. The callback will be invoked whenever the event is fired. If you have a
                * large number of different events on a page, the convention is to use colons to namespace them: "poll:start", or
                * "change:selection".
                *
                * To supply a context value for this when the callback is invoked, pass the optional last argument:
                * model.on('change', this.render, this) or model.on({change: this.render}, this).
                *
                * @example
                * The event string may also be a space-delimited list of several events...
                * book.on("change:title change:author", ...);
                *
                * @example
                * Callbacks bound to the special "all" event will be triggered when any event occurs, and are passed the name of
                * the event as the first argument. For example, to proxy all events from one object to another:
                * proxy.on("all", function(eventName) {
                *    object.trigger(eventName);
                * });
                *
                * @example
                * All Backbone event methods also support an event map syntax, as an alternative to positional arguments:
                * book.on({
                *    "change:author": authorPane.update,
                *    "change:title change:subtitle": titleView.update,
                *    "destroy": bookView.remove
                * });
                *
                * @see http://backbonejs.org/#Events-on
                *
                * @param {string}   name     - Event name(s)
                * @param {function} callback - Event callback function
                * @param {object}   context  - Event context
                * @returns {*}
                */
            }, {
               key: 'on',
               value: function on(name, callback, context) {
                  return s_INTERNAL_ON(this, name, callback, context, void 0);
               }

               /**
                * Just like `on`, but causes the bound callback to fire only once before being removed. Handy for saying "the next
                * time that X happens, do this". When multiple events are passed in using the space separated syntax, the event
                * will fire once for every event you passed in, not once for a combination of all events
                *
                * @see http://backbonejs.org/#Events-once
                *
                * @param {string}   name     - Event name(s)
                * @param {function} callback - Event callback function
                * @param {object}   context  - Event context
                * @returns {*}
                */
            }, {
               key: 'once',
               value: function once(name, callback, context) {
                  // Map the event into a `{event: once}` object.
                  var events = s_EVENTS_API(s_ONCE_MAP, {}, name, callback, _.bind(this.off, this));

                  if (typeof name === 'string' && (context === null || typeof context === 'undefined')) {
                     callback = void 0;
                  }

                  return this.on(events, callback, context);
               }

               /**
                * Tell an object to stop listening to events. Either call stopListening with no arguments to have the object remove
                * all of its registered callbacks ... or be more precise by telling it to remove just the events it's listening to
                * on a specific object, or a specific event, or just a specific callback.
                *
                * @example
                * view.stopListening();
                *
                * view.stopListening(model);
                *
                * @see http://backbonejs.org/#Events-stopListening
                *
                * @param {object}   obj      - Event context
                * @param {string}   name     - Event name(s)
                * @param {function} callback - Event callback function
                * @returns {Events}
                */
            }, {
               key: 'stopListening',
               value: function stopListening(obj, name, callback) {
                  var listeningTo = this._listeningTo;
                  if (!listeningTo) {
                     return this;
                  }

                  var ids = obj ? [obj._listenId] : _.keys(listeningTo);

                  for (var i = 0; i < ids.length; i++) {
                     var listening = listeningTo[ids[i]];

                     // If listening doesn't exist, this object is not currently listening to obj. Break out early.
                     if (!listening) {
                        break;
                     }

                     listening.obj.off(name, callback, this);
                  }

                  return this;
               }

               /**
                * Trigger callbacks for the given event, or space-delimited list of events. Subsequent arguments to trigger will be
                * passed along to the event callbacks.
                *
                * @see http://backbonejs.org/#Events-trigger
                *
                * @param {string}   name  - Event name(s)
                * @returns {Events}
                */
            }, {
               key: 'trigger',
               value: function trigger(name) {
                  /* istanbul ignore if */
                  if (!this._events) {
                     return this;
                  }

                  var length = Math.max(0, arguments.length - 1);
                  var args = new Array(length);

                  for (var i = 0; i < length; i++) {
                     args[i] = arguments[i + 1];
                  }

                  s_EVENTS_API(s_TRIGGER_API, this._events, name, void 0, args);

                  return this;
               }

               /**
                * Delegates to `off`.
                *
                * @returns {*}
                */
            }, {
               key: 'unbind',
               value: function unbind() {
                  return this.off.apply(this, arguments);
               }
            }]);

            return Events;
         })();

         _export('default', Events);

         s_EVENT_SPLITTER = /\s+/;

         /**
          * Iterates over the standard `event, callback` (as well as the fancy multiple space-separated events `"change blur",
          * callback` and jQuery-style event maps `{event: callback}`).
          *
          * @param {function} iteratee    - Event operation to invoke.
          * @param {Object.<{callback: function, context: object, ctx: object, listening:{}}>} events - Events object
          * @param {string|object} name   - A single event name, compound event names, or a hash of event names.
          * @param {function} callback    - Event callback function
          * @param {object}   opts        - Optional parameters
          * @returns {*}
          */

         s_EVENTS_API = function s_EVENTS_API(iteratee, events, name, callback, opts) {
            var i = 0,
                names = undefined;
            if (name && typeof name === 'object') {
               // Handle event maps.
               if (callback !== void 0 && 'context' in opts && opts.context === void 0) {
                  opts.context = callback;
               }
               for (names = _.keys(name); i < names.length; i++) {
                  events = s_EVENTS_API(iteratee, events, names[i], name[names[i]], opts);
               }
            } else if (name && s_EVENT_SPLITTER.test(name)) {
               // Handle space-separated event names by delegating them individually.
               for (names = name.split(s_EVENT_SPLITTER); i < names.length; i++) {
                  events = iteratee(events, names[i], callback, opts);
               }
            } else {
               // Finally, standard events.
               events = iteratee(events, name, callback, opts);
            }
            return events;
         };

         /**
          * Guard the `listening` argument from the public API.
          *
          * @param {Events}   obj      - The Events instance
          * @param {string}   name     - Event name
          * @param {function} callback - Event callback
          * @param {object}   context  - Event context
          * @param {Object.<{obj: object, objId: string, id: string, listeningTo: object, count: number}>} listening -
          *                              Listening object
          * @returns {*}
          */

         s_INTERNAL_ON = function s_INTERNAL_ON(obj, name, callback, context, listening) {
            obj._events = s_EVENTS_API(s_ON_API, obj._events || {}, name, callback, { context: context, ctx: obj, listening: listening });

            if (listening) {
               var listeners = obj._listeners || (obj._listeners = {});
               listeners[listening.id] = listening;
            }

            return obj;
         };

         /**
          * The reducing API that removes a callback from the `events` object.
          *
          * @param {Object.<{callback: function, context: object, ctx: object, listening:{}}>} events - Events object
          * @param {string}   name     - Event name
          * @param {function} callback - Event callback
          * @param {object}   options  - Optional parameters
          * @returns {*}
          */

         s_OFF_API = function s_OFF_API(events, name, callback, options) {
            if (!events) {
               return;
            }

            var i = 0,
                listening = undefined;
            var context = options.context,
                listeners = options.listeners;

            // Delete all events listeners and "drop" events.
            if (!name && !callback && !context) {
               var ids = _.keys(listeners);
               for (; i < ids.length; i++) {
                  listening = listeners[ids[i]];
                  delete listeners[listening.id];
                  delete listening.listeningTo[listening.objId];
               }
               return;
            }

            var names = name ? [name] : _.keys(events);
            for (; i < names.length; i++) {
               name = names[i];
               var handlers = events[name];

               // Bail out if there are no events stored.
               /* istanbul ignore if */
               if (!handlers) {
                  break;
               }

               // Replace events if there are any remaining.  Otherwise, clean up.
               var remaining = [];
               for (var j = 0; j < handlers.length; j++) {
                  var handler = handlers[j];
                  if (callback && callback !== handler.callback && callback !== handler.callback._callback || context && context !== handler.context) {
                     remaining.push(handler);
                  } else {
                     listening = handler.listening;
                     if (listening && --listening.count === 0) {
                        delete listeners[listening.id];
                        delete listening.listeningTo[listening.objId];
                     }
                  }
               }

               // Update tail event if the list has any events.  Otherwise, clean up.
               if (remaining.length) {
                  events[name] = remaining;
               } else {
                  delete events[name];
               }
            }

            return events;
         };

         /**
          * The reducing API that adds a callback to the `events` object.
          *
          * @param {Object.<{callback: function, context: object, ctx: object, listening:{}}>} events - Events object
          * @param {string}   name     - Event name
          * @param {function} callback - Event callback
          * @param {object}   options  - Optional parameters
          * @returns {*}
          */

         s_ON_API = function s_ON_API(events, name, callback, options) {
            if (callback) {
               var handlers = events[name] || (events[name] = []);
               var context = options.context,
                   ctx = options.ctx,
                   listening = options.listening;

               if (listening) {
                  listening.count++;
               }

               handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
            }
            return events;
         };

         /**
          * Reduces the event callbacks into a map of `{event: onceWrapper}`. `offer` unbinds the `onceWrapper` after
          * it has been called.
          *
          * @param {Object.<{callback: function, context: object, ctx: object, listening:{}}>} map - Events object
          * @param {string}   name     - Event name
          * @param {function} callback - Event callback
          * @param {function} offer    - Function to invoke after event has been triggered once; `off()`
          * @returns {*}
          */

         s_ONCE_MAP = function s_ONCE_MAP(map, name, callback, offer) {
            if (callback) {
               (function () {
                  var once = map[name] = _.once(function () {
                     offer(name, once);
                     callback.apply(this, arguments);
                  });
                  once._callback = callback;
               })();
            }
            return map;
         };

         /**
          * Handles triggering the appropriate event callbacks.
          *
          * @param {Object.<{callback: function, context: object, ctx: object, listening:{}}>} objEvents - Events object
          * @param {string}   name  - Event name
          * @param {function} callback - Event callback
          * @param {Array<*>} args  - Event arguments
          * @returns {*}
          */

         s_TRIGGER_API = function s_TRIGGER_API(objEvents, name, callback, args) {
            if (objEvents) {
               var events = objEvents[name];
               var allEvents = objEvents.all;
               if (events && allEvents) {
                  allEvents = allEvents.slice();
               }
               if (events) {
                  s_TRIGGER_EVENTS(events, args);
               }
               if (allEvents) {
                  s_TRIGGER_EVENTS(allEvents, [name].concat(args));
               }
            }
            return objEvents;
         };

         /**
          * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
          * cases speedy (most internal Backbone events have 3 arguments).
          *
          * @param {Object.<{callback: function, context: object, ctx: object, listening:{}}>}  events - events array
          * @param {Array<*>} args - event argument array
          */

         s_TRIGGER_EVENTS = function s_TRIGGER_EVENTS(events, args) {
            var ev = undefined,
                i = -1;
            var a1 = args[0],
                a2 = args[1],
                a3 = args[2],
                l = events.length;

            switch (args.length) {
               case 0:
                  while (++i < l) {
                     (ev = events[i]).callback.call(ev.ctx);
                  }
                  return;
               case 1:
                  while (++i < l) {
                     (ev = events[i]).callback.call(ev.ctx, a1);
                  }
                  return;
               case 2:
                  while (++i < l) {
                     (ev = events[i]).callback.call(ev.ctx, a1, a2);
                  }
                  return;
               case 3:
                  while (++i < l) {
                     (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                  }
                  return;
               default:
                  while (++i < l) {
                     (ev = events[i]).callback.apply(ev.ctx, args);
                  }
                  return;
            }
         };
      }
   };
});

$__System.register('63', ['4', '5', '6', '8', '9', 'a', 'e'], function (_export) {
  var _classCallCheck, BackboneProxy, _, _get, _inherits, _createClass, Events, View, s_DELEGATE_EVENT_SPLITTER, s_VIEW_OPTIONS;

  return {
    setters: [function (_4) {
      _classCallCheck = _4['default'];
    }, function (_6) {
      BackboneProxy = _6['default'];
    }, function (_5) {
      _ = _5['default'];
    }, function (_2) {
      _get = _2['default'];
    }, function (_3) {
      _inherits = _3['default'];
    }, function (_a) {
      _createClass = _a['default'];
    }, function (_e) {
      Events = _e['default'];
    }],
    execute: function () {

      /**
       * Backbone.View - Represents a logical chunk of UI in the DOM. (http://backbonejs.org/#View)
       * -------------
       *
       * Backbone Views are almost more convention than they are actual code. A View is simply a JavaScript object that
       * represents a logical chunk of UI in the DOM. This might be a single item, an entire list, a sidebar or panel, or
       * even the surrounding frame which wraps your whole app. Defining a chunk of UI as a **View** allows you to define
       * your DOM events declaratively, without having to worry about render order ... and makes it easy for the view to
       * react to specific changes in the state of your models.
       *
       * Creating a Backbone.View creates its initial element outside of the DOM, if an existing element is not provided...
       *
       * Example if working with Backbone as ES6 source:
       * @example
       *
       * import Backbone from 'backbone';
       *
       * export default class MyView extends Backbone.View
       * {
       *    constructor(options)
       *    {
       *       super(options);
       *       ...
       *    }
       *
       *    initialize()
       *    {
       *       ...
       *    }
       *    ...
       * }
       *
       * @example
       *
       * To use a custom $el / element define it by a getter method:
       *
       *    get el() { return 'my-element'; }
       *
       * Likewise with events define it by a getter method:
       *
       *    get events()
       *    {
       *       return {
       *         'submit form.login-form': 'logIn',
       *         'click .sign-up': 'signUp',
       *         'click .forgot-password': 'forgotPassword'
       *       }
       *    }
       */
      'use strict';

      View = (function (_Events) {
        _inherits(View, _Events);

        _createClass(View, [{
          key: 'tagName',

          /**
           * The default `tagName` of a View's element is `"div"`.
           *
           * @returns {string}
           */
          get: function get() {
            return 'div';
          }

          /**
           * There are several special options that, if passed, will be attached directly to the view: model, collection, el,
           * id, className, tagName, attributes and events. If the view defines an initialize function, it will be called when
           * the view is first created. If you'd like to create a view that references an element already in the DOM, pass in
           * the element as an option: new View({el: existingElement})
           *
           * @see http://backbonejs.org/#View-constructor
           *
           * @param {object} options - Default options which are mixed into this class as properties via `_.pick` against
           *                           s_VIEW_OPTIONS. Options also is passed onto the `initialize()` function.
           */
        }]);

        function View(options) {
          _classCallCheck(this, View);

          _get(Object.getPrototypeOf(View.prototype), 'constructor', this).call(this);

          /**
           * Client ID
           * @type {number}
           */
          this.cid = _.uniqueId('view');

          _.extend(this, _.pick(options, s_VIEW_OPTIONS));

          this._ensureElement();
          this.initialize.apply(this, arguments);
        }

        // Private / internal methods ---------------------------------------------------------------------------------------

        /**
         * Cached regex to split keys for `delegate`.
         * @type {RegExp}
         */

        /**
         * If jQuery is included on the page, each view has a $ function that runs queries scoped within the view's element.
         * If you use this scoped jQuery function, you don't have to use model ids as part of your query to pull out specific
         * elements in a list, and can rely much more on HTML class attributes. It's equivalent to running:
         * view.$el.find(selector)
         *
         * @see https://api.jquery.com/find/
         *
         * @example
         * class Chapter extends Backbone.View {
         *    serialize() {
         *       return {
         *          title: this.$(".title").text(),
         *          start: this.$(".start-page").text(),
         *          end:   this.$(".end-page").text()
         *       };
         *    }
         * }
         *
         * @see http://backbonejs.org/#View-dollar
         * @see https://api.jquery.com/find/
         *
         * @param {string}   selector - A string containing a selector expression to match elements against.
         * @returns {Element|$}
         */

        _createClass(View, [{
          key: '$',
          value: function $(selector) {
            return this.$el.find(selector);
          }

          /**
           * Produces a DOM element to be assigned to your view. Exposed for subclasses using an alternative DOM
           * manipulation API.
           *
           * @protected
           * @param {string}   tagName  - Name of the tag element to create.
           * @returns {Element}
           *
           * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
           */
        }, {
          key: '_createElement',
          value: function _createElement(tagName) {
            return document.createElement(tagName);
          }

          /**
           * Add a single event listener to the view's element (or a child element using `selector`). This only works for
           * delegate-able events: not `focus`, `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
           *
           * @see http://backbonejs.org/#View-delegateEvents
           * @see http://api.jquery.com/on/
           *
           * @param {string}   eventName   - One or more space-separated event types and optional namespaces.
           * @param {string}   selector    - A selector string to filter the descendants of the selected elements that trigger
           *                                 the event.
           * @param {function} listener    - A function to execute when the event is triggered.
           * @returns {View}
           */
        }, {
          key: 'delegate',
          value: function delegate(eventName, selector, listener) {
            this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
            return this;
          }

          /**
           * Uses jQuery's on function to provide declarative callbacks for DOM events within a view. If an events hash is not
           * passed directly, uses this.events as the source. Events are written in the format {"event selector": "callback"}.
           * The callback may be either the name of a method on the view, or a direct function body. Omitting the selector
           * causes the event to be bound to the view's root element (this.el). By default, delegateEvents is called within
           * the View's constructor for you, so if you have a simple events hash, all of your DOM events will always already
           * be connected, and you will never have to call this function yourself.
           *
           * The events property may also be defined as a function that returns an events hash, to make it easier to
           * programmatically define your events, as well as inherit them from parent views.
           *
           * Using delegateEvents provides a number of advantages over manually using jQuery to bind events to child elements
           * during render. All attached callbacks are bound to the view before being handed off to jQuery, so when the
           * callbacks are invoked, this continues to refer to the view object. When delegateEvents is run again, perhaps with
           * a different events hash, all callbacks are removed and delegated afresh — useful for views which need to behave
           * differently when in different modes.
           *
           * A single-event version of delegateEvents is available as delegate. In fact, delegateEvents is simply a multi-event
           * wrapper around delegate. A counterpart to undelegateEvents is available as undelegate.
           *
           * Callbacks will be bound to the view, with `this` set properly. Uses event delegation for efficiency.
           * Omitting the selector binds the event to `this.el`.
           *
           * @example
           * Older `extend` example:
           * var DocumentView = Backbone.View.extend({
           *    events: {
           *       "dblclick"                : "open",
           *       "click .icon.doc"         : "select",
           *       "contextmenu .icon.doc"   : "showMenu",
           *       "click .show_notes"       : "toggleNotes",
           *       "click .title .lock"      : "editAccessLevel",
           *       "mouseover .title .date"  : "showTooltip"
           *    },
           *
           *    render: function() {
           *       this.$el.html(this.template(this.model.attributes));
           *       return this;
           *    },
           *
           *    open: function() {
           *       window.open(this.model.get("viewer_url"));
           *    },
           *
           *    select: function() {
           *       this.model.set({selected: true});
           *    },
           *
           *   ...
           * });
           *
           * @example
           * Converting the above `extend` example to ES6:
           * class DocumentView extends Backbone.View {
           *    get events() {
           *       return {
           *          "dblclick"                : "open",
           *          "click .icon.doc"         : "select",
           *          "contextmenu .icon.doc"   : "showMenu",
           *          "click .show_notes"       : "toggleNotes",
           *          "click .title .lock"      : "editAccessLevel",
           *          "mouseover .title .date"  : "showTooltip"
           *       };
           *    }
           *
           *    render() {
           *       this.$el.html(this.template(this.model.attributes));
           *       return this;
           *    }
           *
           *    open() {
           *       window.open(this.model.get("viewer_url"));
           *    }
           *
           *    select() {
           *       this.model.set({selected: true});
           *    }
           *    ...
           * }
           *
           * @see http://backbonejs.org/#View-delegateEvents
           * @see http://api.jquery.com/on/
           *
           * @param {object}   events   - hash of event descriptions to bind.
           * @returns {View}
           */
        }, {
          key: 'delegateEvents',
          value: function delegateEvents(events) {
            events = events || _.result(this, 'events');
            if (!events) {
              return this;
            }
            this.undelegateEvents();
            for (var key in events) {
              var method = events[key];
              if (!_.isFunction(method)) {
                method = this[method];
              }
              if (!method) {
                continue;
              }
              var match = key.match(s_DELEGATE_EVENT_SPLITTER);
              this.delegate(match[1], match[2], _.bind(method, this));
            }
            return this;
          }

          /**
           * Ensure that the View has a DOM element to render into. If `this.el` is a string, pass it through `$()`, take
           * the first matching element, and re-assign it to `el`. Otherwise, create an element from the `id`, `className`
           * and `tagName` properties.
           *
           * @protected
           */
        }, {
          key: '_ensureElement',
          value: function _ensureElement() {
            if (!this.el) {
              var attrs = _.extend({}, _.result(this, 'attributes'));
              if (this.id) {
                attrs.id = _.result(this, 'id');
              }
              if (this.className) {
                attrs['class'] = _.result(this, 'className');
              }
              this.setElement(this._createElement(_.result(this, 'tagName')));
              this._setAttributes(attrs);
            } else {
              this.setElement(_.result(this, 'el'));
            }
          }

          /**
           * Initialize is an empty function by default. Override it with your own initialization logic.
           *
           * @see http://backbonejs.org/#View-constructor
           * @abstract
           */
        }, {
          key: 'initialize',
          value: function initialize() {}

          /**
           * Removes a view and its el from the DOM, and calls stopListening to remove any bound events that the view has
           * listenTo'd.
           *
           * @see http://backbonejs.org/#View-remove
           * @see {@link _removeElement}
           * @see {@link stopListening}
           *
           * @returns {View}
           */
        }, {
          key: 'remove',
          value: function remove() {
            this._removeElement();
            this.stopListening();
            return this;
          }

          /**
           * Remove this view's element from the document and all event listeners attached to it. Exposed for subclasses
           * using an alternative DOM manipulation API.
           *
           * @protected
           * @see https://api.jquery.com/remove/
           */
        }, {
          key: '_removeElement',
          value: function _removeElement() {
            this.$el.remove();
          }

          /**
           * The default implementation of render is a no-op. Override this function with your code that renders the view
           * template from model data, and updates this.el with the new HTML. A good convention is to return this at the end
           * of render to enable chained calls.
           *
           * Backbone is agnostic with respect to your preferred method of HTML templating. Your render function could even
           * munge together an HTML string, or use document.createElement to generate a DOM tree. However, we suggest choosing
           * a nice JavaScript templating library. Mustache.js, Haml-js, and Eco are all fine alternatives. Because
           * Underscore.js is already on the page, _.template is available, and is an excellent choice if you prefer simple
           * interpolated-JavaScript style templates.
           *
           * Whatever templating strategy you end up with, it's nice if you never have to put strings of HTML in your
           * JavaScript. At DocumentCloud, we use Jammit in order to package up JavaScript templates stored in /app/views as
           * part of our main core.js asset package.
           *
           * @example
           * class Bookmark extends Backbone.View {
           *    get template() { return _.template(...); }
           *
           *    render() {
           *       this.$el.html(this.template(this.model.attributes));
           *       return this;
           *    }
           * }
           *
           * @see http://backbonejs.org/#View-render
           *
           * @abstract
           * @returns {View}
           */
        }, {
          key: 'render',
          value: function render() {
            return this;
          }

          /**
           * Set attributes from a hash on this view's element.  Exposed for subclasses using an alternative DOM
           * manipulation API.
           *
           * @protected
           * @param {object}   attributes - An object defining attributes to associate with `this.$el`.
           */
        }, {
          key: '_setAttributes',
          value: function _setAttributes(attributes) {
            this.$el.attr(attributes);
          }

          /**
           * Creates the `this.el` and `this.$el` references for this view using the given `el`. `el` can be a CSS selector
           * or an HTML string, a jQuery context or an element. Subclasses can override this to utilize an alternative DOM
           * manipulation API and are only required to set the `this.el` property.
           *
           * @protected
           * @param {string|object}  el - A CSS selector or an HTML string, a jQuery context or an element.
           */
        }, {
          key: '_setElement',
          value: function _setElement(el) {
            /**
             * Cached jQuery context for element.
             * @type {object}
             */
            this.$el = el instanceof BackboneProxy.backbone.$ ? el : BackboneProxy.backbone.$(el);

            /**
             * Cached element
             * @type {Element}
             */
            this.el = this.$el[0];
          }

          /**
           * If you'd like to apply a Backbone view to a different DOM element, use setElement, which will also create the
           * cached $el reference and move the view's delegated events from the old element to the new one.
           *
           * @see http://backbonejs.org/#View-setElement
           * @see {@link undelegateEvents}
           * @see {@link _setElement}
           * @see {@link delegateEvents}
           *
           * @param {string|object}  element  - A CSS selector or an HTML string, a jQuery context or an element.
           * @returns {View}
           */
        }, {
          key: 'setElement',
          value: function setElement(element) {
            this.undelegateEvents();
            this._setElement(element);
            this.delegateEvents();
            return this;
          }

          /**
           * A finer-grained `undelegateEvents` for removing a single delegated event. `selector` and `listener` are
           * both optional.
           *
           * @see http://backbonejs.org/#View-undelegateEvents
           * @see http://api.jquery.com/off/
           *
           * @param {string}   eventName   - One or more space-separated event types and optional namespaces.
           * @param {string}   selector    - A selector which should match the one originally passed to `.delegate()`.
           * @param {function} listener    - A handler function previously attached for the event(s).
           * @returns {View}
           */
        }, {
          key: 'undelegate',
          value: function undelegate(eventName, selector, listener) {
            this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
            return this;
          }

          /**
           * Removes all of the view's delegated events. Useful if you want to disable or remove a view from the DOM
           * temporarily.
           *
           * @see http://backbonejs.org/#View-undelegateEvents
           * @see http://api.jquery.com/off/
           *
           * @returns {View}
           */
        }, {
          key: 'undelegateEvents',
          value: function undelegateEvents() {
            if (this.$el) {
              this.$el.off('.delegateEvents' + this.cid);
            }
            return this;
          }
        }]);

        return View;
      })(Events);

      _export('default', View);

      s_DELEGATE_EVENT_SPLITTER = /^(\S+)\s*(.*)$/;

      /**
       * List of view options to be set as properties.
       * @type {string[]}
       */
      s_VIEW_OPTIONS = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
    }
  };
});

$__System.register('5', [], function (_export) {
  /**
   * BackboneProxy -- Provides a proxy for the actual created Backbone instance. This is initialized in the constructor
   * for Backbone (backbone-es6/src/Backbone.js). Anywhere a reference is needed for the composed Backbone instance
   * import BackboneProxy and access it by "BackboneProxy.backbone".
   *
   * @example
   * import BackboneProxy from 'backbone-es6/src/BackboneProxy.js';
   *
   * BackboneProxy.backbone.sync(...)
   */

  'use strict';

  /**
   * Defines a proxy Object to hold a reference of the Backbone object instantiated.
   *
   * @type {{backbone: null}}
   */
  var BackboneProxy;
  return {
    setters: [],
    execute: function () {
      BackboneProxy = {
        backbone: null
      };

      _export('default', BackboneProxy);
    }
  };
});

$__System.register('d', ['4', 'a'], function (_export) {
   var _classCallCheck, _createClass, s_DEBUG_LOG, s_DEBUG_TRACE, Debug;

   return {
      setters: [function (_) {
         _classCallCheck = _['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }],
      execute: function () {
         'use strict';

         s_DEBUG_LOG = false;
         s_DEBUG_TRACE = false;

         /* eslint-disable no-console */

         /**
          * Debug.js - Provides basic logging functionality that can be turned on via setting s_DEBUG_LOG = true;
          *
          * This is temporary until stability is fully tested.
          */

         Debug = (function () {
            function Debug() {
               _classCallCheck(this, Debug);
            }

            _createClass(Debug, null, [{
               key: 'log',

               /**
                * Posts a log message to console.
                *
                * @param {string}   message  - A message to log
                * @param {boolean}  trace    - A boolean indicating whether to also log `console.trace()`
                */
               value: function log(message) {
                  var trace = arguments.length <= 1 || arguments[1] === undefined ? s_DEBUG_TRACE : arguments[1];

                  if (s_DEBUG_LOG) {
                     console.log(message);
                  }

                  if (s_DEBUG_LOG && trace) {
                     console.trace();
                  }
               }
            }]);

            return Debug;
         })();

         _export('default', Debug);
      }
   };
});

$__System.register('64', ['5', '6', 'd'], function (_export) {

   /**
    * parseSync - Persists models to the server. (http://backbonejs.org/#Sync)
    * ---------
    *
    * This version of sync uses Parse 1.6+ and ParseObject for Backbone.Model or Parse.Query for Backbone.Collections. You
    * will be passed back a ParsePromise and can use it in a similar manner as one would with Parse SDK itself.
    *
    * Dispatches to Model or Collection sync methods.
    *
    * @param {string}            method   - A string that defines the synchronization action to perform.
    * @param {Model|Collection}  model    - The model or collection instance to synchronize.
    * @param {object}            options  - Optional parameters.
    * @returns {*|ParsePromise}
    */
   'use strict';

   var BackboneProxy, _, Debug, syncCollection, syncModel;

   // Private / internal methods ---------------------------------------------------------------------------------------

   /**
    * Syncs a Backbone.Collection via an associated Parse.Query.
    *
    * @param {string}      method      - A string that defines the synchronization action to perform.
    * @param {Collection}  collection  - The model or collection instance to synchronize.
    * @param {object}      options     - Optional parameters
    * @returns {*|ParsePromise}
    */

   _export('default', parseSync);

   function parseSync(method, model, options) {
      if (model instanceof BackboneProxy.backbone.Model) {
         return syncModel(method, model, options);
      } else if (model instanceof BackboneProxy.backbone.Collection) {
         return syncCollection(method, model, options);
      } else {
         throw new TypeError('sync - unknown model type.');
      }
   }

   return {
      setters: [function (_3) {
         BackboneProxy = _3['default'];
      }, function (_2) {
         _ = _2['default'];
      }, function (_d) {
         Debug = _d['default'];
      }],
      execute: function () {
         syncCollection = function syncCollection(method, collection, options) {
            Debug.log('sync - syncCollection - 0 - method: ' + method + '; collection.query: ' + collection.query.toJSON(), true);

            switch (method) {
               case 'create':
               case 'delete':
               case 'patch':
               case 'update':
                  throw new Error('syncCollection - unsupported method: ' + method);

               case 'read':
                  Debug.log('sync - sync(Collection) -- read');

                  if (_.isUndefined(collection.query) || collection.query === null) {
                     throw new Error('syncCollection - collection.query is undefined or null.');
                  }

                  return collection.query.find(options);
            }
         };

         /**
          * Syncs a Backbone.Model via the associated Parse.Object.
          *
          * @param {string}   method   - A string that defines the synchronization action to perform.
          * @param {Model}    model    - The model instance to synchronize.
          * @param {object}   options  - Optional parameters
          * @returns {*|ParsePromise}
          */

         syncModel = function syncModel(method, model, options) {
            Debug.log('sync - syncModel - 0 - method: ' + method, true);

            if (_.isUndefined(model.parseObject) || model.parseObject === null) {
               throw new Error('syncModel - model.parseObject is undefined or null.');
            }

            switch (method) {
               case 'create':
                  return model.parseObject.save(null, options);

               case 'delete':
                  return model.parseObject.destroy(options);

               case 'patch':
                  return model.parseObject.save(null, options);

               case 'read':
                  return model.parseObject.fetch(options);

               case 'update':
                  return model.parseObject.save(null, options);
            }
         };
      }
   };
});

$__System.register('65', ['6'], function (_export) {

   /**
    * Provides older "extend" functionality for Backbone. While it is still accessible it is recommended
    * to adopt the new Backbone-ES6 patterns and ES6 sub-classing via "extends".
    *
    * Helper function to correctly set up the prototype chain for subclasses. Similar to `goog.inherits`, but uses a hash
    * of prototype properties and class properties to be extended.
    *
    * @see http://backbonejs.org/#Collection-extend
    * @see http://backbonejs.org/#Model-extend
    * @see http://backbonejs.org/#Router-extend
    * @see http://backbonejs.org/#View-extend
    *
    * @param {object}   protoProps  - instance properties
    * @param {object}   staticProps - class properties
    * @returns {*}      Subclass of parent class.
    */
   'use strict';

   var _;

   _export('default', extend);

   function extend(protoProps, staticProps) {
      var parent = this;
      var child = undefined;

      // The constructor function for the new subclass is either defined by you (the "constructor" property in your
      // `extend` definition), or defaulted by us to simply call the parent constructor.
      if (protoProps && _.has(protoProps, 'constructor')) {
         child = protoProps.constructor;
      } else {
         child = function () {
            return parent.apply(this, arguments);
         };
      }

      // Add static properties to the constructor function, if supplied.
      _.extend(child, parent, staticProps);

      // Set the prototype chain to inherit from `parent`, without calling
      // `parent`'s constructor function and add the prototype properties.
      child.prototype = _.create(parent.prototype, protoProps);
      child.prototype.constructor = child;

      // backbone-es6 addition: Because View defines a getter for tagName we must actually redefine this getter
      // from the `protoProps.tagName` if it exists.
      if (protoProps && protoProps.tagName) {
         Object.defineProperty(child.prototype, 'tagName', { get: function get() {
               return protoProps.tagName;
            } });
      }

      // Set a convenience property in case the parent's prototype is needed later.
      child.__super__ = parent.prototype;

      return child;
   }

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }],
      execute: function () {}
   };
});

$__System.register('66', ['65'], function (_export) {

   /**
    * Provides extend functionality for Model that is compatible to the Parse SDK.
    *
    * @param {string|object}  className   - Class name or object hash w/ className key
    * @param {object}         protoProps  - instance properties
    * @param {object}         staticProps - class properties
    * @returns {*}            Subclass of parent class.
    */
   'use strict';

   var extend;

   _export('default', modelExtend);

   function modelExtend(_x, _x2, _x3) {
      var _this = this;

      var _again = true;

      _function: while (_again) {
         var className = _x,
             protoProps = _x2,
             staticProps = _x3;
         _again = false;

         if (typeof className !== 'string') {
            if (className && typeof className.className === 'string') {
               _x = className.className;
               _x2 = className;
               _x3 = protoProps;
               _again = true;
               continue _function;
            } else {
               throw new Error('(Parse) Backbone.Model.extend - the first argument should be the className.');
            }
         }

         var child = extend.call(_this, protoProps, staticProps);

         child.className = className;

         return child;
      }
   }

   return {
      setters: [function (_) {
         extend = _['default'];
      }],
      execute: function () {}
   };
});

$__System.register('67', ['6', '47', '49', '65', '66'], function (_export) {

   // Add HTTPS image fetch substitution to Parse.Object ---------------------------------------------------------------

   /**
    * It turns out that we can get an HTTPS link from S3 for any given parse file URL by string substitution.
    *
    * @param {string}   key   - Attribute key
    * @returns {XML|string|void}
    */
   'use strict';

   var _, Parse, Utils, extend, modelExtend, s_PARSE_OBJECT_CLASS_MAP, s_FIX_ISSUE5_DESERIALIZATION;

   /**
    * Stores subclass information registered with Parse.Object.
    * @type {{}}
    */

   _export('default', parseExtend);

   /**
    * Provides support for older "extend" functionality in addition to adding a utility
    * method, "getHTTPSUrl" to retrieve an HTTPS url for Parse.Object and Backbone.Model.
    *
    * @param {Backbone} Backbone - Backbone instance
    */

   function parseExtend(Backbone) {
      // Set up inheritance for the model, collection, router, view and history.
      Backbone.Model.extend = modelExtend;

      Backbone.Collection.extend = Backbone.Router.extend = Backbone.View.extend = Backbone.History.extend = extend;

      // Add HTTPS image fetch substitution to Backbone.Model -------------------------------------------------------------

      /**
       * It turns out that we can get an HTTPS link from S3 for any given parse file URL by string substitution.
       *
       * @param {string}   key   - Attribute key
       * @returns {XML|string|void}
       */
      Backbone.Model.prototype.getHTTPSUrl = function (key) {
         var urlRequest = this.get(key);

         if (!_.isUndefined(urlRequest) && urlRequest !== null && !_.isUndefined(urlRequest.url)) {
            return urlRequest.url().replace('http://files.parsetfss.com/', 'https://s3.amazonaws.com/files.parsetfss.com/');
         }
      };
      // Various fixes for Backbone / Parse integration -------------------------------------------------------------------

      s_FIX_ISSUE5_DESERIALIZATION(Backbone);
   }

   return {
      setters: [function (_3) {
         _ = _3['default'];
      }, function (_2) {
         Parse = _2['default'];
      }, function (_6) {
         Utils = _6['default'];
      }, function (_4) {
         extend = _4['default'];
      }, function (_5) {
         modelExtend = _5['default'];
      }],
      execute: function () {
         Parse.Object.prototype.getHTTPSUrl = function (key) {
            var urlRequest = this.get(key);

            if (!_.isUndefined(urlRequest) && urlRequest !== null && !_.isUndefined(urlRequest.url)) {
               return urlRequest.url().replace('http://files.parsetfss.com/', 'https://s3.amazonaws.com/files.parsetfss.com/');
            }
         };s_PARSE_OBJECT_CLASS_MAP = {};

         /**
          * Fixes backbone-parse-es6 issue #5 - https://github.com/typhonjs-backbone-parse/backbone-parse-es6/issues/5
          *
          * It's necessary to override Parse.Object.fromJSON to support proper deserialization.
          *
          * It should be noted that ParseModel now supports a `subClasses` getter which defines an object hash of an associated
          * className with the constructor / class to associate. By adding this to your ParseModel / Backbone.Model classes
          * this will automatically register them with `Parse.Object.registerSubclass`.
          *
          * For a test suite please see:
          * https://github.com/typhonjs-demos-test/typhonjs-issues-demos/tree/master/repos/backbone-parse-es6/src/issue5
          *
          * @param {object}   Backbone - Backbone instance
          */

         s_FIX_ISSUE5_DESERIALIZATION = function s_FIX_ISSUE5_DESERIALIZATION(Backbone) {
            /**
             * Override `getSubclass` as it is referenced in `fromJSON`.
             *
             * @param {string}   className - Parse.Object className / table ID.
             *
             * @returns {*}
             */
            Parse.Object.getSubclass = function (className) {
               if (typeof className !== 'string') {
                  throw new TypeError('The first argument must be a valid class name.');
               }

               return s_PARSE_OBJECT_CLASS_MAP[className];
            };

            /**
             * Override `registerSubclass` as it needs to use `s_PARSE_OBJECT_CLASS_MAP` above.
             *
             * @param {string}   className - Parse.Object className / table ID.
             * @param {function} constructor - Class / constructor to register as a subclass.
             */
            Parse.Object.registerSubclass = function (className, constructor) {
               if (typeof className !== 'string') {
                  throw new TypeError('The first argument must be a valid class name.');
               }

               if (typeof constructor === 'undefined') {
                  throw new TypeError('You must supply a subclass constructor.');
               }

               if (typeof constructor !== 'function') {
                  throw new TypeError('You must register the subclass constructor. Did you attempt to register an instance of the subclass?');
               }

               s_PARSE_OBJECT_CLASS_MAP[className] = constructor;

               if (!constructor.className) {
                  constructor.className = className;
               }
            };

            /**
             * Override `fromJSON` to check constructor. If it is a type of `Backbone.Model` then construct it as a `ParseModel`
             * passing in the associated `Parse.Object` otherwise just return the `Parse.Object`.
             *
             * @param {object}   json - JSON object
             *
             * @returns {*}
             */
            Parse.Object.fromJSON = function (json) {
               if (!json.className) {
                  throw new Error('Cannot create an object without a className');
               }

               var constructor = Parse.Object.getSubclass(json.className);
               var parseObject = new Parse.Object(json.className);
               var otherAttributes = {};

               for (var attr in json) {
                  if (attr !== 'className' && attr !== '__type') {
                     otherAttributes[attr] = json[attr];
                  }
               }

               parseObject._finishFetch(otherAttributes);

               if (json.objectId) {
                  parseObject._setExisted(true);
               }

               return constructor && Utils.isTypeOf(constructor, Backbone.Model) ? new constructor({}, { parseObject: parseObject }) : parseObject;
            };
         };
      }
   };
});

$__System.registerDynamic("37", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $Object = Object;
  module.exports = {
    create: $Object.create,
    getProto: $Object.getPrototypeOf,
    isEnum: {}.propertyIsEnumerable,
    getDesc: $Object.getOwnPropertyDescriptor,
    setDesc: $Object.defineProperty,
    setDescs: $Object.defineProperties,
    getKeys: $Object.keys,
    getNames: $Object.getOwnPropertyNames,
    getSymbols: $Object.getOwnPropertySymbols,
    each: [].forEach
  };
  return module.exports;
});

$__System.registerDynamic("68", ["37"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var $ = $__require('37');
  module.exports = function defineProperty(it, key, desc) {
    return $.setDesc(it, key, desc);
  };
  return module.exports;
});

$__System.registerDynamic("69", ["68"], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  module.exports = {
    "default": $__require('68'),
    __esModule: true
  };
  return module.exports;
});

$__System.registerDynamic("a", ["69"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var _Object$defineProperty = $__require('69')["default"];
  exports["default"] = (function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        _Object$defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  exports.__esModule = true;
  return module.exports;
});

$__System.registerDynamic("4", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  exports["default"] = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  exports.__esModule = true;
  return module.exports;
});

$__System.register('49', ['4', 'a'], function (_export) {
   var _classCallCheck, _createClass, Utils, s_GET_PROTO, s_WALK_PROTO;

   return {
      setters: [function (_) {
         _classCallCheck = _['default'];
      }, function (_a) {
         _createClass = _a['default'];
      }],
      execute: function () {
         'use strict';

         /**
          * Provides static common utility methods.
          */

         Utils = (function () {
            function Utils() {
               _classCallCheck(this, Utils);
            }

            // Private utility methods ------------------------------------------------------------------------------------------

            _createClass(Utils, null, [{
               key: 'invokeOrValue',

               /**
                * Invokes the property as a function if it exists returning the result or just the property value.
                *
                * @param {object}   object - Object to inspect.
                * @param {string}   property - Property value to return or function name to invoke and return.
                * @returns {*}
                */
               value: function invokeOrValue(object, property) {
                  /* istanbul ignore if */
                  if (typeof object !== 'object') {
                     return void 0;
                  }

                  var value = object[property];

                  return typeof value === 'function' ? object[property]() : value;
               }

               /**
                * Method for checking whether a variable is undefined or null.
                *
                * @param {*}  unknown - Variable to test.
                * @returns {boolean}
                */
            }, {
               key: 'isNullOrUndef',
               value: function isNullOrUndef(unknown) {
                  return unknown === null || typeof unknown === 'undefined';
               }

               /**
                * Method for checking if a given child is a type of the parent.
                *
                * @param {*}  childType - Child type to test.
                * @param {*}  parentType - Parent type to match against child prototype.
                * @returns {boolean}
                */
            }, {
               key: 'isTypeOf',
               value: function isTypeOf(childType, parentType) {
                  return childType === parentType ? true : s_WALK_PROTO(childType, parentType);
               }
            }]);

            return Utils;
         })();

         _export('default', Utils);

         s_GET_PROTO = Object.getPrototypeOf.bind(Object);

         /**
          * Walks to prototype chain of given child and parent types. If the child type eventually matches the parent type
          * the child is a type of the parent.
          *
          * @param {*}  childType - Child type to test.
          * @param {*}  parentType - Parent type to match against child prototype.
          * @returns {boolean}
          */

         s_WALK_PROTO = function s_WALK_PROTO(childType, parentType) {
            var proto = s_GET_PROTO(childType);

            for (; proto !== null; proto = s_GET_PROTO(proto)) {
               if (proto === parentType) {
                  return true;
               }
            }

            return false;
         };
      }
   };
});

$__System.register('6a', ['6', '49'], function (_export) {

   /**
    * Provides support for TyphonJS adding several methods to Backbone.
    *
    * @param {Backbone} Backbone - Backbone instance
    */
   'use strict';

   var _, Utils;

   _export('default', typhonExtend);

   function typhonExtend(Backbone) {
      Backbone.isCollection = function (collection) {
         return !Utils.isNullOrUndef(collection) && collection instanceof Backbone.Collection;
      };

      Backbone.isEventbus = function (eventbus) {
         return !Utils.isNullOrUndef(eventbus) && (eventbus instanceof Backbone.Events || eventbus instanceof Backbone.Events.constructor);
      };

      Backbone.isViewCtor = function (viewCtor) {
         return !Utils.isNullOrUndef(viewCtor) && viewCtor instanceof Backbone.View.constructor;
      };

      Backbone.isModel = function (model) {
         return !Utils.isNullOrUndef(model) && model instanceof Backbone.Model;
      };

      // Add ViewController support to Backbone.View ----------------------------------------------------------------------

      Backbone.View.prototype.close = function () {
         var remove = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

         if (!_.isBoolean(remove)) {
            throw new TypeError('close - remove is not a boolean.');
         }

         if (this.onBeforeClose) {
            // onBeforeClose may veto closing
            var closeable = this.onBeforeClose();
            closeable = _.isBoolean(closeable) ? closeable : true;

            if (!closeable) {
               return false;
            }
         }

         this.stopListening();
         this.unbind();
         this.undelegateEvents();

         if (remove) {
            this.$el.remove();
         } else {
            this.$el.empty();
         }

         if (this.onDestroy) {
            this.onDestroy();
         }

         return true;
      };

      // Empty function that gets called by ViewController.setCurrentView when the same view is requested to be shown;
      // useful for passing messages to views.
      Backbone.View.prototype.onContinue = function () {};

      // The following functions provide lifecycle events used in various group views like tab-view-group.js
      Backbone.View.prototype.onStart = function () {
         this.render();
      };

      Backbone.View.prototype.onResume = function () {
         this.render();
      };

      Backbone.View.prototype.onPause = function () {
         this.undelegateEvents();
      };
   }

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_3) {
         Utils = _3['default'];
      }],
      execute: function () {}
   };
});

$__System.register('1', ['2', '11', '12', '13', '15', '58', '63', '64', '67', '6a'], function (_export) {
  /**
   * ModuleRuntime.js (Parse) -- Provides the standard / default configuration that is the same as Backbone 1.2.3
   */

  'use strict';

  var Backbone, ParseCollection, Model, TyphonEvents, History, Router, View, parseSync, parseExtend, typhonExtend, options, backbone;
  return {
    setters: [function (_) {
      Backbone = _['default'];
    }, function (_2) {
      ParseCollection = _2['default'];
    }, function (_5) {
      Model = _5['default'];
    }, function (_3) {
      TyphonEvents = _3['default'];
    }, function (_4) {
      History = _4['default'];
    }, function (_6) {
      Router = _6['default'];
    }, function (_7) {
      View = _7['default'];
    }, function (_8) {
      parseSync = _8['default'];
    }, function (_9) {
      parseExtend = _9['default'];
    }, function (_a) {
      typhonExtend = _a['default'];
    }],
    execute: function () {
      options = {
        // Current version of the library. Keep in sync with Backbone version supported.
        VERSION: '1.3.3'
      };
      backbone = new Backbone(ParseCollection, TyphonEvents, History, Model, Router, View, parseSync, options);

      parseExtend(backbone);
      typhonExtend(backbone);

      _export('default', backbone);
    }
  };
});

})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define(["jquery","parse","parse/lib/browser/encode.js","underscore"], factory);
  else if (typeof module == 'object' && module.exports && typeof require == 'function')
    module.exports = factory(require("jquery"), require("parse"), require("parse/lib/browser/encode.js"), require("underscore"));
  else
    throw new Error("Module must be loaded as AMD or CommonJS");
});