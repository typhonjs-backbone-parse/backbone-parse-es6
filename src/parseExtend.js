'use strict';

import Parse         from 'parse';

import _             from 'underscore';
import extend        from 'backbone-es6/src/extend.js';
import modelExtend   from './modelExtend.js';

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
      return urlRequest.url().replace('http://files.parsetfss.com/',
       'https://s3.amazonaws.com/files.parsetfss.com/');
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
}