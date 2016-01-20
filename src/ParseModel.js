'use strict';

import _                   from 'underscore';
import Parse               from 'parse';

import Model               from 'backbone-es6/src/Model.js';
import BBUtils             from 'backbone-es6/src/Utils.js';

import BackboneParseObject from './BackboneParseObject.js';

import Utils               from 'typhonjs-core-utils/src/Utils.js';

import Debug               from 'backbone-es6/src/Debug.js';

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
class ParseModel extends Model
{
   /**
    * When creating an instance of a model, you can pass in the initial values of the attributes, which will be set on
    * the model. If you define an initialize function, it will be invoked when the model is created.
    *
    * @param {object}   attributes - Optional attribute hash of original values to set.
    * @param {object}   options    - Optional parameters
    */
   constructor(attributes = {}, options = {})
   {
      super(attributes, _.extend({ abortCtor: true }, options));

      // Allows child classes to abort constructor execution.
      if (_.isBoolean(options.abortCtor) && options.abortCtor) { return; }

      const hasClassNameGetter = !_.isUndefined(this.className);
      const hasCollectionGetter = !_.isUndefined(this.collection);
      const hasSubclassGetter = !_.isUndefined(this.subClasses);

      if (hasClassNameGetter)
      {
         if (!_.isString(this.className))
         {
            throw new TypeError('ctor - getter for className is not a string.');
         }
      }

      if (options.subClasses && !hasSubclassGetter)
      {
         /**
          * Object hash of name / class to register as sub classes.
          * @type {object}
          */
         this.subClasses = options.subClasses;
      }

      // Verify any sub class data.
      if (this.subClasses)
      {
         if (!_.isObject(this.subClasses))
         {
            throw new TypeError('ctor - subClasses is not an object hash.');
         }

         _.each(this.subClasses, (value, key) =>
         {
            if (!_.isString(key))
            {
               throw new TypeError('ctor - subClass key is not a string.');
            }

            if (!Utils.isTypeOf(value, ParseModel))
            {
               throw new TypeError(`ctor - subClass is not a sub class of ParseModel for key: ${key}`);
            }
         });
      }

      let adjustedClassName;

      const classNameOrParseObject = options.parseObject || options.className;

Debug.log(`ParseModel - ctor - 0 - options.parseObject: ${options.parseObject}`, true);

      if (classNameOrParseObject instanceof Parse.Object)
      {
         const parseObject = classNameOrParseObject;

         // Insure that any getter for className is the same as the Parse.Object
         if (hasClassNameGetter && this.className !== parseObject.className)
         {
            throw new Error(`ctor - getter className '${this.className}
             ' does not equal 'parseObject' className '${parseObject.className}'.`);
         }

         /**
          * Parse proxy ParseObject
          * @type {BackboneParseObject}
          */
         if (!(parseObject instanceof BackboneParseObject))
         {
            this.parseObject = new BackboneParseObject(parseObject.className, parseObject.attributes);
            this.parseObject.id = parseObject.id;
            this.parseObject._localId = parseObject._localId;
         }
         else
         {
            this.parseObject = parseObject;
         }

         adjustedClassName = this.parseObject.className;
      }
      else  // Attempt to create Parse.Object from classNameOrParseObject, getter, or from "extend" construction.
      {
         if (_.isString(classNameOrParseObject))
         {
            adjustedClassName = classNameOrParseObject;
            this.parseObject = new BackboneParseObject(adjustedClassName, attributes);
         }
         // Check for getter "get className()" usage.
         else if (hasClassNameGetter)
         {
            this.parseObject = new BackboneParseObject(this.className, attributes);
         }
         // Check for className via "extend" usage.
         else if (!_.isUndefined(this.__proto__ && _.isString(this.__proto__.constructor.className)))
         {
            adjustedClassName = this.__proto__.constructor.className;
            this.parseObject = new BackboneParseObject(adjustedClassName, attributes);
         }
      }

      if (_.isUndefined(this.parseObject))
      {
         throw new TypeError('ctor - classNameOrParseObject is not a string or BackboneParseObject.');
      }

      if (!hasClassNameGetter)
      {
         /**
          * Parse class name
          * @type {string}
          */
         this.className = adjustedClassName;
      }

      // Register the given subClasses if an object hash exists.
      if (this.subClasses)
      {
         _.each(this.subClasses, (value, key) =>
         {
            Parse.Object.registerSubclass(key, value);
         });
      }

      let attrs = attributes || {};

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

      if (options.collection && !hasCollectionGetter)
      {
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
      if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) { return; }

      if (options.parse) { attrs = this.parse(this.parseObject, options) || {}; }

      attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

      this.set(attrs, options);

      this.initialize(this, arguments);
   }

