"format global";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;

      if (typeof name == 'object') {
        for (var p in name)
          exports[p] = name[p];
      }
      else {
        exports[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if ((typeof exports == 'object' || typeof exports == 'function') && exports !== global) {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    // node core modules
    if (name.substr(0, 6) == '@node/')
      return require(name.substr(6));

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        if (firstLoad.__useDefault)
          return firstLoad['default'];
        else
          return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(['1'], [], function($__System) {

$__System.register('2', ['3'], function (_export) {

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

$__System.register('3', ['4'], function (_export) {

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

      // Set the prototype chain to inherit from `parent`, without calling `parent` constructor function.
      var Surrogate = function Surrogate() {
         this.constructor = child;
      };

      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate();

      // Add prototype properties (instance properties) to the subclass, if supplied.
      if (protoProps) {
         _.extend(child.prototype, protoProps);
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

$__System.register('5', ['2', '3', '4', '6'], function (_export) {

   // Add HTTPS image fetch substitution to Parse.Object ---------------------------------------------------------------

   /**
    * It turns out that we can get an HTTPS link from S3 for any given parse file URL by string substitution.
    *
    * @param {string}   key   - Attribute key
    * @returns {XML|string|void}
    */
   'use strict';

   var modelExtend, extend, _, Parse;

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
   }

   return {
      setters: [function (_5) {
         modelExtend = _5['default'];
      }, function (_4) {
         extend = _4['default'];
      }, function (_3) {
         _ = _3['default'];
      }, function (_2) {
         Parse = _2['default'];
      }],
      execute: function () {
         Parse.Object.prototype.getHTTPSUrl = function (key) {
            var urlRequest = this.get(key);

            if (!_.isUndefined(urlRequest) && urlRequest !== null && !_.isUndefined(urlRequest.url)) {
               return urlRequest.url().replace('http://files.parsetfss.com/', 'https://s3.amazonaws.com/files.parsetfss.com/');
            }
         };
      }
   };
});

$__System.register('7', ['4', '8', '9'], function (_export) {

   /**
    * Syncs a Backbone.Collection via an associated Parse.Query.
    *
    * @param {string}      method      - A string that defines the synchronization action to perform.
    * @param {Collection}  collection  - The model or collection instance to synchronize.
    * @param {object}      options     - Optional parameters
    * @returns {*|ParsePromise}
    */
   'use strict';

   var _, BackboneProxy, Debug, syncCollection, syncModel;

   _export('default', parseSync);

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
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_3) {
         BackboneProxy = _3['default'];
      }, function (_4) {
         Debug = _4['default'];
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

$__System.register('a', ['4', '8', 'b', 'c', 'd', 'e', 'f'], function (_export) {
  var _, BackboneProxy, _get, _inherits, _createClass, _classCallCheck, Events, s_DELEGATE_EVENT_SPLITTER, s_VIEW_OPTIONS, View;

  return {
    setters: [function (_2) {
      _ = _2['default'];
    }, function (_3) {
      BackboneProxy = _3['default'];
    }, function (_b) {
      _get = _b['default'];
    }, function (_c) {
      _inherits = _c['default'];
    }, function (_d) {
      _createClass = _d['default'];
    }, function (_e) {
      _classCallCheck = _e['default'];
    }, function (_f) {
      Events = _f['default'];
    }],
    execute: function () {

      // Private / internal methods ---------------------------------------------------------------------------------------

      /**
       * Cached regex to split keys for `delegate`.
       * @type {RegExp}
       */
      'use strict';

      s_DELEGATE_EVENT_SPLITTER = /^(\S+)\s*(.*)$/;

      /**
       * List of view options to be set as properties.
       * @type {string[]}
       */
      s_VIEW_OPTIONS = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

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
    }
  };
});

$__System.register('10', ['4', '8', '11', 'b', 'c', 'd', 'e', 'f'], function (_export) {
   var _, BackboneProxy, _toConsumableArray, _get, _inherits, _createClass, _classCallCheck, Events, s_ESCAPE_REGEX, s_NAMED_PARAM, s_OPTIONAL_PARAM, s_SPLAT_PARAM, s_BIND_ROUTES, s_EXTRACT_PARAMETERS, s_ROUTE_TO_REGEX, Router;

   return {
      setters: [function (_3) {
         _ = _3['default'];
      }, function (_4) {
         BackboneProxy = _4['default'];
      }, function (_2) {
         _toConsumableArray = _2['default'];
      }, function (_b) {
         _get = _b['default'];
      }, function (_c) {
         _inherits = _c['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
      }, function (_f) {
         Events = _f['default'];
      }],
      execute: function () {

         // Private / internal methods ---------------------------------------------------------------------------------------

         /**
          * Cached regular expressions for matching named param parts and splatted parts of route strings.
          * @type {RegExp}
          */
         'use strict';

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
          * A route of "file/*path" will match #file/nested/folder/file.txt, passing "nested/folder/file.txt" to the action.
          *
          * A route of "docs/:section(/:subsection)" will match #docs/faq and #docs/faq/installing, passing "faq" to the action
          * in the first case, and passing "faq" and "installing" to the action in the second.
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
      }
   };
});

$__System.register('12', ['4', '13', 'b', 'c', 'd', 'e', 'f'], function (_export) {
   var _, Utils, _get, _inherits, _createClass, _classCallCheck, Events, s_ROUTE_STRIPPER, s_ROOT_STRIPPER, s_PATH_STRIPPER, s_UPDATE_HASH, History;

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_3) {
         Utils = _3['default'];
      }, function (_b) {
         _get = _b['default'];
      }, function (_c) {
         _inherits = _c['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
      }, function (_f) {
         Events = _f['default'];
      }],
      execute: function () {

         // Private / internal methods ---------------------------------------------------------------------------------------

         /**
          * Cached regex for stripping a leading hash/slash and trailing space.
          */
         'use strict';

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
                  var root = path.slice(0, this.root.length - 1) + '/';
                  return root === this.root;
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
                  var root = this.root;

                  if (fragment === '' || fragment.charAt(0) === '?') {
                     root = root.slice(0, -1) || '/';
                  }

                  var url = root + fragment;

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
                        var root = this.root.slice(0, -1) || '/';
                        this.location.replace(root + '#' + this.getPath());

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
      }
   };
});

$__System.register('14', ['4', '8', '9', '13', '15', 'b', 'c', 'd', 'e', 'f'], function (_export) {
   var _, BackboneProxy, Debug, Utils, Model, _get, _inherits, _createClass, _classCallCheck, Events, s_ADD_OPTIONS, s_SET_OPTIONS, s_ADD_REFERENCE, s_ON_MODEL_EVENT, s_REMOVE_MODELS, s_REMOVE_REFERENCE, s_SPLICE, Collection, collectionMethods;

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_3) {
         BackboneProxy = _3['default'];
      }, function (_6) {
         Debug = _6['default'];
      }, function (_5) {
         Utils = _5['default'];
      }, function (_4) {
         Model = _4['default'];
      }, function (_b) {
         _get = _b['default'];
      }, function (_c) {
         _inherits = _c['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
      }, function (_f) {
         Events = _f['default'];
      }],
      execute: function () {

         // Private / internal methods ---------------------------------------------------------------------------------------

         /**
          * Default options for `Collection#add`.
          * @type {{add: boolean, remove: boolean}}
          */
         'use strict';

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

               if (!options.silent) {
                  options.index = index;
                  model.trigger('remove', model, collection, options);
               }

               removed.push(model);
               s_REMOVE_REFERENCE(collection, model, options);
            }

            return removed.length ? removed : false;
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

         Collection = (function (_Events) {
            _inherits(Collection, _Events);

            /**
             * When creating a Collection, you may choose to pass in the initial array of models. The collection's comparator
             * may be included as an option. Passing false as the comparator option will prevent sorting. If you define an
             * initialize function, it will be invoked when the collection is created. There are a couple of options that, if
             * provided, are attached to the collection directly: model and comparator.
             *
             * Pass null for models to create an empty Collection with options.
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
                * isn't sorted, at will still retrieve models in insertion order.
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

                  options.success = function (model, resp, callbackOpts) {
                     if (wait) {
                        collection.add(model, callbackOpts);
                     }
                     if (success) {
                        success.call(callbackOpts.context, model, resp, callbackOpts);
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
                * Get a model from a collection, specified by an id, a cid, or by passing in a model.
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

                  var id = this.modelId(Utils.isModel(obj) ? obj.attributes : obj);

                  Debug.log('Collection - get - id: ' + id);

                  return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
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
                * Override this method to specify the attribute the collection will use to refer to its models in collection.get.
                * By default returns the idAttribute of the collection's model class or failing that, 'id'. If your collection uses
                * polymorphic models and those models have an idAttribute other than id you must override this method with your own
                * custom logic.
                *
                * @example
                * var Library = Backbone.Collection.extend({
                *    model: function(attrs, options) {
                *       if (condition) {
                *          return new PublicDocument(attrs, options);
                *       } else {
                *          return new PrivateDocument(attrs, options);
                *       }
                *    },
                *
                *    modelId: function(attrs) {
                *       return attrs.private ? 'private_id' : 'public_id';
                *    }
                * });
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
                  return _.invoke(this.models, 'get', attr);
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
                * for each model, and a single "update" event afterwards. The model's index before removal is available to
                * listeners as options.index.
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
                  models = singular ? [models] : _.clone(models);
                  var removed = s_REMOVE_MODELS(this, models, options);

                  if (!options.silent && removed) {
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
                * (or attribute hashes), triggering a single "reset" event at the end. Returns the newly-set models. For
                * convenience, within a "reset" event, the list of any previous models is available as options.previousModels.
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

                  options = _.defaults({}, options, s_SET_OPTIONS);
                  if (options.parse && !Utils.isModel(models)) {
                     models = this.parse(models, options);
                  }

                  var singular = !_.isArray(models);
                  models = singular ? [models] : models.slice();

                  var at = options.at;
                  if (!Utils.isNullOrUndef(at)) {
                     at = +at;
                  }
                  if (at < 0) {
                     at += this.length + 1;
                  }

                  Debug.log('Collection - set - 1 - at: ' + at + '; models.length: ' + models.length);

                  var set = [];
                  var toAdd = [];
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
                     orderChanged = this.length !== set.length || _.some(this.models, function (model, index) {
                        return model !== set[index];
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

                  // Unless silenced, it's time to fire all appropriate add/sort events.
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
                     if (toAdd.length || toRemove.length) {
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
            forEach: 3, each: 3, map: 3, collect: 3, reduce: 4,
            foldl: 4, inject: 4, reduceRight: 4, foldr: 4, find: 3, detect: 3, filter: 3,
            select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
            contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
            head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
            without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
            isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
            sortBy: 3, indexBy: 3
         };

         // Mix in each Underscore method as a proxy to `Collection#models`.
         Utils.addUnderscoreMethods(Collection, collectionMethods, 'models');

         /**
          * Exports the Collection class.
          */

         _export('default', Collection);
      }
   };
});

$__System.register('9', ['d', 'e'], function (_export) {
   var _createClass, _classCallCheck, s_DEBUG_LOG, s_DEBUG_TRACE, Debug;

   return {
      setters: [function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
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

$__System.registerDynamic("16", ["17", "18", "19"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports.send = send;
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _ParseQuery = $__require('19');
  var _ParseQuery2 = _interopRequireDefault(_ParseQuery);
  function send(data, options) {
    options = options || {};
    if (data.where && data.where instanceof _ParseQuery2['default']) {
      data.where = data.where.toJSON().where;
    }
    if (data.push_time && typeof data.push_time === 'object') {
      data.push_time = data.push_time.toJSON();
    }
    if (data.expiration_time && typeof data.expiration_time === 'object') {
      data.expiration_time = data.expiration_time.toJSON();
    }
    if (data.expiration_time && data.expiration_interval) {
      throw new Error('expiration_time and expiration_interval cannot both be set.');
    }
    return _CoreManager2['default'].getPushController().send(data, {useMasterKey: options.useMasterKey})._thenRunCallbacks(options);
  }
  _CoreManager2['default'].setPushController({send: function send(data, options) {
      var RESTController = _CoreManager2['default'].getRESTController();
      var request = RESTController.request('POST', 'push', data, {useMasterKey: !!options.useMasterKey});
      return request._thenRunCallbacks(options);
    }});
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1a", ["b", "c", "e", "17", "1b"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _get = $__require('b')['default'];
  var _inherits = $__require('c')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _ParseObject2 = $__require('1b');
  var _ParseObject3 = _interopRequireDefault(_ParseObject2);
  var Installation = (function(_ParseObject) {
    _inherits(Installation, _ParseObject);
    function Installation(attributes) {
      _classCallCheck(this, Installation);
      _get(Object.getPrototypeOf(Installation.prototype), 'constructor', this).call(this, '_Installation');
      if (attributes && typeof attributes === 'object') {
        if (!this.set(attributes || {})) {
          throw new Error('Can\'t create an invalid Session');
        }
      }
    }
    return Installation;
  })(_ParseObject3['default']);
  exports['default'] = Installation;
  _ParseObject3['default'].registerSubclass('_Installation', Installation);
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1c", ["17", "1d", "1e"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _parseDate = $__require('1d');
  var _parseDate2 = _interopRequireDefault(_parseDate);
  var _ParseUser = $__require('1e');
  var _ParseUser2 = _interopRequireDefault(_ParseUser);
  var initialized = false;
  var requestedPermissions;
  var initOptions;
  exports['default'] = {
    init: function init(options) {
      if (typeof FB === 'undefined') {
        throw new Error('The Facebook JavaScript SDK must be loaded before calling init.');
      }
      initOptions = {};
      if (options) {
        for (var key in options) {
          initOptions[key] = options[key];
        }
      }
      if (initOptions.status && typeof console !== 'undefined') {
        var warn = console.warn || console.log || function() {};
        warn.call(console, 'The "status" flag passed into' + ' FB.init, when set to true, can interfere with Parse Facebook' + ' integration, so it has been suppressed. Please call' + ' FB.getLoginStatus() explicitly if you require this behavior.');
      }
      initOptions.status = false;
      FB.init(initOptions);
      _ParseUser2['default']._registerAuthenticationProvider({
        authenticate: function authenticate(options) {
          var _this = this;
          if (typeof FB === 'undefined') {
            options.error(this, 'Facebook SDK not found.');
          }
          FB.login(function(response) {
            if (response.authResponse) {
              if (options.success) {
                options.success(_this, {
                  id: response.authResponse.userID,
                  access_token: response.authResponse.accessToken,
                  expiration_date: new Date(response.authResponse.expiresIn * 1000 + new Date().getTime()).toJSON()
                });
              }
            } else {
              if (options.error) {
                options.error(_this, response);
              }
            }
          }, {scope: requestedPermissions});
        },
        restoreAuthentication: function restoreAuthentication(authData) {
          if (authData) {
            var expiration = (0, _parseDate2['default'])(authData.expiration_date);
            var expiresIn = expiration ? (expiration.getTime() - new Date().getTime()) / 1000 : 0;
            var authResponse = {
              userID: authData.id,
              accessToken: authData.access_token,
              expiresIn: expiresIn
            };
            var newOptions = {};
            if (initOptions) {
              for (var key in initOptions) {
                newOptions[key] = initOptions[key];
              }
            }
            newOptions.authResponse = authResponse;
            newOptions.status = false;
            var existingResponse = FB.getAuthResponse();
            if (existingResponse && existingResponse.userID !== authResponse.userID) {
              FB.logout();
            }
            FB.init(newOptions);
          }
          return true;
        },
        getAuthType: function getAuthType() {
          return 'facebook';
        },
        deauthenticate: function deauthenticate() {
          this.restoreAuthentication(null);
        }
      });
      initialized = true;
    },
    isLinked: function isLinked(user) {
      return user._isLinked('facebook');
    },
    logIn: function logIn(permissions, options) {
      if (!permissions || typeof permissions === 'string') {
        if (!initialized) {
          throw new Error('You must initialize FacebookUtils before calling logIn.');
        }
        requestedPermissions = permissions;
        return _ParseUser2['default']._logInWith('facebook', options);
      } else {
        var newOptions = {};
        if (options) {
          for (var key in options) {
            newOptions[key] = options[key];
          }
        }
        newOptions.authData = permissions;
        return _ParseUser2['default']._logInWith('facebook', newOptions);
      }
    },
    link: function link(user, permissions, options) {
      if (!permissions || typeof permissions === 'string') {
        if (!initialized) {
          throw new Error('You must initialize FacebookUtils before calling link.');
        }
        requestedPermissions = permissions;
        return user._linkWith('facebook', options);
      } else {
        var newOptions = {};
        if (options) {
          for (var key in options) {
            newOptions[key] = options[key];
          }
        }
        newOptions.authData = permissions;
        return user._linkWith('facebook', newOptions);
      }
    },
    unlink: function unlink(user, options) {
      if (!initialized) {
        throw new Error('You must initialize FacebookUtils before calling unlink.');
      }
      return user._unlinkFrom('facebook', options);
    }
  };
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1f", ["d", "e", "17", "18", "20", "21", "22", "23", "24", "25"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _decode = $__require('20');
  var _decode2 = _interopRequireDefault(_decode);
  var _encode = $__require('21');
  var _encode2 = _interopRequireDefault(_encode);
  var _escape2 = $__require('22');
  var _escape3 = _interopRequireDefault(_escape2);
  var _ParseError = $__require('23');
  var _ParseError2 = _interopRequireDefault(_ParseError);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  var _Storage = $__require('25');
  var _Storage2 = _interopRequireDefault(_Storage);
  var ParseConfig = (function() {
    function ParseConfig() {
      _classCallCheck(this, ParseConfig);
      this.attributes = {};
      this._escapedAttributes = {};
    }
    _createClass(ParseConfig, [{
      key: 'get',
      value: function get(attr) {
        return this.attributes[attr];
      }
    }, {
      key: 'escape',
      value: function escape(attr) {
        var html = this._escapedAttributes[attr];
        if (html) {
          return html;
        }
        var val = this.attributes[attr];
        var escaped = '';
        if (val != null) {
          escaped = (0, _escape3['default'])(val.toString());
        }
        this._escapedAttributes[attr] = escaped;
        return escaped;
      }
    }], [{
      key: 'current',
      value: function current() {
        var controller = _CoreManager2['default'].getConfigController();
        return controller.current();
      }
    }, {
      key: 'get',
      value: function get(options) {
        options = options || {};
        var controller = _CoreManager2['default'].getConfigController();
        return controller.get()._thenRunCallbacks(options);
      }
    }]);
    return ParseConfig;
  })();
  exports['default'] = ParseConfig;
  var currentConfig = null;
  var CURRENT_CONFIG_KEY = 'currentConfig';
  function decodePayload(data) {
    try {
      var json = JSON.parse(data);
      if (json && typeof json === 'object') {
        return (0, _decode2['default'])(json);
      }
    } catch (e) {
      return null;
    }
  }
  _CoreManager2['default'].setConfigController({
    current: function current() {
      if (currentConfig) {
        return currentConfig;
      }
      var config = new ParseConfig();
      var storagePath = _Storage2['default'].generatePath(CURRENT_CONFIG_KEY);
      var configData;
      if (!_Storage2['default'].async()) {
        configData = _Storage2['default'].getItem(storagePath);
        if (configData) {
          var attributes = decodePayload(configData);
          if (attributes) {
            config.attributes = attributes;
            currentConfig = config;
          }
        }
        return config;
      }
      return _Storage2['default'].getItemAsync(storagePath).then(function(configData) {
        if (configData) {
          var attributes = decodePayload(configData);
          if (attributes) {
            config.attributes = attributes;
            currentConfig = config;
          }
        }
        return config;
      });
    },
    get: function get() {
      var RESTController = _CoreManager2['default'].getRESTController();
      return RESTController.request('GET', 'config', {}, {}).then(function(response) {
        if (!response || !response.params) {
          var error = new _ParseError2['default'](_ParseError2['default'].INVALID_JSON, 'Config JSON response invalid.');
          return _ParsePromise2['default'].error(error);
        }
        var config = new ParseConfig();
        config.attributes = {};
        for (var attr in response.params) {
          config.attributes[attr] = (0, _decode2['default'])(response.params[attr]);
        }
        currentConfig = config;
        return _Storage2['default'].setItemAsync(_Storage2['default'].generatePath(CURRENT_CONFIG_KEY), JSON.stringify(response.params)).then(function() {
          return config;
        });
      });
    }
  });
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("26", ["17", "18", "20", "21", "23", "24"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports.run = run;
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _decode = $__require('20');
  var _decode2 = _interopRequireDefault(_decode);
  var _encode = $__require('21');
  var _encode2 = _interopRequireDefault(_encode);
  var _ParseError = $__require('23');
  var _ParseError2 = _interopRequireDefault(_ParseError);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  function run(name, data, options) {
    options = options || {};
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('Cloud function name must be a string.');
    }
    var requestOptions = {};
    if (options.useMasterKey) {
      requestOptions.useMasterKey = options.useMasterKey;
    }
    if (options.sessionToken) {
      requestOptions.sessionToken = options.sessionToken;
    }
    return _CoreManager2['default'].getCloudController().run(name, data, requestOptions)._thenRunCallbacks(options);
  }
  _CoreManager2['default'].setCloudController({run: function run(name, data, options) {
      var RESTController = _CoreManager2['default'].getRESTController();
      var payload = (0, _encode2['default'])(data, true);
      var requestOptions = {};
      if (options.hasOwnProperty('useMasterKey')) {
        requestOptions.useMasterKey = options.useMasterKey;
      }
      if (options.hasOwnProperty('sessionToken')) {
        requestOptions.sessionToken = options.sessionToken;
      }
      var request = RESTController.request('POST', 'functions/' + name, payload, requestOptions);
      return request.then(function(res) {
        var decoded = (0, _decode2['default'])(res);
        if (decoded && decoded.hasOwnProperty('result')) {
          return _ParsePromise2['default'].as(decoded.result);
        }
        return _ParsePromise2['default'].error(new _ParseError2['default'](_ParseError2['default'].INVALID_JSON, 'The server returned an invalid response.'));
      })._thenRunCallbacks(options);
    }});
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("27", ["17", "18"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports.track = track;
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  function track(name, dimensions, options) {
    name = name || '';
    name = name.replace(/^\s*/, '');
    name = name.replace(/\s*$/, '');
    if (name.length === 0) {
      throw new TypeError('A name for the custom event must be provided');
    }
    for (var key in dimensions) {
      if (typeof key !== 'string' || typeof dimensions[key] !== 'string') {
        throw new TypeError('track() dimensions expects keys and values of type "string".');
      }
    }
    options = options || {};
    return _CoreManager2['default'].getAnalyticsController().track(name, dimensions)._thenRunCallbacks(options);
  }
  _CoreManager2['default'].setAnalyticsController({track: function track(name, dimensions) {
      var RESTController = _CoreManager2['default'].getRESTController();
      return RESTController.request('POST', 'events/' + name, {dimensions: dimensions});
    }});
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("28", ["17", "18", "23", "24", "25", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var _interopRequireDefault = $__require('17')['default'];
    Object.defineProperty(exports, '__esModule', {value: true});
    var _CoreManager = $__require('18');
    var _CoreManager2 = _interopRequireDefault(_CoreManager);
    var _ParseError = $__require('23');
    var _ParseError2 = _interopRequireDefault(_ParseError);
    var _ParsePromise = $__require('24');
    var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
    var _Storage = $__require('25');
    var _Storage2 = _interopRequireDefault(_Storage);
    var XHR = null;
    if (typeof XMLHttpRequest !== 'undefined') {
      XHR = XMLHttpRequest;
    }
    var useXDomainRequest = false;
    if (typeof XDomainRequest !== 'undefined' && !('withCredentials' in new XMLHttpRequest())) {
      useXDomainRequest = true;
    }
    function ajaxIE9(method, url, data) {
      var promise = new _ParsePromise2['default']();
      var xdr = new XDomainRequest();
      xdr.onload = function() {
        var response;
        try {
          response = JSON.parse(xdr.responseText);
        } catch (e) {
          promise.reject(e);
        }
        promise.resolve(response);
      };
      xdr.onerror = xdr.ontimeout = function() {
        var fakeResponse = {responseText: JSON.stringify({
            code: _ParseError2['default'].X_DOMAIN_REQUEST,
            error: 'IE\'s XDomainRequest does not supply error info.'
          })};
        promise.reject(fakeResponse);
      };
      xdr.onprogress = function() {};
      xdr.open(method, url);
      xdr.send(data);
      return promise;
    }
    var RESTController = {
      ajax: function ajax(method, url, data, headers) {
        if (useXDomainRequest) {
          return ajaxIE9(method, url, data, headers);
        }
        var promise = new _ParsePromise2['default']();
        var attempts = 0;
        var dispatch = function dispatch() {
          if (XHR == null) {
            throw new Error('Cannot make a request: No definition of XMLHttpRequest was found.');
          }
          var handled = false;
          var xhr = new XHR();
          xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4 || handled) {
              return;
            }
            handled = true;
            if (xhr.status >= 200 && xhr.status < 300) {
              var response;
              try {
                response = JSON.parse(xhr.responseText);
              } catch (e) {
                promise.reject(e);
              }
              promise.resolve(response, xhr.status, xhr);
            } else if (xhr.status >= 500 || xhr.status === 0) {
              if (++attempts < _CoreManager2['default'].get('REQUEST_ATTEMPT_LIMIT')) {
                var delay = Math.round(Math.random() * 125 * Math.pow(2, attempts));
                setTimeout(dispatch, delay);
              } else if (xhr.status === 0) {
                promise.reject('Unable to connect to the Parse API');
              } else {
                promise.reject(xhr);
              }
            } else {
              promise.reject(xhr);
            }
          };
          headers = headers || {};
          headers['Content-Type'] = 'text/plain';
          if (_CoreManager2['default'].get('IS_NODE')) {
            headers['User-Agent'] = 'Parse/' + _CoreManager2['default'].get('VERSION') + ' (NodeJS ' + process.versions.node + ')';
          }
          xhr.open(method, url, true);
          for (var h in headers) {
            xhr.setRequestHeader(h, headers[h]);
          }
          xhr.send(data);
        };
        dispatch();
        return promise;
      },
      request: function request(method, path, data, options) {
        options = options || {};
        var url = _CoreManager2['default'].get('SERVER_URL');
        url += '/1/' + path;
        var payload = {};
        if (data && typeof data === 'object') {
          for (var k in data) {
            payload[k] = data[k];
          }
        }
        if (method !== 'POST') {
          payload._method = method;
          method = 'POST';
        }
        payload._ApplicationId = _CoreManager2['default'].get('APPLICATION_ID');
        payload._JavaScriptKey = _CoreManager2['default'].get('JAVASCRIPT_KEY');
        payload._ClientVersion = 'js' + _CoreManager2['default'].get('VERSION');
        var useMasterKey = options.useMasterKey;
        if (typeof useMasterKey === 'undefined') {
          useMasterKey = _CoreManager2['default'].get('USE_MASTER_KEY');
        }
        if (useMasterKey) {
          if (_CoreManager2['default'].get('MASTER_KEY')) {
            delete payload._JavaScriptKey;
            payload._MasterKey = _CoreManager2['default'].get('MASTER_KEY');
          } else {
            throw new Error('Cannot use the Master Key, it has not been provided.');
          }
        }
        if (_CoreManager2['default'].get('FORCE_REVOCABLE_SESSION')) {
          payload._RevocableSession = '1';
        }
        var installationController = _CoreManager2['default'].getInstallationController();
        return installationController.currentInstallationId().then(function(iid) {
          payload._InstallationId = iid;
          var userController = _CoreManager2['default'].getUserController();
          if (options && typeof options.sessionToken === 'string') {
            return _ParsePromise2['default'].as(options.sessionToken);
          } else if (userController) {
            return userController.currentUserAsync().then(function(user) {
              if (user) {
                return _ParsePromise2['default'].as(user.getSessionToken());
              }
              return _ParsePromise2['default'].as(null);
            });
          }
          return _ParsePromise2['default'].as(null);
        }).then(function(token) {
          if (token) {
            payload._SessionToken = token;
          }
          var payloadString = JSON.stringify(payload);
          return RESTController.ajax(method, url, payloadString);
        }).then(null, function(response) {
          var error;
          if (response && response.responseText) {
            try {
              var errorJSON = JSON.parse(response.responseText);
              error = new _ParseError2['default'](errorJSON.code, errorJSON.error);
            } catch (e) {
              error = new _ParseError2['default'](_ParseError2['default'].INVALID_JSON, 'Received an error with invalid JSON from Parse: ' + response.responseText);
            }
          } else {
            error = new _ParseError2['default'](_ParseError2['default'].CONNECTION_FAILED, 'XMLHttpRequest failed: ' + JSON.stringify(response));
          }
          return _ParsePromise2['default'].error(error);
        });
      },
      _setXHR: function _setXHR(xhr) {
        XHR = xhr;
      }
    };
    module.exports = RESTController;
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2a", ["17", "18", "24", "25"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  var _Storage = $__require('25');
  var _Storage2 = _interopRequireDefault(_Storage);
  var iidCache = null;
  function hexOctet() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  function generateId() {
    return hexOctet() + hexOctet() + '-' + hexOctet() + '-' + hexOctet() + '-' + hexOctet() + '-' + hexOctet() + hexOctet() + hexOctet();
  }
  module.exports = {
    currentInstallationId: function currentInstallationId() {
      if (typeof iidCache === 'string') {
        return _ParsePromise2['default'].as(iidCache);
      }
      var path = _Storage2['default'].generatePath('installationId');
      return _Storage2['default'].getItemAsync(path).then(function(iid) {
        if (!iid) {
          iid = generateId();
          return _Storage2['default'].setItemAsync(path, iid).then(function() {
            iidCache = iid;
            return iid;
          });
        }
        iidCache = iid;
        return iid;
      });
    },
    _clearCache: function _clearCache() {
      iidCache = null;
    },
    _setInstallationIdCache: function _setInstallationIdCache(iid) {
      iidCache = iid;
    }
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2b", ["17", "24"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  module.exports = {
    async: 0,
    getItem: function getItem(path) {
      return localStorage.getItem(path);
    },
    setItem: function setItem(path, value) {
      localStorage.setItem(path, value);
    },
    removeItem: function removeItem(path) {
      localStorage.removeItem(path);
    },
    clear: function clear() {
      localStorage.clear();
    }
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("25", ["17", "18", "24", "2b"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  module.exports = {
    async: function async() {
      var controller = _CoreManager2['default'].getStorageController();
      return !!controller.async;
    },
    getItem: function getItem(path) {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.async === 1) {
        throw new Error('Synchronous storage is not supported by the current storage controller');
      }
      return controller.getItem(path);
    },
    getItemAsync: function getItemAsync(path) {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.async === 1) {
        return controller.getItemAsync(path);
      }
      return _ParsePromise2['default'].as(controller.getItem(path));
    },
    setItem: function setItem(path, value) {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.async === 1) {
        throw new Error('Synchronous storage is not supported by the current storage controller');
      }
      return controller.setItem(path, value);
    },
    setItemAsync: function setItemAsync(path, value) {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.async === 1) {
        return controller.setItemAsync(path, value);
      }
      return _ParsePromise2['default'].as(controller.setItem(path, value));
    },
    removeItem: function removeItem(path) {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.async === 1) {
        throw new Error('Synchronous storage is not supported by the current storage controller');
      }
      return controller.removeItem(path);
    },
    removeItemAsync: function removeItemAsync(path) {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.async === 1) {
        return controller.removeItemAsync(path);
      }
      return _ParsePromise2['default'].as(controller.removeItem(path));
    },
    generatePath: function generatePath(path) {
      if (!_CoreManager2['default'].get('APPLICATION_ID')) {
        throw new Error('You need to call Parse.initialize before using Parse.');
      }
      if (typeof path !== 'string') {
        throw new Error('Tried to get a Storage path that was not a String.');
      }
      if (path[0] === '/') {
        path = path.substr(1);
      }
      return 'Parse/' + _CoreManager2['default'].get('APPLICATION_ID') + '/' + path;
    },
    _clear: function _clear() {
      var controller = _CoreManager2['default'].getStorageController();
      if (controller.hasOwnProperty('clear')) {
        controller.clear();
      }
    }
  };
  _CoreManager2['default'].setStorageController($__require('2b'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2c", ["b", "c", "d", "e", "17", "18", "2d", "1b", "24", "1e"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _get = $__require('b')['default'];
  var _inherits = $__require('c')['default'];
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _isRevocableSession = $__require('2d');
  var _isRevocableSession2 = _interopRequireDefault(_isRevocableSession);
  var _ParseObject2 = $__require('1b');
  var _ParseObject3 = _interopRequireDefault(_ParseObject2);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  var _ParseUser = $__require('1e');
  var _ParseUser2 = _interopRequireDefault(_ParseUser);
  var ParseSession = (function(_ParseObject) {
    _inherits(ParseSession, _ParseObject);
    function ParseSession(attributes) {
      _classCallCheck(this, ParseSession);
      _get(Object.getPrototypeOf(ParseSession.prototype), 'constructor', this).call(this, '_Session');
      if (attributes && typeof attributes === 'object') {
        if (!this.set(attributes || {})) {
          throw new Error('Can\'t create an invalid Session');
        }
      }
    }
    _createClass(ParseSession, [{
      key: 'getSessionToken',
      value: function getSessionToken() {
        return this.get('sessionToken');
      }
    }], [{
      key: 'readOnlyAttributes',
      value: function readOnlyAttributes() {
        return ['createdWith', 'expiresAt', 'installationId', 'restricted', 'sessionToken', 'user'];
      }
    }, {
      key: 'current',
      value: function current(options) {
        options = options || {};
        var controller = _CoreManager2['default'].getSessionController();
        var sessionOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          sessionOptions.useMasterKey = options.useMasterKey;
        }
        return _ParseUser2['default'].currentAsync().then(function(user) {
          if (!user) {
            return _ParsePromise2['default'].error('There is no current user.');
          }
          var token = user.getSessionToken();
          sessionOptions.sessionToken = user.getSessionToken();
          return controller.getSession(sessionOptions);
        });
      }
    }, {
      key: 'isCurrentSessionRevocable',
      value: function isCurrentSessionRevocable() {
        var currentUser = _ParseUser2['default'].current();
        if (currentUser) {
          return (0, _isRevocableSession2['default'])(currentUser.getSessionToken() || '');
        }
        return false;
      }
    }]);
    return ParseSession;
  })(_ParseObject3['default']);
  exports['default'] = ParseSession;
  _ParseObject3['default'].registerSubclass('_Session', ParseSession);
  _CoreManager2['default'].setSessionController({getSession: function getSession(options) {
      var RESTController = _CoreManager2['default'].getRESTController();
      var session = new ParseSession();
      return RESTController.request('GET', 'sessions/me', {}, options).then(function(sessionData) {
        session._finishFetch(sessionData);
        session._setExisted(true);
        return session;
      });
    }});
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2d", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = isRevocableSession;
  function isRevocableSession(token) {
    return token.indexOf('r:') > -1;
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1e", ["b", "c", "d", "e", "2e", "17", "2f", "18", "2d", "30", "23", "1b", "24", "2c", "25", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var _get = $__require('b')['default'];
    var _inherits = $__require('c')['default'];
    var _createClass = $__require('d')['default'];
    var _classCallCheck = $__require('e')['default'];
    var _Object$defineProperty = $__require('2e')['default'];
    var _interopRequireDefault = $__require('17')['default'];
    var _interopRequireWildcard = $__require('2f')['default'];
    Object.defineProperty(exports, '__esModule', {value: true});
    var _CoreManager = $__require('18');
    var _CoreManager2 = _interopRequireDefault(_CoreManager);
    var _isRevocableSession = $__require('2d');
    var _isRevocableSession2 = _interopRequireDefault(_isRevocableSession);
    var _ObjectState = $__require('30');
    var ObjectState = _interopRequireWildcard(_ObjectState);
    var _ParseError = $__require('23');
    var _ParseError2 = _interopRequireDefault(_ParseError);
    var _ParseObject2 = $__require('1b');
    var _ParseObject3 = _interopRequireDefault(_ParseObject2);
    var _ParsePromise = $__require('24');
    var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
    var _ParseSession = $__require('2c');
    var _ParseSession2 = _interopRequireDefault(_ParseSession);
    var _Storage = $__require('25');
    var _Storage2 = _interopRequireDefault(_Storage);
    var CURRENT_USER_KEY = 'currentUser';
    var canUseCurrentUser = !_CoreManager2['default'].get('IS_NODE');
    var currentUserCacheMatchesDisk = false;
    var currentUserCache = null;
    var authProviders = {};
    var ParseUser = (function(_ParseObject) {
      _inherits(ParseUser, _ParseObject);
      function ParseUser(attributes) {
        _classCallCheck(this, ParseUser);
        _get(Object.getPrototypeOf(ParseUser.prototype), 'constructor', this).call(this, '_User');
        if (attributes && typeof attributes === 'object') {
          if (!this.set(attributes || {})) {
            throw new Error('Can\'t create an invalid Parse User');
          }
        }
      }
      _createClass(ParseUser, [{
        key: '_upgradeToRevocableSession',
        value: function _upgradeToRevocableSession(options) {
          options = options || {};
          var upgradeOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            upgradeOptions.useMasterKey = options.useMasterKey;
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.upgradeToRevocableSession(this, upgradeOptions)._thenRunCallbacks(options);
        }
      }, {
        key: '_linkWith',
        value: function _linkWith(provider, options) {
          var _this = this;
          var authType;
          if (typeof provider === 'string') {
            authType = provider;
            provider = authProviders[provider];
          } else {
            authType = provider.getAuthType();
          }
          if (options && options.hasOwnProperty('authData')) {
            var authData = this.get('authData') || {};
            authData[authType] = options.authData;
            var controller = _CoreManager2['default'].getUserController();
            return controller.linkWith(this, authData)._thenRunCallbacks(options, this);
          } else {
            var promise = new _ParsePromise2['default']();
            provider.authenticate({
              success: function success(provider, result) {
                var opts = {};
                opts.authData = result;
                if (options.success) {
                  opts.success = options.success;
                }
                if (options.error) {
                  opts.error = options.error;
                }
                _this._linkWith(provider, opts).then(function() {
                  promise.resolve(_this);
                }, function(error) {
                  promise.reject(error);
                });
              },
              error: function error(provider, _error) {
                if (options.error) {
                  options.error(_this, _error);
                }
                promise.reject(_error);
              }
            });
            return promise;
          }
        }
      }, {
        key: '_synchronizeAuthData',
        value: function _synchronizeAuthData(provider) {
          if (!this.isCurrent() || !provider) {
            return;
          }
          var authType;
          if (typeof provider === 'string') {
            authType = provider;
            provider = authProviders[authType];
          } else {
            authType = provider.getAuthType();
          }
          var authData = this.get('authData');
          if (!provider || typeof authData !== 'object') {
            return;
          }
          var success = provider.restoreAuthentication(authData[authType]);
          if (!success) {
            this._unlinkFrom(provider);
          }
        }
      }, {
        key: '_synchronizeAllAuthData',
        value: function _synchronizeAllAuthData() {
          var authData = this.get('authData');
          if (typeof authData !== 'object') {
            return;
          }
          for (var key in authData) {
            this._synchronizeAuthData(key);
          }
        }
      }, {
        key: '_cleanupAuthData',
        value: function _cleanupAuthData() {
          if (!this.isCurrent()) {
            return;
          }
          var authData = this.get('authData');
          if (typeof authData !== 'object') {
            return;
          }
          for (var key in authData) {
            if (!authData[key]) {
              delete authData[key];
            }
          }
        }
      }, {
        key: '_unlinkFrom',
        value: function _unlinkFrom(provider, options) {
          var _this2 = this;
          var authType;
          if (typeof provider === 'string') {
            authType = provider;
            provider = authProviders[provider];
          } else {
            authType = provider.getAuthType();
          }
          return this._linkWith(provider, {authData: null}).then(function() {
            _this2._synchronizeAuthData(provider);
            return _ParsePromise2['default'].as(_this2);
          })._thenRunCallbacks(options);
        }
      }, {
        key: '_isLinked',
        value: function _isLinked(provider) {
          var authType;
          if (typeof provider === 'string') {
            authType = provider;
          } else {
            authType = provider.getAuthType();
          }
          var authData = this.get('authData') || {};
          return !!authData[authType];
        }
      }, {
        key: '_logOutWithAll',
        value: function _logOutWithAll() {
          var authData = this.get('authData');
          if (typeof authData !== 'object') {
            return;
          }
          for (var key in authData) {
            this._logOutWith(key);
          }
        }
      }, {
        key: '_logOutWith',
        value: function _logOutWith(provider) {
          if (!this.isCurrent()) {
            return;
          }
          if (typeof provider === 'string') {
            provider = authProviders[provider];
          }
          if (provider && provider.deauthenticate) {
            provider.deauthenticate();
          }
        }
      }, {
        key: 'isCurrent',
        value: function isCurrent() {
          var current = ParseUser.current();
          return !!current && current.id === this.id;
        }
      }, {
        key: 'getUsername',
        value: function getUsername() {
          return this.get('username');
        }
      }, {
        key: 'setUsername',
        value: function setUsername(username) {
          var authData = this.get('authData');
          if (authData && authData.hasOwnProperty('anonymous')) {
            authData.anonymous = null;
          }
          this.set('username', username);
        }
      }, {
        key: 'setPassword',
        value: function setPassword(password) {
          this.set('password', password);
        }
      }, {
        key: 'getEmail',
        value: function getEmail() {
          return this.get('email');
        }
      }, {
        key: 'setEmail',
        value: function setEmail(email) {
          this.set('email', email);
        }
      }, {
        key: 'getSessionToken',
        value: function getSessionToken() {
          return this.get('sessionToken');
        }
      }, {
        key: 'authenticated',
        value: function authenticated() {
          var current = ParseUser.current();
          return !!this.get('sessionToken') && !!current && current.id === this.id;
        }
      }, {
        key: 'signUp',
        value: function signUp(attrs, options) {
          options = options || {};
          var signupOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            signupOptions.useMasterKey = options.useMasterKey;
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.signUp(this, attrs, signupOptions)._thenRunCallbacks(options, this);
        }
      }, {
        key: 'logIn',
        value: function logIn(options) {
          options = options || {};
          var loginOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            loginOptions.useMasterKey = options.useMasterKey;
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.logIn(this, loginOptions)._thenRunCallbacks(options, this);
        }
      }, {
        key: 'save',
        value: function save() {
          var _this3 = this;
          for (var _len = arguments.length,
              args = Array(_len),
              _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return _get(Object.getPrototypeOf(ParseUser.prototype), 'save', this).apply(this, args).then(function() {
            if (_this3.isCurrent()) {
              return _CoreManager2['default'].getUserController().updateUserOnDisk(_this3);
            }
            return _this3;
          });
        }
      }, {
        key: 'fetch',
        value: function fetch() {
          var _this4 = this;
          for (var _len2 = arguments.length,
              args = Array(_len2),
              _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }
          return _get(Object.getPrototypeOf(ParseUser.prototype), 'fetch', this).apply(this, args).then(function() {
            if (_this4.isCurrent()) {
              return _CoreManager2['default'].getUserController().updateUserOnDisk(_this4);
            }
            return _this4;
          });
        }
      }], [{
        key: 'readOnlyAttributes',
        value: function readOnlyAttributes() {
          return ['sessionToken'];
        }
      }, {
        key: 'extend',
        value: function extend(protoProps, classProps) {
          if (protoProps) {
            for (var prop in protoProps) {
              if (prop !== 'className') {
                _Object$defineProperty(ParseUser.prototype, prop, {
                  value: protoProps[prop],
                  enumerable: false,
                  writable: true,
                  configurable: true
                });
              }
            }
          }
          if (classProps) {
            for (var prop in classProps) {
              if (prop !== 'className') {
                _Object$defineProperty(ParseUser, prop, {
                  value: classProps[prop],
                  enumerable: false,
                  writable: true,
                  configurable: true
                });
              }
            }
          }
          return ParseUser;
        }
      }, {
        key: 'current',
        value: function current() {
          if (!canUseCurrentUser) {
            return null;
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.currentUser();
        }
      }, {
        key: 'currentAsync',
        value: function currentAsync() {
          if (!canUseCurrentUser) {
            return _ParsePromise2['default'].as(null);
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.currentUserAsync();
        }
      }, {
        key: 'signUp',
        value: function signUp(username, password, attrs, options) {
          attrs = attrs || {};
          attrs.username = username;
          attrs.password = password;
          var user = new ParseUser(attrs);
          return user.signUp({}, options);
        }
      }, {
        key: 'logIn',
        value: function logIn(username, password, options) {
          var user = new ParseUser();
          user._finishFetch({
            username: username,
            password: password
          });
          return user.logIn(options);
        }
      }, {
        key: 'become',
        value: function become(sessionToken, options) {
          if (!canUseCurrentUser) {
            throw new Error('It is not memory-safe to become a user in a server environment');
          }
          options = options || {};
          var becomeOptions = {sessionToken: sessionToken};
          if (options.hasOwnProperty('useMasterKey')) {
            becomeOptions.useMasterKey = options.useMasterKey;
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.become(becomeOptions)._thenRunCallbacks(options);
        }
      }, {
        key: 'logInWith',
        value: function logInWith(provider, options) {
          return ParseUser._logInWith(provider, options);
        }
      }, {
        key: 'logOut',
        value: function logOut() {
          if (!canUseCurrentUser) {
            throw new Error('There is no current user user on a node.js server environment.');
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.logOut();
        }
      }, {
        key: 'requestPasswordReset',
        value: function requestPasswordReset(email, options) {
          options = options || {};
          var requestOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            requestOptions.useMasterKey = options.useMasterKey;
          }
          var controller = _CoreManager2['default'].getUserController();
          return controller.requestPasswordReset(email, requestOptions)._thenRunCallbacks(options);
        }
      }, {
        key: 'allowCustomUserClass',
        value: function allowCustomUserClass(isAllowed) {
          _CoreManager2['default'].set('PERFORM_USER_REWRITE', !isAllowed);
        }
      }, {
        key: 'enableRevocableSession',
        value: function enableRevocableSession(options) {
          options = options || {};
          _CoreManager2['default'].set('FORCE_REVOCABLE_SESSION', true);
          if (canUseCurrentUser) {
            var current = ParseUser.current();
            if (current) {
              return current._upgradeToRevocableSession(options);
            }
          }
          return _ParsePromise2['default'].as()._thenRunCallbacks(options);
        }
      }, {
        key: 'enableUnsafeCurrentUser',
        value: function enableUnsafeCurrentUser() {
          canUseCurrentUser = true;
        }
      }, {
        key: 'disableUnsafeCurrentUser',
        value: function disableUnsafeCurrentUser() {
          canUseCurrentUser = false;
        }
      }, {
        key: '_registerAuthenticationProvider',
        value: function _registerAuthenticationProvider(provider) {
          authProviders[provider.getAuthType()] = provider;
          var current = ParseUser.current();
          if (current) {
            current._synchronizeAuthData(provider.getAuthType());
          }
        }
      }, {
        key: '_logInWith',
        value: function _logInWith(provider, options) {
          var user = new ParseUser();
          return user._linkWith(provider, options);
        }
      }, {
        key: '_clearCache',
        value: function _clearCache() {
          currentUserCache = null;
          currentUserCacheMatchesDisk = false;
        }
      }, {
        key: '_setCurrentUserCache',
        value: function _setCurrentUserCache(user) {
          currentUserCache = user;
        }
      }]);
      return ParseUser;
    })(_ParseObject3['default']);
    exports['default'] = ParseUser;
    _ParseObject3['default'].registerSubclass('_User', ParseUser);
    var DefaultController = {
      updateUserOnDisk: function updateUserOnDisk(user) {
        var path = _Storage2['default'].generatePath(CURRENT_USER_KEY);
        var json = user.toJSON();
        json.className = '_User';
        return _Storage2['default'].setItemAsync(path, JSON.stringify(json)).then(function() {
          return user;
        });
      },
      setCurrentUser: function setCurrentUser(user) {
        currentUserCache = user;
        user._cleanupAuthData();
        user._synchronizeAllAuthData();
        return DefaultController.updateUserOnDisk(user);
      },
      currentUser: function currentUser() {
        if (currentUserCache) {
          return currentUserCache;
        }
        if (currentUserCacheMatchesDisk) {
          return null;
        }
        if (_Storage2['default'].async()) {
          throw new Error('Cannot call currentUser() when using a platform with an async ' + 'storage system. Call currentUserAsync() instead.');
        }
        var path = _Storage2['default'].generatePath(CURRENT_USER_KEY);
        var userData = _Storage2['default'].getItem(path);
        currentUserCacheMatchesDisk = true;
        if (!userData) {
          currentUserCache = null;
          return null;
        }
        userData = JSON.parse(userData);
        if (!userData.className) {
          userData.className = '_User';
        }
        if (userData._id) {
          if (userData.objectId !== userData._id) {
            userData.objectId = userData._id;
          }
          delete userData._id;
        }
        if (userData._sessionToken) {
          userData.sessionToken = userData._sessionToken;
          delete userData._sessionToken;
        }
        var current = ParseUser.fromJSON(userData);
        currentUserCache = current;
        current._synchronizeAllAuthData();
        return current;
      },
      currentUserAsync: function currentUserAsync() {
        if (currentUserCache) {
          return _ParsePromise2['default'].as(currentUserCache);
        }
        if (currentUserCacheMatchesDisk) {
          return _ParsePromise2['default'].as(null);
        }
        var path = _Storage2['default'].generatePath(CURRENT_USER_KEY);
        return _Storage2['default'].getItemAsync(path).then(function(userData) {
          currentUserCacheMatchesDisk = true;
          if (!userData) {
            currentUserCache = null;
            return _ParsePromise2['default'].as(null);
          }
          userData = JSON.parse(userData);
          if (!userData.className) {
            userData.className = '_User';
          }
          if (userData._id) {
            if (userData.objectId !== userData._id) {
              userData.objectId = userData._id;
            }
            delete userData._id;
          }
          if (userData._sessionToken) {
            userData.sessionToken = userData._sessionToken;
            delete userData._sessionToken;
          }
          var current = ParseUser.fromJSON(userData);
          currentUserCache = current;
          current._synchronizeAllAuthData();
          return _ParsePromise2['default'].as(current);
        });
      },
      signUp: function signUp(user, attrs, options) {
        var username = attrs && attrs.username || user.get('username');
        var password = attrs && attrs.password || user.get('password');
        if (!username || !username.length) {
          return _ParsePromise2['default'].error(new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'Cannot sign up user with an empty name.'));
        }
        if (!password || !password.length) {
          return _ParsePromise2['default'].error(new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'Cannot sign up user with an empty password.'));
        }
        return user.save(attrs, options).then(function() {
          user._finishFetch({password: undefined});
          if (canUseCurrentUser) {
            return DefaultController.setCurrentUser(user);
          }
          return user;
        });
      },
      logIn: function logIn(user, options) {
        var RESTController = _CoreManager2['default'].getRESTController();
        var auth = {
          username: user.get('username'),
          password: user.get('password')
        };
        return RESTController.request('GET', 'login', auth, options).then(function(response, status) {
          user._migrateId(response.objectId);
          user._setExisted(true);
          ObjectState.setPendingOp(user.className, user._getId(), 'username', undefined);
          ObjectState.setPendingOp(user.className, user._getId(), 'password', undefined);
          response.password = undefined;
          user._finishFetch(response);
          if (!canUseCurrentUser) {
            return _ParsePromise2['default'].as(user);
          }
          return DefaultController.setCurrentUser(user);
        });
      },
      become: function become(options) {
        var user = new ParseUser();
        var RESTController = _CoreManager2['default'].getRESTController();
        return RESTController.request('GET', 'users/me', {}, options).then(function(response, status) {
          user._finishFetch(response);
          user._setExisted(true);
          return DefaultController.setCurrentUser(user);
        });
      },
      logOut: function logOut() {
        return DefaultController.currentUserAsync().then(function(currentUser) {
          var path = _Storage2['default'].generatePath(CURRENT_USER_KEY);
          var promise = _Storage2['default'].removeItemAsync(path);
          var RESTController = _CoreManager2['default'].getRESTController();
          if (currentUser !== null) {
            var currentSession = currentUser.getSessionToken();
            if (currentSession && (0, _isRevocableSession2['default'])(currentSession)) {
              promise = promise.then(function() {
                return RESTController.request('POST', 'logout', {}, {sessionToken: currentSession});
              });
            }
            currentUser._logOutWithAll();
            currentUser._finishFetch({sessionToken: undefined});
          }
          currentUserCacheMatchesDisk = true;
          currentUserCache = null;
          return promise;
        });
      },
      requestPasswordReset: function requestPasswordReset(email, options) {
        var RESTController = _CoreManager2['default'].getRESTController();
        return RESTController.request('POST', 'requestPasswordReset', {email: email}, options);
      },
      upgradeToRevocableSession: function upgradeToRevocableSession(user, options) {
        var token = user.getSessionToken();
        if (!token) {
          return _ParsePromise2['default'].error(new _ParseError2['default'](_ParseError2['default'].SESSION_MISSING, 'Cannot upgrade a user with no session token'));
        }
        options.sessionToken = token;
        var RESTController = _CoreManager2['default'].getRESTController();
        return RESTController.request('POST', 'upgradeToRevocableSession', {}, options).then(function(result) {
          var session = new _ParseSession2['default']();
          session._finishFetch(result);
          user._finishFetch({sessionToken: session.getSessionToken()});
          if (user.isCurrent()) {
            return DefaultController.setCurrentUser(user);
          }
          return _ParsePromise2['default'].as(user);
        });
      },
      linkWith: function linkWith(user, authData) {
        return user.save({authData: authData}).then(function() {
          if (canUseCurrentUser) {
            return DefaultController.setCurrentUser(user);
          }
          return user;
        });
      }
    };
    _CoreManager2['default'].setUserController(DefaultController);
    module.exports = exports['default'];
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("31", ["17", "32", "1b", "33"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = unsavedChildren;
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  function unsavedChildren(obj, allowDeepUnsaved) {
    var encountered = {
      objects: {},
      files: []
    };
    var identifier = obj.className + ':' + obj._getId();
    encountered.objects[identifier] = obj.dirty() ? obj : true;
    var attributes = obj.attributes;
    for (var attr in attributes) {
      if (typeof attributes[attr] === 'object') {
        traverse(attributes[attr], encountered, false, !!allowDeepUnsaved);
      }
    }
    var unsaved = [];
    for (var id in encountered.objects) {
      if (id !== identifier && encountered.objects[id] !== true) {
        unsaved.push(encountered.objects[id]);
      }
    }
    return unsaved.concat(encountered.files);
  }
  function traverse(obj, encountered, shouldThrow, allowDeepUnsaved) {
    if (obj instanceof _ParseObject2['default']) {
      if (!obj.id && shouldThrow) {
        throw new Error('Cannot create a pointer to an unsaved Object.');
      }
      var identifier = obj.className + ':' + obj._getId();
      if (!encountered.objects[identifier]) {
        encountered.objects[identifier] = obj.dirty() ? obj : true;
        var attributes = obj.attributes;
        for (var attr in attributes) {
          if (typeof attributes[attr] === 'object') {
            traverse(attributes[attr], encountered, !allowDeepUnsaved, allowDeepUnsaved);
          }
        }
      }
      return;
    }
    if (obj instanceof _ParseFile2['default']) {
      if (!obj.url() && encountered.files.indexOf(obj) < 0) {
        encountered.files.push(obj);
      }
      return;
    }
    if (obj instanceof _ParseRelation2['default']) {
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(function(el) {
        traverse(el, encountered, shouldThrow, allowDeepUnsaved);
      });
    }
    for (var k in obj) {
      if (typeof obj[k] === 'object') {
        traverse(obj[k], encountered, shouldThrow, allowDeepUnsaved);
      }
    }
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1d", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = parseDate;
  function parseDate(iso8601) {
    var regexp = new RegExp('^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})' + 'T' + '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})' + '(.([0-9]+))?' + 'Z$');
    var match = regexp.exec(iso8601);
    if (!match) {
      return null;
    }
    var year = match[1] || 0;
    var month = (match[2] || 1) - 1;
    var day = match[3] || 0;
    var hour = match[4] || 0;
    var minute = match[5] || 0;
    var second = match[6] || 0;
    var milli = match[8] || 0;
    return new Date(Date.UTC(year, month, day, hour, minute, second, milli));
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("34", ["d", "e", "17", "24"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  module.exports = (function() {
    function TaskQueue() {
      _classCallCheck(this, TaskQueue);
      this.queue = [];
    }
    _createClass(TaskQueue, [{
      key: 'enqueue',
      value: function enqueue(task) {
        var _this = this;
        var taskComplete = new _ParsePromise2['default']();
        this.queue.push({
          task: task,
          _completion: taskComplete
        });
        if (this.queue.length === 1) {
          task().then(function() {
            _this._dequeue();
            taskComplete.resolve();
          }, function(error) {
            _this._dequeue();
            taskComplete.reject(error);
          });
        }
        return taskComplete;
      }
    }, {
      key: '_dequeue',
      value: function _dequeue() {
        var _this2 = this;
        this.queue.shift();
        if (this.queue.length) {
          var next = this.queue[0];
          next.task().then(function() {
            _this2._dequeue();
            next._completion.resolve();
          }, function(error) {
            _this2._dequeue();
            next._completion.reject(error);
          });
        }
      }
    }]);
    return TaskQueue;
  })();
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("30", ["17", "21", "32", "1b", "24", "33", "34", "35"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports.getState = getState;
  exports.initializeState = initializeState;
  exports.removeState = removeState;
  exports.getServerData = getServerData;
  exports.setServerData = setServerData;
  exports.getPendingOps = getPendingOps;
  exports.setPendingOp = setPendingOp;
  exports.pushPendingState = pushPendingState;
  exports.popPendingState = popPendingState;
  exports.mergeFirstPendingState = mergeFirstPendingState;
  exports.getObjectCache = getObjectCache;
  exports.estimateAttribute = estimateAttribute;
  exports.estimateAttributes = estimateAttributes;
  exports.commitServerChanges = commitServerChanges;
  exports.enqueueTask = enqueueTask;
  exports._clearAllState = _clearAllState;
  var _encode = $__require('21');
  var _encode2 = _interopRequireDefault(_encode);
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  var _TaskQueue = $__require('34');
  var _TaskQueue2 = _interopRequireDefault(_TaskQueue);
  var _ParseOp = $__require('35');
  var objectState = {};
  function getState(className, id) {
    var classData = objectState[className];
    if (classData) {
      return classData[id] || null;
    }
    return null;
  }
  function initializeState(className, id, initial) {
    var state = getState(className, id);
    if (state) {
      return state;
    }
    if (!objectState[className]) {
      objectState[className] = {};
    }
    if (!initial) {
      initial = {
        serverData: {},
        pendingOps: [{}],
        objectCache: {},
        tasks: new _TaskQueue2['default'](),
        existed: false
      };
    }
    state = objectState[className][id] = initial;
    return state;
  }
  function removeState(className, id) {
    var state = getState(className, id);
    if (state === null) {
      return null;
    }
    delete objectState[className][id];
    return state;
  }
  function getServerData(className, id) {
    var state = getState(className, id);
    if (state) {
      return state.serverData;
    }
    return {};
  }
  function setServerData(className, id, attributes) {
    var data = initializeState(className, id).serverData;
    for (var attr in attributes) {
      if (typeof attributes[attr] !== 'undefined') {
        data[attr] = attributes[attr];
      } else {
        delete data[attr];
      }
    }
  }
  function getPendingOps(className, id) {
    var state = getState(className, id);
    if (state) {
      return state.pendingOps;
    }
    return [{}];
  }
  function setPendingOp(className, id, attr, op) {
    var pending = initializeState(className, id).pendingOps;
    var last = pending.length - 1;
    if (op) {
      pending[last][attr] = op;
    } else {
      delete pending[last][attr];
    }
  }
  function pushPendingState(className, id) {
    var pending = initializeState(className, id).pendingOps;
    pending.push({});
  }
  function popPendingState(className, id) {
    var pending = initializeState(className, id).pendingOps;
    var first = pending.shift();
    if (!pending.length) {
      pending[0] = {};
    }
    return first;
  }
  function mergeFirstPendingState(className, id) {
    var first = popPendingState(className, id);
    var pending = getPendingOps(className, id);
    var next = pending[0];
    for (var attr in first) {
      if (next[attr] && first[attr]) {
        var merged = next[attr].mergeWith(first[attr]);
        if (merged) {
          next[attr] = merged;
        }
      } else {
        next[attr] = first[attr];
      }
    }
  }
  function getObjectCache(className, id) {
    var state = getState(className, id);
    if (state) {
      return state.objectCache;
    }
    return {};
  }
  function estimateAttribute(className, id, attr) {
    var serverData = getServerData(className, id);
    var value = serverData[attr];
    var pending = getPendingOps(className, id);
    for (var i = 0; i < pending.length; i++) {
      if (pending[i][attr]) {
        if (pending[i][attr] instanceof _ParseOp.RelationOp) {
          value = pending[i][attr].applyTo(value, {
            className: className,
            id: id
          }, attr);
        } else {
          value = pending[i][attr].applyTo(value);
        }
      }
    }
    return value;
  }
  function estimateAttributes(className, id) {
    var data = {};
    var attr;
    var serverData = getServerData(className, id);
    for (attr in serverData) {
      data[attr] = serverData[attr];
    }
    var pending = getPendingOps(className, id);
    for (var i = 0; i < pending.length; i++) {
      for (attr in pending[i]) {
        if (pending[i][attr] instanceof _ParseOp.RelationOp) {
          data[attr] = pending[i][attr].applyTo(data[attr], {
            className: className,
            id: id
          }, attr);
        } else {
          data[attr] = pending[i][attr].applyTo(data[attr]);
        }
      }
    }
    return data;
  }
  function commitServerChanges(className, id, changes) {
    var state = initializeState(className, id);
    for (var attr in changes) {
      var val = changes[attr];
      state.serverData[attr] = val;
      if (val && typeof val === 'object' && !(val instanceof _ParseObject2['default']) && !(val instanceof _ParseFile2['default']) && !(val instanceof _ParseRelation2['default'])) {
        var json = (0, _encode2['default'])(val, false, true);
        state.objectCache[attr] = JSON.stringify(json);
      }
    }
  }
  function enqueueTask(className, id, task) {
    var state = initializeState(className, id);
    return state.tasks.enqueue(task);
  }
  function _clearAllState() {
    objectState = {};
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("22", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = escape;
  function escape(str) {
    return str.replace(/[&<>\/'"]/g, function(char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '/': '&#x2F;',
        '\'': '&#x27;',
        '"': '&quot;'
      })[char];
    });
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("36", ["37", "17", "38", "32", "39", "1b"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Object$keys = $__require('37')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = equals;
  var _ParseACL = $__require('38');
  var _ParseACL2 = _interopRequireDefault(_ParseACL);
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseGeoPoint = $__require('39');
  var _ParseGeoPoint2 = _interopRequireDefault(_ParseGeoPoint);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  function equals(a, b) {
    if (typeof a !== typeof b) {
      return false;
    }
    if (!a || typeof a !== 'object') {
      return a === b;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      for (var i = a.length; i--; ) {
        if (!equals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    if (a instanceof _ParseACL2['default'] || a instanceof _ParseFile2['default'] || a instanceof _ParseGeoPoint2['default'] || a instanceof _ParseObject2['default']) {
      return a.equals(b);
    }
    if (_Object$keys(a).length !== _Object$keys(b).length) {
      return false;
    }
    for (var k in a) {
      if (!equals(a[k], b[k])) {
        return false;
      }
    }
    return true;
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("19", ["d", "e", "17", "18", "21", "23", "39", "1b", "24", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var _createClass = $__require('d')['default'];
    var _classCallCheck = $__require('e')['default'];
    var _interopRequireDefault = $__require('17')['default'];
    Object.defineProperty(exports, '__esModule', {value: true});
    var _CoreManager = $__require('18');
    var _CoreManager2 = _interopRequireDefault(_CoreManager);
    var _encode = $__require('21');
    var _encode2 = _interopRequireDefault(_encode);
    var _ParseError = $__require('23');
    var _ParseError2 = _interopRequireDefault(_ParseError);
    var _ParseGeoPoint = $__require('39');
    var _ParseGeoPoint2 = _interopRequireDefault(_ParseGeoPoint);
    var _ParseObject = $__require('1b');
    var _ParseObject2 = _interopRequireDefault(_ParseObject);
    var _ParsePromise = $__require('24');
    var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
    function quote(s) {
      return '\\Q' + s.replace('\\E', '\\E\\\\E\\Q') + '\\E';
    }
    var ParseQuery = (function() {
      function ParseQuery(objectClass) {
        _classCallCheck(this, ParseQuery);
        if (typeof objectClass === 'string') {
          if (objectClass === 'User' && _CoreManager2['default'].get('PERFORM_USER_REWRITE')) {
            this.className = '_User';
          } else {
            this.className = objectClass;
          }
        } else if (objectClass instanceof _ParseObject2['default']) {
          this.className = objectClass.className;
        } else if (typeof objectClass === 'function') {
          if (typeof objectClass.className === 'string') {
            this.className = objectClass.className;
          } else {
            var obj = new objectClass();
            this.className = obj.className;
          }
        } else {
          throw new TypeError('A ParseQuery must be constructed with a ParseObject or class name.');
        }
        this._where = {};
        this._include = [];
        this._limit = -1;
        this._skip = 0;
        this._extraOptions = {};
      }
      _createClass(ParseQuery, [{
        key: '_orQuery',
        value: function _orQuery(queries) {
          var queryJSON = queries.map(function(q) {
            return q.toJSON().where;
          });
          this._where.$or = queryJSON;
          return this;
        }
      }, {
        key: '_addCondition',
        value: function _addCondition(key, condition, value) {
          if (!this._where[key] || typeof this._where[key] === 'string') {
            this._where[key] = {};
          }
          this._where[key][condition] = (0, _encode2['default'])(value, false, true);
          return this;
        }
      }, {
        key: 'toJSON',
        value: function toJSON() {
          var params = {where: this._where};
          if (this._include.length) {
            params.include = this._include.join(',');
          }
          if (this._select) {
            params.keys = this._select.join(',');
          }
          if (this._limit >= 0) {
            params.limit = this._limit;
          }
          if (this._skip > 0) {
            params.skip = this._skip;
          }
          if (this._order) {
            params.order = this._order.join(',');
          }
          for (var key in this._extraOptions) {
            params[key] = this._extraOptions[key];
          }
          return params;
        }
      }, {
        key: 'get',
        value: function get(objectId, options) {
          this.equalTo('objectId', objectId);
          var firstOptions = {};
          if (options && options.hasOwnProperty('useMasterKey')) {
            firstOptions.useMasterKey = options.useMasterKey;
          }
          if (options && options.hasOwnProperty('sessionToken')) {
            firstOptions.sessionToken = options.sessionToken;
          }
          return this.first(firstOptions).then(function(response) {
            if (response) {
              return response;
            }
            var errorObject = new _ParseError2['default'](_ParseError2['default'].OBJECT_NOT_FOUND, 'Object not found.');
            return _ParsePromise2['default'].error(errorObject);
          })._thenRunCallbacks(options, null);
        }
      }, {
        key: 'find',
        value: function find(options) {
          var _this = this;
          options = options || {};
          var findOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            findOptions.useMasterKey = options.useMasterKey;
          }
          if (options.hasOwnProperty('sessionToken')) {
            findOptions.sessionToken = options.sessionToken;
          }
          var controller = _CoreManager2['default'].getQueryController();
          return controller.find(this.className, this.toJSON(), findOptions).then(function(response) {
            return response.results.map(function(data) {
              data.className = _this.className;
              return _ParseObject2['default'].fromJSON(data);
            });
          })._thenRunCallbacks(options);
        }
      }, {
        key: 'count',
        value: function count(options) {
          options = options || {};
          var findOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            findOptions.useMasterKey = options.useMasterKey;
          }
          if (options.hasOwnProperty('sessionToken')) {
            findOptions.sessionToken = options.sessionToken;
          }
          var controller = _CoreManager2['default'].getQueryController();
          var params = this.toJSON();
          params.limit = 0;
          params.count = 1;
          return controller.find(this.className, params, findOptions).then(function(result) {
            return result.count;
          })._thenRunCallbacks(options);
        }
      }, {
        key: 'first',
        value: function first(options) {
          var _this2 = this;
          options = options || {};
          var findOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            findOptions.useMasterKey = options.useMasterKey;
          }
          if (options.hasOwnProperty('sessionToken')) {
            findOptions.sessionToken = options.sessionToken;
          }
          var controller = _CoreManager2['default'].getQueryController();
          var params = this.toJSON();
          params.limit = 1;
          return controller.find(this.className, params, findOptions).then(function(response) {
            var objects = response.results;
            if (!objects[0]) {
              return undefined;
            }
            objects[0].className = _this2.className;
            return _ParseObject2['default'].fromJSON(objects[0]);
          })._thenRunCallbacks(options);
        }
      }, {
        key: 'each',
        value: function each(callback, options) {
          options = options || {};
          if (this._order || this._skip || this._limit >= 0) {
            return _ParsePromise2['default'].error('Cannot iterate on a query with sort, skip, or limit.')._thenRunCallbacks(options);
          }
          var promise = new _ParsePromise2['default']();
          var query = new ParseQuery(this.className);
          query._limit = options.batchSize || 100;
          query._include = this._include.map(function(i) {
            return i;
          });
          if (this._select) {
            query._select = this._select.map(function(s) {
              return s;
            });
          }
          query._where = {};
          for (var attr in this._where) {
            var val = this._where[attr];
            if (Array.isArray(val)) {
              query._where[attr] = val.map(function(v) {
                return v;
              });
            } else if (val && typeof val === 'object') {
              var conditionMap = {};
              query._where[attr] = conditionMap;
              for (var cond in val) {
                conditionMap[cond] = val[cond];
              }
            } else {
              query._where[attr] = val;
            }
          }
          query.ascending('objectId');
          var findOptions = {};
          if (options.hasOwnProperty('useMasterKey')) {
            findOptions.useMasterKey = options.useMasterKey;
          }
          if (options.hasOwnProperty('sessionToken')) {
            findOptions.sessionToken = options.sessionToken;
          }
          var finished = false;
          return _ParsePromise2['default']._continueWhile(function() {
            return !finished;
          }, function() {
            return query.find(findOptions).then(function(results) {
              var callbacksDone = _ParsePromise2['default'].as();
              results.forEach(function(result) {
                callbacksDone = callbacksDone.then(function() {
                  return callback(result);
                });
              });
              return callbacksDone.then(function() {
                if (results.length >= query._limit) {
                  query.greaterThan('objectId', results[results.length - 1].id);
                } else {
                  finished = true;
                }
              });
            });
          })._thenRunCallbacks(options);
        }
      }, {
        key: 'equalTo',
        value: function equalTo(key, value) {
          if (typeof value === 'undefined') {
            return this.doesNotExist(key);
          }
          this._where[key] = (0, _encode2['default'])(value, false, true);
          return this;
        }
      }, {
        key: 'notEqualTo',
        value: function notEqualTo(key, value) {
          return this._addCondition(key, '$ne', value);
        }
      }, {
        key: 'lessThan',
        value: function lessThan(key, value) {
          return this._addCondition(key, '$lt', value);
        }
      }, {
        key: 'greaterThan',
        value: function greaterThan(key, value) {
          return this._addCondition(key, '$gt', value);
        }
      }, {
        key: 'lessThanOrEqualTo',
        value: function lessThanOrEqualTo(key, value) {
          return this._addCondition(key, '$lte', value);
        }
      }, {
        key: 'greaterThanOrEqualTo',
        value: function greaterThanOrEqualTo(key, value) {
          return this._addCondition(key, '$gte', value);
        }
      }, {
        key: 'containedIn',
        value: function containedIn(key, value) {
          return this._addCondition(key, '$in', value);
        }
      }, {
        key: 'notContainedIn',
        value: function notContainedIn(key, value) {
          return this._addCondition(key, '$nin', value);
        }
      }, {
        key: 'containsAll',
        value: function containsAll(key, values) {
          return this._addCondition(key, '$all', values);
        }
      }, {
        key: 'exists',
        value: function exists(key) {
          return this._addCondition(key, '$exists', true);
        }
      }, {
        key: 'doesNotExist',
        value: function doesNotExist(key) {
          return this._addCondition(key, '$exists', false);
        }
      }, {
        key: 'matches',
        value: function matches(key, regex, modifiers) {
          this._addCondition(key, '$regex', regex);
          if (!modifiers) {
            modifiers = '';
          }
          if (regex.ignoreCase) {
            modifiers += 'i';
          }
          if (regex.multiline) {
            modifiers += 'm';
          }
          if (modifiers.length) {
            this._addCondition(key, '$options', modifiers);
          }
          return this;
        }
      }, {
        key: 'matchesQuery',
        value: function matchesQuery(key, query) {
          var queryJSON = query.toJSON();
          queryJSON.className = query.className;
          return this._addCondition(key, '$inQuery', queryJSON);
        }
      }, {
        key: 'doesNotMatchQuery',
        value: function doesNotMatchQuery(key, query) {
          var queryJSON = query.toJSON();
          queryJSON.className = query.className;
          return this._addCondition(key, '$notInQuery', queryJSON);
        }
      }, {
        key: 'matchesKeyInQuery',
        value: function matchesKeyInQuery(key, queryKey, query) {
          var queryJSON = query.toJSON();
          queryJSON.className = query.className;
          return this._addCondition(key, '$select', {
            key: queryKey,
            query: queryJSON
          });
        }
      }, {
        key: 'doesNotMatchKeyInQuery',
        value: function doesNotMatchKeyInQuery(key, queryKey, query) {
          var queryJSON = query.toJSON();
          queryJSON.className = query.className;
          return this._addCondition(key, '$dontSelect', {
            key: queryKey,
            query: queryJSON
          });
        }
      }, {
        key: 'contains',
        value: function contains(key, value) {
          if (typeof value !== 'string') {
            throw new Error('The value being searched for must be a string.');
          }
          return this._addCondition(key, '$regex', quote(value));
        }
      }, {
        key: 'startsWith',
        value: function startsWith(key, value) {
          if (typeof value !== 'string') {
            throw new Error('The value being searched for must be a string.');
          }
          return this._addCondition(key, '$regex', '^' + quote(value));
        }
      }, {
        key: 'endsWith',
        value: function endsWith(key, value) {
          if (typeof value !== 'string') {
            throw new Error('The value being searched for must be a string.');
          }
          return this._addCondition(key, '$regex', quote(value) + '$');
        }
      }, {
        key: 'near',
        value: function near(key, point) {
          if (!(point instanceof _ParseGeoPoint2['default'])) {
            point = new _ParseGeoPoint2['default'](point);
          }
          return this._addCondition(key, '$nearSphere', point);
        }
      }, {
        key: 'withinRadians',
        value: function withinRadians(key, point, distance) {
          this.near(key, point);
          return this._addCondition(key, '$maxDistance', distance);
        }
      }, {
        key: 'withinMiles',
        value: function withinMiles(key, point, distance) {
          return this.withinRadians(key, point, distance / 3958.8);
        }
      }, {
        key: 'withinKilometers',
        value: function withinKilometers(key, point, distance) {
          return this.withinRadians(key, point, distance / 6371.0);
        }
      }, {
        key: 'withinGeoBox',
        value: function withinGeoBox(key, southwest, northeast) {
          if (!(southwest instanceof _ParseGeoPoint2['default'])) {
            southwest = new _ParseGeoPoint2['default'](southwest);
          }
          if (!(northeast instanceof _ParseGeoPoint2['default'])) {
            northeast = new _ParseGeoPoint2['default'](northeast);
          }
          this._addCondition(key, '$within', {'$box': [southwest, northeast]});
          return this;
        }
      }, {
        key: 'ascending',
        value: function ascending() {
          this._order = [];
          for (var _len = arguments.length,
              keys = Array(_len),
              _key = 0; _key < _len; _key++) {
            keys[_key] = arguments[_key];
          }
          return this.addAscending.apply(this, keys);
        }
      }, {
        key: 'addAscending',
        value: function addAscending() {
          var _this3 = this;
          if (!this._order) {
            this._order = [];
          }
          for (var _len2 = arguments.length,
              keys = Array(_len2),
              _key2 = 0; _key2 < _len2; _key2++) {
            keys[_key2] = arguments[_key2];
          }
          keys.forEach(function(key) {
            if (Array.isArray(key)) {
              key = key.join();
            }
            _this3._order = _this3._order.concat(key.replace(/\s/g, '').split(','));
          });
          return this;
        }
      }, {
        key: 'descending',
        value: function descending() {
          this._order = [];
          for (var _len3 = arguments.length,
              keys = Array(_len3),
              _key3 = 0; _key3 < _len3; _key3++) {
            keys[_key3] = arguments[_key3];
          }
          return this.addDescending.apply(this, keys);
        }
      }, {
        key: 'addDescending',
        value: function addDescending() {
          var _this4 = this;
          if (!this._order) {
            this._order = [];
          }
          for (var _len4 = arguments.length,
              keys = Array(_len4),
              _key4 = 0; _key4 < _len4; _key4++) {
            keys[_key4] = arguments[_key4];
          }
          keys.forEach(function(key) {
            if (Array.isArray(key)) {
              key = key.join();
            }
            _this4._order = _this4._order.concat(key.replace(/\s/g, '').split(',').map(function(k) {
              return '-' + k;
            }));
          });
          return this;
        }
      }, {
        key: 'skip',
        value: function skip(n) {
          if (typeof n !== 'number' || n < 0) {
            throw new Error('You can only skip by a positive number');
          }
          this._skip = n;
          return this;
        }
      }, {
        key: 'limit',
        value: function limit(n) {
          if (typeof n !== 'number') {
            throw new Error('You can only set the limit to a numeric value');
          }
          this._limit = n;
          return this;
        }
      }, {
        key: 'include',
        value: function include() {
          var _this5 = this;
          for (var _len5 = arguments.length,
              keys = Array(_len5),
              _key5 = 0; _key5 < _len5; _key5++) {
            keys[_key5] = arguments[_key5];
          }
          keys.forEach(function(key) {
            if (Array.isArray(key)) {
              _this5._include = _this5._include.concat(key);
            } else {
              _this5._include.push(key);
            }
          });
          return this;
        }
      }, {
        key: 'select',
        value: function select() {
          var _this6 = this;
          if (!this._select) {
            this._select = [];
          }
          for (var _len6 = arguments.length,
              keys = Array(_len6),
              _key6 = 0; _key6 < _len6; _key6++) {
            keys[_key6] = arguments[_key6];
          }
          keys.forEach(function(key) {
            if (Array.isArray(key)) {
              _this6._select = _this6._select.concat(key);
            } else {
              _this6._select.push(key);
            }
          });
          return this;
        }
      }], [{
        key: 'or',
        value: function or() {
          var className = null;
          for (var _len7 = arguments.length,
              queries = Array(_len7),
              _key7 = 0; _key7 < _len7; _key7++) {
            queries[_key7] = arguments[_key7];
          }
          queries.forEach(function(q) {
            if (!className) {
              className = q.className;
            }
            if (className !== q.className) {
              throw new Error('All queries must be for the same class.');
            }
          });
          var query = new ParseQuery(className);
          query._orQuery(queries);
          return query;
        }
      }]);
      return ParseQuery;
    })();
    exports['default'] = ParseQuery;
    _CoreManager2['default'].setQueryController({find: function find(className, params, options) {
        var RESTController = _CoreManager2['default'].getRESTController();
        return RESTController.request('GET', 'classes/' + className, params, options);
      }});
    module.exports = exports['default'];
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3a", ["17", "3b", "1b"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = unique;
  var _arrayContainsObject = $__require('3b');
  var _arrayContainsObject2 = _interopRequireDefault(_arrayContainsObject);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  function unique(arr) {
    var uniques = [];
    arr.forEach(function(value) {
      if (value instanceof _ParseObject2['default']) {
        if (!(0, _arrayContainsObject2['default'])(uniques, value)) {
          uniques.push(value);
        }
      } else {
        if (uniques.indexOf(value) < 0) {
          uniques.push(value);
        }
      }
    });
    return uniques;
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("39", ["d", "e", "17", "24"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  var ParseGeoPoint = (function() {
    function ParseGeoPoint(arg1, arg2) {
      _classCallCheck(this, ParseGeoPoint);
      if (Array.isArray(arg1)) {
        ParseGeoPoint._validate(arg1[0], arg1[1]);
        this._latitude = arg1[0];
        this._longitude = arg1[1];
      } else if (typeof arg1 === 'object') {
        ParseGeoPoint._validate(arg1.latitude, arg1.longitude);
        this._latitude = arg1.latitude;
        this._longitude = arg1.longitude;
      } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
        ParseGeoPoint._validate(arg1, arg2);
        this._latitude = arg1;
        this._longitude = arg2;
      } else {
        this._latitude = 0;
        this._longitude = 0;
      }
    }
    _createClass(ParseGeoPoint, [{
      key: 'toJSON',
      value: function toJSON() {
        ParseGeoPoint._validate(this._latitude, this._longitude);
        return {
          __type: 'GeoPoint',
          latitude: this._latitude,
          longitude: this._longitude
        };
      }
    }, {
      key: 'equals',
      value: function equals(other) {
        return other instanceof ParseGeoPoint && this.latitude === other.latitude && this.longitude === other.longitude;
      }
    }, {
      key: 'radiansTo',
      value: function radiansTo(point) {
        var d2r = Math.PI / 180.0;
        var lat1rad = this.latitude * d2r;
        var long1rad = this.longitude * d2r;
        var lat2rad = point.latitude * d2r;
        var long2rad = point.longitude * d2r;
        var sinDeltaLatDiv2 = Math.sin((lat1rad - lat2rad) / 2);
        var sinDeltaLongDiv2 = Math.sin((long1rad - long2rad) / 2);
        var a = sinDeltaLatDiv2 * sinDeltaLatDiv2 + Math.cos(lat1rad) * Math.cos(lat2rad) * sinDeltaLongDiv2 * sinDeltaLongDiv2;
        a = Math.min(1.0, a);
        return 2 * Math.asin(Math.sqrt(a));
      }
    }, {
      key: 'kilometersTo',
      value: function kilometersTo(point) {
        return this.radiansTo(point) * 6371.0;
      }
    }, {
      key: 'milesTo',
      value: function milesTo(point) {
        return this.radiansTo(point) * 3958.8;
      }
    }, {
      key: 'latitude',
      get: function get() {
        return this._latitude;
      },
      set: function set(val) {
        ParseGeoPoint._validate(val, this.longitude);
        this._latitude = val;
      }
    }, {
      key: 'longitude',
      get: function get() {
        return this._longitude;
      },
      set: function set(val) {
        ParseGeoPoint._validate(this.latitude, val);
        this._longitude = val;
      }
    }], [{
      key: '_validate',
      value: function _validate(latitude, longitude) {
        if (latitude !== latitude || longitude !== longitude) {
          throw new TypeError('GeoPoint latitude and longitude must be valid numbers');
        }
        if (latitude < -90.0) {
          throw new TypeError('GeoPoint latitude out of bounds: ' + latitude + ' < -90.0.');
        }
        if (latitude > 90.0) {
          throw new TypeError('GeoPoint latitude out of bounds: ' + latitude + ' > 90.0.');
        }
        if (longitude < -180.0) {
          throw new TypeError('GeoPoint longitude out of bounds: ' + longitude + ' < -180.0.');
        }
        if (longitude > 180.0) {
          throw new TypeError('GeoPoint longitude out of bounds: ' + longitude + ' > 180.0.');
        }
      }
    }, {
      key: 'current',
      value: function current(options) {
        var promise = new _ParsePromise2['default']();
        navigator.geolocation.getCurrentPosition(function(location) {
          promise.resolve(new ParseGeoPoint(location.coords.latitude, location.coords.longitude));
        }, function(error) {
          promise.reject(error);
        });
        return promise._thenRunCallbacks(options);
      }
    }]);
    return ParseGeoPoint;
  })();
  exports['default'] = ParseGeoPoint;
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("21", ["37", "17", "38", "32", "39", "1b", "35", "33"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Object$keys = $__require('37')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _ParseACL = $__require('38');
  var _ParseACL2 = _interopRequireDefault(_ParseACL);
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseGeoPoint = $__require('39');
  var _ParseGeoPoint2 = _interopRequireDefault(_ParseGeoPoint);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParseOp = $__require('35');
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  var toString = Object.prototype.toString;
  function encode(value, disallowObjects, forcePointers, seen) {
    if (value instanceof _ParseObject2['default']) {
      if (disallowObjects) {
        throw new Error('Parse Objects not allowed here');
      }
      var seenEntry = value.id ? value.className + ':' + value.id : value;
      if (forcePointers || !seen || seen.indexOf(seenEntry) > -1 || value.dirty() || _Object$keys(value._getServerData()).length < 1) {
        return value.toPointer();
      }
      seen = seen.concat(seenEntry);
      return value._toFullJSON(seen);
    }
    if (value instanceof _ParseOp.Op || value instanceof _ParseACL2['default'] || value instanceof _ParseGeoPoint2['default'] || value instanceof _ParseRelation2['default']) {
      return value.toJSON();
    }
    if (value instanceof _ParseFile2['default']) {
      if (!value.url()) {
        throw new Error('Tried to encode an unsaved file.');
      }
      return value.toJSON();
    }
    if (toString.call(value) === '[object Date]') {
      if (isNaN(value)) {
        throw new Error('Tried to encode an invalid date.');
      }
      return {
        __type: 'Date',
        iso: value.toJSON()
      };
    }
    if (toString.call(value) === '[object RegExp]' && typeof value.source === 'string') {
      return value.source;
    }
    if (Array.isArray(value)) {
      return value.map(function(v) {
        return encode(v, disallowObjects, forcePointers, seen);
      });
    }
    if (value && typeof value === 'object') {
      var output = {};
      for (var k in value) {
        output[k] = encode(value[k], disallowObjects, forcePointers, seen);
      }
      return output;
    }
    return value;
  }
  exports['default'] = function(value, disallowObjects, forcePointers, seen) {
    return encode(value, !!disallowObjects, !!forcePointers, seen || []);
  };
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3b", ["17", "1b"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = arrayContainsObject;
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  function arrayContainsObject(array, object) {
    if (array.indexOf(object) > -1) {
      return true;
    }
    for (var i = 0; i < array.length; i++) {
      if (array[i] instanceof _ParseObject2['default'] && array[i].className === object.className && array[i]._getId() === object._getId()) {
        return true;
      }
    }
    return false;
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("35", ["d", "e", "b", "c", "17", "3b", "20", "21", "1b", "33", "3a"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _get = $__require('b')['default'];
  var _inherits = $__require('c')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports.opFromJSON = opFromJSON;
  var _arrayContainsObject = $__require('3b');
  var _arrayContainsObject2 = _interopRequireDefault(_arrayContainsObject);
  var _decode = $__require('20');
  var _decode2 = _interopRequireDefault(_decode);
  var _encode = $__require('21');
  var _encode2 = _interopRequireDefault(_encode);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  var _unique = $__require('3a');
  var _unique2 = _interopRequireDefault(_unique);
  function opFromJSON(json) {
    if (!json || !json.__op) {
      return null;
    }
    switch (json.__op) {
      case 'Delete':
        return new UnsetOp();
      case 'Increment':
        return new IncrementOp(json.amount);
      case 'Add':
        return new AddOp((0, _decode2['default'])(json.objects));
      case 'AddUnique':
        return new AddUniqueOp((0, _decode2['default'])(json.objects));
      case 'Remove':
        return new RemoveOp((0, _decode2['default'])(json.objects));
      case 'AddRelation':
        var toAdd = (0, _decode2['default'])(json.objects);
        if (!Array.isArray(toAdd)) {
          return new RelationOp([], []);
        }
        return new RelationOp(toAdd, []);
      case 'RemoveRelation':
        var toRemove = (0, _decode2['default'])(json.objects);
        if (!Array.isArray(toRemove)) {
          return new RelationOp([], []);
        }
        return new RelationOp([], toRemove);
      case 'Batch':
        var toAdd = [];
        var toRemove = [];
        for (var i = 0; i < json.ops.length; i++) {
          if (json.ops[i].__op === 'AddRelation') {
            toAdd = toAdd.concat((0, _decode2['default'])(json.ops[i].objects));
          } else if (json.ops[i].__op === 'RemoveRelation') {
            toRemove = toRemove.concat((0, _decode2['default'])(json.ops[i].objects));
          }
        }
        return new RelationOp(toAdd, toRemove);
    }
    return null;
  }
  var Op = (function() {
    function Op() {
      _classCallCheck(this, Op);
    }
    _createClass(Op, [{
      key: 'applyTo',
      value: function applyTo(value) {}
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {}
    }, {
      key: 'toJSON',
      value: function toJSON() {}
    }]);
    return Op;
  })();
  exports.Op = Op;
  var SetOp = (function(_Op) {
    _inherits(SetOp, _Op);
    function SetOp(value) {
      _classCallCheck(this, SetOp);
      _get(Object.getPrototypeOf(SetOp.prototype), 'constructor', this).call(this);
      this._value = value;
    }
    _createClass(SetOp, [{
      key: 'applyTo',
      value: function applyTo(value) {
        return this._value;
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        return new SetOp(this._value);
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return (0, _encode2['default'])(this._value, false, true);
      }
    }]);
    return SetOp;
  })(Op);
  exports.SetOp = SetOp;
  var UnsetOp = (function(_Op2) {
    _inherits(UnsetOp, _Op2);
    function UnsetOp() {
      _classCallCheck(this, UnsetOp);
      _get(Object.getPrototypeOf(UnsetOp.prototype), 'constructor', this).apply(this, arguments);
    }
    _createClass(UnsetOp, [{
      key: 'applyTo',
      value: function applyTo(value) {
        return undefined;
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        return new UnsetOp();
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {__op: 'Delete'};
      }
    }]);
    return UnsetOp;
  })(Op);
  exports.UnsetOp = UnsetOp;
  var IncrementOp = (function(_Op3) {
    _inherits(IncrementOp, _Op3);
    function IncrementOp(amount) {
      _classCallCheck(this, IncrementOp);
      _get(Object.getPrototypeOf(IncrementOp.prototype), 'constructor', this).call(this);
      if (typeof amount !== 'number') {
        throw new TypeError('Increment Op must be initialized with a numeric amount.');
      }
      this._amount = amount;
    }
    _createClass(IncrementOp, [{
      key: 'applyTo',
      value: function applyTo(value) {
        if (typeof value === 'undefined') {
          return this._amount;
        }
        if (typeof value !== 'number') {
          throw new TypeError('Cannot increment a non-numeric value.');
        }
        return this._amount + value;
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        if (!previous) {
          return this;
        }
        if (previous instanceof SetOp) {
          return new SetOp(this.applyTo(previous._value));
        }
        if (previous instanceof UnsetOp) {
          return new SetOp(this._amount);
        }
        if (previous instanceof IncrementOp) {
          return new IncrementOp(this.applyTo(previous._amount));
        }
        throw new Error('Cannot merge Increment Op with the previous Op');
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          __op: 'Increment',
          amount: this._amount
        };
      }
    }]);
    return IncrementOp;
  })(Op);
  exports.IncrementOp = IncrementOp;
  var AddOp = (function(_Op4) {
    _inherits(AddOp, _Op4);
    function AddOp(value) {
      _classCallCheck(this, AddOp);
      _get(Object.getPrototypeOf(AddOp.prototype), 'constructor', this).call(this);
      this._value = Array.isArray(value) ? value : [value];
    }
    _createClass(AddOp, [{
      key: 'applyTo',
      value: function applyTo(value) {
        if (value == null) {
          return this._value;
        }
        if (Array.isArray(value)) {
          return value.concat(this._value);
        }
        throw new Error('Cannot add elements to a non-array value');
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        if (!previous) {
          return this;
        }
        if (previous instanceof SetOp) {
          return new SetOp(this.applyTo(previous._value));
        }
        if (previous instanceof UnsetOp) {
          return new SetOp(this._value);
        }
        if (previous instanceof AddOp) {
          return new AddOp(this.applyTo(previous._value));
        }
        throw new Error('Cannot merge Add Op with the previous Op');
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          __op: 'Add',
          objects: (0, _encode2['default'])(this._value, false, true)
        };
      }
    }]);
    return AddOp;
  })(Op);
  exports.AddOp = AddOp;
  var AddUniqueOp = (function(_Op5) {
    _inherits(AddUniqueOp, _Op5);
    function AddUniqueOp(value) {
      _classCallCheck(this, AddUniqueOp);
      _get(Object.getPrototypeOf(AddUniqueOp.prototype), 'constructor', this).call(this);
      this._value = (0, _unique2['default'])(Array.isArray(value) ? value : [value]);
    }
    _createClass(AddUniqueOp, [{
      key: 'applyTo',
      value: function applyTo(value) {
        if (value == null) {
          return this._value || [];
        }
        if (Array.isArray(value)) {
          var valueCopy = value;
          var toAdd = [];
          this._value.forEach(function(v) {
            if (v instanceof _ParseObject2['default']) {
              if (!(0, _arrayContainsObject2['default'])(valueCopy, v)) {
                toAdd.push(v);
              }
            } else {
              if (valueCopy.indexOf(v) < 0) {
                toAdd.push(v);
              }
            }
          });
          return value.concat(toAdd);
        }
        throw new Error('Cannot add elements to a non-array value');
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        if (!previous) {
          return this;
        }
        if (previous instanceof SetOp) {
          return new SetOp(this.applyTo(previous._value));
        }
        if (previous instanceof UnsetOp) {
          return new SetOp(this._value);
        }
        if (previous instanceof AddUniqueOp) {
          return new AddUniqueOp(this.applyTo(previous._value));
        }
        throw new Error('Cannot merge AddUnique Op with the previous Op');
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          __op: 'AddUnique',
          objects: (0, _encode2['default'])(this._value, false, true)
        };
      }
    }]);
    return AddUniqueOp;
  })(Op);
  exports.AddUniqueOp = AddUniqueOp;
  var RemoveOp = (function(_Op6) {
    _inherits(RemoveOp, _Op6);
    function RemoveOp(value) {
      _classCallCheck(this, RemoveOp);
      _get(Object.getPrototypeOf(RemoveOp.prototype), 'constructor', this).call(this);
      this._value = (0, _unique2['default'])(Array.isArray(value) ? value : [value]);
    }
    _createClass(RemoveOp, [{
      key: 'applyTo',
      value: function applyTo(value) {
        if (value == null) {
          return [];
        }
        if (Array.isArray(value)) {
          var i = value.indexOf(this._value);
          var removed = value.concat([]);
          for (var i = 0; i < this._value.length; i++) {
            var index = removed.indexOf(this._value[i]);
            while (index > -1) {
              removed.splice(index, 1);
              index = removed.indexOf(this._value[i]);
            }
            if (this._value[i] instanceof _ParseObject2['default'] && this._value[i].id) {
              for (var j = 0; j < removed.length; j++) {
                if (removed[j] instanceof _ParseObject2['default'] && this._value[i].id === removed[j].id) {
                  removed.splice(j, 1);
                  j--;
                }
              }
            }
          }
          return removed;
        }
        throw new Error('Cannot remove elements from a non-array value');
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        if (!previous) {
          return this;
        }
        if (previous instanceof SetOp) {
          return new SetOp(this.applyTo(previous._value));
        }
        if (previous instanceof UnsetOp) {
          return new UnsetOp();
        }
        if (previous instanceof RemoveOp) {
          var uniques = previous._value.concat([]);
          for (var i = 0; i < this._value.length; i++) {
            if (this._value[i] instanceof _ParseObject2['default']) {
              if (!(0, _arrayContainsObject2['default'])(uniques, this._value[i])) {
                uniques.push(this._value[i]);
              }
            } else {
              if (uniques.indexOf(this._value[i]) < 0) {
                uniques.push(this._value[i]);
              }
            }
          }
          return new RemoveOp(uniques);
        }
        throw new Error('Cannot merge Remove Op with the previous Op');
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          __op: 'Remove',
          objects: (0, _encode2['default'])(this._value, false, true)
        };
      }
    }]);
    return RemoveOp;
  })(Op);
  exports.RemoveOp = RemoveOp;
  var RelationOp = (function(_Op7) {
    _inherits(RelationOp, _Op7);
    function RelationOp(adds, removes) {
      _classCallCheck(this, RelationOp);
      _get(Object.getPrototypeOf(RelationOp.prototype), 'constructor', this).call(this);
      this._targetClassName = null;
      if (Array.isArray(adds)) {
        this.relationsToAdd = (0, _unique2['default'])(adds.map(this._extractId, this));
      }
      if (Array.isArray(removes)) {
        this.relationsToRemove = (0, _unique2['default'])(removes.map(this._extractId, this));
      }
    }
    _createClass(RelationOp, [{
      key: '_extractId',
      value: function _extractId(obj) {
        if (typeof obj === 'string') {
          return obj;
        }
        if (!obj.id) {
          throw new Error('You cannot add or remove an unsaved Parse Object from a relation');
        }
        if (!this._targetClassName) {
          this._targetClassName = obj.className;
        }
        if (this._targetClassName !== obj.className) {
          throw new Error('Tried to create a Relation with 2 different object types: ' + this._targetClassName + ' and ' + obj.className + '.');
        }
        return obj.id;
      }
    }, {
      key: 'applyTo',
      value: function applyTo(value, object, key) {
        if (!value) {
          var parent = new _ParseObject2['default'](object.className);
          if (object.id && object.id.indexOf('local') === 0) {
            parent._localId = object.id;
          } else if (object.id) {
            parent.id = object.id;
          }
          var relation = new _ParseRelation2['default'](parent, key);
          relation.targetClassName = this._targetClassName;
          return relation;
        }
        if (value instanceof _ParseRelation2['default']) {
          if (this._targetClassName) {
            if (value.targetClassName) {
              if (this._targetClassName !== value.targetClassName) {
                throw new Error('Related object must be a ' + value.targetClassName + ', but a ' + this._targetClassName + ' was passed in.');
              }
            } else {
              value.targetClassName = this._targetClassName;
            }
          }
          return value;
        } else {
          throw new Error('Relation cannot be applied to a non-relation field');
        }
      }
    }, {
      key: 'mergeWith',
      value: function mergeWith(previous) {
        if (!previous) {
          return this;
        } else if (previous instanceof UnsetOp) {
          throw new Error('You cannot modify a relation after deleting it.');
        } else if (previous instanceof RelationOp) {
          if (previous._targetClassName && previous._targetClassName !== this._targetClassName) {
            throw new Error('Related object must be of class ' + previous._targetClassName + ', but ' + (this._targetClassName || 'null') + ' was passed in.');
          }
          var newAdd = previous.relationsToAdd.concat([]);
          this.relationsToRemove.forEach(function(r) {
            var index = newAdd.indexOf(r);
            if (index > -1) {
              newAdd.splice(index, 1);
            }
          });
          this.relationsToAdd.forEach(function(r) {
            var index = newAdd.indexOf(r);
            if (index < 0) {
              newAdd.push(r);
            }
          });
          var newRemove = previous.relationsToRemove.concat([]);
          this.relationsToAdd.forEach(function(r) {
            var index = newRemove.indexOf(r);
            if (index > -1) {
              newRemove.splice(index, 1);
            }
          });
          this.relationsToRemove.forEach(function(r) {
            var index = newRemove.indexOf(r);
            if (index < 0) {
              newRemove.push(r);
            }
          });
          var newRelation = new RelationOp(newAdd, newRemove);
          newRelation._targetClassName = this._targetClassName;
          return newRelation;
        }
        throw new Error('Cannot merge Relation Op with the previous Op');
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        var _this = this;
        var idToPointer = function idToPointer(id) {
          return {
            __type: 'Pointer',
            className: _this._targetClassName,
            objectId: id
          };
        };
        var adds = null;
        var removes = null;
        var pointers = null;
        if (this.relationsToAdd.length > 0) {
          pointers = this.relationsToAdd.map(idToPointer);
          adds = {
            __op: 'AddRelation',
            objects: pointers
          };
        }
        if (this.relationsToRemove.length > 0) {
          pointers = this.relationsToRemove.map(idToPointer);
          removes = {
            __op: 'RemoveRelation',
            objects: pointers
          };
        }
        if (adds && removes) {
          return {
            __op: 'Batch',
            ops: [adds, removes]
          };
        }
        return adds || removes || {};
      }
    }]);
    return RelationOp;
  })(Op);
  exports.RelationOp = RelationOp;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("33", ["d", "e", "17", "35", "1b", "19"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _ParseOp = $__require('35');
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParseQuery = $__require('19');
  var _ParseQuery2 = _interopRequireDefault(_ParseQuery);
  var ParseRelation = (function() {
    function ParseRelation(parent, key) {
      _classCallCheck(this, ParseRelation);
      this.parent = parent;
      this.key = key;
      this.targetClassName = null;
    }
    _createClass(ParseRelation, [{
      key: '_ensureParentAndKey',
      value: function _ensureParentAndKey(parent, key) {
        this.key = this.key || key;
        if (this.key !== key) {
          throw new Error('Internal Error. Relation retrieved from two different keys.');
        }
        if (this.parent) {
          if (this.parent.className !== parent.className) {
            throw new Error('Internal Error. Relation retrieved from two different Objects.');
          }
          if (this.parent.id) {
            if (this.parent.id !== parent.id) {
              throw new Error('Internal Error. Relation retrieved from two different Objects.');
            }
          } else if (parent.id) {
            this.parent = parent;
          }
        } else {
          this.parent = parent;
        }
      }
    }, {
      key: 'add',
      value: function add(objects) {
        if (!Array.isArray(objects)) {
          objects = [objects];
        }
        var change = new _ParseOp.RelationOp(objects, []);
        this.parent.set(this.key, change);
        this.targetClassName = change._targetClassName;
        return this.parent;
      }
    }, {
      key: 'remove',
      value: function remove(objects) {
        if (!Array.isArray(objects)) {
          objects = [objects];
        }
        var change = new _ParseOp.RelationOp([], objects);
        this.parent.set(this.key, change);
        this.targetClassName = change._targetClassName;
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          __type: 'Relation',
          className: this.targetClassName
        };
      }
    }, {
      key: 'query',
      value: function query() {
        var query;
        if (!this.targetClassName) {
          query = new _ParseQuery2['default'](this.parent.className);
          query._extraOptions.redirectClassNameForKey = this.key;
        } else {
          query = new _ParseQuery2['default'](this.targetClassName);
        }
        query._addCondition('$relatedTo', 'object', {
          __type: 'Pointer',
          className: this.parent.className,
          objectId: this.parent.id
        });
        query._addCondition('$relatedTo', 'key', this.key);
        return query;
      }
    }]);
    return ParseRelation;
  })();
  exports['default'] = ParseRelation;
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("24", ["d", "e", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var _createClass = $__require('d')['default'];
    var _classCallCheck = $__require('e')['default'];
    Object.defineProperty(exports, '__esModule', {value: true});
    var _isPromisesAPlusCompliant = false;
    var ParsePromise = (function() {
      function ParsePromise() {
        _classCallCheck(this, ParsePromise);
        this._resolved = false;
        this._rejected = false;
        this._resolvedCallbacks = [];
        this._rejectedCallbacks = [];
      }
      _createClass(ParsePromise, [{
        key: 'resolve',
        value: function resolve() {
          if (this._resolved || this._rejected) {
            throw new Error('A promise was resolved even though it had already been ' + (this._resolved ? 'resolved' : 'rejected') + '.');
          }
          this._resolved = true;
          for (var _len = arguments.length,
              results = Array(_len),
              _key = 0; _key < _len; _key++) {
            results[_key] = arguments[_key];
          }
          this._result = results;
          for (var i = 0; i < this._resolvedCallbacks.length; i++) {
            this._resolvedCallbacks[i].apply(this, results);
          }
          this._resolvedCallbacks = [];
          this._rejectedCallbacks = [];
        }
      }, {
        key: 'reject',
        value: function reject(error) {
          if (this._resolved || this._rejected) {
            throw new Error('A promise was resolved even though it had already been ' + (this._resolved ? 'resolved' : 'rejected') + '.');
          }
          this._rejected = true;
          this._error = error;
          for (var i = 0; i < this._rejectedCallbacks.length; i++) {
            this._rejectedCallbacks[i](error);
          }
          this._resolvedCallbacks = [];
          this._rejectedCallbacks = [];
        }
      }, {
        key: 'then',
        value: function then(resolvedCallback, rejectedCallback) {
          var _this = this;
          var promise = new ParsePromise();
          var wrappedResolvedCallback = function wrappedResolvedCallback() {
            for (var _len2 = arguments.length,
                results = Array(_len2),
                _key2 = 0; _key2 < _len2; _key2++) {
              results[_key2] = arguments[_key2];
            }
            if (typeof resolvedCallback === 'function') {
              if (_isPromisesAPlusCompliant) {
                try {
                  results = [resolvedCallback.apply(this, results)];
                } catch (e) {
                  results = [ParsePromise.error(e)];
                }
              } else {
                results = [resolvedCallback.apply(this, results)];
              }
            }
            if (results.length === 1 && ParsePromise.is(results[0])) {
              results[0].then(function() {
                promise.resolve.apply(promise, arguments);
              }, function(error) {
                promise.reject(error);
              });
            } else {
              promise.resolve.apply(promise, results);
            }
          };
          var wrappedRejectedCallback = function wrappedRejectedCallback(error) {
            var result = [];
            if (typeof rejectedCallback === 'function') {
              if (_isPromisesAPlusCompliant) {
                try {
                  result = [rejectedCallback(error)];
                } catch (e) {
                  result = [ParsePromise.error(e)];
                }
              } else {
                result = [rejectedCallback(error)];
              }
              if (result.length === 1 && ParsePromise.is(result[0])) {
                result[0].then(function() {
                  promise.resolve.apply(promise, arguments);
                }, function(error) {
                  promise.reject(error);
                });
              } else {
                if (_isPromisesAPlusCompliant) {
                  promise.resolve.apply(promise, result);
                } else {
                  promise.reject(result[0]);
                }
              }
            } else {
              promise.reject(error);
            }
          };
          var runLater = function runLater(fn) {
            fn.call();
          };
          if (_isPromisesAPlusCompliant) {
            if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
              runLater = function(fn) {
                process.nextTick(fn);
              };
            } else if (typeof setTimeout === 'function') {
              runLater = function(fn) {
                setTimeout(fn, 0);
              };
            }
          }
          if (this._resolved) {
            runLater(function() {
              wrappedResolvedCallback.apply(_this, _this._result);
            });
          } else if (this._rejected) {
            runLater(function() {
              wrappedRejectedCallback(_this._error);
            });
          } else {
            this._resolvedCallbacks.push(wrappedResolvedCallback);
            this._rejectedCallbacks.push(wrappedRejectedCallback);
          }
          return promise;
        }
      }, {
        key: 'always',
        value: function always(callback) {
          return this.then(callback, callback);
        }
      }, {
        key: 'done',
        value: function done(callback) {
          return this.then(callback);
        }
      }, {
        key: 'fail',
        value: function fail(callback) {
          return this.then(null, callback);
        }
      }, {
        key: '_thenRunCallbacks',
        value: function _thenRunCallbacks(optionsOrCallback, model) {
          var options = {};
          if (typeof optionsOrCallback === 'function') {
            options.success = function(result) {
              optionsOrCallback(result, null);
            };
            options.error = function(error) {
              optionsOrCallback(null, error);
            };
          } else if (typeof optionsOrCallback === 'object') {
            if (typeof optionsOrCallback.success === 'function') {
              options.success = optionsOrCallback.success;
            }
            if (typeof optionsOrCallback.error === 'function') {
              options.error = optionsOrCallback.error;
            }
          }
          return this.then(function() {
            for (var _len3 = arguments.length,
                results = Array(_len3),
                _key3 = 0; _key3 < _len3; _key3++) {
              results[_key3] = arguments[_key3];
            }
            if (options.success) {
              options.success.apply(this, results);
            }
            return ParsePromise.as.apply(ParsePromise, arguments);
          }, function(error) {
            if (options.error) {
              if (typeof model !== 'undefined') {
                options.error(model, error);
              } else {
                options.error(error);
              }
            }
            return ParsePromise.error(error);
          });
        }
      }, {
        key: '_continueWith',
        value: function _continueWith(continuation) {
          return this.then(function() {
            return continuation(arguments, null);
          }, function(error) {
            return continuation(null, error);
          });
        }
      }], [{
        key: 'is',
        value: function is(promise) {
          return typeof promise !== 'undefined' && typeof promise.then === 'function';
        }
      }, {
        key: 'as',
        value: function as() {
          var promise = new ParsePromise();
          for (var _len4 = arguments.length,
              values = Array(_len4),
              _key4 = 0; _key4 < _len4; _key4++) {
            values[_key4] = arguments[_key4];
          }
          promise.resolve.apply(promise, values);
          return promise;
        }
      }, {
        key: 'error',
        value: function error() {
          var promise = new ParsePromise();
          for (var _len5 = arguments.length,
              errors = Array(_len5),
              _key5 = 0; _key5 < _len5; _key5++) {
            errors[_key5] = arguments[_key5];
          }
          promise.reject.apply(promise, errors);
          return promise;
        }
      }, {
        key: 'when',
        value: function when(promises) {
          var objects;
          if (Array.isArray(promises)) {
            objects = promises;
          } else {
            objects = arguments;
          }
          var total = objects.length;
          var hadError = false;
          var results = [];
          var errors = [];
          results.length = objects.length;
          errors.length = objects.length;
          if (total === 0) {
            return ParsePromise.as.apply(this, results);
          }
          var promise = new ParsePromise();
          var resolveOne = function resolveOne() {
            total--;
            if (total <= 0) {
              if (hadError) {
                promise.reject(errors);
              } else {
                promise.resolve.apply(promise, results);
              }
            }
          };
          var chain = function chain(object, index) {
            if (ParsePromise.is(object)) {
              object.then(function(result) {
                results[index] = result;
                resolveOne();
              }, function(error) {
                errors[index] = error;
                hadError = true;
                resolveOne();
              });
            } else {
              results[i] = object;
              resolveOne();
            }
          };
          for (var i = 0; i < objects.length; i++) {
            chain(objects[i], i);
          }
          return promise;
        }
      }, {
        key: '_continueWhile',
        value: function _continueWhile(predicate, asyncFunction) {
          if (predicate()) {
            return asyncFunction().then(function() {
              return ParsePromise._continueWhile(predicate, asyncFunction);
            });
          }
          return ParsePromise.as();
        }
      }, {
        key: 'isPromisesAPlusCompliant',
        value: function isPromisesAPlusCompliant() {
          return _isPromisesAPlusCompliant;
        }
      }, {
        key: 'enableAPlusCompliant',
        value: function enableAPlusCompliant() {
          _isPromisesAPlusCompliant = true;
        }
      }, {
        key: 'disableAPlusCompliant',
        value: function disableAPlusCompliant() {
          _isPromisesAPlusCompliant = false;
        }
      }]);
      return ParsePromise;
    })();
    exports['default'] = ParsePromise;
    module.exports = exports['default'];
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("32", ["d", "e", "17", "18", "24"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  function b64Digit(number) {
    if (number < 26) {
      return String.fromCharCode(65 + number);
    }
    if (number < 52) {
      return String.fromCharCode(97 + (number - 26));
    }
    if (number < 62) {
      return String.fromCharCode(48 + (number - 52));
    }
    if (number === 62) {
      return '+';
    }
    if (number === 63) {
      return '/';
    }
    throw new TypeError('Tried to encode large digit ' + number + ' in base64.');
  }
  var ParseFile = (function() {
    function ParseFile(name, data, type) {
      _classCallCheck(this, ParseFile);
      var specifiedType = type || '';
      this._name = name;
      if (Array.isArray(data)) {
        this._source = {
          format: 'base64',
          base64: ParseFile.encodeBase64(data),
          type: specifiedType
        };
      } else if (typeof File !== 'undefined' && data instanceof File) {
        this._source = {
          format: 'file',
          file: data,
          type: specifiedType
        };
      } else if (data && data.hasOwnProperty('base64')) {
        var matches = /^data:([a-zA-Z]*\/[a-zA-Z+.-]*);(charset=[a-zA-Z0-9\-\/\s]*,)?base64,(\S+)/.exec(data.base64);
        if (matches && matches.length > 0) {
          this._source = {
            format: 'base64',
            base64: matches.length === 4 ? matches[3] : matches[2],
            type: matches[1]
          };
        } else {
          this._source = {
            format: 'base64',
            base64: data.base64,
            type: specifiedType
          };
        }
      } else if (typeof data !== 'undefined') {
        throw new TypeError('Cannot create a Parse.File with that data.');
      }
    }
    _createClass(ParseFile, [{
      key: 'name',
      value: function name() {
        return this._name;
      }
    }, {
      key: 'url',
      value: function url() {
        return this._url;
      }
    }, {
      key: 'save',
      value: function save(options) {
        var _this = this;
        options = options || {};
        var controller = _CoreManager2['default'].getFileController();
        if (!this._previousSave) {
          if (this._source.format === 'file') {
            this._previousSave = controller.saveFile(this._name, this._source).then(function(res) {
              _this._name = res.name;
              _this._url = res.url;
              return _this;
            });
          } else {
            this._previousSave = controller.saveBase64(this._name, this._source).then(function(res) {
              _this._name = res.name;
              _this._url = res.url;
              return _this;
            });
          }
        }
        if (this._previousSave) {
          return this._previousSave._thenRunCallbacks(options);
        }
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          __type: 'File',
          name: this._name,
          url: this._url
        };
      }
    }, {
      key: 'equals',
      value: function equals(other) {
        if (this === other) {
          return true;
        }
        return other instanceof ParseFile && this.name() === other.name() && this.url() === other.url() && typeof this.url() !== 'undefined';
      }
    }], [{
      key: 'fromJSON',
      value: function fromJSON(obj) {
        if (obj.__type !== 'File') {
          throw new TypeError('JSON object does not represent a ParseFile');
        }
        var file = new ParseFile(obj.name);
        file._url = obj.url;
        return file;
      }
    }, {
      key: 'encodeBase64',
      value: function encodeBase64(bytes) {
        var chunks = [];
        chunks.length = Math.ceil(bytes.length / 3);
        for (var i = 0; i < chunks.length; i++) {
          var b1 = bytes[i * 3];
          var b2 = bytes[i * 3 + 1] || 0;
          var b3 = bytes[i * 3 + 2] || 0;
          var has2 = i * 3 + 1 < bytes.length;
          var has3 = i * 3 + 2 < bytes.length;
          chunks[i] = [b64Digit(b1 >> 2 & 0x3F), b64Digit(b1 << 4 & 0x30 | b2 >> 4 & 0x0F), has2 ? b64Digit(b2 << 2 & 0x3C | b3 >> 6 & 0x03) : '=', has3 ? b64Digit(b3 & 0x3F) : '='].join('');
        }
        return chunks.join('');
      }
    }]);
    return ParseFile;
  })();
  exports['default'] = ParseFile;
  _CoreManager2['default'].setFileController({
    saveFile: function saveFile(name, source) {
      if (source.format !== 'file') {
        throw new Error('saveFile can only be used with File-type sources.');
      }
      var headers = {
        'X-Parse-Application-ID': _CoreManager2['default'].get('APPLICATION_ID'),
        'X-Parse-JavaScript-Key': _CoreManager2['default'].get('JAVASCRIPT_KEY')
      };
      var url = _CoreManager2['default'].get('SERVER_URL');
      url += '/1/files/' + name;
      return _CoreManager2['default'].getRESTController().ajax('POST', url, source.file, headers);
    },
    saveBase64: function saveBase64(name, source) {
      if (source.format !== 'base64') {
        throw new Error('saveBase64 can only be used with Base64-type sources.');
      }
      var data = {base64: source.base64};
      if (source.type) {
        data._ContentType = source.type;
      }
      return _CoreManager2['default'].getRESTController().request('POST', 'files/' + name, data);
    }
  });
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3c", ["17", "32", "1b", "33"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = canBeSerialized;
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  function canBeSerialized(obj) {
    if (!(obj instanceof _ParseObject2['default'])) {
      return true;
    }
    var attributes = obj.attributes;
    for (var attr in attributes) {
      var val = attributes[attr];
      if (!canBeSerializedHelper(val)) {
        return false;
      }
    }
    return true;
  }
  function canBeSerializedHelper(value) {
    if (typeof value !== 'object') {
      return true;
    }
    if (value instanceof _ParseRelation2['default']) {
      return true;
    }
    if (value instanceof _ParseObject2['default']) {
      return !!value.id;
    }
    if (value instanceof _ParseFile2['default']) {
      if (value.url()) {
        return true;
      }
      return false;
    }
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        if (!canBeSerializedHelper(value[i])) {
          return false;
        }
      }
      return true;
    }
    for (var k in value) {
      if (!canBeSerializedHelper(value[k])) {
        return false;
      }
    }
    return true;
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("18", ["29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var config = {
      IS_NODE: typeof process !== 'undefined' && !!process.versions && !!process.versions.node,
      REQUEST_ATTEMPT_LIMIT: 5,
      SERVER_URL: 'https://api.parse.com',
      VERSION: '1.6.9',
      APPLICATION_ID: null,
      JAVASCRIPT_KEY: null,
      MASTER_KEY: null,
      USE_MASTER_KEY: false,
      PERFORM_USER_REWRITE: true,
      FORCE_REVOCABLE_SESSION: false
    };
    module.exports = {
      get: function get(key) {
        if (config.hasOwnProperty(key)) {
          return config[key];
        }
        throw new Error('Configuration key not found: ' + key);
      },
      set: function set(key, value) {
        config[key] = value;
      },
      setAnalyticsController: function setAnalyticsController(controller) {
        if (typeof controller.track !== 'function') {
          throw new Error('AnalyticsController must implement track()');
        }
        config['AnalyticsController'] = controller;
      },
      getAnalyticsController: function getAnalyticsController() {
        return config['AnalyticsController'];
      },
      setCloudController: function setCloudController(controller) {
        if (typeof controller.run !== 'function') {
          throw new Error('CloudController must implement run()');
        }
        config['CloudController'] = controller;
      },
      getCloudController: function getCloudController() {
        return config['CloudController'];
      },
      setConfigController: function setConfigController(controller) {
        if (typeof controller.current !== 'function') {
          throw new Error('ConfigController must implement current()');
        }
        if (typeof controller.get !== 'function') {
          throw new Error('ConfigController must implement get()');
        }
        config['ConfigController'] = controller;
      },
      getConfigController: function getConfigController() {
        return config['ConfigController'];
      },
      setFileController: function setFileController(controller) {
        if (typeof controller.saveFile !== 'function') {
          throw new Error('FileController must implement saveFile()');
        }
        if (typeof controller.saveBase64 !== 'function') {
          throw new Error('FileController must implement saveBase64()');
        }
        config['FileController'] = controller;
      },
      getFileController: function getFileController() {
        return config['FileController'];
      },
      setInstallationController: function setInstallationController(controller) {
        if (typeof controller.currentInstallationId !== 'function') {
          throw new Error('InstallationController must implement currentInstallationId()');
        }
        config['InstallationController'] = controller;
      },
      getInstallationController: function getInstallationController() {
        return config['InstallationController'];
      },
      setPushController: function setPushController(controller) {
        if (typeof controller.send !== 'function') {
          throw new Error('PushController must implement send()');
        }
        config['PushController'] = controller;
      },
      getPushController: function getPushController() {
        return config['PushController'];
      },
      setObjectController: function setObjectController(controller) {
        if (typeof controller.save !== 'function') {
          throw new Error('ObjectController must implement save()');
        }
        if (typeof controller.fetch !== 'function') {
          throw new Error('ObjectController must implement fetch()');
        }
        if (typeof controller.destroy !== 'function') {
          throw new Error('ObjectController must implement destroy()');
        }
        config['ObjectController'] = controller;
      },
      getObjectController: function getObjectController() {
        return config['ObjectController'];
      },
      setQueryController: function setQueryController(controller) {
        if (typeof controller.find !== 'function') {
          throw new Error('QueryController must implement find()');
        }
        config['QueryController'] = controller;
      },
      getQueryController: function getQueryController() {
        return config['QueryController'];
      },
      setRESTController: function setRESTController(controller) {
        if (typeof controller.request !== 'function') {
          throw new Error('RESTController must implement request()');
        }
        if (typeof controller.ajax !== 'function') {
          throw new Error('RESTController must implement ajax()');
        }
        config['RESTController'] = controller;
      },
      getRESTController: function getRESTController() {
        return config['RESTController'];
      },
      setSessionController: function setSessionController(controller) {
        if (typeof controller.getSession !== 'function') {
          throw new Error('A SessionController must implement getSession()');
        }
        config['SessionController'] = controller;
      },
      getSessionController: function getSessionController() {
        return config['SessionController'];
      },
      setStorageController: function setStorageController(controller) {
        if (controller.async) {
          if (typeof controller.getItemAsync !== 'function') {
            throw new Error('An async StorageController must implement getItemAsync()');
          }
          if (typeof controller.setItemAsync !== 'function') {
            throw new Error('An async StorageController must implement setItemAsync()');
          }
          if (typeof controller.removeItemAsync !== 'function') {
            throw new Error('An async StorageController must implement removeItemAsync()');
          }
        } else {
          if (typeof controller.getItem !== 'function') {
            throw new Error('A synchronous StorageController must implement getItem()');
          }
          if (typeof controller.setItem !== 'function') {
            throw new Error('A synchronous StorageController must implement setItem()');
          }
          if (typeof controller.removeItem !== 'function') {
            throw new Error('A synchonous StorageController must implement removeItem()');
          }
        }
        config['StorageController'] = controller;
      },
      getStorageController: function getStorageController() {
        return config['StorageController'];
      },
      setUserController: function setUserController(controller) {
        if (typeof controller.setCurrentUser !== 'function') {
          throw new Error('A UserController must implement setCurrentUser()');
        }
        if (typeof controller.currentUser !== 'function') {
          throw new Error('A UserController must implement currentUser()');
        }
        if (typeof controller.currentUserAsync !== 'function') {
          throw new Error('A UserController must implement currentUserAsync()');
        }
        if (typeof controller.signUp !== 'function') {
          throw new Error('A UserController must implement signUp()');
        }
        if (typeof controller.logIn !== 'function') {
          throw new Error('A UserController must implement logIn()');
        }
        if (typeof controller.become !== 'function') {
          throw new Error('A UserController must implement become()');
        }
        if (typeof controller.logOut !== 'function') {
          throw new Error('A UserController must implement logOut()');
        }
        if (typeof controller.requestPasswordReset !== 'function') {
          throw new Error('A UserController must implement requestPasswordReset()');
        }
        if (typeof controller.upgradeToRevocableSession !== 'function') {
          throw new Error('A UserController must implement upgradeToRevocableSession()');
        }
        if (typeof controller.linkWith !== 'function') {
          throw new Error('A UserController must implement linkWith()');
        }
        config['UserController'] = controller;
      },
      getUserController: function getUserController() {
        return config['UserController'];
      }
    };
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3d", ["3e", "3f"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isObject = $__require('3e');
  $__require('3f')('freeze', function($freeze) {
    return function freeze(it) {
      return $freeze && isObject(it) ? $freeze(it) : it;
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("40", ["3d", "41"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  $__require('3d');
  module.exports = $__require('41').Object.freeze;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("42", ["40"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('40'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1b", ["d", "e", "37", "42", "43", "2e", "17", "2f", "18", "3c", "20", "21", "36", "22", "30", "38", "1d", "23", "32", "35", "24", "19", "33", "3a", "31"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _Object$keys = $__require('37')['default'];
  var _Object$freeze = $__require('42')['default'];
  var _Object$create = $__require('43')['default'];
  var _Object$defineProperty = $__require('2e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  var _interopRequireWildcard = $__require('2f')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _canBeSerialized = $__require('3c');
  var _canBeSerialized2 = _interopRequireDefault(_canBeSerialized);
  var _decode = $__require('20');
  var _decode2 = _interopRequireDefault(_decode);
  var _encode = $__require('21');
  var _encode2 = _interopRequireDefault(_encode);
  var _equals = $__require('36');
  var _equals2 = _interopRequireDefault(_equals);
  var _escape2 = $__require('22');
  var _escape3 = _interopRequireDefault(_escape2);
  var _ObjectState = $__require('30');
  var ObjectState = _interopRequireWildcard(_ObjectState);
  var _ParseACL = $__require('38');
  var _ParseACL2 = _interopRequireDefault(_ParseACL);
  var _parseDate = $__require('1d');
  var _parseDate2 = _interopRequireDefault(_parseDate);
  var _ParseError = $__require('23');
  var _ParseError2 = _interopRequireDefault(_ParseError);
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseOp = $__require('35');
  var _ParsePromise = $__require('24');
  var _ParsePromise2 = _interopRequireDefault(_ParsePromise);
  var _ParseQuery = $__require('19');
  var _ParseQuery2 = _interopRequireDefault(_ParseQuery);
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  var _unique = $__require('3a');
  var _unique2 = _interopRequireDefault(_unique);
  var _unsavedChildren = $__require('31');
  var _unsavedChildren2 = _interopRequireDefault(_unsavedChildren);
  var classMap = {};
  var localCount = 0;
  var objectCount = 0;
  var singleInstance = !_CoreManager2['default'].get('IS_NODE');
  var ParseObject = (function() {
    function ParseObject(className, attributes, options) {
      _classCallCheck(this, ParseObject);
      var toSet = null;
      this._objCount = objectCount++;
      if (typeof className === 'string') {
        this.className = className;
        if (attributes && typeof attributes === 'object') {
          toSet = attributes;
        }
      } else if (className && typeof className === 'object') {
        this.className = className.className;
        toSet = {};
        for (var attr in className) {
          if (attr !== 'className') {
            toSet[attr] = className[attr];
          }
        }
        if (attributes && typeof attributes === 'object') {
          options = attributes;
        }
      }
      if (toSet && !this.set(toSet, options)) {
        throw new Error('Can\'t create an invalid Parse Object');
      }
      if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
      }
    }
    _createClass(ParseObject, [{
      key: '_getId',
      value: function _getId() {
        if (typeof this.id === 'string') {
          return this.id;
        }
        if (typeof this._localId === 'string') {
          return this._localId;
        }
        var localId = 'local' + String(localCount++);
        this._localId = localId;
        return localId;
      }
    }, {
      key: '_getStateIdentifier',
      value: function _getStateIdentifier() {
        if (typeof this.id === 'string') {
          if (singleInstance) {
            return this.id;
          }
          return this.id + '_' + String(this._objCount);
        }
        return this._getId();
      }
    }, {
      key: '_getServerData',
      value: function _getServerData() {
        return ObjectState.getServerData(this.className, this._getStateIdentifier());
      }
    }, {
      key: '_clearServerData',
      value: function _clearServerData() {
        var serverData = this._getServerData();
        var unset = {};
        for (var attr in serverData) {
          unset[attr] = undefined;
        }
        ObjectState.setServerData(this.className, this._getStateIdentifier(), unset);
      }
    }, {
      key: '_getPendingOps',
      value: function _getPendingOps() {
        return ObjectState.getPendingOps(this.className, this._getStateIdentifier());
      }
    }, {
      key: '_clearPendingOps',
      value: function _clearPendingOps() {
        var pending = this._getPendingOps();
        var latest = pending[pending.length - 1];
        var keys = _Object$keys(latest);
        keys.forEach(function(key) {
          delete latest[key];
        });
      }
    }, {
      key: '_getDirtyObjectAttributes',
      value: function _getDirtyObjectAttributes() {
        var attributes = this.attributes;
        var objectCache = ObjectState.getObjectCache(this.className, this._getStateIdentifier());
        var dirty = {};
        for (var attr in attributes) {
          var val = attributes[attr];
          if (val && typeof val === 'object' && !(val instanceof ParseObject) && !(val instanceof _ParseFile2['default']) && !(val instanceof _ParseRelation2['default'])) {
            var json = (0, _encode2['default'])(val, false, true);
            var stringified = JSON.stringify(json);
            if (objectCache[attr] !== stringified) {
              dirty[attr] = val;
            }
          }
        }
        return dirty;
      }
    }, {
      key: '_toFullJSON',
      value: function _toFullJSON(seen) {
        var json = this.toJSON(seen);
        json.__type = 'Object';
        json.className = this.className;
        return json;
      }
    }, {
      key: '_getSaveJSON',
      value: function _getSaveJSON() {
        var pending = this._getPendingOps();
        var dirtyObjects = this._getDirtyObjectAttributes();
        var json = {};
        var attr;
        for (attr in dirtyObjects) {
          json[attr] = new _ParseOp.SetOp(dirtyObjects[attr]).toJSON();
        }
        for (attr in pending[0]) {
          json[attr] = pending[0][attr].toJSON();
        }
        return json;
      }
    }, {
      key: '_getSaveParams',
      value: function _getSaveParams() {
        var method = this.id ? 'PUT' : 'POST';
        var body = this._getSaveJSON();
        var path = 'classes/' + this.className;
        if (this.id) {
          path += '/' + this.id;
        } else if (this.className === '_User') {
          path = 'users';
        }
        return {
          method: method,
          body: body,
          path: path
        };
      }
    }, {
      key: '_finishFetch',
      value: function _finishFetch(serverData) {
        if (!this.id && serverData.objectId) {
          this.id = serverData.objectId;
        }
        ObjectState.initializeState(this.className, this._getStateIdentifier());
        var decoded = {};
        for (var attr in serverData) {
          if (attr === 'ACL') {
            decoded[attr] = new _ParseACL2['default'](serverData[attr]);
          } else if (attr !== 'objectId') {
            decoded[attr] = (0, _decode2['default'])(serverData[attr]);
            if (decoded[attr] instanceof _ParseRelation2['default']) {
              decoded[attr]._ensureParentAndKey(this, attr);
            }
          }
        }
        if (decoded.createdAt && typeof decoded.createdAt === 'string') {
          decoded.createdAt = (0, _parseDate2['default'])(decoded.createdAt);
        }
        if (decoded.updatedAt && typeof decoded.updatedAt === 'string') {
          decoded.updatedAt = (0, _parseDate2['default'])(decoded.updatedAt);
        }
        if (!decoded.updatedAt && decoded.createdAt) {
          decoded.updatedAt = decoded.createdAt;
        }
        ObjectState.commitServerChanges(this.className, this._getStateIdentifier(), decoded);
      }
    }, {
      key: '_setExisted',
      value: function _setExisted(existed) {
        var state = ObjectState.getState(this.className, this._getStateIdentifier());
        if (state) {
          state.existed = existed;
        }
      }
    }, {
      key: '_migrateId',
      value: function _migrateId(serverId) {
        if (this._localId && serverId) {
          var oldState = ObjectState.removeState(this.className, this._getStateIdentifier());
          this.id = serverId;
          delete this._localId;
          if (oldState) {
            ObjectState.initializeState(this.className, this._getStateIdentifier(), oldState);
          }
        }
      }
    }, {
      key: '_handleSaveResponse',
      value: function _handleSaveResponse(response, status) {
        var changes = {};
        var attr;
        var pending = ObjectState.popPendingState(this.className, this._getStateIdentifier());
        for (attr in pending) {
          if (pending[attr] instanceof _ParseOp.RelationOp) {
            changes[attr] = pending[attr].applyTo(undefined, this, attr);
          } else if (!(attr in response)) {
            changes[attr] = pending[attr].applyTo(undefined);
          }
        }
        for (attr in response) {
          if ((attr === 'createdAt' || attr === 'updatedAt') && typeof response[attr] === 'string') {
            changes[attr] = (0, _parseDate2['default'])(response[attr]);
          } else if (attr !== 'objectId') {
            changes[attr] = (0, _decode2['default'])(response[attr]);
          }
        }
        if (changes.createdAt && !changes.updatedAt) {
          changes.updatedAt = changes.createdAt;
        }
        this._migrateId(response.objectId);
        if (status !== 201) {
          this._setExisted(true);
        }
        ObjectState.commitServerChanges(this.className, this._getStateIdentifier(), changes);
      }
    }, {
      key: '_handleSaveError',
      value: function _handleSaveError() {
        var pending = this._getPendingOps();
        ObjectState.mergeFirstPendingState(this.className, this._getStateIdentifier());
      }
    }, {
      key: 'initialize',
      value: function initialize() {}
    }, {
      key: 'toJSON',
      value: function toJSON(seen) {
        var seenEntry = this.id ? this.className + ':' + this.id : this;
        var seen = seen || [seenEntry];
        var json = {};
        var attrs = this.attributes;
        for (var attr in attrs) {
          if ((attr === 'createdAt' || attr === 'updatedAt') && attrs[attr].toJSON) {
            json[attr] = attrs[attr].toJSON();
          } else {
            json[attr] = (0, _encode2['default'])(attrs[attr], false, false, seen);
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
    }, {
      key: 'equals',
      value: function equals(other) {
        if (this === other) {
          return true;
        }
        return other instanceof ParseObject && this.className === other.className && this.id === other.id && typeof this.id !== 'undefined';
      }
    }, {
      key: 'dirty',
      value: function dirty(attr) {
        if (!this.id) {
          return true;
        }
        var pendingOps = this._getPendingOps();
        var dirtyObjects = this._getDirtyObjectAttributes();
        if (attr) {
          if (dirtyObjects.hasOwnProperty(attr)) {
            return true;
          }
          for (var i = 0; i < pendingOps.length; i++) {
            if (pendingOps[i].hasOwnProperty(attr)) {
              return true;
            }
          }
          return false;
        }
        if (_Object$keys(pendingOps[0]).length !== 0) {
          return true;
        }
        if (_Object$keys(dirtyObjects).length !== 0) {
          return true;
        }
        return false;
      }
    }, {
      key: 'dirtyKeys',
      value: function dirtyKeys() {
        var pendingOps = this._getPendingOps();
        var keys = {};
        for (var i = 0; i < pendingOps.length; i++) {
          for (var attr in pendingOps[i]) {
            keys[attr] = true;
          }
        }
        var dirtyObjects = this._getDirtyObjectAttributes();
        for (var attr in dirtyObjects) {
          keys[attr] = true;
        }
        return _Object$keys(keys);
      }
    }, {
      key: 'toPointer',
      value: function toPointer() {
        if (!this.id) {
          throw new Error('Cannot create a pointer to an unsaved ParseObject');
        }
        return {
          __type: 'Pointer',
          className: this.className,
          objectId: this.id
        };
      }
    }, {
      key: 'get',
      value: function get(attr) {
        return this.attributes[attr];
      }
    }, {
      key: 'relation',
      value: function relation(attr) {
        var value = this.get(attr);
        if (value) {
          if (!(value instanceof _ParseRelation2['default'])) {
            throw new Error('Called relation() on non-relation field ' + attr);
          }
          value._ensureParentAndKey(this, attr);
          return value;
        }
        return new _ParseRelation2['default'](this, attr);
      }
    }, {
      key: 'escape',
      value: function escape(attr) {
        var val = this.attributes[attr];
        if (val == null) {
          return '';
        }
        var str = val;
        if (typeof val !== 'string') {
          if (typeof val.toString !== 'function') {
            return '';
          }
          val = val.toString();
        }
        return (0, _escape3['default'])(val);
      }
    }, {
      key: 'has',
      value: function has(attr) {
        var attributes = this.attributes;
        if (attributes.hasOwnProperty(attr)) {
          return attributes[attr] != null;
        }
        return false;
      }
    }, {
      key: 'set',
      value: function set(key, value, options) {
        var changes = {};
        var newOps = {};
        if (key && typeof key === 'object') {
          changes = key;
          options = value;
        } else if (typeof key === 'string') {
          changes[key] = value;
        } else {
          return this;
        }
        options = options || {};
        var readonly = [];
        if (typeof this.constructor.readOnlyAttributes === 'function') {
          readonly = readonly.concat(this.constructor.readOnlyAttributes());
        }
        for (var k in changes) {
          if (k === 'createdAt' || k === 'updatedAt') {
            continue;
          }
          if (readonly.indexOf(k) > -1) {
            throw new Error('Cannot modify readonly attribute: ' + k);
          }
          if (options.unset) {
            newOps[k] = new _ParseOp.UnsetOp();
          } else if (changes[k] instanceof _ParseOp.Op) {
            newOps[k] = changes[k];
          } else if (changes[k] && typeof changes[k] === 'object' && typeof changes[k].__op === 'string') {
            newOps[k] = (0, _ParseOp.opFromJSON)(changes[k]);
          } else if (k === 'objectId' || k === 'id') {
            this.id = changes[k];
          } else if (k === 'ACL' && typeof changes[k] === 'object' && !(changes[k] instanceof _ParseACL2['default'])) {
            newOps[k] = new _ParseOp.SetOp(new _ParseACL2['default'](changes[k]));
          } else {
            newOps[k] = new _ParseOp.SetOp(changes[k]);
          }
        }
        var currentAttributes = this.attributes;
        var newValues = {};
        for (var attr in newOps) {
          if (newOps[attr] instanceof _ParseOp.RelationOp) {
            newValues[attr] = newOps[attr].applyTo(currentAttributes[attr], this, attr);
          } else if (!(newOps[attr] instanceof _ParseOp.UnsetOp)) {
            newValues[attr] = newOps[attr].applyTo(currentAttributes[attr]);
          }
        }
        if (!options.ignoreValidation) {
          var validation = this.validate(newValues);
          if (validation) {
            if (typeof options.error === 'function') {
              options.error(this, validation);
            }
            return false;
          }
        }
        var pendingOps = this._getPendingOps();
        var last = pendingOps.length - 1;
        for (var attr in newOps) {
          var nextOp = newOps[attr].mergeWith(pendingOps[last][attr]);
          ObjectState.setPendingOp(this.className, this._getStateIdentifier(), attr, nextOp);
        }
        return this;
      }
    }, {
      key: 'unset',
      value: function unset(attr, options) {
        options = options || {};
        options.unset = true;
        return this.set(attr, null, options);
      }
    }, {
      key: 'increment',
      value: function increment(attr, amount) {
        if (typeof amount === 'undefined') {
          amount = 1;
        }
        if (typeof amount !== 'number') {
          throw new Error('Cannot increment by a non-numeric amount.');
        }
        return this.set(attr, new _ParseOp.IncrementOp(amount));
      }
    }, {
      key: 'add',
      value: function add(attr, item) {
        return this.set(attr, new _ParseOp.AddOp([item]));
      }
    }, {
      key: 'addUnique',
      value: function addUnique(attr, item) {
        return this.set(attr, new _ParseOp.AddUniqueOp([item]));
      }
    }, {
      key: 'remove',
      value: function remove(attr, item) {
        return this.set(attr, new _ParseOp.RemoveOp([item]));
      }
    }, {
      key: 'op',
      value: function op(attr) {
        var pending = this._getPendingOps();
        for (var i = pending.length; i--; ) {
          if (pending[i][attr]) {
            return pending[i][attr];
          }
        }
      }
    }, {
      key: 'clone',
      value: function clone() {
        var clone = new this.constructor();
        if (clone.set) {
          clone.set(this.attributes);
        }
        if (!clone.className) {
          clone.className = this.className;
        }
        return clone;
      }
    }, {
      key: 'isNew',
      value: function isNew() {
        return !this.id;
      }
    }, {
      key: 'existed',
      value: function existed() {
        if (!this.id) {
          return false;
        }
        var state = ObjectState.getState(this.className, this._getStateIdentifier());
        if (state) {
          return state.existed;
        }
        return false;
      }
    }, {
      key: 'isValid',
      value: function isValid() {
        return !this.validate(this.attributes);
      }
    }, {
      key: 'validate',
      value: function validate(attrs) {
        if (attrs.hasOwnProperty('ACL') && !(attrs.ACL instanceof _ParseACL2['default'])) {
          return new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'ACL must be a Parse ACL.');
        }
        for (var key in attrs) {
          if (!/^[A-Za-z][0-9A-Za-z_]*$/.test(key)) {
            return new _ParseError2['default'](_ParseError2['default'].INVALID_KEY_NAME);
          }
        }
        return false;
      }
    }, {
      key: 'getACL',
      value: function getACL() {
        var acl = this.get('ACL');
        if (acl instanceof _ParseACL2['default']) {
          return acl;
        }
        return null;
      }
    }, {
      key: 'setACL',
      value: function setACL(acl, options) {
        return this.set('ACL', acl, options);
      }
    }, {
      key: 'clear',
      value: function clear() {
        var attributes = this.attributes;
        var erasable = {};
        var readonly = ['createdAt', 'updatedAt'];
        if (typeof this.constructor.readOnlyAttributes === 'function') {
          readonly = readonly.concat(this.constructor.readOnlyAttributes());
        }
        for (var attr in attributes) {
          if (readonly.indexOf(attr) < 0) {
            erasable[attr] = true;
          }
        }
        return this.set(erasable, {unset: true});
      }
    }, {
      key: 'fetch',
      value: function fetch(options) {
        options = options || {};
        var fetchOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          fetchOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          fetchOptions.sessionToken = options.sessionToken;
        }
        var controller = _CoreManager2['default'].getObjectController();
        return controller.fetch(this, true, fetchOptions)._thenRunCallbacks(options);
      }
    }, {
      key: 'save',
      value: function save(arg1, arg2, arg3) {
        var _this = this;
        var attrs;
        var options;
        if (typeof arg1 === 'object' || typeof arg1 === 'undefined') {
          attrs = arg1;
          options = arg2;
        } else {
          attrs = {};
          attrs[arg1] = arg2;
          options = arg3;
        }
        if (!options && attrs) {
          options = {};
          if (typeof attrs.success === 'function') {
            options.success = attrs.success;
            delete attrs.success;
          }
          if (typeof attrs.error === 'function') {
            options.error = attrs.error;
            delete attrs.error;
          }
        }
        if (attrs) {
          var validation = this.validate(attrs);
          if (validation) {
            if (options && typeof options.error === 'function') {
              options.error(this, validation);
            }
            return _ParsePromise2['default'].error(validation);
          }
          this.set(attrs, options);
        }
        options = options || {};
        var saveOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          saveOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          saveOptions.sessionToken = options.sessionToken;
        }
        var controller = _CoreManager2['default'].getObjectController();
        var unsaved = (0, _unsavedChildren2['default'])(this);
        return controller.save(unsaved, saveOptions).then(function() {
          return controller.save(_this, saveOptions);
        })._thenRunCallbacks(options, this);
      }
    }, {
      key: 'destroy',
      value: function destroy(options) {
        options = options || {};
        var destroyOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          destroyOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          destroyOptions.sessionToken = options.sessionToken;
        }
        if (!this.id) {
          return _ParsePromise2['default'].as()._thenRunCallbacks(options);
        }
        return _CoreManager2['default'].getObjectController().destroy(this, destroyOptions)._thenRunCallbacks(options);
      }
    }, {
      key: 'attributes',
      get: function get() {
        return _Object$freeze(ObjectState.estimateAttributes(this.className, this._getStateIdentifier()));
      }
    }, {
      key: 'createdAt',
      get: function get() {
        return this._getServerData().createdAt;
      }
    }, {
      key: 'updatedAt',
      get: function get() {
        return this._getServerData().updatedAt;
      }
    }], [{
      key: '_clearAllState',
      value: function _clearAllState() {
        ObjectState._clearAllState();
      }
    }, {
      key: 'fetchAll',
      value: function fetchAll(list, options) {
        var options = options || {};
        var queryOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          queryOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          queryOptions.sessionToken = options.sessionToken;
        }
        return _CoreManager2['default'].getObjectController().fetch(list, true, queryOptions)._thenRunCallbacks(options);
      }
    }, {
      key: 'fetchAllIfNeeded',
      value: function fetchAllIfNeeded(list, options) {
        var options = options || {};
        var queryOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          queryOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          queryOptions.sessionToken = options.sessionToken;
        }
        return _CoreManager2['default'].getObjectController().fetch(list, false, queryOptions)._thenRunCallbacks(options);
      }
    }, {
      key: 'destroyAll',
      value: function destroyAll(list, options) {
        var options = options || {};
        var destroyOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          destroyOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          destroyOptions.sessionToken = options.sessionToken;
        }
        return _CoreManager2['default'].getObjectController().destroy(list, destroyOptions)._thenRunCallbacks(options);
      }
    }, {
      key: 'saveAll',
      value: function saveAll(list, options) {
        var options = options || {};
        var saveOptions = {};
        if (options.hasOwnProperty('useMasterKey')) {
          saveOptions.useMasterKey = options.useMasterKey;
        }
        if (options.hasOwnProperty('sessionToken')) {
          saveOptions.sessionToken = options.sessionToken;
        }
        return _CoreManager2['default'].getObjectController().save(list, saveOptions)._thenRunCallbacks(options);
      }
    }, {
      key: 'createWithoutData',
      value: function createWithoutData(id) {
        var obj = new this();
        obj.id = id;
        return obj;
      }
    }, {
      key: 'fromJSON',
      value: function fromJSON(json) {
        if (!json.className) {
          throw new Error('Cannot create an object without a className');
        }
        var constructor = classMap[json.className];
        var o = constructor ? new constructor() : new ParseObject(json.className);
        var otherAttributes = {};
        for (var attr in json) {
          if (attr !== 'className' && attr !== '__type') {
            otherAttributes[attr] = json[attr];
          }
        }
        o._finishFetch(otherAttributes);
        if (json.objectId) {
          o._setExisted(true);
        }
        return o;
      }
    }, {
      key: 'registerSubclass',
      value: function registerSubclass(className, constructor) {
        if (typeof className !== 'string') {
          throw new TypeError('The first argument must be a valid class name.');
        }
        if (typeof constructor === 'undefined') {
          throw new TypeError('You must supply a subclass constructor.');
        }
        if (typeof constructor !== 'function') {
          throw new TypeError('You must register the subclass constructor. ' + 'Did you attempt to register an instance of the subclass?');
        }
        classMap[className] = constructor;
        if (!constructor.className) {
          constructor.className = className;
        }
      }
    }, {
      key: 'extend',
      value: function extend(className, protoProps, classProps) {
        if (typeof className !== 'string') {
          if (className && typeof className.className === 'string') {
            return ParseObject.extend(className.className, className, protoProps);
          } else {
            throw new Error('Parse.Object.extend\'s first argument should be the className.');
          }
        }
        var adjustedClassName = className;
        if (adjustedClassName === 'User' && _CoreManager2['default'].get('PERFORM_USER_REWRITE')) {
          adjustedClassName = '_User';
        }
        var parentProto = ParseObject.prototype;
        if (this.hasOwnProperty('__super__') && this.__super__) {
          parentProto = this.prototype;
        } else if (classMap[adjustedClassName]) {
          parentProto = classMap[adjustedClassName].prototype;
        }
        var ParseObjectSubclass = function ParseObjectSubclass(attributes, options) {
          this.className = adjustedClassName;
          this._objCount = objectCount++;
          if (attributes && typeof attributes === 'object') {
            if (!this.set(attributes || {}, options)) {
              throw new Error('Can\'t create an invalid Parse Object');
            }
          }
          if (typeof this.initialize === 'function') {
            this.initialize.apply(this, arguments);
          }
        };
        ParseObjectSubclass.className = adjustedClassName;
        ParseObjectSubclass.__super__ = parentProto;
        ParseObjectSubclass.prototype = _Object$create(parentProto, {constructor: {
            value: ParseObjectSubclass,
            enumerable: false,
            writable: true,
            configurable: true
          }});
        if (protoProps) {
          for (var prop in protoProps) {
            if (prop !== 'className') {
              _Object$defineProperty(ParseObjectSubclass.prototype, prop, {
                value: protoProps[prop],
                enumerable: false,
                writable: true,
                configurable: true
              });
            }
          }
        }
        if (classProps) {
          for (var prop in classProps) {
            if (prop !== 'className') {
              _Object$defineProperty(ParseObjectSubclass, prop, {
                value: classProps[prop],
                enumerable: false,
                writable: true,
                configurable: true
              });
            }
          }
        }
        ParseObjectSubclass.extend = function(name, protoProps, classProps) {
          if (typeof name === 'string') {
            return ParseObject.extend.call(ParseObjectSubclass, name, protoProps, classProps);
          }
          return ParseObject.extend.call(ParseObjectSubclass, adjustedClassName, name, protoProps);
        };
        ParseObjectSubclass.createWithoutData = ParseObject.createWithoutData;
        classMap[adjustedClassName] = ParseObjectSubclass;
        return ParseObjectSubclass;
      }
    }, {
      key: 'enableSingleInstance',
      value: function enableSingleInstance() {
        singleInstance = true;
      }
    }, {
      key: 'disableSingleInstance',
      value: function disableSingleInstance() {
        singleInstance = false;
      }
    }]);
    return ParseObject;
  })();
  exports['default'] = ParseObject;
  _CoreManager2['default'].setObjectController({
    fetch: function fetch(target, forceFetch, options) {
      if (Array.isArray(target)) {
        if (target.length < 1) {
          return _ParsePromise2['default'].as([]);
        }
        var objs = [];
        var ids = [];
        var className = null;
        var results = [];
        var error = null;
        target.forEach(function(el, i) {
          if (error) {
            return;
          }
          if (!className) {
            className = el.className;
          }
          if (className !== el.className) {
            error = new _ParseError2['default'](_ParseError2['default'].INVALID_CLASS_NAME, 'All objects should be of the same class');
          }
          if (!el.id) {
            error = new _ParseError2['default'](_ParseError2['default'].MISSING_OBJECT_ID, 'All objects must have an ID');
          }
          if (forceFetch || _Object$keys(el._getServerData()).length === 0) {
            ids.push(el.id);
            objs.push(el);
          }
          results.push(el);
        });
        if (error) {
          return _ParsePromise2['default'].error(error);
        }
        var query = new _ParseQuery2['default'](className);
        query.containedIn('objectId', ids);
        query._limit = ids.length;
        return query.find(options).then(function(objects) {
          var idMap = {};
          objects.forEach(function(o) {
            idMap[o.id] = o;
          });
          for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            if (!obj || !obj.id || !idMap[obj.id]) {
              if (forceFetch) {
                return _ParsePromise2['default'].error(new _ParseError2['default'](_ParseError2['default'].OBJECT_NOT_FOUND, 'All objects must exist on the server.'));
              }
            }
          }
          if (!singleInstance) {
            for (var i = 0; i < results.length; i++) {
              var obj = results[i];
              if (obj && obj.id && idMap[obj.id]) {
                var id = obj.id;
                obj._finishFetch(idMap[id].toJSON());
                results[i] = idMap[id];
              }
            }
          }
          return _ParsePromise2['default'].as(results);
        });
      } else {
        var RESTController = _CoreManager2['default'].getRESTController();
        return RESTController.request('GET', 'classes/' + target.className + '/' + target._getId(), {}, options).then(function(response, status, xhr) {
          if (target instanceof ParseObject) {
            target._clearPendingOps();
            target._finishFetch(response);
          }
          return target;
        });
      }
    },
    destroy: function destroy(target, options) {
      var RESTController = _CoreManager2['default'].getRESTController();
      if (Array.isArray(target)) {
        if (target.length < 1) {
          return _ParsePromise2['default'].as([]);
        }
        var batches = [[]];
        target.forEach(function(obj) {
          if (!obj.id) {
            return;
          }
          batches[batches.length - 1].push(obj);
          if (batches[batches.length - 1].length >= 20) {
            batches.push([]);
          }
        });
        if (batches[batches.length - 1].length === 0) {
          batches.pop();
        }
        var deleteCompleted = _ParsePromise2['default'].as();
        var errors = [];
        batches.forEach(function(batch) {
          deleteCompleted = deleteCompleted.then(function() {
            return RESTController.request('POST', 'batch', {requests: batch.map(function(obj) {
                return {
                  method: 'DELETE',
                  path: '/1/classes/' + obj.className + '/' + obj._getId(),
                  body: {}
                };
              })}, options).then(function(results) {
              for (var i = 0; i < results.length; i++) {
                if (results[i] && results[i].hasOwnProperty('error')) {
                  var err = new _ParseError2['default'](results[i].error.code, results[i].error.error);
                  err.object = batch[i];
                  errors.push(err);
                }
              }
            });
          });
        });
        return deleteCompleted.then(function() {
          if (errors.length) {
            var aggregate = new _ParseError2['default'](_ParseError2['default'].AGGREGATE_ERROR);
            aggregate.errors = errors;
            return _ParsePromise2['default'].error(aggregate);
          }
          return _ParsePromise2['default'].as(target);
        });
      } else if (target instanceof ParseObject) {
        return RESTController.request('DELETE', 'classes/' + target.className + '/' + target._getId(), {}, options).then(function() {
          return _ParsePromise2['default'].as(target);
        });
      }
      return _ParsePromise2['default'].as(target);
    },
    save: function save(target, options) {
      var RESTController = _CoreManager2['default'].getRESTController();
      if (Array.isArray(target)) {
        if (target.length < 1) {
          return _ParsePromise2['default'].as([]);
        }
        var unsaved = target.concat();
        for (var i = 0; i < target.length; i++) {
          if (target[i] instanceof ParseObject) {
            unsaved = unsaved.concat((0, _unsavedChildren2['default'])(target[i], true));
          }
        }
        unsaved = (0, _unique2['default'])(unsaved);
        var filesSaved = _ParsePromise2['default'].as();
        var pending = [];
        unsaved.forEach(function(el) {
          if (el instanceof _ParseFile2['default']) {
            filesSaved = filesSaved.then(function() {
              return el.save();
            });
          } else if (el instanceof ParseObject) {
            pending.push(el);
          }
        });
        return filesSaved.then(function() {
          var objectError = null;
          return _ParsePromise2['default']._continueWhile(function() {
            return pending.length > 0;
          }, function() {
            var batch = [];
            var nextPending = [];
            pending.forEach(function(el) {
              if (batch.length < 20 && (0, _canBeSerialized2['default'])(el)) {
                batch.push(el);
              } else {
                nextPending.push(el);
              }
            });
            pending = nextPending;
            if (batch.length < 1) {
              return _ParsePromise2['default'].error(new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'Tried to save a batch with a cycle.'));
            }
            var batchReturned = new _ParsePromise2['default']();
            var batchReady = [];
            var batchTasks = [];
            batch.forEach(function(obj, index) {
              var ready = new _ParsePromise2['default']();
              batchReady.push(ready);
              var task = function task() {
                ready.resolve();
                return batchReturned.then(function(responses, status) {
                  if (responses[index].hasOwnProperty('success')) {
                    obj._handleSaveResponse(responses[index].success, status);
                  } else {
                    if (!objectError && responses[index].hasOwnProperty('error')) {
                      var serverError = responses[index].error;
                      objectError = new _ParseError2['default'](serverError.code, serverError.error);
                      pending = [];
                    }
                    obj._handleSaveError();
                  }
                });
              };
              ObjectState.pushPendingState(obj.className, obj._getStateIdentifier());
              batchTasks.push(ObjectState.enqueueTask(obj.className, obj._getStateIdentifier(), task));
            });
            _ParsePromise2['default'].when(batchReady).then(function() {
              return RESTController.request('POST', 'batch', {requests: batch.map(function(obj) {
                  var params = obj._getSaveParams();
                  params.path = '/1/' + params.path;
                  return params;
                })}, options);
            }).then(function(response, status, xhr) {
              batchReturned.resolve(response, status);
            });
            return _ParsePromise2['default'].when(batchTasks);
          }).then(function() {
            if (objectError) {
              return _ParsePromise2['default'].error(objectError);
            }
            return _ParsePromise2['default'].as(target);
          });
        });
      } else if (target instanceof ParseObject) {
        var targetCopy = target;
        var task = function task() {
          var params = targetCopy._getSaveParams();
          return RESTController.request(params.method, params.path, params.body, options).then(function(response, status) {
            targetCopy._handleSaveResponse(response, status);
          }, function(error) {
            targetCopy._handleSaveError();
            return _ParsePromise2['default'].error(error);
          });
        };
        ObjectState.pushPendingState(target.className, target._getStateIdentifier());
        return ObjectState.enqueueTask(target.className, target._getStateIdentifier(), task).then(function() {
          return target;
        }, function(error) {
          return error;
        });
      }
      return _ParsePromise2['default'].as();
    }
  });
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("23", ["e"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _classCallCheck = $__require('e')["default"];
  Object.defineProperty(exports, "__esModule", {value: true});
  var ParseError = function ParseError(code, message) {
    _classCallCheck(this, ParseError);
    this.code = code;
    this.message = message;
  };
  ;
  exports["default"] = ParseError;
  ParseError.OTHER_CAUSE = -1;
  ParseError.INTERNAL_SERVER_ERROR = 1;
  ParseError.CONNECTION_FAILED = 100;
  ParseError.OBJECT_NOT_FOUND = 101;
  ParseError.INVALID_QUERY = 102;
  ParseError.INVALID_CLASS_NAME = 103;
  ParseError.MISSING_OBJECT_ID = 104;
  ParseError.INVALID_KEY_NAME = 105;
  ParseError.INVALID_POINTER = 106;
  ParseError.INVALID_JSON = 107;
  ParseError.COMMAND_UNAVAILABLE = 108;
  ParseError.NOT_INITIALIZED = 109;
  ParseError.INCORRECT_TYPE = 111;
  ParseError.INVALID_CHANNEL_NAME = 112;
  ParseError.PUSH_MISCONFIGURED = 115;
  ParseError.OBJECT_TOO_LARGE = 116;
  ParseError.OPERATION_FORBIDDEN = 119;
  ParseError.CACHE_MISS = 120;
  ParseError.INVALID_NESTED_KEY = 121;
  ParseError.INVALID_FILE_NAME = 122;
  ParseError.INVALID_ACL = 123;
  ParseError.TIMEOUT = 124;
  ParseError.INVALID_EMAIL_ADDRESS = 125;
  ParseError.MISSING_CONTENT_TYPE = 126;
  ParseError.MISSING_CONTENT_LENGTH = 127;
  ParseError.INVALID_CONTENT_LENGTH = 128;
  ParseError.FILE_TOO_LARGE = 129;
  ParseError.FILE_SAVE_ERROR = 130;
  ParseError.DUPLICATE_VALUE = 137;
  ParseError.INVALID_ROLE_NAME = 139;
  ParseError.EXCEEDED_QUOTA = 140;
  ParseError.SCRIPT_FAILED = 141;
  ParseError.VALIDATION_ERROR = 142;
  ParseError.INVALID_IMAGE_DATA = 143;
  ParseError.UNSAVED_FILE_ERROR = 151;
  ParseError.INVALID_PUSH_TIME_ERROR = 152;
  ParseError.FILE_DELETE_ERROR = 153;
  ParseError.REQUEST_LIMIT_EXCEEDED = 155;
  ParseError.INVALID_EVENT_NAME = 160;
  ParseError.USERNAME_MISSING = 200;
  ParseError.PASSWORD_MISSING = 201;
  ParseError.USERNAME_TAKEN = 202;
  ParseError.EMAIL_TAKEN = 203;
  ParseError.EMAIL_MISSING = 204;
  ParseError.EMAIL_NOT_FOUND = 205;
  ParseError.SESSION_MISSING = 206;
  ParseError.MUST_CREATE_USER_THROUGH_SIGNUP = 207;
  ParseError.ACCOUNT_ALREADY_LINKED = 208;
  ParseError.INVALID_SESSION_TOKEN = 209;
  ParseError.LINKED_ID_MISSING = 250;
  ParseError.INVALID_LINKED_SESSION = 251;
  ParseError.UNSUPPORTED_SERVICE = 252;
  ParseError.AGGREGATE_ERROR = 600;
  ParseError.FILE_READ_ERROR = 601;
  ParseError.X_DOMAIN_REQUEST = 602;
  module.exports = exports["default"];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("44", ["b", "c", "d", "e", "17", "38", "23", "1b"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _get = $__require('b')['default'];
  var _inherits = $__require('c')['default'];
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _ParseACL = $__require('38');
  var _ParseACL2 = _interopRequireDefault(_ParseACL);
  var _ParseError = $__require('23');
  var _ParseError2 = _interopRequireDefault(_ParseError);
  var _ParseObject2 = $__require('1b');
  var _ParseObject3 = _interopRequireDefault(_ParseObject2);
  var ParseRole = (function(_ParseObject) {
    _inherits(ParseRole, _ParseObject);
    function ParseRole(name, acl) {
      _classCallCheck(this, ParseRole);
      _get(Object.getPrototypeOf(ParseRole.prototype), 'constructor', this).call(this, '_Role');
      if (typeof name === 'string' && acl instanceof _ParseACL2['default']) {
        this.setName(name);
        this.setACL(acl);
      }
    }
    _createClass(ParseRole, [{
      key: 'getName',
      value: function getName() {
        return this.get('name');
      }
    }, {
      key: 'setName',
      value: function setName(name, options) {
        return this.set('name', name, options);
      }
    }, {
      key: 'getUsers',
      value: function getUsers() {
        return this.relation('users');
      }
    }, {
      key: 'getRoles',
      value: function getRoles() {
        return this.relation('roles');
      }
    }, {
      key: 'validate',
      value: function validate(attrs, options) {
        var isInvalid = _get(Object.getPrototypeOf(ParseRole.prototype), 'validate', this).call(this, attrs, options);
        if (isInvalid) {
          return isInvalid;
        }
        if ('name' in attrs && attrs.name !== this.getName()) {
          var newName = attrs.name;
          if (this.id && this.id !== attrs.objectId) {
            return new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'A role\'s name can only be set before it has been saved.');
          }
          if (typeof newName !== 'string') {
            return new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'A role\'s name must be a String.');
          }
          if (!/^[0-9a-zA-Z\-_ ]+$/.test(newName)) {
            return new _ParseError2['default'](_ParseError2['default'].OTHER_CAUSE, 'A role\'s name can be only contain alphanumeric characters, _, ' + '-, and spaces.');
          }
        }
        return false;
      }
    }]);
    return ParseRole;
  })(_ParseObject3['default']);
  exports['default'] = ParseRole;
  _ParseObject3['default'].registerSubclass('_Role', ParseRole);
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("45", ["46", "3f"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toObject = $__require('46');
  $__require('3f')('keys', function($keys) {
    return function keys(it) {
      return $keys(toObject(it));
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("47", ["45", "41"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  $__require('45');
  module.exports = $__require('41').Object.keys;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("37", ["47"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('47'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("38", ["d", "e", "37", "17", "44", "1e"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _createClass = $__require('d')['default'];
  var _classCallCheck = $__require('e')['default'];
  var _Object$keys = $__require('37')['default'];
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  var _ParseRole = $__require('44');
  var _ParseRole2 = _interopRequireDefault(_ParseRole);
  var _ParseUser = $__require('1e');
  var _ParseUser2 = _interopRequireDefault(_ParseUser);
  var PUBLIC_KEY = '*';
  var ParseACL = (function() {
    function ParseACL(arg1) {
      _classCallCheck(this, ParseACL);
      this.permissionsById = {};
      if (arg1 && typeof arg1 === 'object') {
        if (arg1 instanceof _ParseUser2['default']) {
          this.setReadAccess(arg1, true);
          this.setWriteAccess(arg1, true);
        } else {
          for (var userId in arg1) {
            var accessList = arg1[userId];
            if (typeof userId !== 'string') {
              throw new TypeError('Tried to create an ACL with an invalid user id.');
            }
            this.permissionsById[userId] = {};
            for (var permission in accessList) {
              var allowed = accessList[permission];
              if (permission !== 'read' && permission !== 'write') {
                throw new TypeError('Tried to create an ACL with an invalid permission type.');
              }
              if (typeof allowed !== 'boolean') {
                throw new TypeError('Tried to create an ACL with an invalid permission value.');
              }
              this.permissionsById[userId][permission] = allowed;
            }
          }
        }
      } else if (typeof arg1 === 'function') {
        throw new TypeError('ParseACL constructed with a function. Did you forget ()?');
      }
    }
    _createClass(ParseACL, [{
      key: 'toJSON',
      value: function toJSON() {
        var permissions = {};
        for (var p in this.permissionsById) {
          permissions[p] = this.permissionsById[p];
        }
        return permissions;
      }
    }, {
      key: 'equals',
      value: function equals(other) {
        if (!(other instanceof ParseACL)) {
          return false;
        }
        var users = _Object$keys(this.permissionsById);
        var otherUsers = _Object$keys(other.permissionsById);
        if (users.length !== otherUsers.length) {
          return false;
        }
        for (var u in this.permissionsById) {
          if (!other.permissionsById[u]) {
            return false;
          }
          if (this.permissionsById[u].read !== other.permissionsById[u].read) {
            return false;
          }
          if (this.permissionsById[u].write !== other.permissionsById[u].write) {
            return false;
          }
        }
        return true;
      }
    }, {
      key: '_setAccess',
      value: function _setAccess(accessType, userId, allowed) {
        if (userId instanceof _ParseUser2['default']) {
          userId = userId.id;
        } else if (userId instanceof _ParseRole2['default']) {
          userId = 'role:' + userId.getName();
        }
        if (typeof userId !== 'string') {
          throw new TypeError('userId must be a string.');
        }
        if (typeof allowed !== 'boolean') {
          throw new TypeError('allowed must be either true or false.');
        }
        var permissions = this.permissionsById[userId];
        if (!permissions) {
          if (!allowed) {
            return;
          } else {
            permissions = {};
            this.permissionsById[userId] = permissions;
          }
        }
        if (allowed) {
          this.permissionsById[userId][accessType] = true;
        } else {
          delete permissions[accessType];
          if (_Object$keys(permissions).length === 0) {
            delete this.permissionsById[userId];
          }
        }
      }
    }, {
      key: '_getAccess',
      value: function _getAccess(accessType, userId) {
        if (userId instanceof _ParseUser2['default']) {
          userId = userId.id;
        } else if (userId instanceof _ParseRole2['default']) {
          userId = 'role:' + userId.getName();
        }
        var permissions = this.permissionsById[userId];
        if (!permissions) {
          return false;
        }
        return !!permissions[accessType];
      }
    }, {
      key: 'setReadAccess',
      value: function setReadAccess(userId, allowed) {
        this._setAccess('read', userId, allowed);
      }
    }, {
      key: 'getReadAccess',
      value: function getReadAccess(userId) {
        return this._getAccess('read', userId);
      }
    }, {
      key: 'setWriteAccess',
      value: function setWriteAccess(userId, allowed) {
        this._setAccess('write', userId, allowed);
      }
    }, {
      key: 'getWriteAccess',
      value: function getWriteAccess(userId) {
        return this._getAccess('write', userId);
      }
    }, {
      key: 'setPublicReadAccess',
      value: function setPublicReadAccess(allowed) {
        this.setReadAccess(PUBLIC_KEY, allowed);
      }
    }, {
      key: 'getPublicReadAccess',
      value: function getPublicReadAccess() {
        return this.getReadAccess(PUBLIC_KEY);
      }
    }, {
      key: 'setPublicWriteAccess',
      value: function setPublicWriteAccess(allowed) {
        this.setWriteAccess(PUBLIC_KEY, allowed);
      }
    }, {
      key: 'getPublicWriteAccess',
      value: function getPublicWriteAccess() {
        return this.getWriteAccess(PUBLIC_KEY);
      }
    }, {
      key: 'getRoleReadAccess',
      value: function getRoleReadAccess(role) {
        if (role instanceof _ParseRole2['default']) {
          role = role.getName();
        }
        if (typeof role !== 'string') {
          throw new TypeError('role must be a ParseRole or a String');
        }
        return this.getReadAccess('role:' + role);
      }
    }, {
      key: 'getRoleWriteAccess',
      value: function getRoleWriteAccess(role) {
        if (role instanceof _ParseRole2['default']) {
          role = role.getName();
        }
        if (typeof role !== 'string') {
          throw new TypeError('role must be a ParseRole or a String');
        }
        return this.getWriteAccess('role:' + role);
      }
    }, {
      key: 'setRoleReadAccess',
      value: function setRoleReadAccess(role, allowed) {
        if (role instanceof _ParseRole2['default']) {
          role = role.getName();
        }
        if (typeof role !== 'string') {
          throw new TypeError('role must be a ParseRole or a String');
        }
        this.setReadAccess('role:' + role, allowed);
      }
    }, {
      key: 'setRoleWriteAccess',
      value: function setRoleWriteAccess(role, allowed) {
        if (role instanceof _ParseRole2['default']) {
          role = role.getName();
        }
        if (typeof role !== 'string') {
          throw new TypeError('role must be a ParseRole or a String');
        }
        this.setWriteAccess('role:' + role, allowed);
      }
    }]);
    return ParseACL;
  })();
  exports['default'] = ParseACL;
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("20", ["17", "38", "32", "39", "1b", "35", "33"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  Object.defineProperty(exports, '__esModule', {value: true});
  exports['default'] = decode;
  var _ParseACL = $__require('38');
  var _ParseACL2 = _interopRequireDefault(_ParseACL);
  var _ParseFile = $__require('32');
  var _ParseFile2 = _interopRequireDefault(_ParseFile);
  var _ParseGeoPoint = $__require('39');
  var _ParseGeoPoint2 = _interopRequireDefault(_ParseGeoPoint);
  var _ParseObject = $__require('1b');
  var _ParseObject2 = _interopRequireDefault(_ParseObject);
  var _ParseOp = $__require('35');
  var _ParseRelation = $__require('33');
  var _ParseRelation2 = _interopRequireDefault(_ParseRelation);
  function decode(value) {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      var dup = [];
      value.forEach(function(v, i) {
        dup[i] = decode(v);
      });
      return dup;
    }
    if (typeof value.__op === 'string') {
      return (0, _ParseOp.opFromJSON)(value);
    }
    if (value.__type === 'Pointer' && value.className) {
      return _ParseObject2['default'].fromJSON(value);
    }
    if (value.__type === 'Object' && value.className) {
      return _ParseObject2['default'].fromJSON(value);
    }
    if (value.__type === 'Relation') {
      var relation = new _ParseRelation2['default'](null, null);
      relation.targetClassName = value.className;
      return relation;
    }
    if (value.__type === 'Date') {
      return new Date(value.iso);
    }
    if (value.__type === 'File') {
      return _ParseFile2['default'].fromJSON(value);
    }
    if (value.__type === 'GeoPoint') {
      return new _ParseGeoPoint2['default']({
        latitude: value.latitude,
        longitude: value.longitude
      });
    }
    var copy = {};
    for (var k in value) {
      copy[k] = decode(value[k]);
    }
    return copy;
  }
  module.exports = exports['default'];
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2f", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports["default"] = function(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};
      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key))
            newObj[key] = obj[key];
        }
      }
      newObj["default"] = obj;
      return newObj;
    }
  };
  exports.__esModule = true;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("17", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports["default"] = function(obj) {
    return obj && obj.__esModule ? obj : {"default": obj};
  };
  exports.__esModule = true;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("48", ["17", "2f", "20", "21", "18", "2a", "35", "28", "38", "27", "26", "1f", "23", "1c", "32", "39", "1a", "1b", "24", "16", "19", "33", "44", "2c", "25", "1e"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _interopRequireDefault = $__require('17')['default'];
  var _interopRequireWildcard = $__require('2f')['default'];
  var _decode = $__require('20');
  var _decode2 = _interopRequireDefault(_decode);
  var _encode = $__require('21');
  var _encode2 = _interopRequireDefault(_encode);
  var _CoreManager = $__require('18');
  var _CoreManager2 = _interopRequireDefault(_CoreManager);
  var _InstallationController = $__require('2a');
  var _InstallationController2 = _interopRequireDefault(_InstallationController);
  var _ParseOp = $__require('35');
  var ParseOp = _interopRequireWildcard(_ParseOp);
  var _RESTController = $__require('28');
  var _RESTController2 = _interopRequireDefault(_RESTController);
  var Parse = {
    initialize: function initialize(applicationId, javaScriptKey) {
      if ('browser' === 'browser' && _CoreManager2['default'].get('IS_NODE')) {
        console.log('It looks like you\'re using the browser version of the SDK in a ' + 'node.js environment. You should require(\'parse/node\') instead.');
      }
      Parse._initialize(applicationId, javaScriptKey);
    },
    _initialize: function _initialize(applicationId, javaScriptKey, masterKey) {
      _CoreManager2['default'].set('APPLICATION_ID', applicationId);
      _CoreManager2['default'].set('JAVASCRIPT_KEY', javaScriptKey);
      _CoreManager2['default'].set('MASTER_KEY', masterKey);
      _CoreManager2['default'].set('USE_MASTER_KEY', false);
    }
  };
  Object.defineProperty(Parse, 'applicationId', {
    get: function get() {
      return _CoreManager2['default'].get('APPLICATION_ID');
    },
    set: function set(value) {
      _CoreManager2['default'].set('APPLICATION_ID', value);
    }
  });
  Object.defineProperty(Parse, 'javaScriptKey', {
    get: function get() {
      return _CoreManager2['default'].get('JAVASCRIPT_KEY');
    },
    set: function set(value) {
      _CoreManager2['default'].set('JAVASCRIPT_KEY', value);
    }
  });
  Object.defineProperty(Parse, 'masterKey', {
    get: function get() {
      return _CoreManager2['default'].get('MASTER_KEY');
    },
    set: function set(value) {
      _CoreManager2['default'].set('MASTER_KEY', value);
    }
  });
  Object.defineProperty(Parse, 'serverURL', {
    get: function get() {
      return _CoreManager2['default'].get('SERVER_URL');
    },
    set: function set(value) {
      _CoreManager2['default'].set('SERVER_URL', value);
    }
  });
  Parse.ACL = $__require('38');
  Parse.Analytics = $__require('27');
  Parse.Cloud = $__require('26');
  Parse.CoreManager = $__require('18');
  Parse.Config = $__require('1f');
  Parse.Error = $__require('23');
  Parse.FacebookUtils = $__require('1c');
  Parse.File = $__require('32');
  Parse.GeoPoint = $__require('39');
  Parse.Installation = $__require('1a');
  Parse.Object = $__require('1b');
  Parse.Op = {
    Set: ParseOp.SetOp,
    Unset: ParseOp.UnsetOp,
    Increment: ParseOp.IncrementOp,
    Add: ParseOp.AddOp,
    Remove: ParseOp.RemoveOp,
    AddUnique: ParseOp.AddUniqueOp,
    Relation: ParseOp.RelationOp
  };
  Parse.Promise = $__require('24');
  Parse.Push = $__require('16');
  Parse.Query = $__require('19');
  Parse.Relation = $__require('33');
  Parse.Role = $__require('44');
  Parse.Session = $__require('2c');
  Parse.Storage = $__require('25');
  Parse.User = $__require('1e');
  Parse._request = function() {
    for (var _len = arguments.length,
        args = Array(_len),
        _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return _CoreManager2['default'].getRESTController().request.apply(null, args);
  };
  Parse._ajax = function() {
    for (var _len2 = arguments.length,
        args = Array(_len2),
        _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return _CoreManager2['default'].getRESTController().ajax.apply(null, args);
  };
  Parse._decode = function(_, value) {
    return (0, _decode2['default'])(value);
  };
  Parse._encode = function(value, _, disallowObjects) {
    return (0, _encode2['default'])(value, disallowObjects);
  };
  Parse._getInstallationId = function() {
    return _CoreManager2['default'].getInstallationController().currentInstallationId();
  };
  _CoreManager2['default'].setInstallationController(_InstallationController2['default']);
  _CoreManager2['default'].setRESTController(_RESTController2['default']);
  Parse.Parse = Parse;
  module.exports = Parse;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("49", ["48"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('48');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6", ["49"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('49');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("46", ["4a"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var defined = $__require('4a');
  module.exports = function(it) {
    return Object(defined(it));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4b", ["4c", "4d", "46", "4e", "4f", "50", "51", "52"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ctx = $__require('4c'),
      $export = $__require('4d'),
      toObject = $__require('46'),
      call = $__require('4e'),
      isArrayIter = $__require('4f'),
      toLength = $__require('50'),
      getIterFn = $__require('51');
  $export($export.S + $export.F * !$__require('52')(function(iter) {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("53", ["54", "4b", "41"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  $__require('54');
  $__require('4b');
  module.exports = $__require('41').Array.from;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("55", ["53"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('53'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("11", ["55"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Array$from = $__require('55')["default"];
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
  global.define = __define;
  return module.exports;
});

$__System.register('13', ['4', '8', '11', 'd', 'e'], function (_export) {
   var _, BackboneProxy, _toConsumableArray, _createClass, _classCallCheck, s_ADD_METHOD, s_CB, s_MODEL_MATCHER, Utils;

   return {
      setters: [function (_3) {
         _ = _3['default'];
      }, function (_4) {
         BackboneProxy = _4['default'];
      }, function (_2) {
         _toConsumableArray = _2['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
      }],
      execute: function () {

         // Private / internal methods ---------------------------------------------------------------------------------------

         /**
          * Creates an optimized function that dispatches to an associated Underscore function.
          *
          * @param {number}   length      - Length of variables for given Underscore method to dispatch.
          * @param {string}   method      - Function name of Underscore to invoke.
          * @param {string}   attribute   - Attribute to associate with the Underscore function invoked.
          * @returns {Function}
          */
         'use strict';

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

         Utils = (function () {
            function Utils() {
               _classCallCheck(this, Utils);
            }

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
      }
   };
});

$__System.register('f', ['4', 'd', 'e'], function (_export) {
   var _, _createClass, _classCallCheck, s_EVENT_SPLITTER, s_EVENTS_API, s_INTERNAL_ON, s_OFF_API, s_ON_API, s_ONCE_MAP, s_TRIGGER_API, s_TRIGGER_EVENTS, Events;

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
      }],
      execute: function () {

         // Private / internal methods ---------------------------------------------------------------------------------------

         /**
          * Regular expression used to split event strings.
          * @type {RegExp}
          */
         'use strict';

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
               // Handle space separated event names by delegating them individually.
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
            if (_.size(events)) {
               return events;
            }
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
          * @param {function} cb    - Event callback
          * @param {Array<*>} args  - Event arguments
          * @returns {*}
          */

         s_TRIGGER_API = function s_TRIGGER_API(objEvents, name, cb, args) {
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
          * "reset" (collection, options) — when the collection's entire contents have been replaced.
          * "sort" (collection, options) — when the collection has been re-sorted.
          * "change" (model, options) — when a model's attributes have changed.
          * "change:[attribute]" (model, value, options) — when a specific attribute has been updated.
          * "destroy" (model, collection, options) — when a model is destroyed.
          * "request" (model_or_collection, xhr, options) — when a model or collection has started a request to the server.
          * "sync" (model_or_collection, resp, options) — when a model or collection has been successfully synced with the
          * server.
          * "error" (model_or_collection, resp, options) — when a model's or collection's request to the server has failed.
          * "invalid" (model, error, options) — when a model's validation fails on the client.
          * "route:[name]" (params) — Fired by the router when a specific route is matched.
          * "route" (route, params) — Fired by the router when any route has been matched.
          * "route" (router, route, params) — Fired by history when any route has been matched.
          * "all" — this special event fires for any triggered event, passing the event name as the first argument.
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

         Events = (function () {
            /** */

            function Events() {
               _classCallCheck(this, Events);
            }

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
                  return this.on(events, void 0, context);
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
                  if (_.isEmpty(listeningTo)) {
                     this._listeningTo = void 0;
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
      }
   };
});

$__System.register('15', ['4', '8', '13', 'b', 'c', 'd', 'e', 'f'], function (_export) {
   var _, BackboneProxy, Utils, _get, _inherits, _createClass, _classCallCheck, Events, Model, modelMethods;

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_3) {
         BackboneProxy = _3['default'];
      }, function (_4) {
         Utils = _4['default'];
      }, function (_b) {
         _get = _b['default'];
      }, function (_c) {
         _inherits = _c['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
      }, function (_f) {
         Events = _f['default'];
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

               /**
                * The prefix is used to create the client id which is used to identify models locally.
                * You may want to override this if you're experiencing name clashes with model ids.
                *
                * @type {string}
                */
               this.cidPrefix = 'c';

               // Allows child classes to postpone initialization.
               if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) {
                  return;
               }

               if (options.parse) {
                  attrs = this.parse(attrs, options) || {};
               }

               attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

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
                  return this._validate({}, _.defaults({ validate: true }, options));
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
                  } else {
                     if (!this._validate(attrs, options)) {
                        return false;
                     }
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

                  /**
                   * Update the `id`.
                   * @type {*}
                   */
                  this.id = this.get(this.idAttribute);

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

$__System.registerDynamic("52", ["56"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ITERATOR = $__require('56')('iterator'),
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("57", ["41", "58", "59", "56"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var core = $__require('41'),
      $ = $__require('58'),
      DESCRIPTORS = $__require('59'),
      SPECIES = $__require('56')('species');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5a", ["5b"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var redefine = $__require('5b');
  module.exports = function(target, src) {
    for (var key in src)
      redefine(target, key, src[key]);
    return target;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5c", ["3e", "5d"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isObject = $__require('3e'),
      document = $__require('5d').document,
      is = isObject(document) && isObject(document.createElement);
  module.exports = function(it) {
    return is ? document.createElement(it) : {};
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5e", ["5d"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('5d').document && document.documentElement;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5f", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("60", ["4c", "5f", "5e", "5c", "5d", "61", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var ctx = $__require('4c'),
        invoke = $__require('5f'),
        html = $__require('5e'),
        cel = $__require('5c'),
        global = $__require('5d'),
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
      if ($__require('61')(process) == 'process') {
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
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("62", ["5d", "60", "61", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var global = $__require('5d'),
        macrotask = $__require('60').set,
        Observer = global.MutationObserver || global.WebKitMutationObserver,
        process = global.process,
        Promise = global.Promise,
        isNode = $__require('61')(process) == 'process',
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
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("63", ["64", "65", "56"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var anObject = $__require('64'),
      aFunction = $__require('65'),
      SPECIES = $__require('56')('species');
  module.exports = function(O, D) {
    var C = anObject(O).constructor,
        S;
    return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("66", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = Object.is || function is(x, y) {
    return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("51", ["67", "56", "68", "41"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var classof = $__require('67'),
      ITERATOR = $__require('56')('iterator'),
      Iterators = $__require('68');
  module.exports = $__require('41').getIteratorMethod = function(it) {
    if (it != undefined)
      return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("50", ["69"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toInteger = $__require('69'),
      min = Math.min;
  module.exports = function(it) {
    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4f", ["68", "56"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Iterators = $__require('68'),
      ITERATOR = $__require('56')('iterator'),
      ArrayProto = Array.prototype;
  module.exports = function(it) {
    return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4e", ["64"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var anObject = $__require('64');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6a", ["4c", "4e", "4f", "64", "50", "51"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ctx = $__require('4c'),
      call = $__require('4e'),
      isArrayIter = $__require('4f'),
      anObject = $__require('64'),
      toLength = $__require('50'),
      getIterFn = $__require('51');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6b", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(it, Constructor, name) {
    if (!(it instanceof Constructor))
      throw TypeError(name + ": use the 'new' operator!");
    return it;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("67", ["61", "56"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var cof = $__require('61'),
      TAG = $__require('56')('toStringTag'),
      ARG = cof(function() {
        return arguments;
      }()) == 'Arguments';
  module.exports = function(it) {
    var O,
        T,
        B;
    return it === undefined ? 'Undefined' : it === null ? 'Null' : typeof(T = (O = Object(it))[TAG]) == 'string' ? T : ARG ? cof(O) : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6c", ["58", "6d", "5d", "4c", "67", "4d", "3e", "64", "65", "6b", "6a", "6e", "66", "56", "63", "62", "59", "5a", "6f", "57", "41", "52", "29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    'use strict';
    var $ = $__require('58'),
        LIBRARY = $__require('6d'),
        global = $__require('5d'),
        ctx = $__require('4c'),
        classof = $__require('67'),
        $export = $__require('4d'),
        isObject = $__require('3e'),
        anObject = $__require('64'),
        aFunction = $__require('65'),
        strictNew = $__require('6b'),
        forOf = $__require('6a'),
        setProto = $__require('6e').set,
        same = $__require('66'),
        SPECIES = $__require('56')('species'),
        speciesConstructor = $__require('63'),
        asap = $__require('62'),
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
        if (works && $__require('59')) {
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
      $__require('5a')(P.prototype, {
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
    $__require('6f')(P, PROMISE);
    $__require('57')(PROMISE);
    Wrapper = $__require('41')[PROMISE];
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
    $export($export.S + $export.F * !(USE_NATIVE && $__require('52')(function(iter) {
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
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("70", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(done, value) {
    return {
      value: value,
      done: !!done
    };
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("71", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function() {};
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("72", ["71", "70", "68", "73", "74"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var addToUnscopables = $__require('71'),
      step = $__require('70'),
      Iterators = $__require('68'),
      toIObject = $__require('73');
  module.exports = $__require('74')(Array, 'Array', function(iterated, kind) {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("75", ["72", "68"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  $__require('72');
  var Iterators = $__require('68');
  Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("76", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var id = 0,
      px = Math.random();
  module.exports = function(key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("77", ["5d"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = $__require('5d'),
      SHARED = '__core-js_shared__',
      store = global[SHARED] || (global[SHARED] = {});
  module.exports = function(key) {
    return store[key] || (store[key] = {});
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("56", ["77", "76", "5d"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var store = $__require('77')('wks'),
      uid = $__require('76'),
      Symbol = $__require('5d').Symbol;
  module.exports = function(name) {
    return store[name] || (store[name] = Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6f", ["58", "78", "56"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var def = $__require('58').setDesc,
      has = $__require('78'),
      TAG = $__require('56')('toStringTag');
  module.exports = function(it, tag, stat) {
    if (it && !has(it = stat ? it : it.prototype, TAG))
      def(it, TAG, {
        configurable: true,
        value: tag
      });
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("79", ["58", "7a", "6f", "7b", "56"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = $__require('58'),
      descriptor = $__require('7a'),
      setToStringTag = $__require('6f'),
      IteratorPrototype = {};
  $__require('7b')(IteratorPrototype, $__require('56')('iterator'), function() {
    return this;
  });
  module.exports = function(Constructor, NAME, next) {
    Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
    setToStringTag(Constructor, NAME + ' Iterator');
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("68", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {};
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("78", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var hasOwnProperty = {}.hasOwnProperty;
  module.exports = function(it, key) {
    return hasOwnProperty.call(it, key);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("59", ["7c"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = !$__require('7c')(function() {
    return Object.defineProperty({}, 'a', {get: function() {
        return 7;
      }}).a != 7;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7a", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7b", ["58", "7a", "59"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = $__require('58'),
      createDesc = $__require('7a');
  module.exports = $__require('59') ? function(object, key, value) {
    return $.setDesc(object, key, createDesc(1, value));
  } : function(object, key, value) {
    object[key] = value;
    return object;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5b", ["7b"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('7b');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6d", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = true;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("74", ["6d", "4d", "5b", "7b", "78", "68", "79", "6f", "58", "56"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var LIBRARY = $__require('6d'),
      $export = $__require('4d'),
      redefine = $__require('5b'),
      hide = $__require('7b'),
      has = $__require('78'),
      Iterators = $__require('68'),
      $iterCreate = $__require('79'),
      setToStringTag = $__require('6f'),
      getProto = $__require('58').getProto,
      ITERATOR = $__require('56')('iterator'),
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("69", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ceil = Math.ceil,
      floor = Math.floor;
  module.exports = function(it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7d", ["69", "4a"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toInteger = $__require('69'),
      defined = $__require('4a');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("54", ["7d", "74"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $at = $__require('7d')(true);
  $__require('74')(String, 'String', function(iterated) {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7e", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7f", ["7e", "54", "75", "6c", "41"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  $__require('7e');
  $__require('54');
  $__require('75');
  $__require('6c');
  module.exports = $__require('41').Promise;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("80", ["7f"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('7f'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.register('81', ['4', '6', '9', '13', '15', '80', 'b', 'c', 'd', 'e'], function (_export) {
   var _, Parse, Debug, Utils, Model, _Promise, _get, _inherits, _createClass, _classCallCheck, ParseModel;

   return {
      setters: [function (_3) {
         _ = _3['default'];
      }, function (_6) {
         Parse = _6['default'];
      }, function (_7) {
         Debug = _7['default'];
      }, function (_5) {
         Utils = _5['default'];
      }, function (_4) {
         Model = _4['default'];
      }, function (_2) {
         _Promise = _2['default'];
      }, function (_b) {
         _get = _b['default'];
      }, function (_c) {
         _inherits = _c['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
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

               if (hasClassNameGetter) {
                  if (!_.isString(this.className)) {
                     throw new TypeError('Model - ctor - getter for className is not a string.');
                  }
               }

               var adjustedClassName = undefined;

               var classNameOrParseObject = options.parseObject || options.className;

               if (classNameOrParseObject instanceof Parse.Object) {
                  var parseObject = classNameOrParseObject;

                  // Insure that any getter for className is the same as the Parse.Object
                  if (hasClassNameGetter && this.className !== parseObject.className) {
                     throw new Error('Model - ctor - getter className \'' + this.className + '\n             \' does not equal Parse.Object className \'' + parseObject.className + '\'.');
                  }

                  /**
                   * Parse class name string or proxy ParseObject
                   * @type {string|ParseObject}
                   */
                  this.parseObject = classNameOrParseObject;

                  adjustedClassName = this.parseObject.className;
               } else // Attempt to create Parse.Object from classNameOrParseObject, getter, or from "extend" construction.
                  {
                     if (_.isString(classNameOrParseObject)) {
                        adjustedClassName = classNameOrParseObject;
                        this.parseObject = new Parse.Object(adjustedClassName, attributes);
                     }
                     // Check for getter "get className()" usage.
                     else if (hasClassNameGetter) {
                           this.parseObject = new Parse.Object(this.className, attributes);
                        }
                        // Check for className via "extend" usage.
                        else if (!_.isUndefined(this.__proto__ && _.isString(this.__proto__.constructor.className))) {
                              adjustedClassName = this.__proto__.constructor.className;
                              this.parseObject = new Parse.Object(adjustedClassName, attributes);
                           }
                  }

               if (_.isUndefined(this.parseObject)) {
                  throw new TypeError('ctor - classNameOrParseObject is not a string or Parse.Object.');
               }

               if (!hasClassNameGetter) {
                  /**
                   * Parse class name
                   * @type {string}
                   */
                  this.className = adjustedClassName;
               }

               var attrs = attributes || {};

               options.parse = true;
               options.updateParseObject = _.isBoolean(options.updateParseObject) ? options.updateParseObject : true;

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

               /**
                * The prefix is used to create the client id which is used to identify models locally.
                * You may want to override this if you're experiencing name clashes with model ids.
                *
                * @type {string}
                */
               this.cidPrefix = 'c';

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
                     Utils.wrapError(this, options);
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
                     this.id = resp.id;

                     // Store the parse ID in local attributes; Note that it won't be propagated in "set()"
                     var mergeId = {};
                     mergeId[ParseModel.prototype.idAttribute] = resp.id;

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
                        var setSuccess = !updateParseObject;

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

$__System.registerDynamic("82", ["58"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = $__require('58');
  module.exports = function defineProperty(it, key, desc) {
    return $.setDesc(it, key, desc);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2e", ["82"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('82'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d", ["2e"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Object$defineProperty = $__require('2e')["default"];
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("64", ["3e"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isObject = $__require('3e');
  module.exports = function(it) {
    if (!isObject(it))
      throw TypeError(it + ' is not an object!');
    return it;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3e", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6e", ["58", "3e", "64", "4c"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var getDesc = $__require('58').getDesc,
      isObject = $__require('3e'),
      anObject = $__require('64');
  var check = function(O, proto) {
    anObject(O);
    if (!isObject(proto) && proto !== null)
      throw TypeError(proto + ": can't set as prototype!");
  };
  module.exports = {
    set: Object.setPrototypeOf || ('__proto__' in {} ? function(test, buggy, set) {
      try {
        set = $__require('4c')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("83", ["4d", "6e"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $export = $__require('4d');
  $export($export.S, 'Object', {setPrototypeOf: $__require('6e').set});
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("84", ["83", "41"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  $__require('83');
  module.exports = $__require('41').Object.setPrototypeOf;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("85", ["84"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('84'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("86", ["58"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = $__require('58');
  module.exports = function create(P, D) {
    return $.create(P, D);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("43", ["86"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('86'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c", ["43", "85"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Object$create = $__require('43')["default"];
  var _Object$setPrototypeOf = $__require('85')["default"];
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7c", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(exec) {
    try {
      return !!exec();
    } catch (e) {
      return true;
    }
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("65", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(it) {
    if (typeof it != 'function')
      throw TypeError(it + ' is not a function!');
    return it;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4c", ["65"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var aFunction = $__require('65');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("41", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var core = module.exports = {version: '1.2.6'};
  if (typeof __e == 'number')
    __e = core;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5d", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
  if (typeof __g == 'number')
    __g = global;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4d", ["5d", "41", "4c"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = $__require('5d'),
      core = $__require('41'),
      ctx = $__require('4c'),
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3f", ["4d", "41", "7c"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $export = $__require('4d'),
      core = $__require('41'),
      fails = $__require('7c');
  module.exports = function(KEY, exec) {
    var fn = (core.Object || {})[KEY] || Object[KEY],
        exp = {};
    exp[KEY] = exec(fn);
    $export($export.S + $export.F * fails(function() {
      fn(1);
    }), 'Object', exp);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4a", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(it) {
    if (it == undefined)
      throw TypeError("Can't call method on  " + it);
    return it;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("61", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toString = {}.toString;
  module.exports = function(it) {
    return toString.call(it).slice(8, -1);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("87", ["61"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var cof = $__require('61');
  module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it) {
    return cof(it) == 'String' ? it.split('') : Object(it);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("73", ["87", "4a"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var IObject = $__require('87'),
      defined = $__require('4a');
  module.exports = function(it) {
    return IObject(defined(it));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("88", ["73", "3f"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toIObject = $__require('73');
  $__require('3f')('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor) {
    return function getOwnPropertyDescriptor(it, key) {
      return $getOwnPropertyDescriptor(toIObject(it), key);
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("58", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("89", ["58", "88"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = $__require('58');
  $__require('88');
  module.exports = function getOwnPropertyDescriptor(it, key) {
    return $.getDesc(it, key);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8a", ["89"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('89'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b", ["8a"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Object$getOwnPropertyDescriptor = $__require('8a')["default"];
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
  global.define = __define;
  return module.exports;
});

$__System.register('8b', ['4', '9', '14', '81', 'b', 'c', 'd', 'e'], function (_export) {
   var _, Debug, Collection, Model, _get, _inherits, _createClass, _classCallCheck, ParseCollection;

   return {
      setters: [function (_2) {
         _ = _2['default'];
      }, function (_5) {
         Debug = _5['default'];
      }, function (_4) {
         Collection = _4['default'];
      }, function (_3) {
         Model = _3['default'];
      }, function (_b) {
         _get = _b['default'];
      }, function (_c) {
         _inherits = _c['default'];
      }, function (_d) {
         _createClass = _d['default'];
      }, function (_e) {
         _classCallCheck = _e['default'];
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
             * Exports the ParseCollection class.
             */

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
            }]);

            return ParseCollection;
         })(Collection);

         _export('default', ParseCollection);
      }
   };
});

$__System.register('8', [], function (_export) {
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

$__System.registerDynamic("e", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports["default"] = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  exports.__esModule = true;
  global.define = __define;
  return module.exports;
});

$__System.register('8c', ['4', '8', 'e', '8d'], function (_export) {
  var _, BackboneProxy, _classCallCheck, $, Backbone;

  return {
    setters: [function (_2) {
      _ = _2['default'];
    }, function (_3) {
      BackboneProxy = _3['default'];
    }, function (_e) {
      _classCallCheck = _e['default'];
    }, function (_d) {
      $ = _d['default'];
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
       * Backbone-ES6
       * https://github.com/typhonjs/backbone-es6
       * (c) 2015 Michael Leahy
       * Backbone-ES6 may be freely distributed under the MIT license.
       *
       * This fork of Backbone converts it to ES6 and provides extension through constructor injection for easy modification.
       * The only major difference from Backbone is that Backbone itself is not a global Events instance anymore. Please
       * see @link{Events.js} for documentation on easily setting up an ES6 event module for global usage.
       *
       * @see http://backbonejs.org
       * @see https://github.com/typhonjs/backbone-es6
       * @author Michael Leahy
       * @version 1.2.3
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

$__System.register('8e', ['5', '7', '10', '12', '81', '8c', '8b', 'f', 'a'], function (_export) {
  /**
   * ModuleRuntime.js (Parse) -- Provides the standard / default configuration that is the same as Backbone 1.2.3
   */

  'use strict';

  var parseExtend, parseSync, Router, History, Model, Backbone, Collection, Events, View, options, backbone;
  return {
    setters: [function (_5) {
      parseExtend = _5['default'];
    }, function (_4) {
      parseSync = _4['default'];
    }, function (_3) {
      Router = _3['default'];
    }, function (_) {
      History = _['default'];
    }, function (_2) {
      Model = _2['default'];
    }, function (_c) {
      Backbone = _c['default'];
    }, function (_b) {
      Collection = _b['default'];
    }, function (_f) {
      Events = _f['default'];
    }, function (_a) {
      View = _a['default'];
    }],
    execute: function () {
      options = {
        // Current version of the library. Keep in sync with Backbone version supported.
        VERSION: '1.2.3'
      };
      backbone = new Backbone(Collection, Events, History, Model, Router, View, parseSync, options);

      parseExtend(backbone);

      _export('default', backbone);
    }
  };
});

$__System.register('8f', ['6', '8e'], function (_export) {
  /**
   * GlobalRuntime.js (Parse) -- Initializes Backbone and Parse setting them to "root.Backbone" and "root.Parse"
   * if root exists. "root" is defined as self in the browser or global if on the server.
   */

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  'use strict';

  var Parse, Backbone, root;
  return {
    setters: [function (_) {
      Parse = _['default'];
    }, function (_e) {
      Backbone = _e['default'];
    }],
    execute: function () {
      root = typeof self === 'object' && self.self === self && self || typeof global === 'object' && global.global === global && global;

      if (typeof root !== 'undefined' && root !== null) {
        root.Backbone = Backbone;
        root.Parse = Parse;
      } else {
        throw new Error('Could not find a valid global object.');
      }

      _export('default', Backbone);
    }
  };
});

$__System.registerDynamic("90", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function() {
    var root = this;
    var previousUnderscore = root._;
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        FuncProto = Function.prototype;
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreate = Object.create;
    var Ctor = function() {};
    var _ = function(obj) {
      if (obj instanceof _)
        return obj;
      if (!(this instanceof _))
        return new _(obj);
      this._wrapped = obj;
    };
    if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = _;
      }
      exports._ = _;
    } else {
      root._ = _;
    }
    _.VERSION = '1.8.3';
    var optimizeCb = function(func, context, argCount) {
      if (context === void 0)
        return func;
      switch (argCount == null ? 3 : argCount) {
        case 1:
          return function(value) {
            return func.call(context, value);
          };
        case 2:
          return function(value, other) {
            return func.call(context, value, other);
          };
        case 3:
          return function(value, index, collection) {
            return func.call(context, value, index, collection);
          };
        case 4:
          return function(accumulator, value, index, collection) {
            return func.call(context, accumulator, value, index, collection);
          };
      }
      return function() {
        return func.apply(context, arguments);
      };
    };
    var cb = function(value, context, argCount) {
      if (value == null)
        return _.identity;
      if (_.isFunction(value))
        return optimizeCb(value, context, argCount);
      if (_.isObject(value))
        return _.matcher(value);
      return _.property(value);
    };
    _.iteratee = function(value, context) {
      return cb(value, context, Infinity);
    };
    var createAssigner = function(keysFunc, undefinedOnly) {
      return function(obj) {
        var length = arguments.length;
        if (length < 2 || obj == null)
          return obj;
        for (var index = 1; index < length; index++) {
          var source = arguments[index],
              keys = keysFunc(source),
              l = keys.length;
          for (var i = 0; i < l; i++) {
            var key = keys[i];
            if (!undefinedOnly || obj[key] === void 0)
              obj[key] = source[key];
          }
        }
        return obj;
      };
    };
    var baseCreate = function(prototype) {
      if (!_.isObject(prototype))
        return {};
      if (nativeCreate)
        return nativeCreate(prototype);
      Ctor.prototype = prototype;
      var result = new Ctor;
      Ctor.prototype = null;
      return result;
    };
    var property = function(key) {
      return function(obj) {
        return obj == null ? void 0 : obj[key];
      };
    };
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = property('length');
    var isArrayLike = function(collection) {
      var length = getLength(collection);
      return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };
    _.each = _.forEach = function(obj, iteratee, context) {
      iteratee = optimizeCb(iteratee, context);
      var i,
          length;
      if (isArrayLike(obj)) {
        for (i = 0, length = obj.length; i < length; i++) {
          iteratee(obj[i], i, obj);
        }
      } else {
        var keys = _.keys(obj);
        for (i = 0, length = keys.length; i < length; i++) {
          iteratee(obj[keys[i]], keys[i], obj);
        }
      }
      return obj;
    };
    _.map = _.collect = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          results = Array(length);
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        results[index] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
    };
    function createReduce(dir) {
      function iterator(obj, iteratee, memo, keys, index, length) {
        for (; index >= 0 && index < length; index += dir) {
          var currentKey = keys ? keys[index] : index;
          memo = iteratee(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
      }
      return function(obj, iteratee, memo, context) {
        iteratee = optimizeCb(iteratee, context, 4);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length,
            index = dir > 0 ? 0 : length - 1;
        if (arguments.length < 3) {
          memo = obj[keys ? keys[index] : index];
          index += dir;
        }
        return iterator(obj, iteratee, memo, keys, index, length);
      };
    }
    _.reduce = _.foldl = _.inject = createReduce(1);
    _.reduceRight = _.foldr = createReduce(-1);
    _.find = _.detect = function(obj, predicate, context) {
      var key;
      if (isArrayLike(obj)) {
        key = _.findIndex(obj, predicate, context);
      } else {
        key = _.findKey(obj, predicate, context);
      }
      if (key !== void 0 && key !== -1)
        return obj[key];
    };
    _.filter = _.select = function(obj, predicate, context) {
      var results = [];
      predicate = cb(predicate, context);
      _.each(obj, function(value, index, list) {
        if (predicate(value, index, list))
          results.push(value);
      });
      return results;
    };
    _.reject = function(obj, predicate, context) {
      return _.filter(obj, _.negate(cb(predicate)), context);
    };
    _.every = _.all = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length;
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (!predicate(obj[currentKey], currentKey, obj))
          return false;
      }
      return true;
    };
    _.some = _.any = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length;
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (predicate(obj[currentKey], currentKey, obj))
          return true;
      }
      return false;
    };
    _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
      if (!isArrayLike(obj))
        obj = _.values(obj);
      if (typeof fromIndex != 'number' || guard)
        fromIndex = 0;
      return _.indexOf(obj, item, fromIndex) >= 0;
    };
    _.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      var isFunc = _.isFunction(method);
      return _.map(obj, function(value) {
        var func = isFunc ? method : value[method];
        return func == null ? func : func.apply(value, args);
      });
    };
    _.pluck = function(obj, key) {
      return _.map(obj, _.property(key));
    };
    _.where = function(obj, attrs) {
      return _.filter(obj, _.matcher(attrs));
    };
    _.findWhere = function(obj, attrs) {
      return _.find(obj, _.matcher(attrs));
    };
    _.max = function(obj, iteratee, context) {
      var result = -Infinity,
          lastComputed = -Infinity,
          value,
          computed;
      if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : _.values(obj);
        for (var i = 0,
            length = obj.length; i < length; i++) {
          value = obj[i];
          if (value > result) {
            result = value;
          }
        }
      } else {
        iteratee = cb(iteratee, context);
        _.each(obj, function(value, index, list) {
          computed = iteratee(value, index, list);
          if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
            result = value;
            lastComputed = computed;
          }
        });
      }
      return result;
    };
    _.min = function(obj, iteratee, context) {
      var result = Infinity,
          lastComputed = Infinity,
          value,
          computed;
      if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : _.values(obj);
        for (var i = 0,
            length = obj.length; i < length; i++) {
          value = obj[i];
          if (value < result) {
            result = value;
          }
        }
      } else {
        iteratee = cb(iteratee, context);
        _.each(obj, function(value, index, list) {
          computed = iteratee(value, index, list);
          if (computed < lastComputed || computed === Infinity && result === Infinity) {
            result = value;
            lastComputed = computed;
          }
        });
      }
      return result;
    };
    _.shuffle = function(obj) {
      var set = isArrayLike(obj) ? obj : _.values(obj);
      var length = set.length;
      var shuffled = Array(length);
      for (var index = 0,
          rand; index < length; index++) {
        rand = _.random(0, index);
        if (rand !== index)
          shuffled[index] = shuffled[rand];
        shuffled[rand] = set[index];
      }
      return shuffled;
    };
    _.sample = function(obj, n, guard) {
      if (n == null || guard) {
        if (!isArrayLike(obj))
          obj = _.values(obj);
        return obj[_.random(obj.length - 1)];
      }
      return _.shuffle(obj).slice(0, Math.max(0, n));
    };
    _.sortBy = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      return _.pluck(_.map(obj, function(value, index, list) {
        return {
          value: value,
          index: index,
          criteria: iteratee(value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0)
            return 1;
          if (a < b || b === void 0)
            return -1;
        }
        return left.index - right.index;
      }), 'value');
    };
    var group = function(behavior) {
      return function(obj, iteratee, context) {
        var result = {};
        iteratee = cb(iteratee, context);
        _.each(obj, function(value, index) {
          var key = iteratee(value, index, obj);
          behavior(result, value, key);
        });
        return result;
      };
    };
    _.groupBy = group(function(result, value, key) {
      if (_.has(result, key))
        result[key].push(value);
      else
        result[key] = [value];
    });
    _.indexBy = group(function(result, value, key) {
      result[key] = value;
    });
    _.countBy = group(function(result, value, key) {
      if (_.has(result, key))
        result[key]++;
      else
        result[key] = 1;
    });
    _.toArray = function(obj) {
      if (!obj)
        return [];
      if (_.isArray(obj))
        return slice.call(obj);
      if (isArrayLike(obj))
        return _.map(obj, _.identity);
      return _.values(obj);
    };
    _.size = function(obj) {
      if (obj == null)
        return 0;
      return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };
    _.partition = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var pass = [],
          fail = [];
      _.each(obj, function(value, key, obj) {
        (predicate(value, key, obj) ? pass : fail).push(value);
      });
      return [pass, fail];
    };
    _.first = _.head = _.take = function(array, n, guard) {
      if (array == null)
        return void 0;
      if (n == null || guard)
        return array[0];
      return _.initial(array, array.length - n);
    };
    _.initial = function(array, n, guard) {
      return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };
    _.last = function(array, n, guard) {
      if (array == null)
        return void 0;
      if (n == null || guard)
        return array[array.length - 1];
      return _.rest(array, Math.max(0, array.length - n));
    };
    _.rest = _.tail = _.drop = function(array, n, guard) {
      return slice.call(array, n == null || guard ? 1 : n);
    };
    _.compact = function(array) {
      return _.filter(array, _.identity);
    };
    var flatten = function(input, shallow, strict, startIndex) {
      var output = [],
          idx = 0;
      for (var i = startIndex || 0,
          length = getLength(input); i < length; i++) {
        var value = input[i];
        if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
          if (!shallow)
            value = flatten(value, shallow, strict);
          var j = 0,
              len = value.length;
          output.length += len;
          while (j < len) {
            output[idx++] = value[j++];
          }
        } else if (!strict) {
          output[idx++] = value;
        }
      }
      return output;
    };
    _.flatten = function(array, shallow) {
      return flatten(array, shallow, false);
    };
    _.without = function(array) {
      return _.difference(array, slice.call(arguments, 1));
    };
    _.uniq = _.unique = function(array, isSorted, iteratee, context) {
      if (!_.isBoolean(isSorted)) {
        context = iteratee;
        iteratee = isSorted;
        isSorted = false;
      }
      if (iteratee != null)
        iteratee = cb(iteratee, context);
      var result = [];
      var seen = [];
      for (var i = 0,
          length = getLength(array); i < length; i++) {
        var value = array[i],
            computed = iteratee ? iteratee(value, i, array) : value;
        if (isSorted) {
          if (!i || seen !== computed)
            result.push(value);
          seen = computed;
        } else if (iteratee) {
          if (!_.contains(seen, computed)) {
            seen.push(computed);
            result.push(value);
          }
        } else if (!_.contains(result, value)) {
          result.push(value);
        }
      }
      return result;
    };
    _.union = function() {
      return _.uniq(flatten(arguments, true, true));
    };
    _.intersection = function(array) {
      var result = [];
      var argsLength = arguments.length;
      for (var i = 0,
          length = getLength(array); i < length; i++) {
        var item = array[i];
        if (_.contains(result, item))
          continue;
        for (var j = 1; j < argsLength; j++) {
          if (!_.contains(arguments[j], item))
            break;
        }
        if (j === argsLength)
          result.push(item);
      }
      return result;
    };
    _.difference = function(array) {
      var rest = flatten(arguments, true, true, 1);
      return _.filter(array, function(value) {
        return !_.contains(rest, value);
      });
    };
    _.zip = function() {
      return _.unzip(arguments);
    };
    _.unzip = function(array) {
      var length = array && _.max(array, getLength).length || 0;
      var result = Array(length);
      for (var index = 0; index < length; index++) {
        result[index] = _.pluck(array, index);
      }
      return result;
    };
    _.object = function(list, values) {
      var result = {};
      for (var i = 0,
          length = getLength(list); i < length; i++) {
        if (values) {
          result[list[i]] = values[i];
        } else {
          result[list[i][0]] = list[i][1];
        }
      }
      return result;
    };
    function createPredicateIndexFinder(dir) {
      return function(array, predicate, context) {
        predicate = cb(predicate, context);
        var length = getLength(array);
        var index = dir > 0 ? 0 : length - 1;
        for (; index >= 0 && index < length; index += dir) {
          if (predicate(array[index], index, array))
            return index;
        }
        return -1;
      };
    }
    _.findIndex = createPredicateIndexFinder(1);
    _.findLastIndex = createPredicateIndexFinder(-1);
    _.sortedIndex = function(array, obj, iteratee, context) {
      iteratee = cb(iteratee, context, 1);
      var value = iteratee(obj);
      var low = 0,
          high = getLength(array);
      while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (iteratee(array[mid]) < value)
          low = mid + 1;
        else
          high = mid;
      }
      return low;
    };
    function createIndexFinder(dir, predicateFind, sortedIndex) {
      return function(array, item, idx) {
        var i = 0,
            length = getLength(array);
        if (typeof idx == 'number') {
          if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
          } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
          }
        } else if (sortedIndex && idx && length) {
          idx = sortedIndex(array, item);
          return array[idx] === item ? idx : -1;
        }
        if (item !== item) {
          idx = predicateFind(slice.call(array, i, length), _.isNaN);
          return idx >= 0 ? idx + i : -1;
        }
        for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
          if (array[idx] === item)
            return idx;
        }
        return -1;
      };
    }
    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);
    _.range = function(start, stop, step) {
      if (stop == null) {
        stop = start || 0;
        start = 0;
      }
      step = step || 1;
      var length = Math.max(Math.ceil((stop - start) / step), 0);
      var range = Array(length);
      for (var idx = 0; idx < length; idx++, start += step) {
        range[idx] = start;
      }
      return range;
    };
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
      if (!(callingContext instanceof boundFunc))
        return sourceFunc.apply(context, args);
      var self = baseCreate(sourceFunc.prototype);
      var result = sourceFunc.apply(self, args);
      if (_.isObject(result))
        return result;
      return self;
    };
    _.bind = function(func, context) {
      if (nativeBind && func.bind === nativeBind)
        return nativeBind.apply(func, slice.call(arguments, 1));
      if (!_.isFunction(func))
        throw new TypeError('Bind must be called on a function');
      var args = slice.call(arguments, 2);
      var bound = function() {
        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
      };
      return bound;
    };
    _.partial = function(func) {
      var boundArgs = slice.call(arguments, 1);
      var bound = function() {
        var position = 0,
            length = boundArgs.length;
        var args = Array(length);
        for (var i = 0; i < length; i++) {
          args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
        }
        while (position < arguments.length)
          args.push(arguments[position++]);
        return executeBound(func, bound, this, this, args);
      };
      return bound;
    };
    _.bindAll = function(obj) {
      var i,
          length = arguments.length,
          key;
      if (length <= 1)
        throw new Error('bindAll must be passed function names');
      for (i = 1; i < length; i++) {
        key = arguments[i];
        obj[key] = _.bind(obj[key], obj);
      }
      return obj;
    };
    _.memoize = function(func, hasher) {
      var memoize = function(key) {
        var cache = memoize.cache;
        var address = '' + (hasher ? hasher.apply(this, arguments) : key);
        if (!_.has(cache, address))
          cache[address] = func.apply(this, arguments);
        return cache[address];
      };
      memoize.cache = {};
      return memoize;
    };
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function() {
        return func.apply(null, args);
      }, wait);
    };
    _.defer = _.partial(_.delay, _, 1);
    _.throttle = function(func, wait, options) {
      var context,
          args,
          result;
      var timeout = null;
      var previous = 0;
      if (!options)
        options = {};
      var later = function() {
        previous = options.leading === false ? 0 : _.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout)
          context = args = null;
      };
      return function() {
        var now = _.now();
        if (!previous && options.leading === false)
          previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout)
            context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };
    _.debounce = function(func, wait, immediate) {
      var timeout,
          args,
          context,
          timestamp,
          result;
      var later = function() {
        var last = _.now() - timestamp;
        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout)
              context = args = null;
          }
        }
      };
      return function() {
        context = this;
        args = arguments;
        timestamp = _.now();
        var callNow = immediate && !timeout;
        if (!timeout)
          timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }
        return result;
      };
    };
    _.wrap = function(func, wrapper) {
      return _.partial(wrapper, func);
    };
    _.negate = function(predicate) {
      return function() {
        return !predicate.apply(this, arguments);
      };
    };
    _.compose = function() {
      var args = arguments;
      var start = args.length - 1;
      return function() {
        var i = start;
        var result = args[start].apply(this, arguments);
        while (i--)
          result = args[i].call(this, result);
        return result;
      };
    };
    _.after = function(times, func) {
      return function() {
        if (--times < 1) {
          return func.apply(this, arguments);
        }
      };
    };
    _.before = function(times, func) {
      var memo;
      return function() {
        if (--times > 0) {
          memo = func.apply(this, arguments);
        }
        if (times <= 1)
          func = null;
        return memo;
      };
    };
    _.once = _.partial(_.before, 2);
    var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
    function collectNonEnumProps(obj, keys) {
      var nonEnumIdx = nonEnumerableProps.length;
      var constructor = obj.constructor;
      var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;
      var prop = 'constructor';
      if (_.has(obj, prop) && !_.contains(keys, prop))
        keys.push(prop);
      while (nonEnumIdx--) {
        prop = nonEnumerableProps[nonEnumIdx];
        if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
          keys.push(prop);
        }
      }
    }
    _.keys = function(obj) {
      if (!_.isObject(obj))
        return [];
      if (nativeKeys)
        return nativeKeys(obj);
      var keys = [];
      for (var key in obj)
        if (_.has(obj, key))
          keys.push(key);
      if (hasEnumBug)
        collectNonEnumProps(obj, keys);
      return keys;
    };
    _.allKeys = function(obj) {
      if (!_.isObject(obj))
        return [];
      var keys = [];
      for (var key in obj)
        keys.push(key);
      if (hasEnumBug)
        collectNonEnumProps(obj, keys);
      return keys;
    };
    _.values = function(obj) {
      var keys = _.keys(obj);
      var length = keys.length;
      var values = Array(length);
      for (var i = 0; i < length; i++) {
        values[i] = obj[keys[i]];
      }
      return values;
    };
    _.mapObject = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys = _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
    };
    _.pairs = function(obj) {
      var keys = _.keys(obj);
      var length = keys.length;
      var pairs = Array(length);
      for (var i = 0; i < length; i++) {
        pairs[i] = [keys[i], obj[keys[i]]];
      }
      return pairs;
    };
    _.invert = function(obj) {
      var result = {};
      var keys = _.keys(obj);
      for (var i = 0,
          length = keys.length; i < length; i++) {
        result[obj[keys[i]]] = keys[i];
      }
      return result;
    };
    _.functions = _.methods = function(obj) {
      var names = [];
      for (var key in obj) {
        if (_.isFunction(obj[key]))
          names.push(key);
      }
      return names.sort();
    };
    _.extend = createAssigner(_.allKeys);
    _.extendOwn = _.assign = createAssigner(_.keys);
    _.findKey = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = _.keys(obj),
          key;
      for (var i = 0,
          length = keys.length; i < length; i++) {
        key = keys[i];
        if (predicate(obj[key], key, obj))
          return key;
      }
    };
    _.pick = function(object, oiteratee, context) {
      var result = {},
          obj = object,
          iteratee,
          keys;
      if (obj == null)
        return result;
      if (_.isFunction(oiteratee)) {
        keys = _.allKeys(obj);
        iteratee = optimizeCb(oiteratee, context);
      } else {
        keys = flatten(arguments, false, false, 1);
        iteratee = function(value, key, obj) {
          return key in obj;
        };
        obj = Object(obj);
      }
      for (var i = 0,
          length = keys.length; i < length; i++) {
        var key = keys[i];
        var value = obj[key];
        if (iteratee(value, key, obj))
          result[key] = value;
      }
      return result;
    };
    _.omit = function(obj, iteratee, context) {
      if (_.isFunction(iteratee)) {
        iteratee = _.negate(iteratee);
      } else {
        var keys = _.map(flatten(arguments, false, false, 1), String);
        iteratee = function(value, key) {
          return !_.contains(keys, key);
        };
      }
      return _.pick(obj, iteratee, context);
    };
    _.defaults = createAssigner(_.allKeys, true);
    _.create = function(prototype, props) {
      var result = baseCreate(prototype);
      if (props)
        _.extendOwn(result, props);
      return result;
    };
    _.clone = function(obj) {
      if (!_.isObject(obj))
        return obj;
      return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };
    _.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };
    _.isMatch = function(object, attrs) {
      var keys = _.keys(attrs),
          length = keys.length;
      if (object == null)
        return !length;
      var obj = Object(object);
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        if (attrs[key] !== obj[key] || !(key in obj))
          return false;
      }
      return true;
    };
    var eq = function(a, b, aStack, bStack) {
      if (a === b)
        return a !== 0 || 1 / a === 1 / b;
      if (a == null || b == null)
        return a === b;
      if (a instanceof _)
        a = a._wrapped;
      if (b instanceof _)
        b = b._wrapped;
      var className = toString.call(a);
      if (className !== toString.call(b))
        return false;
      switch (className) {
        case '[object RegExp]':
        case '[object String]':
          return '' + a === '' + b;
        case '[object Number]':
          if (+a !== +a)
            return +b !== +b;
          return +a === 0 ? 1 / +a === 1 / b : +a === +b;
        case '[object Date]':
        case '[object Boolean]':
          return +a === +b;
      }
      var areArrays = className === '[object Array]';
      if (!areArrays) {
        if (typeof a != 'object' || typeof b != 'object')
          return false;
        var aCtor = a.constructor,
            bCtor = b.constructor;
        if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
          return false;
        }
      }
      aStack = aStack || [];
      bStack = bStack || [];
      var length = aStack.length;
      while (length--) {
        if (aStack[length] === a)
          return bStack[length] === b;
      }
      aStack.push(a);
      bStack.push(b);
      if (areArrays) {
        length = a.length;
        if (length !== b.length)
          return false;
        while (length--) {
          if (!eq(a[length], b[length], aStack, bStack))
            return false;
        }
      } else {
        var keys = _.keys(a),
            key;
        length = keys.length;
        if (_.keys(b).length !== length)
          return false;
        while (length--) {
          key = keys[length];
          if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack)))
            return false;
        }
      }
      aStack.pop();
      bStack.pop();
      return true;
    };
    _.isEqual = function(a, b) {
      return eq(a, b);
    };
    _.isEmpty = function(obj) {
      if (obj == null)
        return true;
      if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)))
        return obj.length === 0;
      return _.keys(obj).length === 0;
    };
    _.isElement = function(obj) {
      return !!(obj && obj.nodeType === 1);
    };
    _.isArray = nativeIsArray || function(obj) {
      return toString.call(obj) === '[object Array]';
    };
    _.isObject = function(obj) {
      var type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    };
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
      _['is' + name] = function(obj) {
        return toString.call(obj) === '[object ' + name + ']';
      };
    });
    if (!_.isArguments(arguments)) {
      _.isArguments = function(obj) {
        return _.has(obj, 'callee');
      };
    }
    if (typeof/./ != 'function' && typeof Int8Array != 'object') {
      _.isFunction = function(obj) {
        return typeof obj == 'function' || false;
      };
    }
    _.isFinite = function(obj) {
      return isFinite(obj) && !isNaN(parseFloat(obj));
    };
    _.isNaN = function(obj) {
      return _.isNumber(obj) && obj !== +obj;
    };
    _.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };
    _.isNull = function(obj) {
      return obj === null;
    };
    _.isUndefined = function(obj) {
      return obj === void 0;
    };
    _.has = function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    };
    _.noConflict = function() {
      root._ = previousUnderscore;
      return this;
    };
    _.identity = function(value) {
      return value;
    };
    _.constant = function(value) {
      return function() {
        return value;
      };
    };
    _.noop = function() {};
    _.property = property;
    _.propertyOf = function(obj) {
      return obj == null ? function() {} : function(key) {
        return obj[key];
      };
    };
    _.matcher = _.matches = function(attrs) {
      attrs = _.extendOwn({}, attrs);
      return function(obj) {
        return _.isMatch(obj, attrs);
      };
    };
    _.times = function(n, iteratee, context) {
      var accum = Array(Math.max(0, n));
      iteratee = optimizeCb(iteratee, context, 1);
      for (var i = 0; i < n; i++)
        accum[i] = iteratee(i);
      return accum;
    };
    _.random = function(min, max) {
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + Math.floor(Math.random() * (max - min + 1));
    };
    _.now = Date.now || function() {
      return new Date().getTime();
    };
    var escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;'
    };
    var unescapeMap = _.invert(escapeMap);
    var createEscaper = function(map) {
      var escaper = function(match) {
        return map[match];
      };
      var source = '(?:' + _.keys(map).join('|') + ')';
      var testRegexp = RegExp(source);
      var replaceRegexp = RegExp(source, 'g');
      return function(string) {
        string = string == null ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
      };
    };
    _.escape = createEscaper(escapeMap);
    _.unescape = createEscaper(unescapeMap);
    _.result = function(object, property, fallback) {
      var value = object == null ? void 0 : object[property];
      if (value === void 0) {
        value = fallback;
      }
      return _.isFunction(value) ? value.call(object) : value;
    };
    var idCounter = 0;
    _.uniqueId = function(prefix) {
      var id = ++idCounter + '';
      return prefix ? prefix + id : id;
    };
    _.templateSettings = {
      evaluate: /<%([\s\S]+?)%>/g,
      interpolate: /<%=([\s\S]+?)%>/g,
      escape: /<%-([\s\S]+?)%>/g
    };
    var noMatch = /(.)^/;
    var escapes = {
      "'": "'",
      '\\': '\\',
      '\r': 'r',
      '\n': 'n',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };
    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
    var escapeChar = function(match) {
      return '\\' + escapes[match];
    };
    _.template = function(text, settings, oldSettings) {
      if (!settings && oldSettings)
        settings = oldSettings;
      settings = _.defaults({}, settings, _.templateSettings);
      var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');
      var index = 0;
      var source = "__p+='";
      text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, escapeChar);
        index = offset + match.length;
        if (escape) {
          source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
        } else if (interpolate) {
          source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        } else if (evaluate) {
          source += "';\n" + evaluate + "\n__p+='";
        }
        return match;
      });
      source += "';\n";
      if (!settings.variable)
        source = 'with(obj||{}){\n' + source + '}\n';
      source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + 'return __p;\n';
      try {
        var render = new Function(settings.variable || 'obj', '_', source);
      } catch (e) {
        e.source = source;
        throw e;
      }
      var template = function(data) {
        return render.call(this, data, _);
      };
      var argument = settings.variable || 'obj';
      template.source = 'function(' + argument + '){\n' + source + '}';
      return template;
    };
    _.chain = function(obj) {
      var instance = _(obj);
      instance._chain = true;
      return instance;
    };
    var result = function(instance, obj) {
      return instance._chain ? _(obj).chain() : obj;
    };
    _.mixin = function(obj) {
      _.each(_.functions(obj), function(name) {
        var func = _[name] = obj[name];
        _.prototype[name] = function() {
          var args = [this._wrapped];
          push.apply(args, arguments);
          return result(this, func.apply(_, args));
        };
      });
    };
    _.mixin(_);
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        var obj = this._wrapped;
        method.apply(obj, arguments);
        if ((name === 'shift' || name === 'splice') && obj.length === 0)
          delete obj[0];
        return result(this, obj);
      };
    });
    _.each(['concat', 'join', 'slice'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        return result(this, method.apply(this._wrapped, arguments));
      };
    });
    _.prototype.value = function() {
      return this._wrapped;
    };
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
    _.prototype.toString = function() {
      return '' + this._wrapped;
    };
    if (typeof define === 'function' && define.amd) {
      define('underscore', [], function() {
        return _;
      });
    }
  }.call(this));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4", ["90"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('90');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("91", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  function cleanUpNextTick() {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("92", ["91"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('91');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("93", ["92"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__System._nodeRequire ? process : $__require('92');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("29", ["93"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('93');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("94", ["29"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function(process) {
    (function(global, factory) {
      if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ? factory(global, true) : function(w) {
          if (!w.document) {
            throw new Error("jQuery requires a window with a document");
          }
          return factory(w);
        };
      } else {
        factory(global);
      }
    }(typeof window !== "undefined" ? window : this, function(window, noGlobal) {
      var arr = [];
      var slice = arr.slice;
      var concat = arr.concat;
      var push = arr.push;
      var indexOf = arr.indexOf;
      var class2type = {};
      var toString = class2type.toString;
      var hasOwn = class2type.hasOwnProperty;
      var support = {};
      var document = window.document,
          version = "2.1.4",
          jQuery = function(selector, context) {
            return new jQuery.fn.init(selector, context);
          },
          rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          rmsPrefix = /^-ms-/,
          rdashAlpha = /-([\da-z])/gi,
          fcamelCase = function(all, letter) {
            return letter.toUpperCase();
          };
      jQuery.fn = jQuery.prototype = {
        jquery: version,
        constructor: jQuery,
        selector: "",
        length: 0,
        toArray: function() {
          return slice.call(this);
        },
        get: function(num) {
          return num != null ? (num < 0 ? this[num + this.length] : this[num]) : slice.call(this);
        },
        pushStack: function(elems) {
          var ret = jQuery.merge(this.constructor(), elems);
          ret.prevObject = this;
          ret.context = this.context;
          return ret;
        },
        each: function(callback, args) {
          return jQuery.each(this, callback, args);
        },
        map: function(callback) {
          return this.pushStack(jQuery.map(this, function(elem, i) {
            return callback.call(elem, i, elem);
          }));
        },
        slice: function() {
          return this.pushStack(slice.apply(this, arguments));
        },
        first: function() {
          return this.eq(0);
        },
        last: function() {
          return this.eq(-1);
        },
        eq: function(i) {
          var len = this.length,
              j = +i + (i < 0 ? len : 0);
          return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
        },
        end: function() {
          return this.prevObject || this.constructor(null);
        },
        push: push,
        sort: arr.sort,
        splice: arr.splice
      };
      jQuery.extend = jQuery.fn.extend = function() {
        var options,
            name,
            src,
            copy,
            copyIsArray,
            clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        if (typeof target === "boolean") {
          deep = target;
          target = arguments[i] || {};
          i++;
        }
        if (typeof target !== "object" && !jQuery.isFunction(target)) {
          target = {};
        }
        if (i === length) {
          target = this;
          i--;
        }
        for (; i < length; i++) {
          if ((options = arguments[i]) != null) {
            for (name in options) {
              src = target[name];
              copy = options[name];
              if (target === copy) {
                continue;
              }
              if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                if (copyIsArray) {
                  copyIsArray = false;
                  clone = src && jQuery.isArray(src) ? src : [];
                } else {
                  clone = src && jQuery.isPlainObject(src) ? src : {};
                }
                target[name] = jQuery.extend(deep, clone, copy);
              } else if (copy !== undefined) {
                target[name] = copy;
              }
            }
          }
        }
        return target;
      };
      jQuery.extend({
        expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
        isReady: true,
        error: function(msg) {
          throw new Error(msg);
        },
        noop: function() {},
        isFunction: function(obj) {
          return jQuery.type(obj) === "function";
        },
        isArray: Array.isArray,
        isWindow: function(obj) {
          return obj != null && obj === obj.window;
        },
        isNumeric: function(obj) {
          return !jQuery.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
        },
        isPlainObject: function(obj) {
          if (jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)) {
            return false;
          }
          if (obj.constructor && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
          }
          return true;
        },
        isEmptyObject: function(obj) {
          var name;
          for (name in obj) {
            return false;
          }
          return true;
        },
        type: function(obj) {
          if (obj == null) {
            return obj + "";
          }
          return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
        },
        globalEval: function(code) {
          var script,
              indirect = eval;
          code = jQuery.trim(code);
          if (code) {
            if (code.indexOf("use strict") === 1) {
              script = document.createElement("script");
              script.text = code;
              document.head.appendChild(script).parentNode.removeChild(script);
            } else {
              indirect(code);
            }
          }
        },
        camelCase: function(string) {
          return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
        nodeName: function(elem, name) {
          return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },
        each: function(obj, callback, args) {
          var value,
              i = 0,
              length = obj.length,
              isArray = isArraylike(obj);
          if (args) {
            if (isArray) {
              for (; i < length; i++) {
                value = callback.apply(obj[i], args);
                if (value === false) {
                  break;
                }
              }
            } else {
              for (i in obj) {
                value = callback.apply(obj[i], args);
                if (value === false) {
                  break;
                }
              }
            }
          } else {
            if (isArray) {
              for (; i < length; i++) {
                value = callback.call(obj[i], i, obj[i]);
                if (value === false) {
                  break;
                }
              }
            } else {
              for (i in obj) {
                value = callback.call(obj[i], i, obj[i]);
                if (value === false) {
                  break;
                }
              }
            }
          }
          return obj;
        },
        trim: function(text) {
          return text == null ? "" : (text + "").replace(rtrim, "");
        },
        makeArray: function(arr, results) {
          var ret = results || [];
          if (arr != null) {
            if (isArraylike(Object(arr))) {
              jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
            } else {
              push.call(ret, arr);
            }
          }
          return ret;
        },
        inArray: function(elem, arr, i) {
          return arr == null ? -1 : indexOf.call(arr, elem, i);
        },
        merge: function(first, second) {
          var len = +second.length,
              j = 0,
              i = first.length;
          for (; j < len; j++) {
            first[i++] = second[j];
          }
          first.length = i;
          return first;
        },
        grep: function(elems, callback, invert) {
          var callbackInverse,
              matches = [],
              i = 0,
              length = elems.length,
              callbackExpect = !invert;
          for (; i < length; i++) {
            callbackInverse = !callback(elems[i], i);
            if (callbackInverse !== callbackExpect) {
              matches.push(elems[i]);
            }
          }
          return matches;
        },
        map: function(elems, callback, arg) {
          var value,
              i = 0,
              length = elems.length,
              isArray = isArraylike(elems),
              ret = [];
          if (isArray) {
            for (; i < length; i++) {
              value = callback(elems[i], i, arg);
              if (value != null) {
                ret.push(value);
              }
            }
          } else {
            for (i in elems) {
              value = callback(elems[i], i, arg);
              if (value != null) {
                ret.push(value);
              }
            }
          }
          return concat.apply([], ret);
        },
        guid: 1,
        proxy: function(fn, context) {
          var tmp,
              args,
              proxy;
          if (typeof context === "string") {
            tmp = fn[context];
            context = fn;
            fn = tmp;
          }
          if (!jQuery.isFunction(fn)) {
            return undefined;
          }
          args = slice.call(arguments, 2);
          proxy = function() {
            return fn.apply(context || this, args.concat(slice.call(arguments)));
          };
          proxy.guid = fn.guid = fn.guid || jQuery.guid++;
          return proxy;
        },
        now: Date.now,
        support: support
      });
      jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
      });
      function isArraylike(obj) {
        var length = "length" in obj && obj.length,
            type = jQuery.type(obj);
        if (type === "function" || jQuery.isWindow(obj)) {
          return false;
        }
        if (obj.nodeType === 1 && length) {
          return true;
        }
        return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
      }
      var Sizzle = (function(window) {
        var i,
            support,
            Expr,
            getText,
            isXML,
            tokenize,
            compile,
            select,
            outermostContext,
            sortInput,
            hasDuplicate,
            setDocument,
            document,
            docElem,
            documentIsHTML,
            rbuggyQSA,
            rbuggyMatches,
            matches,
            contains,
            expando = "sizzle" + 1 * new Date(),
            preferredDoc = window.document,
            dirruns = 0,
            done = 0,
            classCache = createCache(),
            tokenCache = createCache(),
            compilerCache = createCache(),
            sortOrder = function(a, b) {
              if (a === b) {
                hasDuplicate = true;
              }
              return 0;
            },
            MAX_NEGATIVE = 1 << 31,
            hasOwn = ({}).hasOwnProperty,
            arr = [],
            pop = arr.pop,
            push_native = arr.push,
            push = arr.push,
            slice = arr.slice,
            indexOf = function(list, elem) {
              var i = 0,
                  len = list.length;
              for (; i < len; i++) {
                if (list[i] === elem) {
                  return i;
                }
              }
              return -1;
            },
            booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
            whitespace = "[\\x20\\t\\r\\n\\f]",
            characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
            identifier = characterEncoding.replace("w", "w#"),
            attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace + "*([*^$|!~]?=)" + whitespace + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",
            pseudos = ":(" + characterEncoding + ")(?:\\((" + "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + ".*" + ")\\)|)",
            rwhitespace = new RegExp(whitespace + "+", "g"),
            rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
            rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
            rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),
            rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"),
            rpseudo = new RegExp(pseudos),
            ridentifier = new RegExp("^" + identifier + "$"),
            matchExpr = {
              "ID": new RegExp("^#(" + characterEncoding + ")"),
              "CLASS": new RegExp("^\\.(" + characterEncoding + ")"),
              "TAG": new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
              "ATTR": new RegExp("^" + attributes),
              "PSEUDO": new RegExp("^" + pseudos),
              "CHILD": new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
              "bool": new RegExp("^(?:" + booleans + ")$", "i"),
              "needsContext": new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
            },
            rinputs = /^(?:input|select|textarea|button)$/i,
            rheader = /^h\d$/i,
            rnative = /^[^{]+\{\s*\[native \w/,
            rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
            rsibling = /[+~]/,
            rescape = /'|\\/g,
            runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
            funescape = function(_, escaped, escapedWhitespace) {
              var high = "0x" + escaped - 0x10000;
              return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 0x10000) : String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
            },
            unloadHandler = function() {
              setDocument();
            };
        try {
          push.apply((arr = slice.call(preferredDoc.childNodes)), preferredDoc.childNodes);
          arr[preferredDoc.childNodes.length].nodeType;
        } catch (e) {
          push = {apply: arr.length ? function(target, els) {
              push_native.apply(target, slice.call(els));
            } : function(target, els) {
              var j = target.length,
                  i = 0;
              while ((target[j++] = els[i++])) {}
              target.length = j - 1;
            }};
        }
        function Sizzle(selector, context, results, seed) {
          var match,
              elem,
              m,
              nodeType,
              i,
              groups,
              old,
              nid,
              newContext,
              newSelector;
          if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
            setDocument(context);
          }
          context = context || document;
          results = results || [];
          nodeType = context.nodeType;
          if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
            return results;
          }
          if (!seed && documentIsHTML) {
            if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
              if ((m = match[1])) {
                if (nodeType === 9) {
                  elem = context.getElementById(m);
                  if (elem && elem.parentNode) {
                    if (elem.id === m) {
                      results.push(elem);
                      return results;
                    }
                  } else {
                    return results;
                  }
                } else {
                  if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) {
                    results.push(elem);
                    return results;
                  }
                }
              } else if (match[2]) {
                push.apply(results, context.getElementsByTagName(selector));
                return results;
              } else if ((m = match[3]) && support.getElementsByClassName) {
                push.apply(results, context.getElementsByClassName(m));
                return results;
              }
            }
            if (support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
              nid = old = expando;
              newContext = context;
              newSelector = nodeType !== 1 && selector;
              if (nodeType === 1 && context.nodeName.toLowerCase() !== "object") {
                groups = tokenize(selector);
                if ((old = context.getAttribute("id"))) {
                  nid = old.replace(rescape, "\\$&");
                } else {
                  context.setAttribute("id", nid);
                }
                nid = "[id='" + nid + "'] ";
                i = groups.length;
                while (i--) {
                  groups[i] = nid + toSelector(groups[i]);
                }
                newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                newSelector = groups.join(",");
              }
              if (newSelector) {
                try {
                  push.apply(results, newContext.querySelectorAll(newSelector));
                  return results;
                } catch (qsaError) {} finally {
                  if (!old) {
                    context.removeAttribute("id");
                  }
                }
              }
            }
          }
          return select(selector.replace(rtrim, "$1"), context, results, seed);
        }
        function createCache() {
          var keys = [];
          function cache(key, value) {
            if (keys.push(key + " ") > Expr.cacheLength) {
              delete cache[keys.shift()];
            }
            return (cache[key + " "] = value);
          }
          return cache;
        }
        function markFunction(fn) {
          fn[expando] = true;
          return fn;
        }
        function assert(fn) {
          var div = document.createElement("div");
          try {
            return !!fn(div);
          } catch (e) {
            return false;
          } finally {
            if (div.parentNode) {
              div.parentNode.removeChild(div);
            }
            div = null;
          }
        }
        function addHandle(attrs, handler) {
          var arr = attrs.split("|"),
              i = attrs.length;
          while (i--) {
            Expr.attrHandle[arr[i]] = handler;
          }
        }
        function siblingCheck(a, b) {
          var cur = b && a,
              diff = cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);
          if (diff) {
            return diff;
          }
          if (cur) {
            while ((cur = cur.nextSibling)) {
              if (cur === b) {
                return -1;
              }
            }
          }
          return a ? 1 : -1;
        }
        function createInputPseudo(type) {
          return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === type;
          };
        }
        function createButtonPseudo(type) {
          return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return (name === "input" || name === "button") && elem.type === type;
          };
        }
        function createPositionalPseudo(fn) {
          return markFunction(function(argument) {
            argument = +argument;
            return markFunction(function(seed, matches) {
              var j,
                  matchIndexes = fn([], seed.length, argument),
                  i = matchIndexes.length;
              while (i--) {
                if (seed[(j = matchIndexes[i])]) {
                  seed[j] = !(matches[j] = seed[j]);
                }
              }
            });
          });
        }
        function testContext(context) {
          return context && typeof context.getElementsByTagName !== "undefined" && context;
        }
        support = Sizzle.support = {};
        isXML = Sizzle.isXML = function(elem) {
          var documentElement = elem && (elem.ownerDocument || elem).documentElement;
          return documentElement ? documentElement.nodeName !== "HTML" : false;
        };
        setDocument = Sizzle.setDocument = function(node) {
          var hasCompare,
              parent,
              doc = node ? node.ownerDocument || node : preferredDoc;
          if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
            return document;
          }
          document = doc;
          docElem = doc.documentElement;
          parent = doc.defaultView;
          if (parent && parent !== parent.top) {
            if (parent.addEventListener) {
              parent.addEventListener("unload", unloadHandler, false);
            } else if (parent.attachEvent) {
              parent.attachEvent("onunload", unloadHandler);
            }
          }
          documentIsHTML = !isXML(doc);
          support.attributes = assert(function(div) {
            div.className = "i";
            return !div.getAttribute("className");
          });
          support.getElementsByTagName = assert(function(div) {
            div.appendChild(doc.createComment(""));
            return !div.getElementsByTagName("*").length;
          });
          support.getElementsByClassName = rnative.test(doc.getElementsByClassName);
          support.getById = assert(function(div) {
            docElem.appendChild(div).id = expando;
            return !doc.getElementsByName || !doc.getElementsByName(expando).length;
          });
          if (support.getById) {
            Expr.find["ID"] = function(id, context) {
              if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                var m = context.getElementById(id);
                return m && m.parentNode ? [m] : [];
              }
            };
            Expr.filter["ID"] = function(id) {
              var attrId = id.replace(runescape, funescape);
              return function(elem) {
                return elem.getAttribute("id") === attrId;
              };
            };
          } else {
            delete Expr.find["ID"];
            Expr.filter["ID"] = function(id) {
              var attrId = id.replace(runescape, funescape);
              return function(elem) {
                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return node && node.value === attrId;
              };
            };
          }
          Expr.find["TAG"] = support.getElementsByTagName ? function(tag, context) {
            if (typeof context.getElementsByTagName !== "undefined") {
              return context.getElementsByTagName(tag);
            } else if (support.qsa) {
              return context.querySelectorAll(tag);
            }
          } : function(tag, context) {
            var elem,
                tmp = [],
                i = 0,
                results = context.getElementsByTagName(tag);
            if (tag === "*") {
              while ((elem = results[i++])) {
                if (elem.nodeType === 1) {
                  tmp.push(elem);
                }
              }
              return tmp;
            }
            return results;
          };
          Expr.find["CLASS"] = support.getElementsByClassName && function(className, context) {
            if (documentIsHTML) {
              return context.getElementsByClassName(className);
            }
          };
          rbuggyMatches = [];
          rbuggyQSA = [];
          if ((support.qsa = rnative.test(doc.querySelectorAll))) {
            assert(function(div) {
              docElem.appendChild(div).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\f]' msallowcapture=''>" + "<option selected=''></option></select>";
              if (div.querySelectorAll("[msallowcapture^='']").length) {
                rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
              }
              if (!div.querySelectorAll("[selected]").length) {
                rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
              }
              if (!div.querySelectorAll("[id~=" + expando + "-]").length) {
                rbuggyQSA.push("~=");
              }
              if (!div.querySelectorAll(":checked").length) {
                rbuggyQSA.push(":checked");
              }
              if (!div.querySelectorAll("a#" + expando + "+*").length) {
                rbuggyQSA.push(".#.+[+~]");
              }
            });
            assert(function(div) {
              var input = doc.createElement("input");
              input.setAttribute("type", "hidden");
              div.appendChild(input).setAttribute("name", "D");
              if (div.querySelectorAll("[name=d]").length) {
                rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
              }
              if (!div.querySelectorAll(":enabled").length) {
                rbuggyQSA.push(":enabled", ":disabled");
              }
              div.querySelectorAll("*,:x");
              rbuggyQSA.push(",.*:");
            });
          }
          if ((support.matchesSelector = rnative.test((matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)))) {
            assert(function(div) {
              support.disconnectedMatch = matches.call(div, "div");
              matches.call(div, "[s!='']:x");
              rbuggyMatches.push("!=", pseudos);
            });
          }
          rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
          rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));
          hasCompare = rnative.test(docElem.compareDocumentPosition);
          contains = hasCompare || rnative.test(docElem.contains) ? function(a, b) {
            var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
            return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
          } : function(a, b) {
            if (b) {
              while ((b = b.parentNode)) {
                if (b === a) {
                  return true;
                }
              }
            }
            return false;
          };
          sortOrder = hasCompare ? function(a, b) {
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }
            var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
            if (compare) {
              return compare;
            }
            compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
            if (compare & 1 || (!support.sortDetached && b.compareDocumentPosition(a) === compare)) {
              if (a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
                return -1;
              }
              if (b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
                return 1;
              }
              return sortInput ? (indexOf(sortInput, a) - indexOf(sortInput, b)) : 0;
            }
            return compare & 4 ? -1 : 1;
          } : function(a, b) {
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }
            var cur,
                i = 0,
                aup = a.parentNode,
                bup = b.parentNode,
                ap = [a],
                bp = [b];
            if (!aup || !bup) {
              return a === doc ? -1 : b === doc ? 1 : aup ? -1 : bup ? 1 : sortInput ? (indexOf(sortInput, a) - indexOf(sortInput, b)) : 0;
            } else if (aup === bup) {
              return siblingCheck(a, b);
            }
            cur = a;
            while ((cur = cur.parentNode)) {
              ap.unshift(cur);
            }
            cur = b;
            while ((cur = cur.parentNode)) {
              bp.unshift(cur);
            }
            while (ap[i] === bp[i]) {
              i++;
            }
            return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
          };
          return doc;
        };
        Sizzle.matches = function(expr, elements) {
          return Sizzle(expr, null, null, elements);
        };
        Sizzle.matchesSelector = function(elem, expr) {
          if ((elem.ownerDocument || elem) !== document) {
            setDocument(elem);
          }
          expr = expr.replace(rattributeQuotes, "='$1']");
          if (support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
            try {
              var ret = matches.call(elem, expr);
              if (ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11) {
                return ret;
              }
            } catch (e) {}
          }
          return Sizzle(expr, document, null, [elem]).length > 0;
        };
        Sizzle.contains = function(context, elem) {
          if ((context.ownerDocument || context) !== document) {
            setDocument(context);
          }
          return contains(context, elem);
        };
        Sizzle.attr = function(elem, name) {
          if ((elem.ownerDocument || elem) !== document) {
            setDocument(elem);
          }
          var fn = Expr.attrHandle[name.toLowerCase()],
              val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
          return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
        };
        Sizzle.error = function(msg) {
          throw new Error("Syntax error, unrecognized expression: " + msg);
        };
        Sizzle.uniqueSort = function(results) {
          var elem,
              duplicates = [],
              j = 0,
              i = 0;
          hasDuplicate = !support.detectDuplicates;
          sortInput = !support.sortStable && results.slice(0);
          results.sort(sortOrder);
          if (hasDuplicate) {
            while ((elem = results[i++])) {
              if (elem === results[i]) {
                j = duplicates.push(i);
              }
            }
            while (j--) {
              results.splice(duplicates[j], 1);
            }
          }
          sortInput = null;
          return results;
        };
        getText = Sizzle.getText = function(elem) {
          var node,
              ret = "",
              i = 0,
              nodeType = elem.nodeType;
          if (!nodeType) {
            while ((node = elem[i++])) {
              ret += getText(node);
            }
          } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
            if (typeof elem.textContent === "string") {
              return elem.textContent;
            } else {
              for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                ret += getText(elem);
              }
            }
          } else if (nodeType === 3 || nodeType === 4) {
            return elem.nodeValue;
          }
          return ret;
        };
        Expr = Sizzle.selectors = {
          cacheLength: 50,
          createPseudo: markFunction,
          match: matchExpr,
          attrHandle: {},
          find: {},
          relative: {
            ">": {
              dir: "parentNode",
              first: true
            },
            " ": {dir: "parentNode"},
            "+": {
              dir: "previousSibling",
              first: true
            },
            "~": {dir: "previousSibling"}
          },
          preFilter: {
            "ATTR": function(match) {
              match[1] = match[1].replace(runescape, funescape);
              match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
              if (match[2] === "~=") {
                match[3] = " " + match[3] + " ";
              }
              return match.slice(0, 4);
            },
            "CHILD": function(match) {
              match[1] = match[1].toLowerCase();
              if (match[1].slice(0, 3) === "nth") {
                if (!match[3]) {
                  Sizzle.error(match[0]);
                }
                match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                match[5] = +((match[7] + match[8]) || match[3] === "odd");
              } else if (match[3]) {
                Sizzle.error(match[0]);
              }
              return match;
            },
            "PSEUDO": function(match) {
              var excess,
                  unquoted = !match[6] && match[2];
              if (matchExpr["CHILD"].test(match[0])) {
                return null;
              }
              if (match[3]) {
                match[2] = match[4] || match[5] || "";
              } else if (unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                match[0] = match[0].slice(0, excess);
                match[2] = unquoted.slice(0, excess);
              }
              return match.slice(0, 3);
            }
          },
          filter: {
            "TAG": function(nodeNameSelector) {
              var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
              return nodeNameSelector === "*" ? function() {
                return true;
              } : function(elem) {
                return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
              };
            },
            "CLASS": function(className) {
              var pattern = classCache[className + " "];
              return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");
              });
            },
            "ATTR": function(name, operator, check) {
              return function(elem) {
                var result = Sizzle.attr(elem, name);
                if (result == null) {
                  return operator === "!=";
                }
                if (!operator) {
                  return true;
                }
                result += "";
                return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false;
              };
            },
            "CHILD": function(type, what, argument, first, last) {
              var simple = type.slice(0, 3) !== "nth",
                  forward = type.slice(-4) !== "last",
                  ofType = what === "of-type";
              return first === 1 && last === 0 ? function(elem) {
                return !!elem.parentNode;
              } : function(elem, context, xml) {
                var cache,
                    outerCache,
                    node,
                    diff,
                    nodeIndex,
                    start,
                    dir = simple !== forward ? "nextSibling" : "previousSibling",
                    parent = elem.parentNode,
                    name = ofType && elem.nodeName.toLowerCase(),
                    useCache = !xml && !ofType;
                if (parent) {
                  if (simple) {
                    while (dir) {
                      node = elem;
                      while ((node = node[dir])) {
                        if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                          return false;
                        }
                      }
                      start = dir = type === "only" && !start && "nextSibling";
                    }
                    return true;
                  }
                  start = [forward ? parent.firstChild : parent.lastChild];
                  if (forward && useCache) {
                    outerCache = parent[expando] || (parent[expando] = {});
                    cache = outerCache[type] || [];
                    nodeIndex = cache[0] === dirruns && cache[1];
                    diff = cache[0] === dirruns && cache[2];
                    node = nodeIndex && parent.childNodes[nodeIndex];
                    while ((node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop())) {
                      if (node.nodeType === 1 && ++diff && node === elem) {
                        outerCache[type] = [dirruns, nodeIndex, diff];
                        break;
                      }
                    }
                  } else if (useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns) {
                    diff = cache[1];
                  } else {
                    while ((node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop())) {
                      if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                        if (useCache) {
                          (node[expando] || (node[expando] = {}))[type] = [dirruns, diff];
                        }
                        if (node === elem) {
                          break;
                        }
                      }
                    }
                  }
                  diff -= last;
                  return diff === first || (diff % first === 0 && diff / first >= 0);
                }
              };
            },
            "PSEUDO": function(pseudo, argument) {
              var args,
                  fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
              if (fn[expando]) {
                return fn(argument);
              }
              if (fn.length > 1) {
                args = [pseudo, pseudo, "", argument];
                return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                  var idx,
                      matched = fn(seed, argument),
                      i = matched.length;
                  while (i--) {
                    idx = indexOf(seed, matched[i]);
                    seed[idx] = !(matches[idx] = matched[i]);
                  }
                }) : function(elem) {
                  return fn(elem, 0, args);
                };
              }
              return fn;
            }
          },
          pseudos: {
            "not": markFunction(function(selector) {
              var input = [],
                  results = [],
                  matcher = compile(selector.replace(rtrim, "$1"));
              return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                var elem,
                    unmatched = matcher(seed, null, xml, []),
                    i = seed.length;
                while (i--) {
                  if ((elem = unmatched[i])) {
                    seed[i] = !(matches[i] = elem);
                  }
                }
              }) : function(elem, context, xml) {
                input[0] = elem;
                matcher(input, null, xml, results);
                input[0] = null;
                return !results.pop();
              };
            }),
            "has": markFunction(function(selector) {
              return function(elem) {
                return Sizzle(selector, elem).length > 0;
              };
            }),
            "contains": markFunction(function(text) {
              text = text.replace(runescape, funescape);
              return function(elem) {
                return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
              };
            }),
            "lang": markFunction(function(lang) {
              if (!ridentifier.test(lang || "")) {
                Sizzle.error("unsupported lang: " + lang);
              }
              lang = lang.replace(runescape, funescape).toLowerCase();
              return function(elem) {
                var elemLang;
                do {
                  if ((elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang"))) {
                    elemLang = elemLang.toLowerCase();
                    return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                  }
                } while ((elem = elem.parentNode) && elem.nodeType === 1);
                return false;
              };
            }),
            "target": function(elem) {
              var hash = window.location && window.location.hash;
              return hash && hash.slice(1) === elem.id;
            },
            "root": function(elem) {
              return elem === docElem;
            },
            "focus": function(elem) {
              return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
            },
            "enabled": function(elem) {
              return elem.disabled === false;
            },
            "disabled": function(elem) {
              return elem.disabled === true;
            },
            "checked": function(elem) {
              var nodeName = elem.nodeName.toLowerCase();
              return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
            },
            "selected": function(elem) {
              if (elem.parentNode) {
                elem.parentNode.selectedIndex;
              }
              return elem.selected === true;
            },
            "empty": function(elem) {
              for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                if (elem.nodeType < 6) {
                  return false;
                }
              }
              return true;
            },
            "parent": function(elem) {
              return !Expr.pseudos["empty"](elem);
            },
            "header": function(elem) {
              return rheader.test(elem.nodeName);
            },
            "input": function(elem) {
              return rinputs.test(elem.nodeName);
            },
            "button": function(elem) {
              var name = elem.nodeName.toLowerCase();
              return name === "input" && elem.type === "button" || name === "button";
            },
            "text": function(elem) {
              var attr;
              return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
            },
            "first": createPositionalPseudo(function() {
              return [0];
            }),
            "last": createPositionalPseudo(function(matchIndexes, length) {
              return [length - 1];
            }),
            "eq": createPositionalPseudo(function(matchIndexes, length, argument) {
              return [argument < 0 ? argument + length : argument];
            }),
            "even": createPositionalPseudo(function(matchIndexes, length) {
              var i = 0;
              for (; i < length; i += 2) {
                matchIndexes.push(i);
              }
              return matchIndexes;
            }),
            "odd": createPositionalPseudo(function(matchIndexes, length) {
              var i = 1;
              for (; i < length; i += 2) {
                matchIndexes.push(i);
              }
              return matchIndexes;
            }),
            "lt": createPositionalPseudo(function(matchIndexes, length, argument) {
              var i = argument < 0 ? argument + length : argument;
              for (; --i >= 0; ) {
                matchIndexes.push(i);
              }
              return matchIndexes;
            }),
            "gt": createPositionalPseudo(function(matchIndexes, length, argument) {
              var i = argument < 0 ? argument + length : argument;
              for (; ++i < length; ) {
                matchIndexes.push(i);
              }
              return matchIndexes;
            })
          }
        };
        Expr.pseudos["nth"] = Expr.pseudos["eq"];
        for (i in {
          radio: true,
          checkbox: true,
          file: true,
          password: true,
          image: true
        }) {
          Expr.pseudos[i] = createInputPseudo(i);
        }
        for (i in {
          submit: true,
          reset: true
        }) {
          Expr.pseudos[i] = createButtonPseudo(i);
        }
        function setFilters() {}
        setFilters.prototype = Expr.filters = Expr.pseudos;
        Expr.setFilters = new setFilters();
        tokenize = Sizzle.tokenize = function(selector, parseOnly) {
          var matched,
              match,
              tokens,
              type,
              soFar,
              groups,
              preFilters,
              cached = tokenCache[selector + " "];
          if (cached) {
            return parseOnly ? 0 : cached.slice(0);
          }
          soFar = selector;
          groups = [];
          preFilters = Expr.preFilter;
          while (soFar) {
            if (!matched || (match = rcomma.exec(soFar))) {
              if (match) {
                soFar = soFar.slice(match[0].length) || soFar;
              }
              groups.push((tokens = []));
            }
            matched = false;
            if ((match = rcombinators.exec(soFar))) {
              matched = match.shift();
              tokens.push({
                value: matched,
                type: match[0].replace(rtrim, " ")
              });
              soFar = soFar.slice(matched.length);
            }
            for (type in Expr.filter) {
              if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                matched = match.shift();
                tokens.push({
                  value: matched,
                  type: type,
                  matches: match
                });
                soFar = soFar.slice(matched.length);
              }
            }
            if (!matched) {
              break;
            }
          }
          return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
        };
        function toSelector(tokens) {
          var i = 0,
              len = tokens.length,
              selector = "";
          for (; i < len; i++) {
            selector += tokens[i].value;
          }
          return selector;
        }
        function addCombinator(matcher, combinator, base) {
          var dir = combinator.dir,
              checkNonElements = base && dir === "parentNode",
              doneName = done++;
          return combinator.first ? function(elem, context, xml) {
            while ((elem = elem[dir])) {
              if (elem.nodeType === 1 || checkNonElements) {
                return matcher(elem, context, xml);
              }
            }
          } : function(elem, context, xml) {
            var oldCache,
                outerCache,
                newCache = [dirruns, doneName];
            if (xml) {
              while ((elem = elem[dir])) {
                if (elem.nodeType === 1 || checkNonElements) {
                  if (matcher(elem, context, xml)) {
                    return true;
                  }
                }
              }
            } else {
              while ((elem = elem[dir])) {
                if (elem.nodeType === 1 || checkNonElements) {
                  outerCache = elem[expando] || (elem[expando] = {});
                  if ((oldCache = outerCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                    return (newCache[2] = oldCache[2]);
                  } else {
                    outerCache[dir] = newCache;
                    if ((newCache[2] = matcher(elem, context, xml))) {
                      return true;
                    }
                  }
                }
              }
            }
          };
        }
        function elementMatcher(matchers) {
          return matchers.length > 1 ? function(elem, context, xml) {
            var i = matchers.length;
            while (i--) {
              if (!matchers[i](elem, context, xml)) {
                return false;
              }
            }
            return true;
          } : matchers[0];
        }
        function multipleContexts(selector, contexts, results) {
          var i = 0,
              len = contexts.length;
          for (; i < len; i++) {
            Sizzle(selector, contexts[i], results);
          }
          return results;
        }
        function condense(unmatched, map, filter, context, xml) {
          var elem,
              newUnmatched = [],
              i = 0,
              len = unmatched.length,
              mapped = map != null;
          for (; i < len; i++) {
            if ((elem = unmatched[i])) {
              if (!filter || filter(elem, context, xml)) {
                newUnmatched.push(elem);
                if (mapped) {
                  map.push(i);
                }
              }
            }
          }
          return newUnmatched;
        }
        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
          if (postFilter && !postFilter[expando]) {
            postFilter = setMatcher(postFilter);
          }
          if (postFinder && !postFinder[expando]) {
            postFinder = setMatcher(postFinder, postSelector);
          }
          return markFunction(function(seed, results, context, xml) {
            var temp,
                i,
                elem,
                preMap = [],
                postMap = [],
                preexisting = results.length,
                elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),
                matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
                matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
            if (matcher) {
              matcher(matcherIn, matcherOut, context, xml);
            }
            if (postFilter) {
              temp = condense(matcherOut, postMap);
              postFilter(temp, [], context, xml);
              i = temp.length;
              while (i--) {
                if ((elem = temp[i])) {
                  matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
                }
              }
            }
            if (seed) {
              if (postFinder || preFilter) {
                if (postFinder) {
                  temp = [];
                  i = matcherOut.length;
                  while (i--) {
                    if ((elem = matcherOut[i])) {
                      temp.push((matcherIn[i] = elem));
                    }
                  }
                  postFinder(null, (matcherOut = []), temp, xml);
                }
                i = matcherOut.length;
                while (i--) {
                  if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                    seed[temp] = !(results[temp] = elem);
                  }
                }
              }
            } else {
              matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
              if (postFinder) {
                postFinder(null, results, matcherOut, xml);
              } else {
                push.apply(results, matcherOut);
              }
            }
          });
        }
        function matcherFromTokens(tokens) {
          var checkContext,
              matcher,
              j,
              len = tokens.length,
              leadingRelative = Expr.relative[tokens[0].type],
              implicitRelative = leadingRelative || Expr.relative[" "],
              i = leadingRelative ? 1 : 0,
              matchContext = addCombinator(function(elem) {
                return elem === checkContext;
              }, implicitRelative, true),
              matchAnyContext = addCombinator(function(elem) {
                return indexOf(checkContext, elem) > -1;
              }, implicitRelative, true),
              matchers = [function(elem, context, xml) {
                var ret = (!leadingRelative && (xml || context !== outermostContext)) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
                checkContext = null;
                return ret;
              }];
          for (; i < len; i++) {
            if ((matcher = Expr.relative[tokens[i].type])) {
              matchers = [addCombinator(elementMatcher(matchers), matcher)];
            } else {
              matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);
              if (matcher[expando]) {
                j = ++i;
                for (; j < len; j++) {
                  if (Expr.relative[tokens[j].type]) {
                    break;
                  }
                }
                return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({value: tokens[i - 2].type === " " ? "*" : ""})).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens((tokens = tokens.slice(j))), j < len && toSelector(tokens));
              }
              matchers.push(matcher);
            }
          }
          return elementMatcher(matchers);
        }
        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
          var bySet = setMatchers.length > 0,
              byElement = elementMatchers.length > 0,
              superMatcher = function(seed, context, xml, results, outermost) {
                var elem,
                    j,
                    matcher,
                    matchedCount = 0,
                    i = "0",
                    unmatched = seed && [],
                    setMatched = [],
                    contextBackup = outermostContext,
                    elems = seed || byElement && Expr.find["TAG"]("*", outermost),
                    dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
                    len = elems.length;
                if (outermost) {
                  outermostContext = context !== document && context;
                }
                for (; i !== len && (elem = elems[i]) != null; i++) {
                  if (byElement && elem) {
                    j = 0;
                    while ((matcher = elementMatchers[j++])) {
                      if (matcher(elem, context, xml)) {
                        results.push(elem);
                        break;
                      }
                    }
                    if (outermost) {
                      dirruns = dirrunsUnique;
                    }
                  }
                  if (bySet) {
                    if ((elem = !matcher && elem)) {
                      matchedCount--;
                    }
                    if (seed) {
                      unmatched.push(elem);
                    }
                  }
                }
                matchedCount += i;
                if (bySet && i !== matchedCount) {
                  j = 0;
                  while ((matcher = setMatchers[j++])) {
                    matcher(unmatched, setMatched, context, xml);
                  }
                  if (seed) {
                    if (matchedCount > 0) {
                      while (i--) {
                        if (!(unmatched[i] || setMatched[i])) {
                          setMatched[i] = pop.call(results);
                        }
                      }
                    }
                    setMatched = condense(setMatched);
                  }
                  push.apply(results, setMatched);
                  if (outermost && !seed && setMatched.length > 0 && (matchedCount + setMatchers.length) > 1) {
                    Sizzle.uniqueSort(results);
                  }
                }
                if (outermost) {
                  dirruns = dirrunsUnique;
                  outermostContext = contextBackup;
                }
                return unmatched;
              };
          return bySet ? markFunction(superMatcher) : superMatcher;
        }
        compile = Sizzle.compile = function(selector, match) {
          var i,
              setMatchers = [],
              elementMatchers = [],
              cached = compilerCache[selector + " "];
          if (!cached) {
            if (!match) {
              match = tokenize(selector);
            }
            i = match.length;
            while (i--) {
              cached = matcherFromTokens(match[i]);
              if (cached[expando]) {
                setMatchers.push(cached);
              } else {
                elementMatchers.push(cached);
              }
            }
            cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
            cached.selector = selector;
          }
          return cached;
        };
        select = Sizzle.select = function(selector, context, results, seed) {
          var i,
              tokens,
              token,
              type,
              find,
              compiled = typeof selector === "function" && selector,
              match = !seed && tokenize((selector = compiled.selector || selector));
          results = results || [];
          if (match.length === 1) {
            tokens = match[0] = match[0].slice(0);
            if (tokens.length > 2 && (token = tokens[0]).type === "ID" && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
              context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
              if (!context) {
                return results;
              } else if (compiled) {
                context = context.parentNode;
              }
              selector = selector.slice(tokens.shift().value.length);
            }
            i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
            while (i--) {
              token = tokens[i];
              if (Expr.relative[(type = token.type)]) {
                break;
              }
              if ((find = Expr.find[type])) {
                if ((seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context))) {
                  tokens.splice(i, 1);
                  selector = seed.length && toSelector(tokens);
                  if (!selector) {
                    push.apply(results, seed);
                    return results;
                  }
                  break;
                }
              }
            }
          }
          (compiled || compile(selector, match))(seed, context, !documentIsHTML, results, rsibling.test(selector) && testContext(context.parentNode) || context);
          return results;
        };
        support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
        support.detectDuplicates = !!hasDuplicate;
        setDocument();
        support.sortDetached = assert(function(div1) {
          return div1.compareDocumentPosition(document.createElement("div")) & 1;
        });
        if (!assert(function(div) {
          div.innerHTML = "<a href='#'></a>";
          return div.firstChild.getAttribute("href") === "#";
        })) {
          addHandle("type|href|height|width", function(elem, name, isXML) {
            if (!isXML) {
              return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
            }
          });
        }
        if (!support.attributes || !assert(function(div) {
          div.innerHTML = "<input/>";
          div.firstChild.setAttribute("value", "");
          return div.firstChild.getAttribute("value") === "";
        })) {
          addHandle("value", function(elem, name, isXML) {
            if (!isXML && elem.nodeName.toLowerCase() === "input") {
              return elem.defaultValue;
            }
          });
        }
        if (!assert(function(div) {
          return div.getAttribute("disabled") == null;
        })) {
          addHandle(booleans, function(elem, name, isXML) {
            var val;
            if (!isXML) {
              return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
            }
          });
        }
        return Sizzle;
      })(window);
      jQuery.find = Sizzle;
      jQuery.expr = Sizzle.selectors;
      jQuery.expr[":"] = jQuery.expr.pseudos;
      jQuery.unique = Sizzle.uniqueSort;
      jQuery.text = Sizzle.getText;
      jQuery.isXMLDoc = Sizzle.isXML;
      jQuery.contains = Sizzle.contains;
      var rneedsContext = jQuery.expr.match.needsContext;
      var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);
      var risSimple = /^.[^:#\[\.,]*$/;
      function winnow(elements, qualifier, not) {
        if (jQuery.isFunction(qualifier)) {
          return jQuery.grep(elements, function(elem, i) {
            return !!qualifier.call(elem, i, elem) !== not;
          });
        }
        if (qualifier.nodeType) {
          return jQuery.grep(elements, function(elem) {
            return (elem === qualifier) !== not;
          });
        }
        if (typeof qualifier === "string") {
          if (risSimple.test(qualifier)) {
            return jQuery.filter(qualifier, elements, not);
          }
          qualifier = jQuery.filter(qualifier, elements);
        }
        return jQuery.grep(elements, function(elem) {
          return (indexOf.call(qualifier, elem) >= 0) !== not;
        });
      }
      jQuery.filter = function(expr, elems, not) {
        var elem = elems[0];
        if (not) {
          expr = ":not(" + expr + ")";
        }
        return elems.length === 1 && elem.nodeType === 1 ? jQuery.find.matchesSelector(elem, expr) ? [elem] : [] : jQuery.find.matches(expr, jQuery.grep(elems, function(elem) {
          return elem.nodeType === 1;
        }));
      };
      jQuery.fn.extend({
        find: function(selector) {
          var i,
              len = this.length,
              ret = [],
              self = this;
          if (typeof selector !== "string") {
            return this.pushStack(jQuery(selector).filter(function() {
              for (i = 0; i < len; i++) {
                if (jQuery.contains(self[i], this)) {
                  return true;
                }
              }
            }));
          }
          for (i = 0; i < len; i++) {
            jQuery.find(selector, self[i], ret);
          }
          ret = this.pushStack(len > 1 ? jQuery.unique(ret) : ret);
          ret.selector = this.selector ? this.selector + " " + selector : selector;
          return ret;
        },
        filter: function(selector) {
          return this.pushStack(winnow(this, selector || [], false));
        },
        not: function(selector) {
          return this.pushStack(winnow(this, selector || [], true));
        },
        is: function(selector) {
          return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length;
        }
      });
      var rootjQuery,
          rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
          init = jQuery.fn.init = function(selector, context) {
            var match,
                elem;
            if (!selector) {
              return this;
            }
            if (typeof selector === "string") {
              if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
                match = [null, selector, null];
              } else {
                match = rquickExpr.exec(selector);
              }
              if (match && (match[1] || !context)) {
                if (match[1]) {
                  context = context instanceof jQuery ? context[0] : context;
                  jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
                  if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                    for (match in context) {
                      if (jQuery.isFunction(this[match])) {
                        this[match](context[match]);
                      } else {
                        this.attr(match, context[match]);
                      }
                    }
                  }
                  return this;
                } else {
                  elem = document.getElementById(match[2]);
                  if (elem && elem.parentNode) {
                    this.length = 1;
                    this[0] = elem;
                  }
                  this.context = document;
                  this.selector = selector;
                  return this;
                }
              } else if (!context || context.jquery) {
                return (context || rootjQuery).find(selector);
              } else {
                return this.constructor(context).find(selector);
              }
            } else if (selector.nodeType) {
              this.context = this[0] = selector;
              this.length = 1;
              return this;
            } else if (jQuery.isFunction(selector)) {
              return typeof rootjQuery.ready !== "undefined" ? rootjQuery.ready(selector) : selector(jQuery);
            }
            if (selector.selector !== undefined) {
              this.selector = selector.selector;
              this.context = selector.context;
            }
            return jQuery.makeArray(selector, this);
          };
      init.prototype = jQuery.fn;
      rootjQuery = jQuery(document);
      var rparentsprev = /^(?:parents|prev(?:Until|All))/,
          guaranteedUnique = {
            children: true,
            contents: true,
            next: true,
            prev: true
          };
      jQuery.extend({
        dir: function(elem, dir, until) {
          var matched = [],
              truncate = until !== undefined;
          while ((elem = elem[dir]) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
              if (truncate && jQuery(elem).is(until)) {
                break;
              }
              matched.push(elem);
            }
          }
          return matched;
        },
        sibling: function(n, elem) {
          var matched = [];
          for (; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
              matched.push(n);
            }
          }
          return matched;
        }
      });
      jQuery.fn.extend({
        has: function(target) {
          var targets = jQuery(target, this),
              l = targets.length;
          return this.filter(function() {
            var i = 0;
            for (; i < l; i++) {
              if (jQuery.contains(this, targets[i])) {
                return true;
              }
            }
          });
        },
        closest: function(selectors, context) {
          var cur,
              i = 0,
              l = this.length,
              matched = [],
              pos = rneedsContext.test(selectors) || typeof selectors !== "string" ? jQuery(selectors, context || this.context) : 0;
          for (; i < l; i++) {
            for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
              if (cur.nodeType < 11 && (pos ? pos.index(cur) > -1 : cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))) {
                matched.push(cur);
                break;
              }
            }
          }
          return this.pushStack(matched.length > 1 ? jQuery.unique(matched) : matched);
        },
        index: function(elem) {
          if (!elem) {
            return (this[0] && this[0].parentNode) ? this.first().prevAll().length : -1;
          }
          if (typeof elem === "string") {
            return indexOf.call(jQuery(elem), this[0]);
          }
          return indexOf.call(this, elem.jquery ? elem[0] : elem);
        },
        add: function(selector, context) {
          return this.pushStack(jQuery.unique(jQuery.merge(this.get(), jQuery(selector, context))));
        },
        addBack: function(selector) {
          return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
        }
      });
      function sibling(cur, dir) {
        while ((cur = cur[dir]) && cur.nodeType !== 1) {}
        return cur;
      }
      jQuery.each({
        parent: function(elem) {
          var parent = elem.parentNode;
          return parent && parent.nodeType !== 11 ? parent : null;
        },
        parents: function(elem) {
          return jQuery.dir(elem, "parentNode");
        },
        parentsUntil: function(elem, i, until) {
          return jQuery.dir(elem, "parentNode", until);
        },
        next: function(elem) {
          return sibling(elem, "nextSibling");
        },
        prev: function(elem) {
          return sibling(elem, "previousSibling");
        },
        nextAll: function(elem) {
          return jQuery.dir(elem, "nextSibling");
        },
        prevAll: function(elem) {
          return jQuery.dir(elem, "previousSibling");
        },
        nextUntil: function(elem, i, until) {
          return jQuery.dir(elem, "nextSibling", until);
        },
        prevUntil: function(elem, i, until) {
          return jQuery.dir(elem, "previousSibling", until);
        },
        siblings: function(elem) {
          return jQuery.sibling((elem.parentNode || {}).firstChild, elem);
        },
        children: function(elem) {
          return jQuery.sibling(elem.firstChild);
        },
        contents: function(elem) {
          return elem.contentDocument || jQuery.merge([], elem.childNodes);
        }
      }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
          var matched = jQuery.map(this, fn, until);
          if (name.slice(-5) !== "Until") {
            selector = until;
          }
          if (selector && typeof selector === "string") {
            matched = jQuery.filter(selector, matched);
          }
          if (this.length > 1) {
            if (!guaranteedUnique[name]) {
              jQuery.unique(matched);
            }
            if (rparentsprev.test(name)) {
              matched.reverse();
            }
          }
          return this.pushStack(matched);
        };
      });
      var rnotwhite = (/\S+/g);
      var optionsCache = {};
      function createOptions(options) {
        var object = optionsCache[options] = {};
        jQuery.each(options.match(rnotwhite) || [], function(_, flag) {
          object[flag] = true;
        });
        return object;
      }
      jQuery.Callbacks = function(options) {
        options = typeof options === "string" ? (optionsCache[options] || createOptions(options)) : jQuery.extend({}, options);
        var memory,
            fired,
            firing,
            firingStart,
            firingLength,
            firingIndex,
            list = [],
            stack = !options.once && [],
            fire = function(data) {
              memory = options.memory && data;
              fired = true;
              firingIndex = firingStart || 0;
              firingStart = 0;
              firingLength = list.length;
              firing = true;
              for (; list && firingIndex < firingLength; firingIndex++) {
                if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                  memory = false;
                  break;
                }
              }
              firing = false;
              if (list) {
                if (stack) {
                  if (stack.length) {
                    fire(stack.shift());
                  }
                } else if (memory) {
                  list = [];
                } else {
                  self.disable();
                }
              }
            },
            self = {
              add: function() {
                if (list) {
                  var start = list.length;
                  (function add(args) {
                    jQuery.each(args, function(_, arg) {
                      var type = jQuery.type(arg);
                      if (type === "function") {
                        if (!options.unique || !self.has(arg)) {
                          list.push(arg);
                        }
                      } else if (arg && arg.length && type !== "string") {
                        add(arg);
                      }
                    });
                  })(arguments);
                  if (firing) {
                    firingLength = list.length;
                  } else if (memory) {
                    firingStart = start;
                    fire(memory);
                  }
                }
                return this;
              },
              remove: function() {
                if (list) {
                  jQuery.each(arguments, function(_, arg) {
                    var index;
                    while ((index = jQuery.inArray(arg, list, index)) > -1) {
                      list.splice(index, 1);
                      if (firing) {
                        if (index <= firingLength) {
                          firingLength--;
                        }
                        if (index <= firingIndex) {
                          firingIndex--;
                        }
                      }
                    }
                  });
                }
                return this;
              },
              has: function(fn) {
                return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
              },
              empty: function() {
                list = [];
                firingLength = 0;
                return this;
              },
              disable: function() {
                list = stack = memory = undefined;
                return this;
              },
              disabled: function() {
                return !list;
              },
              lock: function() {
                stack = undefined;
                if (!memory) {
                  self.disable();
                }
                return this;
              },
              locked: function() {
                return !stack;
              },
              fireWith: function(context, args) {
                if (list && (!fired || stack)) {
                  args = args || [];
                  args = [context, args.slice ? args.slice() : args];
                  if (firing) {
                    stack.push(args);
                  } else {
                    fire(args);
                  }
                }
                return this;
              },
              fire: function() {
                self.fireWith(this, arguments);
                return this;
              },
              fired: function() {
                return !!fired;
              }
            };
        return self;
      };
      jQuery.extend({
        Deferred: function(func) {
          var tuples = [["resolve", "done", jQuery.Callbacks("once memory"), "resolved"], ["reject", "fail", jQuery.Callbacks("once memory"), "rejected"], ["notify", "progress", jQuery.Callbacks("memory")]],
              state = "pending",
              promise = {
                state: function() {
                  return state;
                },
                always: function() {
                  deferred.done(arguments).fail(arguments);
                  return this;
                },
                then: function() {
                  var fns = arguments;
                  return jQuery.Deferred(function(newDefer) {
                    jQuery.each(tuples, function(i, tuple) {
                      var fn = jQuery.isFunction(fns[i]) && fns[i];
                      deferred[tuple[1]](function() {
                        var returned = fn && fn.apply(this, arguments);
                        if (returned && jQuery.isFunction(returned.promise)) {
                          returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);
                        } else {
                          newDefer[tuple[0] + "With"](this === promise ? newDefer.promise() : this, fn ? [returned] : arguments);
                        }
                      });
                    });
                    fns = null;
                  }).promise();
                },
                promise: function(obj) {
                  return obj != null ? jQuery.extend(obj, promise) : promise;
                }
              },
              deferred = {};
          promise.pipe = promise.then;
          jQuery.each(tuples, function(i, tuple) {
            var list = tuple[2],
                stateString = tuple[3];
            promise[tuple[1]] = list.add;
            if (stateString) {
              list.add(function() {
                state = stateString;
              }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
            }
            deferred[tuple[0]] = function() {
              deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
              return this;
            };
            deferred[tuple[0] + "With"] = list.fireWith;
          });
          promise.promise(deferred);
          if (func) {
            func.call(deferred, deferred);
          }
          return deferred;
        },
        when: function(subordinate) {
          var i = 0,
              resolveValues = slice.call(arguments),
              length = resolveValues.length,
              remaining = length !== 1 || (subordinate && jQuery.isFunction(subordinate.promise)) ? length : 0,
              deferred = remaining === 1 ? subordinate : jQuery.Deferred(),
              updateFunc = function(i, contexts, values) {
                return function(value) {
                  contexts[i] = this;
                  values[i] = arguments.length > 1 ? slice.call(arguments) : value;
                  if (values === progressValues) {
                    deferred.notifyWith(contexts, values);
                  } else if (!(--remaining)) {
                    deferred.resolveWith(contexts, values);
                  }
                };
              },
              progressValues,
              progressContexts,
              resolveContexts;
          if (length > 1) {
            progressValues = new Array(length);
            progressContexts = new Array(length);
            resolveContexts = new Array(length);
            for (; i < length; i++) {
              if (resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)) {
                resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues));
              } else {
                --remaining;
              }
            }
          }
          if (!remaining) {
            deferred.resolveWith(resolveContexts, resolveValues);
          }
          return deferred.promise();
        }
      });
      var readyList;
      jQuery.fn.ready = function(fn) {
        jQuery.ready.promise().done(fn);
        return this;
      };
      jQuery.extend({
        isReady: false,
        readyWait: 1,
        holdReady: function(hold) {
          if (hold) {
            jQuery.readyWait++;
          } else {
            jQuery.ready(true);
          }
        },
        ready: function(wait) {
          if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
            return;
          }
          jQuery.isReady = true;
          if (wait !== true && --jQuery.readyWait > 0) {
            return;
          }
          readyList.resolveWith(document, [jQuery]);
          if (jQuery.fn.triggerHandler) {
            jQuery(document).triggerHandler("ready");
            jQuery(document).off("ready");
          }
        }
      });
      function completed() {
        document.removeEventListener("DOMContentLoaded", completed, false);
        window.removeEventListener("load", completed, false);
        jQuery.ready();
      }
      jQuery.ready.promise = function(obj) {
        if (!readyList) {
          readyList = jQuery.Deferred();
          if (document.readyState === "complete") {
            setTimeout(jQuery.ready);
          } else {
            document.addEventListener("DOMContentLoaded", completed, false);
            window.addEventListener("load", completed, false);
          }
        }
        return readyList.promise(obj);
      };
      jQuery.ready.promise();
      var access = jQuery.access = function(elems, fn, key, value, chainable, emptyGet, raw) {
        var i = 0,
            len = elems.length,
            bulk = key == null;
        if (jQuery.type(key) === "object") {
          chainable = true;
          for (i in key) {
            jQuery.access(elems, fn, i, key[i], true, emptyGet, raw);
          }
        } else if (value !== undefined) {
          chainable = true;
          if (!jQuery.isFunction(value)) {
            raw = true;
          }
          if (bulk) {
            if (raw) {
              fn.call(elems, value);
              fn = null;
            } else {
              bulk = fn;
              fn = function(elem, key, value) {
                return bulk.call(jQuery(elem), value);
              };
            }
          }
          if (fn) {
            for (; i < len; i++) {
              fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
            }
          }
        }
        return chainable ? elems : bulk ? fn.call(elems) : len ? fn(elems[0], key) : emptyGet;
      };
      jQuery.acceptData = function(owner) {
        return owner.nodeType === 1 || owner.nodeType === 9 || !(+owner.nodeType);
      };
      function Data() {
        Object.defineProperty(this.cache = {}, 0, {get: function() {
            return {};
          }});
        this.expando = jQuery.expando + Data.uid++;
      }
      Data.uid = 1;
      Data.accepts = jQuery.acceptData;
      Data.prototype = {
        key: function(owner) {
          if (!Data.accepts(owner)) {
            return 0;
          }
          var descriptor = {},
              unlock = owner[this.expando];
          if (!unlock) {
            unlock = Data.uid++;
            try {
              descriptor[this.expando] = {value: unlock};
              Object.defineProperties(owner, descriptor);
            } catch (e) {
              descriptor[this.expando] = unlock;
              jQuery.extend(owner, descriptor);
            }
          }
          if (!this.cache[unlock]) {
            this.cache[unlock] = {};
          }
          return unlock;
        },
        set: function(owner, data, value) {
          var prop,
              unlock = this.key(owner),
              cache = this.cache[unlock];
          if (typeof data === "string") {
            cache[data] = value;
          } else {
            if (jQuery.isEmptyObject(cache)) {
              jQuery.extend(this.cache[unlock], data);
            } else {
              for (prop in data) {
                cache[prop] = data[prop];
              }
            }
          }
          return cache;
        },
        get: function(owner, key) {
          var cache = this.cache[this.key(owner)];
          return key === undefined ? cache : cache[key];
        },
        access: function(owner, key, value) {
          var stored;
          if (key === undefined || ((key && typeof key === "string") && value === undefined)) {
            stored = this.get(owner, key);
            return stored !== undefined ? stored : this.get(owner, jQuery.camelCase(key));
          }
          this.set(owner, key, value);
          return value !== undefined ? value : key;
        },
        remove: function(owner, key) {
          var i,
              name,
              camel,
              unlock = this.key(owner),
              cache = this.cache[unlock];
          if (key === undefined) {
            this.cache[unlock] = {};
          } else {
            if (jQuery.isArray(key)) {
              name = key.concat(key.map(jQuery.camelCase));
            } else {
              camel = jQuery.camelCase(key);
              if (key in cache) {
                name = [key, camel];
              } else {
                name = camel;
                name = name in cache ? [name] : (name.match(rnotwhite) || []);
              }
            }
            i = name.length;
            while (i--) {
              delete cache[name[i]];
            }
          }
        },
        hasData: function(owner) {
          return !jQuery.isEmptyObject(this.cache[owner[this.expando]] || {});
        },
        discard: function(owner) {
          if (owner[this.expando]) {
            delete this.cache[owner[this.expando]];
          }
        }
      };
      var data_priv = new Data();
      var data_user = new Data();
      var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
          rmultiDash = /([A-Z])/g;
      function dataAttr(elem, key, data) {
        var name;
        if (data === undefined && elem.nodeType === 1) {
          name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();
          data = elem.getAttribute(name);
          if (typeof data === "string") {
            try {
              data = data === "true" ? true : data === "false" ? false : data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? jQuery.parseJSON(data) : data;
            } catch (e) {}
            data_user.set(elem, key, data);
          } else {
            data = undefined;
          }
        }
        return data;
      }
      jQuery.extend({
        hasData: function(elem) {
          return data_user.hasData(elem) || data_priv.hasData(elem);
        },
        data: function(elem, name, data) {
          return data_user.access(elem, name, data);
        },
        removeData: function(elem, name) {
          data_user.remove(elem, name);
        },
        _data: function(elem, name, data) {
          return data_priv.access(elem, name, data);
        },
        _removeData: function(elem, name) {
          data_priv.remove(elem, name);
        }
      });
      jQuery.fn.extend({
        data: function(key, value) {
          var i,
              name,
              data,
              elem = this[0],
              attrs = elem && elem.attributes;
          if (key === undefined) {
            if (this.length) {
              data = data_user.get(elem);
              if (elem.nodeType === 1 && !data_priv.get(elem, "hasDataAttrs")) {
                i = attrs.length;
                while (i--) {
                  if (attrs[i]) {
                    name = attrs[i].name;
                    if (name.indexOf("data-") === 0) {
                      name = jQuery.camelCase(name.slice(5));
                      dataAttr(elem, name, data[name]);
                    }
                  }
                }
                data_priv.set(elem, "hasDataAttrs", true);
              }
            }
            return data;
          }
          if (typeof key === "object") {
            return this.each(function() {
              data_user.set(this, key);
            });
          }
          return access(this, function(value) {
            var data,
                camelKey = jQuery.camelCase(key);
            if (elem && value === undefined) {
              data = data_user.get(elem, key);
              if (data !== undefined) {
                return data;
              }
              data = data_user.get(elem, camelKey);
              if (data !== undefined) {
                return data;
              }
              data = dataAttr(elem, camelKey, undefined);
              if (data !== undefined) {
                return data;
              }
              return;
            }
            this.each(function() {
              var data = data_user.get(this, camelKey);
              data_user.set(this, camelKey, value);
              if (key.indexOf("-") !== -1 && data !== undefined) {
                data_user.set(this, key, value);
              }
            });
          }, null, value, arguments.length > 1, null, true);
        },
        removeData: function(key) {
          return this.each(function() {
            data_user.remove(this, key);
          });
        }
      });
      jQuery.extend({
        queue: function(elem, type, data) {
          var queue;
          if (elem) {
            type = (type || "fx") + "queue";
            queue = data_priv.get(elem, type);
            if (data) {
              if (!queue || jQuery.isArray(data)) {
                queue = data_priv.access(elem, type, jQuery.makeArray(data));
              } else {
                queue.push(data);
              }
            }
            return queue || [];
          }
        },
        dequeue: function(elem, type) {
          type = type || "fx";
          var queue = jQuery.queue(elem, type),
              startLength = queue.length,
              fn = queue.shift(),
              hooks = jQuery._queueHooks(elem, type),
              next = function() {
                jQuery.dequeue(elem, type);
              };
          if (fn === "inprogress") {
            fn = queue.shift();
            startLength--;
          }
          if (fn) {
            if (type === "fx") {
              queue.unshift("inprogress");
            }
            delete hooks.stop;
            fn.call(elem, next, hooks);
          }
          if (!startLength && hooks) {
            hooks.empty.fire();
          }
        },
        _queueHooks: function(elem, type) {
          var key = type + "queueHooks";
          return data_priv.get(elem, key) || data_priv.access(elem, key, {empty: jQuery.Callbacks("once memory").add(function() {
              data_priv.remove(elem, [type + "queue", key]);
            })});
        }
      });
      jQuery.fn.extend({
        queue: function(type, data) {
          var setter = 2;
          if (typeof type !== "string") {
            data = type;
            type = "fx";
            setter--;
          }
          if (arguments.length < setter) {
            return jQuery.queue(this[0], type);
          }
          return data === undefined ? this : this.each(function() {
            var queue = jQuery.queue(this, type, data);
            jQuery._queueHooks(this, type);
            if (type === "fx" && queue[0] !== "inprogress") {
              jQuery.dequeue(this, type);
            }
          });
        },
        dequeue: function(type) {
          return this.each(function() {
            jQuery.dequeue(this, type);
          });
        },
        clearQueue: function(type) {
          return this.queue(type || "fx", []);
        },
        promise: function(type, obj) {
          var tmp,
              count = 1,
              defer = jQuery.Deferred(),
              elements = this,
              i = this.length,
              resolve = function() {
                if (!(--count)) {
                  defer.resolveWith(elements, [elements]);
                }
              };
          if (typeof type !== "string") {
            obj = type;
            type = undefined;
          }
          type = type || "fx";
          while (i--) {
            tmp = data_priv.get(elements[i], type + "queueHooks");
            if (tmp && tmp.empty) {
              count++;
              tmp.empty.add(resolve);
            }
          }
          resolve();
          return defer.promise(obj);
        }
      });
      var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;
      var cssExpand = ["Top", "Right", "Bottom", "Left"];
      var isHidden = function(elem, el) {
        elem = el || elem;
        return jQuery.css(elem, "display") === "none" || !jQuery.contains(elem.ownerDocument, elem);
      };
      var rcheckableType = (/^(?:checkbox|radio)$/i);
      (function() {
        var fragment = document.createDocumentFragment(),
            div = fragment.appendChild(document.createElement("div")),
            input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("checked", "checked");
        input.setAttribute("name", "t");
        div.appendChild(input);
        support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
        div.innerHTML = "<textarea>x</textarea>";
        support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
      })();
      var strundefined = typeof undefined;
      support.focusinBubbles = "onfocusin" in window;
      var rkeyEvent = /^key/,
          rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/,
          rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
          rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
      function returnTrue() {
        return true;
      }
      function returnFalse() {
        return false;
      }
      function safeActiveElement() {
        try {
          return document.activeElement;
        } catch (err) {}
      }
      jQuery.event = {
        global: {},
        add: function(elem, types, handler, data, selector) {
          var handleObjIn,
              eventHandle,
              tmp,
              events,
              t,
              handleObj,
              special,
              handlers,
              type,
              namespaces,
              origType,
              elemData = data_priv.get(elem);
          if (!elemData) {
            return;
          }
          if (handler.handler) {
            handleObjIn = handler;
            handler = handleObjIn.handler;
            selector = handleObjIn.selector;
          }
          if (!handler.guid) {
            handler.guid = jQuery.guid++;
          }
          if (!(events = elemData.events)) {
            events = elemData.events = {};
          }
          if (!(eventHandle = elemData.handle)) {
            eventHandle = elemData.handle = function(e) {
              return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : undefined;
            };
          }
          types = (types || "").match(rnotwhite) || [""];
          t = types.length;
          while (t--) {
            tmp = rtypenamespace.exec(types[t]) || [];
            type = origType = tmp[1];
            namespaces = (tmp[2] || "").split(".").sort();
            if (!type) {
              continue;
            }
            special = jQuery.event.special[type] || {};
            type = (selector ? special.delegateType : special.bindType) || type;
            special = jQuery.event.special[type] || {};
            handleObj = jQuery.extend({
              type: type,
              origType: origType,
              data: data,
              handler: handler,
              guid: handler.guid,
              selector: selector,
              needsContext: selector && jQuery.expr.match.needsContext.test(selector),
              namespace: namespaces.join(".")
            }, handleObjIn);
            if (!(handlers = events[type])) {
              handlers = events[type] = [];
              handlers.delegateCount = 0;
              if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                if (elem.addEventListener) {
                  elem.addEventListener(type, eventHandle, false);
                }
              }
            }
            if (special.add) {
              special.add.call(elem, handleObj);
              if (!handleObj.handler.guid) {
                handleObj.handler.guid = handler.guid;
              }
            }
            if (selector) {
              handlers.splice(handlers.delegateCount++, 0, handleObj);
            } else {
              handlers.push(handleObj);
            }
            jQuery.event.global[type] = true;
          }
        },
        remove: function(elem, types, handler, selector, mappedTypes) {
          var j,
              origCount,
              tmp,
              events,
              t,
              handleObj,
              special,
              handlers,
              type,
              namespaces,
              origType,
              elemData = data_priv.hasData(elem) && data_priv.get(elem);
          if (!elemData || !(events = elemData.events)) {
            return;
          }
          types = (types || "").match(rnotwhite) || [""];
          t = types.length;
          while (t--) {
            tmp = rtypenamespace.exec(types[t]) || [];
            type = origType = tmp[1];
            namespaces = (tmp[2] || "").split(".").sort();
            if (!type) {
              for (type in events) {
                jQuery.event.remove(elem, type + types[t], handler, selector, true);
              }
              continue;
            }
            special = jQuery.event.special[type] || {};
            type = (selector ? special.delegateType : special.bindType) || type;
            handlers = events[type] || [];
            tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
            origCount = j = handlers.length;
            while (j--) {
              handleObj = handlers[j];
              if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                handlers.splice(j, 1);
                if (handleObj.selector) {
                  handlers.delegateCount--;
                }
                if (special.remove) {
                  special.remove.call(elem, handleObj);
                }
              }
            }
            if (origCount && !handlers.length) {
              if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                jQuery.removeEvent(elem, type, elemData.handle);
              }
              delete events[type];
            }
          }
          if (jQuery.isEmptyObject(events)) {
            delete elemData.handle;
            data_priv.remove(elem, "events");
          }
        },
        trigger: function(event, data, elem, onlyHandlers) {
          var i,
              cur,
              tmp,
              bubbleType,
              ontype,
              handle,
              special,
              eventPath = [elem || document],
              type = hasOwn.call(event, "type") ? event.type : event,
              namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
          cur = tmp = elem = elem || document;
          if (elem.nodeType === 3 || elem.nodeType === 8) {
            return;
          }
          if (rfocusMorph.test(type + jQuery.event.triggered)) {
            return;
          }
          if (type.indexOf(".") >= 0) {
            namespaces = type.split(".");
            type = namespaces.shift();
            namespaces.sort();
          }
          ontype = type.indexOf(":") < 0 && "on" + type;
          event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
          event.isTrigger = onlyHandlers ? 2 : 3;
          event.namespace = namespaces.join(".");
          event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
          event.result = undefined;
          if (!event.target) {
            event.target = elem;
          }
          data = data == null ? [event] : jQuery.makeArray(data, [event]);
          special = jQuery.event.special[type] || {};
          if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
            return;
          }
          if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
            bubbleType = special.delegateType || type;
            if (!rfocusMorph.test(bubbleType + type)) {
              cur = cur.parentNode;
            }
            for (; cur; cur = cur.parentNode) {
              eventPath.push(cur);
              tmp = cur;
            }
            if (tmp === (elem.ownerDocument || document)) {
              eventPath.push(tmp.defaultView || tmp.parentWindow || window);
            }
          }
          i = 0;
          while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
            event.type = i > 1 ? bubbleType : special.bindType || type;
            handle = (data_priv.get(cur, "events") || {})[event.type] && data_priv.get(cur, "handle");
            if (handle) {
              handle.apply(cur, data);
            }
            handle = ontype && cur[ontype];
            if (handle && handle.apply && jQuery.acceptData(cur)) {
              event.result = handle.apply(cur, data);
              if (event.result === false) {
                event.preventDefault();
              }
            }
          }
          event.type = type;
          if (!onlyHandlers && !event.isDefaultPrevented()) {
            if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && jQuery.acceptData(elem)) {
              if (ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)) {
                tmp = elem[ontype];
                if (tmp) {
                  elem[ontype] = null;
                }
                jQuery.event.triggered = type;
                elem[type]();
                jQuery.event.triggered = undefined;
                if (tmp) {
                  elem[ontype] = tmp;
                }
              }
            }
          }
          return event.result;
        },
        dispatch: function(event) {
          event = jQuery.event.fix(event);
          var i,
              j,
              ret,
              matched,
              handleObj,
              handlerQueue = [],
              args = slice.call(arguments),
              handlers = (data_priv.get(this, "events") || {})[event.type] || [],
              special = jQuery.event.special[event.type] || {};
          args[0] = event;
          event.delegateTarget = this;
          if (special.preDispatch && special.preDispatch.call(this, event) === false) {
            return;
          }
          handlerQueue = jQuery.event.handlers.call(this, event, handlers);
          i = 0;
          while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
            event.currentTarget = matched.elem;
            j = 0;
            while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
              if (!event.namespace_re || event.namespace_re.test(handleObj.namespace)) {
                event.handleObj = handleObj;
                event.data = handleObj.data;
                ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                if (ret !== undefined) {
                  if ((event.result = ret) === false) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }
              }
            }
          }
          if (special.postDispatch) {
            special.postDispatch.call(this, event);
          }
          return event.result;
        },
        handlers: function(event, handlers) {
          var i,
              matches,
              sel,
              handleObj,
              handlerQueue = [],
              delegateCount = handlers.delegateCount,
              cur = event.target;
          if (delegateCount && cur.nodeType && (!event.button || event.type !== "click")) {
            for (; cur !== this; cur = cur.parentNode || this) {
              if (cur.disabled !== true || event.type !== "click") {
                matches = [];
                for (i = 0; i < delegateCount; i++) {
                  handleObj = handlers[i];
                  sel = handleObj.selector + " ";
                  if (matches[sel] === undefined) {
                    matches[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) >= 0 : jQuery.find(sel, this, null, [cur]).length;
                  }
                  if (matches[sel]) {
                    matches.push(handleObj);
                  }
                }
                if (matches.length) {
                  handlerQueue.push({
                    elem: cur,
                    handlers: matches
                  });
                }
              }
            }
          }
          if (delegateCount < handlers.length) {
            handlerQueue.push({
              elem: this,
              handlers: handlers.slice(delegateCount)
            });
          }
          return handlerQueue;
        },
        props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
          props: "char charCode key keyCode".split(" "),
          filter: function(event, original) {
            if (event.which == null) {
              event.which = original.charCode != null ? original.charCode : original.keyCode;
            }
            return event;
          }
        },
        mouseHooks: {
          props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
          filter: function(event, original) {
            var eventDoc,
                doc,
                body,
                button = original.button;
            if (event.pageX == null && original.clientX != null) {
              eventDoc = event.target.ownerDocument || document;
              doc = eventDoc.documentElement;
              body = eventDoc.body;
              event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
              event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
            }
            if (!event.which && button !== undefined) {
              event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
            }
            return event;
          }
        },
        fix: function(event) {
          if (event[jQuery.expando]) {
            return event;
          }
          var i,
              prop,
              copy,
              type = event.type,
              originalEvent = event,
              fixHook = this.fixHooks[type];
          if (!fixHook) {
            this.fixHooks[type] = fixHook = rmouseEvent.test(type) ? this.mouseHooks : rkeyEvent.test(type) ? this.keyHooks : {};
          }
          copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;
          event = new jQuery.Event(originalEvent);
          i = copy.length;
          while (i--) {
            prop = copy[i];
            event[prop] = originalEvent[prop];
          }
          if (!event.target) {
            event.target = document;
          }
          if (event.target.nodeType === 3) {
            event.target = event.target.parentNode;
          }
          return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
        },
        special: {
          load: {noBubble: true},
          focus: {
            trigger: function() {
              if (this !== safeActiveElement() && this.focus) {
                this.focus();
                return false;
              }
            },
            delegateType: "focusin"
          },
          blur: {
            trigger: function() {
              if (this === safeActiveElement() && this.blur) {
                this.blur();
                return false;
              }
            },
            delegateType: "focusout"
          },
          click: {
            trigger: function() {
              if (this.type === "checkbox" && this.click && jQuery.nodeName(this, "input")) {
                this.click();
                return false;
              }
            },
            _default: function(event) {
              return jQuery.nodeName(event.target, "a");
            }
          },
          beforeunload: {postDispatch: function(event) {
              if (event.result !== undefined && event.originalEvent) {
                event.originalEvent.returnValue = event.result;
              }
            }}
        },
        simulate: function(type, elem, event, bubble) {
          var e = jQuery.extend(new jQuery.Event(), event, {
            type: type,
            isSimulated: true,
            originalEvent: {}
          });
          if (bubble) {
            jQuery.event.trigger(e, null, elem);
          } else {
            jQuery.event.dispatch.call(elem, e);
          }
          if (e.isDefaultPrevented()) {
            event.preventDefault();
          }
        }
      };
      jQuery.removeEvent = function(elem, type, handle) {
        if (elem.removeEventListener) {
          elem.removeEventListener(type, handle, false);
        }
      };
      jQuery.Event = function(src, props) {
        if (!(this instanceof jQuery.Event)) {
          return new jQuery.Event(src, props);
        }
        if (src && src.type) {
          this.originalEvent = src;
          this.type = src.type;
          this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined && src.returnValue === false ? returnTrue : returnFalse;
        } else {
          this.type = src;
        }
        if (props) {
          jQuery.extend(this, props);
        }
        this.timeStamp = src && src.timeStamp || jQuery.now();
        this[jQuery.expando] = true;
      };
      jQuery.Event.prototype = {
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse,
        preventDefault: function() {
          var e = this.originalEvent;
          this.isDefaultPrevented = returnTrue;
          if (e && e.preventDefault) {
            e.preventDefault();
          }
        },
        stopPropagation: function() {
          var e = this.originalEvent;
          this.isPropagationStopped = returnTrue;
          if (e && e.stopPropagation) {
            e.stopPropagation();
          }
        },
        stopImmediatePropagation: function() {
          var e = this.originalEvent;
          this.isImmediatePropagationStopped = returnTrue;
          if (e && e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          this.stopPropagation();
        }
      };
      jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        pointerenter: "pointerover",
        pointerleave: "pointerout"
      }, function(orig, fix) {
        jQuery.event.special[orig] = {
          delegateType: fix,
          bindType: fix,
          handle: function(event) {
            var ret,
                target = this,
                related = event.relatedTarget,
                handleObj = event.handleObj;
            if (!related || (related !== target && !jQuery.contains(target, related))) {
              event.type = handleObj.origType;
              ret = handleObj.handler.apply(this, arguments);
              event.type = fix;
            }
            return ret;
          }
        };
      });
      if (!support.focusinBubbles) {
        jQuery.each({
          focus: "focusin",
          blur: "focusout"
        }, function(orig, fix) {
          var handler = function(event) {
            jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), true);
          };
          jQuery.event.special[fix] = {
            setup: function() {
              var doc = this.ownerDocument || this,
                  attaches = data_priv.access(doc, fix);
              if (!attaches) {
                doc.addEventListener(orig, handler, true);
              }
              data_priv.access(doc, fix, (attaches || 0) + 1);
            },
            teardown: function() {
              var doc = this.ownerDocument || this,
                  attaches = data_priv.access(doc, fix) - 1;
              if (!attaches) {
                doc.removeEventListener(orig, handler, true);
                data_priv.remove(doc, fix);
              } else {
                data_priv.access(doc, fix, attaches);
              }
            }
          };
        });
      }
      jQuery.fn.extend({
        on: function(types, selector, data, fn, one) {
          var origFn,
              type;
          if (typeof types === "object") {
            if (typeof selector !== "string") {
              data = data || selector;
              selector = undefined;
            }
            for (type in types) {
              this.on(type, selector, data, types[type], one);
            }
            return this;
          }
          if (data == null && fn == null) {
            fn = selector;
            data = selector = undefined;
          } else if (fn == null) {
            if (typeof selector === "string") {
              fn = data;
              data = undefined;
            } else {
              fn = data;
              data = selector;
              selector = undefined;
            }
          }
          if (fn === false) {
            fn = returnFalse;
          } else if (!fn) {
            return this;
          }
          if (one === 1) {
            origFn = fn;
            fn = function(event) {
              jQuery().off(event);
              return origFn.apply(this, arguments);
            };
            fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
          }
          return this.each(function() {
            jQuery.event.add(this, types, fn, data, selector);
          });
        },
        one: function(types, selector, data, fn) {
          return this.on(types, selector, data, fn, 1);
        },
        off: function(types, selector, fn) {
          var handleObj,
              type;
          if (types && types.preventDefault && types.handleObj) {
            handleObj = types.handleObj;
            jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
            return this;
          }
          if (typeof types === "object") {
            for (type in types) {
              this.off(type, selector, types[type]);
            }
            return this;
          }
          if (selector === false || typeof selector === "function") {
            fn = selector;
            selector = undefined;
          }
          if (fn === false) {
            fn = returnFalse;
          }
          return this.each(function() {
            jQuery.event.remove(this, types, fn, selector);
          });
        },
        trigger: function(type, data) {
          return this.each(function() {
            jQuery.event.trigger(type, data, this);
          });
        },
        triggerHandler: function(type, data) {
          var elem = this[0];
          if (elem) {
            return jQuery.event.trigger(type, data, elem, true);
          }
        }
      });
      var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
          rtagName = /<([\w:]+)/,
          rhtml = /<|&#?\w+;/,
          rnoInnerhtml = /<(?:script|style|link)/i,
          rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
          rscriptType = /^$|\/(?:java|ecma)script/i,
          rscriptTypeMasked = /^true\/(.*)/,
          rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
          wrapMap = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            thead: [1, "<table>", "</table>"],
            col: [2, "<table><colgroup>", "</colgroup></table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            _default: [0, "", ""]
          };
      wrapMap.optgroup = wrapMap.option;
      wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
      wrapMap.th = wrapMap.td;
      function manipulationTarget(elem, content) {
        return jQuery.nodeName(elem, "table") && jQuery.nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr") ? elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")) : elem;
      }
      function disableScript(elem) {
        elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
        return elem;
      }
      function restoreScript(elem) {
        var match = rscriptTypeMasked.exec(elem.type);
        if (match) {
          elem.type = match[1];
        } else {
          elem.removeAttribute("type");
        }
        return elem;
      }
      function setGlobalEval(elems, refElements) {
        var i = 0,
            l = elems.length;
        for (; i < l; i++) {
          data_priv.set(elems[i], "globalEval", !refElements || data_priv.get(refElements[i], "globalEval"));
        }
      }
      function cloneCopyEvent(src, dest) {
        var i,
            l,
            type,
            pdataOld,
            pdataCur,
            udataOld,
            udataCur,
            events;
        if (dest.nodeType !== 1) {
          return;
        }
        if (data_priv.hasData(src)) {
          pdataOld = data_priv.access(src);
          pdataCur = data_priv.set(dest, pdataOld);
          events = pdataOld.events;
          if (events) {
            delete pdataCur.handle;
            pdataCur.events = {};
            for (type in events) {
              for (i = 0, l = events[type].length; i < l; i++) {
                jQuery.event.add(dest, type, events[type][i]);
              }
            }
          }
        }
        if (data_user.hasData(src)) {
          udataOld = data_user.access(src);
          udataCur = jQuery.extend({}, udataOld);
          data_user.set(dest, udataCur);
        }
      }
      function getAll(context, tag) {
        var ret = context.getElementsByTagName ? context.getElementsByTagName(tag || "*") : context.querySelectorAll ? context.querySelectorAll(tag || "*") : [];
        return tag === undefined || tag && jQuery.nodeName(context, tag) ? jQuery.merge([context], ret) : ret;
      }
      function fixInput(src, dest) {
        var nodeName = dest.nodeName.toLowerCase();
        if (nodeName === "input" && rcheckableType.test(src.type)) {
          dest.checked = src.checked;
        } else if (nodeName === "input" || nodeName === "textarea") {
          dest.defaultValue = src.defaultValue;
        }
      }
      jQuery.extend({
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
          var i,
              l,
              srcElements,
              destElements,
              clone = elem.cloneNode(true),
              inPage = jQuery.contains(elem.ownerDocument, elem);
          if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
            destElements = getAll(clone);
            srcElements = getAll(elem);
            for (i = 0, l = srcElements.length; i < l; i++) {
              fixInput(srcElements[i], destElements[i]);
            }
          }
          if (dataAndEvents) {
            if (deepDataAndEvents) {
              srcElements = srcElements || getAll(elem);
              destElements = destElements || getAll(clone);
              for (i = 0, l = srcElements.length; i < l; i++) {
                cloneCopyEvent(srcElements[i], destElements[i]);
              }
            } else {
              cloneCopyEvent(elem, clone);
            }
          }
          destElements = getAll(clone, "script");
          if (destElements.length > 0) {
            setGlobalEval(destElements, !inPage && getAll(elem, "script"));
          }
          return clone;
        },
        buildFragment: function(elems, context, scripts, selection) {
          var elem,
              tmp,
              tag,
              wrap,
              contains,
              j,
              fragment = context.createDocumentFragment(),
              nodes = [],
              i = 0,
              l = elems.length;
          for (; i < l; i++) {
            elem = elems[i];
            if (elem || elem === 0) {
              if (jQuery.type(elem) === "object") {
                jQuery.merge(nodes, elem.nodeType ? [elem] : elem);
              } else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));
              } else {
                tmp = tmp || fragment.appendChild(context.createElement("div"));
                tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                wrap = wrapMap[tag] || wrapMap._default;
                tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2];
                j = wrap[0];
                while (j--) {
                  tmp = tmp.lastChild;
                }
                jQuery.merge(nodes, tmp.childNodes);
                tmp = fragment.firstChild;
                tmp.textContent = "";
              }
            }
          }
          fragment.textContent = "";
          i = 0;
          while ((elem = nodes[i++])) {
            if (selection && jQuery.inArray(elem, selection) !== -1) {
              continue;
            }
            contains = jQuery.contains(elem.ownerDocument, elem);
            tmp = getAll(fragment.appendChild(elem), "script");
            if (contains) {
              setGlobalEval(tmp);
            }
            if (scripts) {
              j = 0;
              while ((elem = tmp[j++])) {
                if (rscriptType.test(elem.type || "")) {
                  scripts.push(elem);
                }
              }
            }
          }
          return fragment;
        },
        cleanData: function(elems) {
          var data,
              elem,
              type,
              key,
              special = jQuery.event.special,
              i = 0;
          for (; (elem = elems[i]) !== undefined; i++) {
            if (jQuery.acceptData(elem)) {
              key = elem[data_priv.expando];
              if (key && (data = data_priv.cache[key])) {
                if (data.events) {
                  for (type in data.events) {
                    if (special[type]) {
                      jQuery.event.remove(elem, type);
                    } else {
                      jQuery.removeEvent(elem, type, data.handle);
                    }
                  }
                }
                if (data_priv.cache[key]) {
                  delete data_priv.cache[key];
                }
              }
            }
            delete data_user.cache[elem[data_user.expando]];
          }
        }
      });
      jQuery.fn.extend({
        text: function(value) {
          return access(this, function(value) {
            return value === undefined ? jQuery.text(this) : this.empty().each(function() {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                this.textContent = value;
              }
            });
          }, null, value, arguments.length);
        },
        append: function() {
          return this.domManip(arguments, function(elem) {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              var target = manipulationTarget(this, elem);
              target.appendChild(elem);
            }
          });
        },
        prepend: function() {
          return this.domManip(arguments, function(elem) {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              var target = manipulationTarget(this, elem);
              target.insertBefore(elem, target.firstChild);
            }
          });
        },
        before: function() {
          return this.domManip(arguments, function(elem) {
            if (this.parentNode) {
              this.parentNode.insertBefore(elem, this);
            }
          });
        },
        after: function() {
          return this.domManip(arguments, function(elem) {
            if (this.parentNode) {
              this.parentNode.insertBefore(elem, this.nextSibling);
            }
          });
        },
        remove: function(selector, keepData) {
          var elem,
              elems = selector ? jQuery.filter(selector, this) : this,
              i = 0;
          for (; (elem = elems[i]) != null; i++) {
            if (!keepData && elem.nodeType === 1) {
              jQuery.cleanData(getAll(elem));
            }
            if (elem.parentNode) {
              if (keepData && jQuery.contains(elem.ownerDocument, elem)) {
                setGlobalEval(getAll(elem, "script"));
              }
              elem.parentNode.removeChild(elem);
            }
          }
          return this;
        },
        empty: function() {
          var elem,
              i = 0;
          for (; (elem = this[i]) != null; i++) {
            if (elem.nodeType === 1) {
              jQuery.cleanData(getAll(elem, false));
              elem.textContent = "";
            }
          }
          return this;
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
          dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
          deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
          return this.map(function() {
            return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
          });
        },
        html: function(value) {
          return access(this, function(value) {
            var elem = this[0] || {},
                i = 0,
                l = this.length;
            if (value === undefined && elem.nodeType === 1) {
              return elem.innerHTML;
            }
            if (typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {
              value = value.replace(rxhtmlTag, "<$1></$2>");
              try {
                for (; i < l; i++) {
                  elem = this[i] || {};
                  if (elem.nodeType === 1) {
                    jQuery.cleanData(getAll(elem, false));
                    elem.innerHTML = value;
                  }
                }
                elem = 0;
              } catch (e) {}
            }
            if (elem) {
              this.empty().append(value);
            }
          }, null, value, arguments.length);
        },
        replaceWith: function() {
          var arg = arguments[0];
          this.domManip(arguments, function(elem) {
            arg = this.parentNode;
            jQuery.cleanData(getAll(this));
            if (arg) {
              arg.replaceChild(elem, this);
            }
          });
          return arg && (arg.length || arg.nodeType) ? this : this.remove();
        },
        detach: function(selector) {
          return this.remove(selector, true);
        },
        domManip: function(args, callback) {
          args = concat.apply([], args);
          var fragment,
              first,
              scripts,
              hasScripts,
              node,
              doc,
              i = 0,
              l = this.length,
              set = this,
              iNoClone = l - 1,
              value = args[0],
              isFunction = jQuery.isFunction(value);
          if (isFunction || (l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value))) {
            return this.each(function(index) {
              var self = set.eq(index);
              if (isFunction) {
                args[0] = value.call(this, index, self.html());
              }
              self.domManip(args, callback);
            });
          }
          if (l) {
            fragment = jQuery.buildFragment(args, this[0].ownerDocument, false, this);
            first = fragment.firstChild;
            if (fragment.childNodes.length === 1) {
              fragment = first;
            }
            if (first) {
              scripts = jQuery.map(getAll(fragment, "script"), disableScript);
              hasScripts = scripts.length;
              for (; i < l; i++) {
                node = fragment;
                if (i !== iNoClone) {
                  node = jQuery.clone(node, true, true);
                  if (hasScripts) {
                    jQuery.merge(scripts, getAll(node, "script"));
                  }
                }
                callback.call(this[i], node, i);
              }
              if (hasScripts) {
                doc = scripts[scripts.length - 1].ownerDocument;
                jQuery.map(scripts, restoreScript);
                for (i = 0; i < hasScripts; i++) {
                  node = scripts[i];
                  if (rscriptType.test(node.type || "") && !data_priv.access(node, "globalEval") && jQuery.contains(doc, node)) {
                    if (node.src) {
                      if (jQuery._evalUrl) {
                        jQuery._evalUrl(node.src);
                      }
                    } else {
                      jQuery.globalEval(node.textContent.replace(rcleanScript, ""));
                    }
                  }
                }
              }
            }
          }
          return this;
        }
      });
      jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
      }, function(name, original) {
        jQuery.fn[name] = function(selector) {
          var elems,
              ret = [],
              insert = jQuery(selector),
              last = insert.length - 1,
              i = 0;
          for (; i <= last; i++) {
            elems = i === last ? this : this.clone(true);
            jQuery(insert[i])[original](elems);
            push.apply(ret, elems.get());
          }
          return this.pushStack(ret);
        };
      });
      var iframe,
          elemdisplay = {};
      function actualDisplay(name, doc) {
        var style,
            elem = jQuery(doc.createElement(name)).appendTo(doc.body),
            display = window.getDefaultComputedStyle && (style = window.getDefaultComputedStyle(elem[0])) ? style.display : jQuery.css(elem[0], "display");
        elem.detach();
        return display;
      }
      function defaultDisplay(nodeName) {
        var doc = document,
            display = elemdisplay[nodeName];
        if (!display) {
          display = actualDisplay(nodeName, doc);
          if (display === "none" || !display) {
            iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement);
            doc = iframe[0].contentDocument;
            doc.write();
            doc.close();
            display = actualDisplay(nodeName, doc);
            iframe.detach();
          }
          elemdisplay[nodeName] = display;
        }
        return display;
      }
      var rmargin = (/^margin/);
      var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
      var getStyles = function(elem) {
        if (elem.ownerDocument.defaultView.opener) {
          return elem.ownerDocument.defaultView.getComputedStyle(elem, null);
        }
        return window.getComputedStyle(elem, null);
      };
      function curCSS(elem, name, computed) {
        var width,
            minWidth,
            maxWidth,
            ret,
            style = elem.style;
        computed = computed || getStyles(elem);
        if (computed) {
          ret = computed.getPropertyValue(name) || computed[name];
        }
        if (computed) {
          if (ret === "" && !jQuery.contains(elem.ownerDocument, elem)) {
            ret = jQuery.style(elem, name);
          }
          if (rnumnonpx.test(ret) && rmargin.test(name)) {
            width = style.width;
            minWidth = style.minWidth;
            maxWidth = style.maxWidth;
            style.minWidth = style.maxWidth = style.width = ret;
            ret = computed.width;
            style.width = width;
            style.minWidth = minWidth;
            style.maxWidth = maxWidth;
          }
        }
        return ret !== undefined ? ret + "" : ret;
      }
      function addGetHookIf(conditionFn, hookFn) {
        return {get: function() {
            if (conditionFn()) {
              delete this.get;
              return;
            }
            return (this.get = hookFn).apply(this, arguments);
          }};
      }
      (function() {
        var pixelPositionVal,
            boxSizingReliableVal,
            docElem = document.documentElement,
            container = document.createElement("div"),
            div = document.createElement("div");
        if (!div.style) {
          return;
        }
        div.style.backgroundClip = "content-box";
        div.cloneNode(true).style.backgroundClip = "";
        support.clearCloneStyle = div.style.backgroundClip === "content-box";
        container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" + "position:absolute";
        container.appendChild(div);
        function computePixelPositionAndBoxSizingReliable() {
          div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" + "box-sizing:border-box;display:block;margin-top:1%;top:1%;" + "border:1px;padding:1px;width:4px;position:absolute";
          div.innerHTML = "";
          docElem.appendChild(container);
          var divStyle = window.getComputedStyle(div, null);
          pixelPositionVal = divStyle.top !== "1%";
          boxSizingReliableVal = divStyle.width === "4px";
          docElem.removeChild(container);
        }
        if (window.getComputedStyle) {
          jQuery.extend(support, {
            pixelPosition: function() {
              computePixelPositionAndBoxSizingReliable();
              return pixelPositionVal;
            },
            boxSizingReliable: function() {
              if (boxSizingReliableVal == null) {
                computePixelPositionAndBoxSizingReliable();
              }
              return boxSizingReliableVal;
            },
            reliableMarginRight: function() {
              var ret,
                  marginDiv = div.appendChild(document.createElement("div"));
              marginDiv.style.cssText = div.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" + "box-sizing:content-box;display:block;margin:0;border:0;padding:0";
              marginDiv.style.marginRight = marginDiv.style.width = "0";
              div.style.width = "1px";
              docElem.appendChild(container);
              ret = !parseFloat(window.getComputedStyle(marginDiv, null).marginRight);
              docElem.removeChild(container);
              div.removeChild(marginDiv);
              return ret;
            }
          });
        }
      })();
      jQuery.swap = function(elem, options, callback, args) {
        var ret,
            name,
            old = {};
        for (name in options) {
          old[name] = elem.style[name];
          elem.style[name] = options[name];
        }
        ret = callback.apply(elem, args || []);
        for (name in options) {
          elem.style[name] = old[name];
        }
        return ret;
      };
      var rdisplayswap = /^(none|table(?!-c[ea]).+)/,
          rnumsplit = new RegExp("^(" + pnum + ")(.*)$", "i"),
          rrelNum = new RegExp("^([+-])=(" + pnum + ")", "i"),
          cssShow = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
          },
          cssNormalTransform = {
            letterSpacing: "0",
            fontWeight: "400"
          },
          cssPrefixes = ["Webkit", "O", "Moz", "ms"];
      function vendorPropName(style, name) {
        if (name in style) {
          return name;
        }
        var capName = name[0].toUpperCase() + name.slice(1),
            origName = name,
            i = cssPrefixes.length;
        while (i--) {
          name = cssPrefixes[i] + capName;
          if (name in style) {
            return name;
          }
        }
        return origName;
      }
      function setPositiveNumber(elem, value, subtract) {
        var matches = rnumsplit.exec(value);
        return matches ? Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") : value;
      }
      function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
        var i = extra === (isBorderBox ? "border" : "content") ? 4 : name === "width" ? 1 : 0,
            val = 0;
        for (; i < 4; i += 2) {
          if (extra === "margin") {
            val += jQuery.css(elem, extra + cssExpand[i], true, styles);
          }
          if (isBorderBox) {
            if (extra === "content") {
              val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
            }
            if (extra !== "margin") {
              val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
            }
          } else {
            val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
            if (extra !== "padding") {
              val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
            }
          }
        }
        return val;
      }
      function getWidthOrHeight(elem, name, extra) {
        var valueIsBorderBox = true,
            val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
            styles = getStyles(elem),
            isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
        if (val <= 0 || val == null) {
          val = curCSS(elem, name, styles);
          if (val < 0 || val == null) {
            val = elem.style[name];
          }
          if (rnumnonpx.test(val)) {
            return val;
          }
          valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);
          val = parseFloat(val) || 0;
        }
        return (val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles)) + "px";
      }
      function showHide(elements, show) {
        var display,
            elem,
            hidden,
            values = [],
            index = 0,
            length = elements.length;
        for (; index < length; index++) {
          elem = elements[index];
          if (!elem.style) {
            continue;
          }
          values[index] = data_priv.get(elem, "olddisplay");
          display = elem.style.display;
          if (show) {
            if (!values[index] && display === "none") {
              elem.style.display = "";
            }
            if (elem.style.display === "" && isHidden(elem)) {
              values[index] = data_priv.access(elem, "olddisplay", defaultDisplay(elem.nodeName));
            }
          } else {
            hidden = isHidden(elem);
            if (display !== "none" || !hidden) {
              data_priv.set(elem, "olddisplay", hidden ? display : jQuery.css(elem, "display"));
            }
          }
        }
        for (index = 0; index < length; index++) {
          elem = elements[index];
          if (!elem.style) {
            continue;
          }
          if (!show || elem.style.display === "none" || elem.style.display === "") {
            elem.style.display = show ? values[index] || "" : "none";
          }
        }
        return elements;
      }
      jQuery.extend({
        cssHooks: {opacity: {get: function(elem, computed) {
              if (computed) {
                var ret = curCSS(elem, "opacity");
                return ret === "" ? "1" : ret;
              }
            }}},
        cssNumber: {
          "columnCount": true,
          "fillOpacity": true,
          "flexGrow": true,
          "flexShrink": true,
          "fontWeight": true,
          "lineHeight": true,
          "opacity": true,
          "order": true,
          "orphans": true,
          "widows": true,
          "zIndex": true,
          "zoom": true
        },
        cssProps: {"float": "cssFloat"},
        style: function(elem, name, value, extra) {
          if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
            return;
          }
          var ret,
              type,
              hooks,
              origName = jQuery.camelCase(name),
              style = elem.style;
          name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName));
          hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
          if (value !== undefined) {
            type = typeof value;
            if (type === "string" && (ret = rrelNum.exec(value))) {
              value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name));
              type = "number";
            }
            if (value == null || value !== value) {
              return;
            }
            if (type === "number" && !jQuery.cssNumber[origName]) {
              value += "px";
            }
            if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
              style[name] = "inherit";
            }
            if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
              style[name] = value;
            }
          } else {
            if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
              return ret;
            }
            return style[name];
          }
        },
        css: function(elem, name, extra, styles) {
          var val,
              num,
              hooks,
              origName = jQuery.camelCase(name);
          name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName));
          hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
          if (hooks && "get" in hooks) {
            val = hooks.get(elem, true, extra);
          }
          if (val === undefined) {
            val = curCSS(elem, name, styles);
          }
          if (val === "normal" && name in cssNormalTransform) {
            val = cssNormalTransform[name];
          }
          if (extra === "" || extra) {
            num = parseFloat(val);
            return extra === true || jQuery.isNumeric(num) ? num || 0 : val;
          }
          return val;
        }
      });
      jQuery.each(["height", "width"], function(i, name) {
        jQuery.cssHooks[name] = {
          get: function(elem, computed, extra) {
            if (computed) {
              return rdisplayswap.test(jQuery.css(elem, "display")) && elem.offsetWidth === 0 ? jQuery.swap(elem, cssShow, function() {
                return getWidthOrHeight(elem, name, extra);
              }) : getWidthOrHeight(elem, name, extra);
            }
          },
          set: function(elem, value, extra) {
            var styles = extra && getStyles(elem);
            return setPositiveNumber(elem, value, extra ? augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles) : 0);
          }
        };
      });
      jQuery.cssHooks.marginRight = addGetHookIf(support.reliableMarginRight, function(elem, computed) {
        if (computed) {
          return jQuery.swap(elem, {"display": "inline-block"}, curCSS, [elem, "marginRight"]);
        }
      });
      jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
      }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {expand: function(value) {
            var i = 0,
                expanded = {},
                parts = typeof value === "string" ? value.split(" ") : [value];
            for (; i < 4; i++) {
              expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
            }
            return expanded;
          }};
        if (!rmargin.test(prefix)) {
          jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
        }
      });
      jQuery.fn.extend({
        css: function(name, value) {
          return access(this, function(elem, name, value) {
            var styles,
                len,
                map = {},
                i = 0;
            if (jQuery.isArray(name)) {
              styles = getStyles(elem);
              len = name.length;
              for (; i < len; i++) {
                map[name[i]] = jQuery.css(elem, name[i], false, styles);
              }
              return map;
            }
            return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
          }, name, value, arguments.length > 1);
        },
        show: function() {
          return showHide(this, true);
        },
        hide: function() {
          return showHide(this);
        },
        toggle: function(state) {
          if (typeof state === "boolean") {
            return state ? this.show() : this.hide();
          }
          return this.each(function() {
            if (isHidden(this)) {
              jQuery(this).show();
            } else {
              jQuery(this).hide();
            }
          });
        }
      });
      function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
      }
      jQuery.Tween = Tween;
      Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
          this.elem = elem;
          this.prop = prop;
          this.easing = easing || "swing";
          this.options = options;
          this.start = this.now = this.cur();
          this.end = end;
          this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
          var hooks = Tween.propHooks[this.prop];
          return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        run: function(percent) {
          var eased,
              hooks = Tween.propHooks[this.prop];
          if (this.options.duration) {
            this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);
          } else {
            this.pos = eased = percent;
          }
          this.now = (this.end - this.start) * eased + this.start;
          if (this.options.step) {
            this.options.step.call(this.elem, this.now, this);
          }
          if (hooks && hooks.set) {
            hooks.set(this);
          } else {
            Tween.propHooks._default.set(this);
          }
          return this;
        }
      };
      Tween.prototype.init.prototype = Tween.prototype;
      Tween.propHooks = {_default: {
          get: function(tween) {
            var result;
            if (tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)) {
              return tween.elem[tween.prop];
            }
            result = jQuery.css(tween.elem, tween.prop, "");
            return !result || result === "auto" ? 0 : result;
          },
          set: function(tween) {
            if (jQuery.fx.step[tween.prop]) {
              jQuery.fx.step[tween.prop](tween);
            } else if (tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
              jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
            } else {
              tween.elem[tween.prop] = tween.now;
            }
          }
        }};
      Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {set: function(tween) {
          if (tween.elem.nodeType && tween.elem.parentNode) {
            tween.elem[tween.prop] = tween.now;
          }
        }};
      jQuery.easing = {
        linear: function(p) {
          return p;
        },
        swing: function(p) {
          return 0.5 - Math.cos(p * Math.PI) / 2;
        }
      };
      jQuery.fx = Tween.prototype.init;
      jQuery.fx.step = {};
      var fxNow,
          timerId,
          rfxtypes = /^(?:toggle|show|hide)$/,
          rfxnum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i"),
          rrun = /queueHooks$/,
          animationPrefilters = [defaultPrefilter],
          tweeners = {"*": [function(prop, value) {
              var tween = this.createTween(prop, value),
                  target = tween.cur(),
                  parts = rfxnum.exec(value),
                  unit = parts && parts[3] || (jQuery.cssNumber[prop] ? "" : "px"),
                  start = (jQuery.cssNumber[prop] || unit !== "px" && +target) && rfxnum.exec(jQuery.css(tween.elem, prop)),
                  scale = 1,
                  maxIterations = 20;
              if (start && start[3] !== unit) {
                unit = unit || start[3];
                parts = parts || [];
                start = +target || 1;
                do {
                  scale = scale || ".5";
                  start = start / scale;
                  jQuery.style(tween.elem, prop, start + unit);
                } while (scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);
              }
              if (parts) {
                start = tween.start = +start || +target || 0;
                tween.unit = unit;
                tween.end = parts[1] ? start + (parts[1] + 1) * parts[2] : +parts[2];
              }
              return tween;
            }]};
      function createFxNow() {
        setTimeout(function() {
          fxNow = undefined;
        });
        return (fxNow = jQuery.now());
      }
      function genFx(type, includeWidth) {
        var which,
            i = 0,
            attrs = {height: type};
        includeWidth = includeWidth ? 1 : 0;
        for (; i < 4; i += 2 - includeWidth) {
          which = cssExpand[i];
          attrs["margin" + which] = attrs["padding" + which] = type;
        }
        if (includeWidth) {
          attrs.opacity = attrs.width = type;
        }
        return attrs;
      }
      function createTween(value, prop, animation) {
        var tween,
            collection = (tweeners[prop] || []).concat(tweeners["*"]),
            index = 0,
            length = collection.length;
        for (; index < length; index++) {
          if ((tween = collection[index].call(animation, prop, value))) {
            return tween;
          }
        }
      }
      function defaultPrefilter(elem, props, opts) {
        var prop,
            value,
            toggle,
            tween,
            hooks,
            oldfire,
            display,
            checkDisplay,
            anim = this,
            orig = {},
            style = elem.style,
            hidden = elem.nodeType && isHidden(elem),
            dataShow = data_priv.get(elem, "fxshow");
        if (!opts.queue) {
          hooks = jQuery._queueHooks(elem, "fx");
          if (hooks.unqueued == null) {
            hooks.unqueued = 0;
            oldfire = hooks.empty.fire;
            hooks.empty.fire = function() {
              if (!hooks.unqueued) {
                oldfire();
              }
            };
          }
          hooks.unqueued++;
          anim.always(function() {
            anim.always(function() {
              hooks.unqueued--;
              if (!jQuery.queue(elem, "fx").length) {
                hooks.empty.fire();
              }
            });
          });
        }
        if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
          opts.overflow = [style.overflow, style.overflowX, style.overflowY];
          display = jQuery.css(elem, "display");
          checkDisplay = display === "none" ? data_priv.get(elem, "olddisplay") || defaultDisplay(elem.nodeName) : display;
          if (checkDisplay === "inline" && jQuery.css(elem, "float") === "none") {
            style.display = "inline-block";
          }
        }
        if (opts.overflow) {
          style.overflow = "hidden";
          anim.always(function() {
            style.overflow = opts.overflow[0];
            style.overflowX = opts.overflow[1];
            style.overflowY = opts.overflow[2];
          });
        }
        for (prop in props) {
          value = props[prop];
          if (rfxtypes.exec(value)) {
            delete props[prop];
            toggle = toggle || value === "toggle";
            if (value === (hidden ? "hide" : "show")) {
              if (value === "show" && dataShow && dataShow[prop] !== undefined) {
                hidden = true;
              } else {
                continue;
              }
            }
            orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
          } else {
            display = undefined;
          }
        }
        if (!jQuery.isEmptyObject(orig)) {
          if (dataShow) {
            if ("hidden" in dataShow) {
              hidden = dataShow.hidden;
            }
          } else {
            dataShow = data_priv.access(elem, "fxshow", {});
          }
          if (toggle) {
            dataShow.hidden = !hidden;
          }
          if (hidden) {
            jQuery(elem).show();
          } else {
            anim.done(function() {
              jQuery(elem).hide();
            });
          }
          anim.done(function() {
            var prop;
            data_priv.remove(elem, "fxshow");
            for (prop in orig) {
              jQuery.style(elem, prop, orig[prop]);
            }
          });
          for (prop in orig) {
            tween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
            if (!(prop in dataShow)) {
              dataShow[prop] = tween.start;
              if (hidden) {
                tween.end = tween.start;
                tween.start = prop === "width" || prop === "height" ? 1 : 0;
              }
            }
          }
        } else if ((display === "none" ? defaultDisplay(elem.nodeName) : display) === "inline") {
          style.display = display;
        }
      }
      function propFilter(props, specialEasing) {
        var index,
            name,
            easing,
            value,
            hooks;
        for (index in props) {
          name = jQuery.camelCase(index);
          easing = specialEasing[name];
          value = props[index];
          if (jQuery.isArray(value)) {
            easing = value[1];
            value = props[index] = value[0];
          }
          if (index !== name) {
            props[name] = value;
            delete props[index];
          }
          hooks = jQuery.cssHooks[name];
          if (hooks && "expand" in hooks) {
            value = hooks.expand(value);
            delete props[name];
            for (index in value) {
              if (!(index in props)) {
                props[index] = value[index];
                specialEasing[index] = easing;
              }
            }
          } else {
            specialEasing[name] = easing;
          }
        }
      }
      function Animation(elem, properties, options) {
        var result,
            stopped,
            index = 0,
            length = animationPrefilters.length,
            deferred = jQuery.Deferred().always(function() {
              delete tick.elem;
            }),
            tick = function() {
              if (stopped) {
                return false;
              }
              var currentTime = fxNow || createFxNow(),
                  remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
                  temp = remaining / animation.duration || 0,
                  percent = 1 - temp,
                  index = 0,
                  length = animation.tweens.length;
              for (; index < length; index++) {
                animation.tweens[index].run(percent);
              }
              deferred.notifyWith(elem, [animation, percent, remaining]);
              if (percent < 1 && length) {
                return remaining;
              } else {
                deferred.resolveWith(elem, [animation]);
                return false;
              }
            },
            animation = deferred.promise({
              elem: elem,
              props: jQuery.extend({}, properties),
              opts: jQuery.extend(true, {specialEasing: {}}, options),
              originalProperties: properties,
              originalOptions: options,
              startTime: fxNow || createFxNow(),
              duration: options.duration,
              tweens: [],
              createTween: function(prop, end) {
                var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                animation.tweens.push(tween);
                return tween;
              },
              stop: function(gotoEnd) {
                var index = 0,
                    length = gotoEnd ? animation.tweens.length : 0;
                if (stopped) {
                  return this;
                }
                stopped = true;
                for (; index < length; index++) {
                  animation.tweens[index].run(1);
                }
                if (gotoEnd) {
                  deferred.resolveWith(elem, [animation, gotoEnd]);
                } else {
                  deferred.rejectWith(elem, [animation, gotoEnd]);
                }
                return this;
              }
            }),
            props = animation.props;
        propFilter(props, animation.opts.specialEasing);
        for (; index < length; index++) {
          result = animationPrefilters[index].call(animation, elem, props, animation.opts);
          if (result) {
            return result;
          }
        }
        jQuery.map(props, createTween, animation);
        if (jQuery.isFunction(animation.opts.start)) {
          animation.opts.start.call(elem, animation);
        }
        jQuery.fx.timer(jQuery.extend(tick, {
          elem: elem,
          anim: animation,
          queue: animation.opts.queue
        }));
        return animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
      }
      jQuery.Animation = jQuery.extend(Animation, {
        tweener: function(props, callback) {
          if (jQuery.isFunction(props)) {
            callback = props;
            props = ["*"];
          } else {
            props = props.split(" ");
          }
          var prop,
              index = 0,
              length = props.length;
          for (; index < length; index++) {
            prop = props[index];
            tweeners[prop] = tweeners[prop] || [];
            tweeners[prop].unshift(callback);
          }
        },
        prefilter: function(callback, prepend) {
          if (prepend) {
            animationPrefilters.unshift(callback);
          } else {
            animationPrefilters.push(callback);
          }
        }
      });
      jQuery.speed = function(speed, easing, fn) {
        var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
          complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
          duration: speed,
          easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };
        opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default;
        if (opt.queue == null || opt.queue === true) {
          opt.queue = "fx";
        }
        opt.old = opt.complete;
        opt.complete = function() {
          if (jQuery.isFunction(opt.old)) {
            opt.old.call(this);
          }
          if (opt.queue) {
            jQuery.dequeue(this, opt.queue);
          }
        };
        return opt;
      };
      jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
          return this.filter(isHidden).css("opacity", 0).show().end().animate({opacity: to}, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
          var empty = jQuery.isEmptyObject(prop),
              optall = jQuery.speed(speed, easing, callback),
              doAnimation = function() {
                var anim = Animation(this, jQuery.extend({}, prop), optall);
                if (empty || data_priv.get(this, "finish")) {
                  anim.stop(true);
                }
              };
          doAnimation.finish = doAnimation;
          return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
        },
        stop: function(type, clearQueue, gotoEnd) {
          var stopQueue = function(hooks) {
            var stop = hooks.stop;
            delete hooks.stop;
            stop(gotoEnd);
          };
          if (typeof type !== "string") {
            gotoEnd = clearQueue;
            clearQueue = type;
            type = undefined;
          }
          if (clearQueue && type !== false) {
            this.queue(type || "fx", []);
          }
          return this.each(function() {
            var dequeue = true,
                index = type != null && type + "queueHooks",
                timers = jQuery.timers,
                data = data_priv.get(this);
            if (index) {
              if (data[index] && data[index].stop) {
                stopQueue(data[index]);
              }
            } else {
              for (index in data) {
                if (data[index] && data[index].stop && rrun.test(index)) {
                  stopQueue(data[index]);
                }
              }
            }
            for (index = timers.length; index--; ) {
              if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                timers[index].anim.stop(gotoEnd);
                dequeue = false;
                timers.splice(index, 1);
              }
            }
            if (dequeue || !gotoEnd) {
              jQuery.dequeue(this, type);
            }
          });
        },
        finish: function(type) {
          if (type !== false) {
            type = type || "fx";
          }
          return this.each(function() {
            var index,
                data = data_priv.get(this),
                queue = data[type + "queue"],
                hooks = data[type + "queueHooks"],
                timers = jQuery.timers,
                length = queue ? queue.length : 0;
            data.finish = true;
            jQuery.queue(this, type, []);
            if (hooks && hooks.stop) {
              hooks.stop.call(this, true);
            }
            for (index = timers.length; index--; ) {
              if (timers[index].elem === this && timers[index].queue === type) {
                timers[index].anim.stop(true);
                timers.splice(index, 1);
              }
            }
            for (index = 0; index < length; index++) {
              if (queue[index] && queue[index].finish) {
                queue[index].finish.call(this);
              }
            }
            delete data.finish;
          });
        }
      });
      jQuery.each(["toggle", "show", "hide"], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
          return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
        };
      });
      jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {opacity: "show"},
        fadeOut: {opacity: "hide"},
        fadeToggle: {opacity: "toggle"}
      }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
          return this.animate(props, speed, easing, callback);
        };
      });
      jQuery.timers = [];
      jQuery.fx.tick = function() {
        var timer,
            i = 0,
            timers = jQuery.timers;
        fxNow = jQuery.now();
        for (; i < timers.length; i++) {
          timer = timers[i];
          if (!timer() && timers[i] === timer) {
            timers.splice(i--, 1);
          }
        }
        if (!timers.length) {
          jQuery.fx.stop();
        }
        fxNow = undefined;
      };
      jQuery.fx.timer = function(timer) {
        jQuery.timers.push(timer);
        if (timer()) {
          jQuery.fx.start();
        } else {
          jQuery.timers.pop();
        }
      };
      jQuery.fx.interval = 13;
      jQuery.fx.start = function() {
        if (!timerId) {
          timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval);
        }
      };
      jQuery.fx.stop = function() {
        clearInterval(timerId);
        timerId = null;
      };
      jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
      };
      jQuery.fn.delay = function(time, type) {
        time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
        type = type || "fx";
        return this.queue(type, function(next, hooks) {
          var timeout = setTimeout(next, time);
          hooks.stop = function() {
            clearTimeout(timeout);
          };
        });
      };
      (function() {
        var input = document.createElement("input"),
            select = document.createElement("select"),
            opt = select.appendChild(document.createElement("option"));
        input.type = "checkbox";
        support.checkOn = input.value !== "";
        support.optSelected = opt.selected;
        select.disabled = true;
        support.optDisabled = !opt.disabled;
        input = document.createElement("input");
        input.value = "t";
        input.type = "radio";
        support.radioValue = input.value === "t";
      })();
      var nodeHook,
          boolHook,
          attrHandle = jQuery.expr.attrHandle;
      jQuery.fn.extend({
        attr: function(name, value) {
          return access(this, jQuery.attr, name, value, arguments.length > 1);
        },
        removeAttr: function(name) {
          return this.each(function() {
            jQuery.removeAttr(this, name);
          });
        }
      });
      jQuery.extend({
        attr: function(elem, name, value) {
          var hooks,
              ret,
              nType = elem.nodeType;
          if (!elem || nType === 3 || nType === 8 || nType === 2) {
            return;
          }
          if (typeof elem.getAttribute === strundefined) {
            return jQuery.prop(elem, name, value);
          }
          if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
            name = name.toLowerCase();
            hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name) ? boolHook : nodeHook);
          }
          if (value !== undefined) {
            if (value === null) {
              jQuery.removeAttr(elem, name);
            } else if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
              return ret;
            } else {
              elem.setAttribute(name, value + "");
              return value;
            }
          } else if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
            return ret;
          } else {
            ret = jQuery.find.attr(elem, name);
            return ret == null ? undefined : ret;
          }
        },
        removeAttr: function(elem, value) {
          var name,
              propName,
              i = 0,
              attrNames = value && value.match(rnotwhite);
          if (attrNames && elem.nodeType === 1) {
            while ((name = attrNames[i++])) {
              propName = jQuery.propFix[name] || name;
              if (jQuery.expr.match.bool.test(name)) {
                elem[propName] = false;
              }
              elem.removeAttribute(name);
            }
          }
        },
        attrHooks: {type: {set: function(elem, value) {
              if (!support.radioValue && value === "radio" && jQuery.nodeName(elem, "input")) {
                var val = elem.value;
                elem.setAttribute("type", value);
                if (val) {
                  elem.value = val;
                }
                return value;
              }
            }}}
      });
      boolHook = {set: function(elem, value, name) {
          if (value === false) {
            jQuery.removeAttr(elem, name);
          } else {
            elem.setAttribute(name, name);
          }
          return name;
        }};
      jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name) {
        var getter = attrHandle[name] || jQuery.find.attr;
        attrHandle[name] = function(elem, name, isXML) {
          var ret,
              handle;
          if (!isXML) {
            handle = attrHandle[name];
            attrHandle[name] = ret;
            ret = getter(elem, name, isXML) != null ? name.toLowerCase() : null;
            attrHandle[name] = handle;
          }
          return ret;
        };
      });
      var rfocusable = /^(?:input|select|textarea|button)$/i;
      jQuery.fn.extend({
        prop: function(name, value) {
          return access(this, jQuery.prop, name, value, arguments.length > 1);
        },
        removeProp: function(name) {
          return this.each(function() {
            delete this[jQuery.propFix[name] || name];
          });
        }
      });
      jQuery.extend({
        propFix: {
          "for": "htmlFor",
          "class": "className"
        },
        prop: function(elem, name, value) {
          var ret,
              hooks,
              notxml,
              nType = elem.nodeType;
          if (!elem || nType === 3 || nType === 8 || nType === 2) {
            return;
          }
          notxml = nType !== 1 || !jQuery.isXMLDoc(elem);
          if (notxml) {
            name = jQuery.propFix[name] || name;
            hooks = jQuery.propHooks[name];
          }
          if (value !== undefined) {
            return hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : (elem[name] = value);
          } else {
            return hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null ? ret : elem[name];
          }
        },
        propHooks: {tabIndex: {get: function(elem) {
              return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href ? elem.tabIndex : -1;
            }}}
      });
      if (!support.optSelected) {
        jQuery.propHooks.selected = {get: function(elem) {
            var parent = elem.parentNode;
            if (parent && parent.parentNode) {
              parent.parentNode.selectedIndex;
            }
            return null;
          }};
      }
      jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
        jQuery.propFix[this.toLowerCase()] = this;
      });
      var rclass = /[\t\r\n\f]/g;
      jQuery.fn.extend({
        addClass: function(value) {
          var classes,
              elem,
              cur,
              clazz,
              j,
              finalValue,
              proceed = typeof value === "string" && value,
              i = 0,
              len = this.length;
          if (jQuery.isFunction(value)) {
            return this.each(function(j) {
              jQuery(this).addClass(value.call(this, j, this.className));
            });
          }
          if (proceed) {
            classes = (value || "").match(rnotwhite) || [];
            for (; i < len; i++) {
              elem = this[i];
              cur = elem.nodeType === 1 && (elem.className ? (" " + elem.className + " ").replace(rclass, " ") : " ");
              if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {
                  if (cur.indexOf(" " + clazz + " ") < 0) {
                    cur += clazz + " ";
                  }
                }
                finalValue = jQuery.trim(cur);
                if (elem.className !== finalValue) {
                  elem.className = finalValue;
                }
              }
            }
          }
          return this;
        },
        removeClass: function(value) {
          var classes,
              elem,
              cur,
              clazz,
              j,
              finalValue,
              proceed = arguments.length === 0 || typeof value === "string" && value,
              i = 0,
              len = this.length;
          if (jQuery.isFunction(value)) {
            return this.each(function(j) {
              jQuery(this).removeClass(value.call(this, j, this.className));
            });
          }
          if (proceed) {
            classes = (value || "").match(rnotwhite) || [];
            for (; i < len; i++) {
              elem = this[i];
              cur = elem.nodeType === 1 && (elem.className ? (" " + elem.className + " ").replace(rclass, " ") : "");
              if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {
                  while (cur.indexOf(" " + clazz + " ") >= 0) {
                    cur = cur.replace(" " + clazz + " ", " ");
                  }
                }
                finalValue = value ? jQuery.trim(cur) : "";
                if (elem.className !== finalValue) {
                  elem.className = finalValue;
                }
              }
            }
          }
          return this;
        },
        toggleClass: function(value, stateVal) {
          var type = typeof value;
          if (typeof stateVal === "boolean" && type === "string") {
            return stateVal ? this.addClass(value) : this.removeClass(value);
          }
          if (jQuery.isFunction(value)) {
            return this.each(function(i) {
              jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);
            });
          }
          return this.each(function() {
            if (type === "string") {
              var className,
                  i = 0,
                  self = jQuery(this),
                  classNames = value.match(rnotwhite) || [];
              while ((className = classNames[i++])) {
                if (self.hasClass(className)) {
                  self.removeClass(className);
                } else {
                  self.addClass(className);
                }
              }
            } else if (type === strundefined || type === "boolean") {
              if (this.className) {
                data_priv.set(this, "__className__", this.className);
              }
              this.className = this.className || value === false ? "" : data_priv.get(this, "__className__") || "";
            }
          });
        },
        hasClass: function(selector) {
          var className = " " + selector + " ",
              i = 0,
              l = this.length;
          for (; i < l; i++) {
            if (this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0) {
              return true;
            }
          }
          return false;
        }
      });
      var rreturn = /\r/g;
      jQuery.fn.extend({val: function(value) {
          var hooks,
              ret,
              isFunction,
              elem = this[0];
          if (!arguments.length) {
            if (elem) {
              hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
              if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
                return ret;
              }
              ret = elem.value;
              return typeof ret === "string" ? ret.replace(rreturn, "") : ret == null ? "" : ret;
            }
            return;
          }
          isFunction = jQuery.isFunction(value);
          return this.each(function(i) {
            var val;
            if (this.nodeType !== 1) {
              return;
            }
            if (isFunction) {
              val = value.call(this, i, jQuery(this).val());
            } else {
              val = value;
            }
            if (val == null) {
              val = "";
            } else if (typeof val === "number") {
              val += "";
            } else if (jQuery.isArray(val)) {
              val = jQuery.map(val, function(value) {
                return value == null ? "" : value + "";
              });
            }
            hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
            if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
              this.value = val;
            }
          });
        }});
      jQuery.extend({valHooks: {
          option: {get: function(elem) {
              var val = jQuery.find.attr(elem, "value");
              return val != null ? val : jQuery.trim(jQuery.text(elem));
            }},
          select: {
            get: function(elem) {
              var value,
                  option,
                  options = elem.options,
                  index = elem.selectedIndex,
                  one = elem.type === "select-one" || index < 0,
                  values = one ? null : [],
                  max = one ? index + 1 : options.length,
                  i = index < 0 ? max : one ? index : 0;
              for (; i < max; i++) {
                option = options[i];
                if ((option.selected || i === index) && (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))) {
                  value = jQuery(option).val();
                  if (one) {
                    return value;
                  }
                  values.push(value);
                }
              }
              return values;
            },
            set: function(elem, value) {
              var optionSet,
                  option,
                  options = elem.options,
                  values = jQuery.makeArray(value),
                  i = options.length;
              while (i--) {
                option = options[i];
                if ((option.selected = jQuery.inArray(option.value, values) >= 0)) {
                  optionSet = true;
                }
              }
              if (!optionSet) {
                elem.selectedIndex = -1;
              }
              return values;
            }
          }
        }});
      jQuery.each(["radio", "checkbox"], function() {
        jQuery.valHooks[this] = {set: function(elem, value) {
            if (jQuery.isArray(value)) {
              return (elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0);
            }
          }};
        if (!support.checkOn) {
          jQuery.valHooks[this].get = function(elem) {
            return elem.getAttribute("value") === null ? "on" : elem.value;
          };
        }
      });
      jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "), function(i, name) {
        jQuery.fn[name] = function(data, fn) {
          return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
        };
      });
      jQuery.fn.extend({
        hover: function(fnOver, fnOut) {
          return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        },
        bind: function(types, data, fn) {
          return this.on(types, null, data, fn);
        },
        unbind: function(types, fn) {
          return this.off(types, null, fn);
        },
        delegate: function(selector, types, data, fn) {
          return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
          return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
        }
      });
      var nonce = jQuery.now();
      var rquery = (/\?/);
      jQuery.parseJSON = function(data) {
        return JSON.parse(data + "");
      };
      jQuery.parseXML = function(data) {
        var xml,
            tmp;
        if (!data || typeof data !== "string") {
          return null;
        }
        try {
          tmp = new DOMParser();
          xml = tmp.parseFromString(data, "text/xml");
        } catch (e) {
          xml = undefined;
        }
        if (!xml || xml.getElementsByTagName("parsererror").length) {
          jQuery.error("Invalid XML: " + data);
        }
        return xml;
      };
      var rhash = /#.*$/,
          rts = /([?&])_=[^&]*/,
          rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
          rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
          rnoContent = /^(?:GET|HEAD)$/,
          rprotocol = /^\/\//,
          rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
          prefilters = {},
          transports = {},
          allTypes = "*/".concat("*"),
          ajaxLocation = window.location.href,
          ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [];
      function addToPrefiltersOrTransports(structure) {
        return function(dataTypeExpression, func) {
          if (typeof dataTypeExpression !== "string") {
            func = dataTypeExpression;
            dataTypeExpression = "*";
          }
          var dataType,
              i = 0,
              dataTypes = dataTypeExpression.toLowerCase().match(rnotwhite) || [];
          if (jQuery.isFunction(func)) {
            while ((dataType = dataTypes[i++])) {
              if (dataType[0] === "+") {
                dataType = dataType.slice(1) || "*";
                (structure[dataType] = structure[dataType] || []).unshift(func);
              } else {
                (structure[dataType] = structure[dataType] || []).push(func);
              }
            }
          }
        };
      }
      function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
        var inspected = {},
            seekingTransport = (structure === transports);
        function inspect(dataType) {
          var selected;
          inspected[dataType] = true;
          jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
            var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
            if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
              options.dataTypes.unshift(dataTypeOrTransport);
              inspect(dataTypeOrTransport);
              return false;
            } else if (seekingTransport) {
              return !(selected = dataTypeOrTransport);
            }
          });
          return selected;
        }
        return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
      }
      function ajaxExtend(target, src) {
        var key,
            deep,
            flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) {
          if (src[key] !== undefined) {
            (flatOptions[key] ? target : (deep || (deep = {})))[key] = src[key];
          }
        }
        if (deep) {
          jQuery.extend(true, target, deep);
        }
        return target;
      }
      function ajaxHandleResponses(s, jqXHR, responses) {
        var ct,
            type,
            finalDataType,
            firstDataType,
            contents = s.contents,
            dataTypes = s.dataTypes;
        while (dataTypes[0] === "*") {
          dataTypes.shift();
          if (ct === undefined) {
            ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
          }
        }
        if (ct) {
          for (type in contents) {
            if (contents[type] && contents[type].test(ct)) {
              dataTypes.unshift(type);
              break;
            }
          }
        }
        if (dataTypes[0] in responses) {
          finalDataType = dataTypes[0];
        } else {
          for (type in responses) {
            if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
              finalDataType = type;
              break;
            }
            if (!firstDataType) {
              firstDataType = type;
            }
          }
          finalDataType = finalDataType || firstDataType;
        }
        if (finalDataType) {
          if (finalDataType !== dataTypes[0]) {
            dataTypes.unshift(finalDataType);
          }
          return responses[finalDataType];
        }
      }
      function ajaxConvert(s, response, jqXHR, isSuccess) {
        var conv2,
            current,
            conv,
            tmp,
            prev,
            converters = {},
            dataTypes = s.dataTypes.slice();
        if (dataTypes[1]) {
          for (conv in s.converters) {
            converters[conv.toLowerCase()] = s.converters[conv];
          }
        }
        current = dataTypes.shift();
        while (current) {
          if (s.responseFields[current]) {
            jqXHR[s.responseFields[current]] = response;
          }
          if (!prev && isSuccess && s.dataFilter) {
            response = s.dataFilter(response, s.dataType);
          }
          prev = current;
          current = dataTypes.shift();
          if (current) {
            if (current === "*") {
              current = prev;
            } else if (prev !== "*" && prev !== current) {
              conv = converters[prev + " " + current] || converters["* " + current];
              if (!conv) {
                for (conv2 in converters) {
                  tmp = conv2.split(" ");
                  if (tmp[1] === current) {
                    conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                    if (conv) {
                      if (conv === true) {
                        conv = converters[conv2];
                      } else if (converters[conv2] !== true) {
                        current = tmp[0];
                        dataTypes.unshift(tmp[1]);
                      }
                      break;
                    }
                  }
                }
              }
              if (conv !== true) {
                if (conv && s["throws"]) {
                  response = conv(response);
                } else {
                  try {
                    response = conv(response);
                  } catch (e) {
                    return {
                      state: "parsererror",
                      error: conv ? e : "No conversion from " + prev + " to " + current
                    };
                  }
                }
              }
            }
          }
        }
        return {
          state: "success",
          data: response
        };
      }
      jQuery.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
          url: ajaxLocation,
          type: "GET",
          isLocal: rlocalProtocol.test(ajaxLocParts[1]),
          global: true,
          processData: true,
          async: true,
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          accepts: {
            "*": allTypes,
            text: "text/plain",
            html: "text/html",
            xml: "application/xml, text/xml",
            json: "application/json, text/javascript"
          },
          contents: {
            xml: /xml/,
            html: /html/,
            json: /json/
          },
          responseFields: {
            xml: "responseXML",
            text: "responseText",
            json: "responseJSON"
          },
          converters: {
            "* text": String,
            "text html": true,
            "text json": jQuery.parseJSON,
            "text xml": jQuery.parseXML
          },
          flatOptions: {
            url: true,
            context: true
          }
        },
        ajaxSetup: function(target, settings) {
          return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target);
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        ajax: function(url, options) {
          if (typeof url === "object") {
            options = url;
            url = undefined;
          }
          options = options || {};
          var transport,
              cacheURL,
              responseHeadersString,
              responseHeaders,
              timeoutTimer,
              parts,
              fireGlobals,
              i,
              s = jQuery.ajaxSetup({}, options),
              callbackContext = s.context || s,
              globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event,
              deferred = jQuery.Deferred(),
              completeDeferred = jQuery.Callbacks("once memory"),
              statusCode = s.statusCode || {},
              requestHeaders = {},
              requestHeadersNames = {},
              state = 0,
              strAbort = "canceled",
              jqXHR = {
                readyState: 0,
                getResponseHeader: function(key) {
                  var match;
                  if (state === 2) {
                    if (!responseHeaders) {
                      responseHeaders = {};
                      while ((match = rheaders.exec(responseHeadersString))) {
                        responseHeaders[match[1].toLowerCase()] = match[2];
                      }
                    }
                    match = responseHeaders[key.toLowerCase()];
                  }
                  return match == null ? null : match;
                },
                getAllResponseHeaders: function() {
                  return state === 2 ? responseHeadersString : null;
                },
                setRequestHeader: function(name, value) {
                  var lname = name.toLowerCase();
                  if (!state) {
                    name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;
                    requestHeaders[name] = value;
                  }
                  return this;
                },
                overrideMimeType: function(type) {
                  if (!state) {
                    s.mimeType = type;
                  }
                  return this;
                },
                statusCode: function(map) {
                  var code;
                  if (map) {
                    if (state < 2) {
                      for (code in map) {
                        statusCode[code] = [statusCode[code], map[code]];
                      }
                    } else {
                      jqXHR.always(map[jqXHR.status]);
                    }
                  }
                  return this;
                },
                abort: function(statusText) {
                  var finalText = statusText || strAbort;
                  if (transport) {
                    transport.abort(finalText);
                  }
                  done(0, finalText);
                  return this;
                }
              };
          deferred.promise(jqXHR).complete = completeDeferred.add;
          jqXHR.success = jqXHR.done;
          jqXHR.error = jqXHR.fail;
          s.url = ((url || s.url || ajaxLocation) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//");
          s.type = options.method || options.type || s.method || s.type;
          s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(rnotwhite) || [""];
          if (s.crossDomain == null) {
            parts = rurl.exec(s.url.toLowerCase());
            s.crossDomain = !!(parts && (parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] || (parts[3] || (parts[1] === "http:" ? "80" : "443")) !== (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? "80" : "443"))));
          }
          if (s.data && s.processData && typeof s.data !== "string") {
            s.data = jQuery.param(s.data, s.traditional);
          }
          inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
          if (state === 2) {
            return jqXHR;
          }
          fireGlobals = jQuery.event && s.global;
          if (fireGlobals && jQuery.active++ === 0) {
            jQuery.event.trigger("ajaxStart");
          }
          s.type = s.type.toUpperCase();
          s.hasContent = !rnoContent.test(s.type);
          cacheURL = s.url;
          if (!s.hasContent) {
            if (s.data) {
              cacheURL = (s.url += (rquery.test(cacheURL) ? "&" : "?") + s.data);
              delete s.data;
            }
            if (s.cache === false) {
              s.url = rts.test(cacheURL) ? cacheURL.replace(rts, "$1_=" + nonce++) : cacheURL + (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce++;
            }
          }
          if (s.ifModified) {
            if (jQuery.lastModified[cacheURL]) {
              jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
            }
            if (jQuery.etag[cacheURL]) {
              jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
            }
          }
          if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
            jqXHR.setRequestHeader("Content-Type", s.contentType);
          }
          jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
          for (i in s.headers) {
            jqXHR.setRequestHeader(i, s.headers[i]);
          }
          if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || state === 2)) {
            return jqXHR.abort();
          }
          strAbort = "abort";
          for (i in {
            success: 1,
            error: 1,
            complete: 1
          }) {
            jqXHR[i](s[i]);
          }
          transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
          if (!transport) {
            done(-1, "No Transport");
          } else {
            jqXHR.readyState = 1;
            if (fireGlobals) {
              globalEventContext.trigger("ajaxSend", [jqXHR, s]);
            }
            if (s.async && s.timeout > 0) {
              timeoutTimer = setTimeout(function() {
                jqXHR.abort("timeout");
              }, s.timeout);
            }
            try {
              state = 1;
              transport.send(requestHeaders, done);
            } catch (e) {
              if (state < 2) {
                done(-1, e);
              } else {
                throw e;
              }
            }
          }
          function done(status, nativeStatusText, responses, headers) {
            var isSuccess,
                success,
                error,
                response,
                modified,
                statusText = nativeStatusText;
            if (state === 2) {
              return;
            }
            state = 2;
            if (timeoutTimer) {
              clearTimeout(timeoutTimer);
            }
            transport = undefined;
            responseHeadersString = headers || "";
            jqXHR.readyState = status > 0 ? 4 : 0;
            isSuccess = status >= 200 && status < 300 || status === 304;
            if (responses) {
              response = ajaxHandleResponses(s, jqXHR, responses);
            }
            response = ajaxConvert(s, response, jqXHR, isSuccess);
            if (isSuccess) {
              if (s.ifModified) {
                modified = jqXHR.getResponseHeader("Last-Modified");
                if (modified) {
                  jQuery.lastModified[cacheURL] = modified;
                }
                modified = jqXHR.getResponseHeader("etag");
                if (modified) {
                  jQuery.etag[cacheURL] = modified;
                }
              }
              if (status === 204 || s.type === "HEAD") {
                statusText = "nocontent";
              } else if (status === 304) {
                statusText = "notmodified";
              } else {
                statusText = response.state;
                success = response.data;
                error = response.error;
                isSuccess = !error;
              }
            } else {
              error = statusText;
              if (status || !statusText) {
                statusText = "error";
                if (status < 0) {
                  status = 0;
                }
              }
            }
            jqXHR.status = status;
            jqXHR.statusText = (nativeStatusText || statusText) + "";
            if (isSuccess) {
              deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
            } else {
              deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
            }
            jqXHR.statusCode(statusCode);
            statusCode = undefined;
            if (fireGlobals) {
              globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [jqXHR, s, isSuccess ? success : error]);
            }
            completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
            if (fireGlobals) {
              globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
              if (!(--jQuery.active)) {
                jQuery.event.trigger("ajaxStop");
              }
            }
          }
          return jqXHR;
        },
        getJSON: function(url, data, callback) {
          return jQuery.get(url, data, callback, "json");
        },
        getScript: function(url, callback) {
          return jQuery.get(url, undefined, callback, "script");
        }
      });
      jQuery.each(["get", "post"], function(i, method) {
        jQuery[method] = function(url, data, callback, type) {
          if (jQuery.isFunction(data)) {
            type = type || callback;
            callback = data;
            data = undefined;
          }
          return jQuery.ajax({
            url: url,
            type: method,
            dataType: type,
            data: data,
            success: callback
          });
        };
      });
      jQuery._evalUrl = function(url) {
        return jQuery.ajax({
          url: url,
          type: "GET",
          dataType: "script",
          async: false,
          global: false,
          "throws": true
        });
      };
      jQuery.fn.extend({
        wrapAll: function(html) {
          var wrap;
          if (jQuery.isFunction(html)) {
            return this.each(function(i) {
              jQuery(this).wrapAll(html.call(this, i));
            });
          }
          if (this[0]) {
            wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
            if (this[0].parentNode) {
              wrap.insertBefore(this[0]);
            }
            wrap.map(function() {
              var elem = this;
              while (elem.firstElementChild) {
                elem = elem.firstElementChild;
              }
              return elem;
            }).append(this);
          }
          return this;
        },
        wrapInner: function(html) {
          if (jQuery.isFunction(html)) {
            return this.each(function(i) {
              jQuery(this).wrapInner(html.call(this, i));
            });
          }
          return this.each(function() {
            var self = jQuery(this),
                contents = self.contents();
            if (contents.length) {
              contents.wrapAll(html);
            } else {
              self.append(html);
            }
          });
        },
        wrap: function(html) {
          var isFunction = jQuery.isFunction(html);
          return this.each(function(i) {
            jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
          });
        },
        unwrap: function() {
          return this.parent().each(function() {
            if (!jQuery.nodeName(this, "body")) {
              jQuery(this).replaceWith(this.childNodes);
            }
          }).end();
        }
      });
      jQuery.expr.filters.hidden = function(elem) {
        return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
      };
      jQuery.expr.filters.visible = function(elem) {
        return !jQuery.expr.filters.hidden(elem);
      };
      var r20 = /%20/g,
          rbracket = /\[\]$/,
          rCRLF = /\r?\n/g,
          rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
          rsubmittable = /^(?:input|select|textarea|keygen)/i;
      function buildParams(prefix, obj, traditional, add) {
        var name;
        if (jQuery.isArray(obj)) {
          jQuery.each(obj, function(i, v) {
            if (traditional || rbracket.test(prefix)) {
              add(prefix, v);
            } else {
              buildParams(prefix + "[" + (typeof v === "object" ? i : "") + "]", v, traditional, add);
            }
          });
        } else if (!traditional && jQuery.type(obj) === "object") {
          for (name in obj) {
            buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
          }
        } else {
          add(prefix, obj);
        }
      }
      jQuery.param = function(a, traditional) {
        var prefix,
            s = [],
            add = function(key, value) {
              value = jQuery.isFunction(value) ? value() : (value == null ? "" : value);
              s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            };
        if (traditional === undefined) {
          traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
        }
        if (jQuery.isArray(a) || (a.jquery && !jQuery.isPlainObject(a))) {
          jQuery.each(a, function() {
            add(this.name, this.value);
          });
        } else {
          for (prefix in a) {
            buildParams(prefix, a[prefix], traditional, add);
          }
        }
        return s.join("&").replace(r20, "+");
      };
      jQuery.fn.extend({
        serialize: function() {
          return jQuery.param(this.serializeArray());
        },
        serializeArray: function() {
          return this.map(function() {
            var elements = jQuery.prop(this, "elements");
            return elements ? jQuery.makeArray(elements) : this;
          }).filter(function() {
            var type = this.type;
            return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
          }).map(function(i, elem) {
            var val = jQuery(this).val();
            return val == null ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
              return {
                name: elem.name,
                value: val.replace(rCRLF, "\r\n")
              };
            }) : {
              name: elem.name,
              value: val.replace(rCRLF, "\r\n")
            };
          }).get();
        }
      });
      jQuery.ajaxSettings.xhr = function() {
        try {
          return new XMLHttpRequest();
        } catch (e) {}
      };
      var xhrId = 0,
          xhrCallbacks = {},
          xhrSuccessStatus = {
            0: 200,
            1223: 204
          },
          xhrSupported = jQuery.ajaxSettings.xhr();
      if (window.attachEvent) {
        window.attachEvent("onunload", function() {
          for (var key in xhrCallbacks) {
            xhrCallbacks[key]();
          }
        });
      }
      support.cors = !!xhrSupported && ("withCredentials" in xhrSupported);
      support.ajax = xhrSupported = !!xhrSupported;
      jQuery.ajaxTransport(function(options) {
        var callback;
        if (support.cors || xhrSupported && !options.crossDomain) {
          return {
            send: function(headers, complete) {
              var i,
                  xhr = options.xhr(),
                  id = ++xhrId;
              xhr.open(options.type, options.url, options.async, options.username, options.password);
              if (options.xhrFields) {
                for (i in options.xhrFields) {
                  xhr[i] = options.xhrFields[i];
                }
              }
              if (options.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(options.mimeType);
              }
              if (!options.crossDomain && !headers["X-Requested-With"]) {
                headers["X-Requested-With"] = "XMLHttpRequest";
              }
              for (i in headers) {
                xhr.setRequestHeader(i, headers[i]);
              }
              callback = function(type) {
                return function() {
                  if (callback) {
                    delete xhrCallbacks[id];
                    callback = xhr.onload = xhr.onerror = null;
                    if (type === "abort") {
                      xhr.abort();
                    } else if (type === "error") {
                      complete(xhr.status, xhr.statusText);
                    } else {
                      complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, typeof xhr.responseText === "string" ? {text: xhr.responseText} : undefined, xhr.getAllResponseHeaders());
                    }
                  }
                };
              };
              xhr.onload = callback();
              xhr.onerror = callback("error");
              callback = xhrCallbacks[id] = callback("abort");
              try {
                xhr.send(options.hasContent && options.data || null);
              } catch (e) {
                if (callback) {
                  throw e;
                }
              }
            },
            abort: function() {
              if (callback) {
                callback();
              }
            }
          };
        }
      });
      jQuery.ajaxSetup({
        accepts: {script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},
        contents: {script: /(?:java|ecma)script/},
        converters: {"text script": function(text) {
            jQuery.globalEval(text);
            return text;
          }}
      });
      jQuery.ajaxPrefilter("script", function(s) {
        if (s.cache === undefined) {
          s.cache = false;
        }
        if (s.crossDomain) {
          s.type = "GET";
        }
      });
      jQuery.ajaxTransport("script", function(s) {
        if (s.crossDomain) {
          var script,
              callback;
          return {
            send: function(_, complete) {
              script = jQuery("<script>").prop({
                async: true,
                charset: s.scriptCharset,
                src: s.url
              }).on("load error", callback = function(evt) {
                script.remove();
                callback = null;
                if (evt) {
                  complete(evt.type === "error" ? 404 : 200, evt.type);
                }
              });
              document.head.appendChild(script[0]);
            },
            abort: function() {
              if (callback) {
                callback();
              }
            }
          };
        }
      });
      var oldCallbacks = [],
          rjsonp = /(=)\?(?=&|$)|\?\?/;
      jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
          var callback = oldCallbacks.pop() || (jQuery.expando + "_" + (nonce++));
          this[callback] = true;
          return callback;
        }
      });
      jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName,
            overwritten,
            responseContainer,
            jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data");
        if (jsonProp || s.dataTypes[0] === "jsonp") {
          callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
          if (jsonProp) {
            s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
          } else if (s.jsonp !== false) {
            s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
          }
          s.converters["script json"] = function() {
            if (!responseContainer) {
              jQuery.error(callbackName + " was not called");
            }
            return responseContainer[0];
          };
          s.dataTypes[0] = "json";
          overwritten = window[callbackName];
          window[callbackName] = function() {
            responseContainer = arguments;
          };
          jqXHR.always(function() {
            window[callbackName] = overwritten;
            if (s[callbackName]) {
              s.jsonpCallback = originalSettings.jsonpCallback;
              oldCallbacks.push(callbackName);
            }
            if (responseContainer && jQuery.isFunction(overwritten)) {
              overwritten(responseContainer[0]);
            }
            responseContainer = overwritten = undefined;
          });
          return "script";
        }
      });
      jQuery.parseHTML = function(data, context, keepScripts) {
        if (!data || typeof data !== "string") {
          return null;
        }
        if (typeof context === "boolean") {
          keepScripts = context;
          context = false;
        }
        context = context || document;
        var parsed = rsingleTag.exec(data),
            scripts = !keepScripts && [];
        if (parsed) {
          return [context.createElement(parsed[1])];
        }
        parsed = jQuery.buildFragment([data], context, scripts);
        if (scripts && scripts.length) {
          jQuery(scripts).remove();
        }
        return jQuery.merge([], parsed.childNodes);
      };
      var _load = jQuery.fn.load;
      jQuery.fn.load = function(url, params, callback) {
        if (typeof url !== "string" && _load) {
          return _load.apply(this, arguments);
        }
        var selector,
            type,
            response,
            self = this,
            off = url.indexOf(" ");
        if (off >= 0) {
          selector = jQuery.trim(url.slice(off));
          url = url.slice(0, off);
        }
        if (jQuery.isFunction(params)) {
          callback = params;
          params = undefined;
        } else if (params && typeof params === "object") {
          type = "POST";
        }
        if (self.length > 0) {
          jQuery.ajax({
            url: url,
            type: type,
            dataType: "html",
            data: params
          }).done(function(responseText) {
            response = arguments;
            self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText);
          }).complete(callback && function(jqXHR, status) {
            self.each(callback, response || [jqXHR.responseText, status, jqXHR]);
          });
        }
        return this;
      };
      jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(i, type) {
        jQuery.fn[type] = function(fn) {
          return this.on(type, fn);
        };
      });
      jQuery.expr.filters.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
          return elem === fn.elem;
        }).length;
      };
      var docElem = window.document.documentElement;
      function getWindow(elem) {
        return jQuery.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
      }
      jQuery.offset = {setOffset: function(elem, options, i) {
          var curPosition,
              curLeft,
              curCSSTop,
              curTop,
              curOffset,
              curCSSLeft,
              calculatePosition,
              position = jQuery.css(elem, "position"),
              curElem = jQuery(elem),
              props = {};
          if (position === "static") {
            elem.style.position = "relative";
          }
          curOffset = curElem.offset();
          curCSSTop = jQuery.css(elem, "top");
          curCSSLeft = jQuery.css(elem, "left");
          calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
          if (calculatePosition) {
            curPosition = curElem.position();
            curTop = curPosition.top;
            curLeft = curPosition.left;
          } else {
            curTop = parseFloat(curCSSTop) || 0;
            curLeft = parseFloat(curCSSLeft) || 0;
          }
          if (jQuery.isFunction(options)) {
            options = options.call(elem, i, curOffset);
          }
          if (options.top != null) {
            props.top = (options.top - curOffset.top) + curTop;
          }
          if (options.left != null) {
            props.left = (options.left - curOffset.left) + curLeft;
          }
          if ("using" in options) {
            options.using.call(elem, props);
          } else {
            curElem.css(props);
          }
        }};
      jQuery.fn.extend({
        offset: function(options) {
          if (arguments.length) {
            return options === undefined ? this : this.each(function(i) {
              jQuery.offset.setOffset(this, options, i);
            });
          }
          var docElem,
              win,
              elem = this[0],
              box = {
                top: 0,
                left: 0
              },
              doc = elem && elem.ownerDocument;
          if (!doc) {
            return;
          }
          docElem = doc.documentElement;
          if (!jQuery.contains(docElem, elem)) {
            return box;
          }
          if (typeof elem.getBoundingClientRect !== strundefined) {
            box = elem.getBoundingClientRect();
          }
          win = getWindow(doc);
          return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
          };
        },
        position: function() {
          if (!this[0]) {
            return;
          }
          var offsetParent,
              offset,
              elem = this[0],
              parentOffset = {
                top: 0,
                left: 0
              };
          if (jQuery.css(elem, "position") === "fixed") {
            offset = elem.getBoundingClientRect();
          } else {
            offsetParent = this.offsetParent();
            offset = this.offset();
            if (!jQuery.nodeName(offsetParent[0], "html")) {
              parentOffset = offsetParent.offset();
            }
            parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", true);
            parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", true);
          }
          return {
            top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
            left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
          };
        },
        offsetParent: function() {
          return this.map(function() {
            var offsetParent = this.offsetParent || docElem;
            while (offsetParent && (!jQuery.nodeName(offsetParent, "html") && jQuery.css(offsetParent, "position") === "static")) {
              offsetParent = offsetParent.offsetParent;
            }
            return offsetParent || docElem;
          });
        }
      });
      jQuery.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
      }, function(method, prop) {
        var top = "pageYOffset" === prop;
        jQuery.fn[method] = function(val) {
          return access(this, function(elem, method, val) {
            var win = getWindow(elem);
            if (val === undefined) {
              return win ? win[prop] : elem[method];
            }
            if (win) {
              win.scrollTo(!top ? val : window.pageXOffset, top ? val : window.pageYOffset);
            } else {
              elem[method] = val;
            }
          }, method, val, arguments.length, null);
        };
      });
      jQuery.each(["top", "left"], function(i, prop) {
        jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function(elem, computed) {
          if (computed) {
            computed = curCSS(elem, prop);
            return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
          }
        });
      });
      jQuery.each({
        Height: "height",
        Width: "width"
      }, function(name, type) {
        jQuery.each({
          padding: "inner" + name,
          content: type,
          "": "outer" + name
        }, function(defaultExtra, funcName) {
          jQuery.fn[funcName] = function(margin, value) {
            var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"),
                extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
            return access(this, function(elem, type, value) {
              var doc;
              if (jQuery.isWindow(elem)) {
                return elem.document.documentElement["client" + name];
              }
              if (elem.nodeType === 9) {
                doc = elem.documentElement;
                return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);
              }
              return value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra);
            }, type, chainable ? margin : undefined, chainable, null);
          };
        });
      });
      jQuery.fn.size = function() {
        return this.length;
      };
      jQuery.fn.andSelf = jQuery.fn.addBack;
      if (typeof define === "function" && define.amd) {
        define("jquery", [], function() {
          return jQuery;
        });
      }
      var _jQuery = window.jQuery,
          _$ = window.$;
      jQuery.noConflict = function(deep) {
        if (window.$ === jQuery) {
          window.$ = _$;
        }
        if (deep && window.jQuery === jQuery) {
          window.jQuery = _jQuery;
        }
        return jQuery;
      };
      if (typeof noGlobal === strundefined) {
        window.jQuery = window.$ = jQuery;
      }
      return jQuery;
    }));
  })($__require('29'));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8d", ["94"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__require('94');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1", ["8d", "4", "8f"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global);
  if (typeof root !== 'undefined' && root !== null) {
    root.$ = root.jQuery = $__require('8d');
    root._ = $__require('4');
  } else {
    throw new Error('Could not find a valid global object.');
  }
  $__require('8f');
  global.define = __define;
  return module.exports;
});

})
(function(factory) {
  factory();
});