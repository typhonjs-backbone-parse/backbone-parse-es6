'use strict';

import Parse         from 'parse';

import _             from 'underscore';
import extend        from 'backbone-es6/src/extend.js';
import modelExtend   from './modelExtend.js';

import Utils         from 'typhonjs-core-utils/src/Utils.js';

// Add HTTPS image fetch substitution to Parse.Object ---------------------------------------------------------------

/**
 * It turns out that we can get an HTTPS link from S3 for any given parse file URL by string substitution.
 *
 * @param {string}   key   - Attribute key
 * @returns {XML|string|void}
 */
Parse.Object.prototype.getHTTPSUrl = function(key)
{
   const urlRequest = this.get(key);

   if (!_.isUndefined(urlRequest) && urlRequest !== null && !_.isUndefined(urlRequest.url))
   {
      return urlRequest.url().replace('http://files.parsetfss.com/', 'https://s3.amazonaws.com/files.parsetfss.com/');
   }
};

/**
 * Provides support for older "extend" functionality in addition to adding a utility
 * method, "getHTTPSUrl" to retrieve an HTTPS url for Parse.Object and Backbone.Model.
 *
 * @param {Backbone} Backbone - Backbone instance
 */
export default function parseExtend(Backbone)
{
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
   Backbone.Model.prototype.getHTTPSUrl = function(key)
   {
      const urlRequest = this.get(key);

      if (!_.isUndefined(urlRequest) && urlRequest !== null && !_.isUndefined(urlRequest.url))
      {
         return urlRequest.url().replace('http://files.parsetfss.com/',
          'https://s3.amazonaws.com/files.parsetfss.com/');
      }
   };
// Various fixes for Backbone / Parse integration -------------------------------------------------------------------

   s_FIX_ISSUE5_DESERIALIZATION(Backbone);
}

/**
 * Stores subclass information registered with Parse.Object.
 * @type {{}}
 */
const s_PARSE_OBJECT_CLASS_MAP = {};

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
const s_FIX_ISSUE5_DESERIALIZATION = (Backbone) =>
{
   /**
    * Override `getSubclass` as it is referenced in `fromJSON`.
    *
    * @param {string}   className - Parse.Object className / table ID.
    *
    * @returns {*}
    */
   Parse.Object.getSubclass = (className) =>
   {
      if (typeof className !== 'string') { throw new TypeError('The first argument must be a valid class name.'); }

      return s_PARSE_OBJECT_CLASS_MAP[className];
   };

   /**
    * Override `registerSubclass` as it needs to use `s_PARSE_OBJECT_CLASS_MAP` above.
    *
    * @param {string}   className - Parse.Object className / table ID.
    * @param {function} constructor - Class / constructor to register as a subclass.
    */
   Parse.Object.registerSubclass = (className, constructor) =>
   {
      if (typeof className !== 'string') { throw new TypeError('The first argument must be a valid class name.'); }

      if (typeof constructor === 'undefined') { throw new TypeError('You must supply a subclass constructor.'); }

      if (typeof constructor !== 'function')
      {
         throw new TypeError(
          'You must register the subclass constructor. Did you attempt to register an instance of the subclass?');
      }

      s_PARSE_OBJECT_CLASS_MAP[className] = constructor;

      if (!constructor.className) { constructor.className = className; }
   };

   /**
    * Override `fromJSON` to check constructor. If it is a type of `Backbone.Model` then construct it as a `ParseModel`
    * passing in the associated `Parse.Object` otherwise just return the `Parse.Object`.
    *
    * @param {object}   json - JSON object
    *
    * @returns {*}
    */
   Parse.Object.fromJSON = (json) =>
   {
      if (!json.className) { throw new Error('Cannot create an object without a className'); }

      const constructor = Parse.Object.getSubclass(json.className);
      const parseObject = new Parse.Object(json.className);
      const otherAttributes = {};

      for (const attr in json)
      {
         if (attr !== 'className' && attr !== '__type') { otherAttributes[attr] = json[attr]; }
      }

      parseObject._finishFetch(otherAttributes);

      if (json.objectId) { parseObject._setExisted(true); }

      return constructor && Utils.isTypeOf(constructor, Backbone.Model) ? new constructor({}, { parseObject }) :
       parseObject;
   };
};