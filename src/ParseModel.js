'use strict';

import _             from 'underscore';
import Model         from 'backbone-es6/src/Model.js';
import Utils         from 'backbone-es6/src/Utils.js';

import Parse         from 'parse';

import Debug         from 'backbone-es6/src/Debug.js';

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

      if (hasClassNameGetter)
      {
         if (!_.isString(this.className))
         {
            throw new TypeError('Model - ctor - getter for className is not a string.');
         }
      }

      let adjustedClassName;

      const classNameOrParseObject = options.parseObject || options.className;

      if (classNameOrParseObject instanceof Parse.Object)
      {
         const parseObject = classNameOrParseObject;

         // Insure that any getter for className is the same as the Parse.Object
         if (hasClassNameGetter && this.className !== parseObject.className)
         {
            throw new Error(`Model - ctor - getter className '${this.className}
             ' does not equal Parse.Object className '${parseObject.className}'.`);
         }

         /**
          * Parse class name string or proxy ParseObject
          * @type {string|ParseObject}
          */
         this.parseObject = classNameOrParseObject;

         adjustedClassName = this.parseObject.className;
      }
      else  // Attempt to create Parse.Object from classNameOrParseObject, getter, or from "extend" construction.
      {
         if (_.isString(classNameOrParseObject))
         {
            adjustedClassName = classNameOrParseObject;
            this.parseObject = new Parse.Object(adjustedClassName, attributes);
         }
         // Check for getter "get className()" usage.
         else if (hasClassNameGetter)
         {
            this.parseObject = new Parse.Object(this.className, attributes);
         }
         // Check for className via "extend" usage.
         else if (!_.isUndefined(this.__proto__ && _.isString(this.__proto__.constructor.className)))
         {
            adjustedClassName = this.__proto__.constructor.className;
            this.parseObject = new Parse.Object(adjustedClassName, attributes);
         }
      }

      if (_.isUndefined(this.parseObject))
      {
         throw new TypeError('ctor - classNameOrParseObject is not a string or Parse.Object.');
      }

      if (!hasClassNameGetter)
      {
         /**
          * Parse class name
          * @type {string}
          */
         this.className = adjustedClassName;
      }

      let attrs = attributes || {};

      options.parse = true;
      options.updateParseObject = options.updateParseObject || true;

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

      /**
       * The prefix is used to create the client id which is used to identify models locally.
       * You may want to override this if you're experiencing name clashes with model ids.
       *
       * @type {string}
       */
      this.cidPrefix = 'c';

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
         Utils.wrapError(this, options);
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
         this.id = resp.id;

         // Store the parse ID in local attributes; Note that it won't be propagated in "set()"
         const mergeId = {};
         mergeId[ParseModel.prototype.idAttribute] = resp.id;

Debug.log(`ParseModel - parse - 2 - mergeId: ${mergeId[Model.prototype.idAttribute]}`);

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

            if (updateParseObject && this.parseObject !== null && attr !== Model.prototype.idAttribute)
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
            let setSuccess = !updateParseObject;

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