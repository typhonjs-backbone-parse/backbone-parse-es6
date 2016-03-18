'use strict';

import _             from 'underscore';
import BackboneProxy from 'backbone-es6/src/BackboneProxy.js';

import Debug         from 'backbone-es6/src/Debug.js';

/**
 * Syncs a Backbone.Collection via an associated Parse.Query.
 *
 * @param {string}      method      - A string that defines the synchronization action to perform.
 * @param {Collection}  collection  - The model or collection instance to synchronize.
 * @param {object}      options     - Optional parameters
 * @returns {*|ParsePromise}
 */
const syncCollection = (method, collection, options) =>
{
Debug.log(`sync - syncCollection - 0 - method: ${method}; collection.query: ${collection.query.toJSON()}`, true);

   switch (method)
   {
      case 'create':
      case 'delete':
      case 'patch':
      case 'update':
         throw new Error(`syncCollection - unsupported method: ${method}`);

      case 'read':
Debug.log(`sync - sync(Collection) -- read`);

         if (_.isUndefined(collection.query) || collection.query === null)
         {
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
const syncModel = (method, model, options) =>
{
Debug.log(`sync - syncModel - 0 - method: ${method}`, true);

   if (_.isUndefined(model.parseObject) || model.parseObject === null)
   {
      throw new Error('syncModel - model.parseObject is undefined or null.');
   }

   switch (method)
   {
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
export default function parseSync(method, model, options)
{
   if (model instanceof BackboneProxy.backbone.Model)
   {
      return syncModel(method, model, options);
   }
   else if (model instanceof BackboneProxy.backbone.Collection)
   {
      return syncCollection(method, model, options);
   }
   else
   {
      throw new TypeError('sync - unknown model type.');
   }
}