   /**
    * Returns a new instance of the model with identical attributes.
    *
    * @see http://backbonejs.org/#Model-clone
    *
    * @returns {*}
    */
   clone()
   {
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
   destroy(options)
   {
      options = options ? _.clone(options) : {};
      const success = options.success;
      const wait = options.wait;

      const destroy = () =>
      {
         this.stopListening();
         this.trigger('destroy', this, this.collection, options);
      };

      options.success = (resp) =>
      {
         if (wait) { destroy(); }
         if (success) { success.call(options.context, this, resp, options); }
         if (!this.isNew()) { this.trigger('sync', this, resp, options); }
      };

      let xhr;

      if (this.isNew())
      {
         xhr = new Promise((resolve) =>
         {
            _.defer(options.success);
            resolve();
         });
      }
      else
      {
         BBUtils.wrapError(this, options);
         xhr = this.sync('delete', this, options);
      }

      if (!wait) { destroy(); }

      return xhr;
   }

   /**
    * Has this model been saved to the server yet? If the model does not yet have an id, it is considered to be new.
    *
    * @see http://backbonejs.org/#Model-isNew
    *
    * @returns {boolean}
    */
   isNew()
   {
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
   parse(resp, options)
   {
      /* eslint-enable no-unused-vars */

Debug.log(`ParseModel - parse - 0 - resp instanceof Parse.Object: ${resp instanceof Parse.Object}`, true);
Debug.log(`ParseModel - parse - 1 - ParseModel.prototype.idAttribute: ${ParseModel.prototype.idAttribute}`);

      let merged;

      if (resp instanceof Parse.Object)
      {
         /**
          * Update the `id`.
          * @type {*}
          */
         this.id = resp._getId();

         // Store the parse ID in local attributes; Note that it won't be propagated in "set()"
         const mergeId = {};
         mergeId[ParseModel.prototype.idAttribute] = this.id;

Debug.log(`ParseModel - parse - 2 - mergeId: ${mergeId[ParseModel.prototype.idAttribute]}`);

         merged = _.extend(mergeId, resp.attributes);

Debug.log(`ParseModel - parse - 3 - merged: ${JSON.stringify(merged)}`);
      }
      else if (_.isObject(resp))
      {
         const parseObjectId = resp[ParseModel.prototype.idAttribute];

Debug.log(`ParseModel - parse - 4 - resp is an Object / existing model - parseObjectId: ${parseObjectId}; resp: ${JSON.stringify(resp)}`);

         if (!_.isUndefined(parseObjectId) && this.id !== parseObjectId)
         {
Debug.log(`ParseModel - parse - 5 - this.id !== parseObjectId; this.id: ${this.id}; parseObjectId: ${parseObjectId}`);

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
   save(key, val, options)
   {
      let attrs;

      if (Utils.isNullOrUndef(key) || typeof key === 'object')
      {
Debug.log(`ParseModel - save - 0`);

         attrs = key;
         options = val;
      }
      else
      {
Debug.log(`ParseModel - save - 1`);

         (attrs = {})[key] = val;
      }

      // Save any previous options.success function.
      const success = !Utils.isNullOrUndef(options) ? options.success : undefined;

Debug.log(`ParseModel - save - 2 - options.success defined: ${success !== undefined}`);

      options = options || {};

      options.success = (model, resp, options) =>
      {
         // Execute previously cached success function. Must do this first before resolving any potential
         // child object changes.
         if (success)
         {
Debug.log('ParseModel - save - 3 - invoking original options.success.');
            success.call(options.context, this, resp, options);
         }

Debug.log('ParseModel - save - 4 - invoking ParseModel success.');

         const modelAttrs = this.attributes;
         for (const attr in modelAttrs)
         {
            const field = modelAttrs[attr];

            // Here is the key part as if the associated Parse.Object id is different than the model id it
            // needs to be parsed and data set to the Backbone.Model.
            if (field.parseObject && field.parseObject.id !== field.id)
            {
               field.set(field.parse(field.parseObject), options);
            }
         }
      };

      return super.save(attrs, options);
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
   set(key, val, options = {})
   {
      if (Utils.isNullOrUndef(key)) { return this; }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      let attrs;
      if (typeof key === 'object')
      {
         attrs = key;
         options = val || {};
      }
      else
      {
         (attrs = {})[key] = val;
      }

      // Run validation.
      if (!this._validate(attrs, options)) { return false; }

      // Extract attributes and options.
      const unset = options.unset;
      const silent = options.silent;
      const updateParseObject = !_.isUndefined(options.updateParseObject) ? options.updateParseObject : true;

      const changes = [];
      const changing = this._changing;
      this._changing = true;

Debug.log(`ParseModel - set - 0 - changing: ${changing}; attrs: ${JSON.stringify(attrs)}; options: ${JSON.stringify(options)}`, true);

      if (!changing)
      {
         this._previousAttributes = _.clone(this.attributes);
         this.changed = {};
      }

      const current = this.attributes;
      const changed = this.changed;
      const prev = this._previousAttributes;

      // For each `set` attribute, update or delete the current value.
      for (const attr in attrs)
      {
         val = attrs[attr];

         if (!_.isEqual(current[attr], val))
         {
Debug.log(`ParseModel - set - 1 - current[attr] != val for key: ${attr}`);
            changes.push(attr);
         }

         let actuallyChanged = false;

         if (!_.isEqual(prev[attr], val))
         {
Debug.log(`ParseModel - set - 2 - prev[attr] != val for key: ${attr}`);

            changed[attr] = val;
            actuallyChanged = true;
         }
         else
         {
Debug.log(`ParseModel - set - 3 - prev[attr] == val delete changed for key: ${attr}`);
            delete changed[attr];
         }

         if (unset)
         {
            let unsetSuccess = !updateParseObject;

            // Ignore any change to the Parse.Object id
            if (attr === ParseModel.prototype.idAttribute)
            {
               continue;
            }

            if (updateParseObject && this.parseObject !== null && attr !== ParseModel.prototype.idAttribute)
            {
               // Parse.Object returns itself on success
               unsetSuccess = this.parseObject === this.parseObject.unset(attr);

Debug.log(`ParseModel - set - 4 - unset Parse.Object - attr: ${attr}; unsetSuccess: ${unsetSuccess}`);
            }

            if (unsetSuccess)
            {
               delete current[attr];
            }
         }
         else
         {
            let setSuccess = !updateParseObject || attr === ParseModel.prototype.idAttribute;

            if (actuallyChanged && updateParseObject && this.parseObject !== null &&
             attr !== ParseModel.prototype.idAttribute)
            {
               // Parse.Object returns itself on success
               setSuccess = this.parseObject === this.parseObject.set(attr, val, options);

Debug.log(`ParseModel - set - 5 - set Parse.Object - attr: ${attr}; setSuccess: ${setSuccess}`);
            }

            if (actuallyChanged && setSuccess)
            {
               current[attr] = val;
            }
         }
      }

      // Trigger all relevant attribute changes.
      if (!silent)
      {
         if (changes.length) { this._pending = options; }
         for (let i = 0; i < changes.length; i++)
         {
            this.trigger(`change:${changes[i]}`, this, current[changes[i]], options);
Debug.log(`ParseModel - set - 6 - trigger - changeKey: ${changes[i]}`);
         }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) { return this; }
      if (!silent)
      {
         while (this._pending)
         {
            options = this._pending;
            this._pending = false;
            this.trigger('change', this, options);
Debug.log(`ParseModel - set - 7 - trigger - change`);
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
   toJSON()
   {
      return this.parseObject.toJSON();
   }

   /**
    * This is an unsupported operation for backbone-parse-es6.
    */
   url()
   {
      throw new Error('ParseModel - url() - Unsupported Operation.');
   }
}

// The Parse.Object id is set in Backbone.Model attributes to _parseObjectId. In set any change to _parseObjectId is not
// propagated to the associated Parse.Object. Note that the Parse.Object id is also set to this.id in "parse()".
ParseModel.prototype.idAttribute = '_parseObjectId';

/**
 * Exports the ParseModel class.
 */
export default ParseModel;