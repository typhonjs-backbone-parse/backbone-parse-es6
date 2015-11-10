'use strict';

import _                from 'underscore';
import Model            from './ParseModel.js';
import Collection       from 'backbone-es6/src/Collection.js';

import Debug            from 'backbone-es6/src/Debug.js';

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
class ParseCollection extends Collection
{
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
   constructor(models = [], options = {})
   {
      super(models, _.extend({ abortCtor: true }, options));

      // Allows child classes to abort constructor execution.
      if (_.isBoolean(options.abortCtor) && options.abortCtor) { return; }

      // Must detect if there are any getters defined in order to skip setting these values directly.
      const hasModelGetter = !_.isUndefined(this.model);
      const hasQueryGetter = !_.isUndefined(this.query);
      const hasComparatorGetter = !_.isUndefined(this.comparator);

      // The default model for a collection is just a **Backbone.Model**. This should be overridden in most cases.
      if (!hasModelGetter)
      {
         /**
          * The default Backbone.Model class to use as a prototype for this collection.
          * @type {Model}
          */
         this.model = Model;
      }

      if (options.model && !hasModelGetter)
      {
         if (!(options.model instanceof Model))
         {
            throw TypeError('options.model is not an instance of ParseModel.');
         }

         this.model = options.model;
      }

      if (options.query && !hasQueryGetter)
      {
         /**
          * A Parse.Query instance
          * @type {Parse.Query}
          */
         this.query = options.query;
      }

      if (options.comparator !== void 0 && !hasComparatorGetter)
      {
         /**
          * A comparator string indicating the attribute to sort.
          * @type {string}
          */
         this.comparator = options.comparator;
      }

      // Allows child classes to postpone initialization.
      if (_.isBoolean(options.abortCtorInit) && options.abortCtorInit) { return; }

      this._reset();

      this.initialize(...arguments);

      if (models) { this.reset(models, _.extend({ silent: true }, options)); }
   }

   /**
    * Returns a new instance of the collection with an identical list of models.
    *
    * @see http://backbonejs.org/#Collection-clone
    *
    * @returns {Collection} Returns a new collection with shared models.
    */
   clone()
   {
      return new this.constructor(this.models, {
         model: this.model,
         query: this.query,
         comparator: this.comparator
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
   parse(resp, options)
   {
      /* eslint-enable no-unused-vars */

      let output;

Debug.log(`ParseCollection - parse - 0`, true);

      if (!_.isArray(resp))
      {
         const parseObject = resp;
         output = new this.model({}, { parseObject });

Debug.log(`ParseCollection - parse - 1 - toJSON: ${JSON.stringify(parseObject.toJSON())}`);
      }
      else
      {
         output = [];

Debug.log(`ParseCollection - parse - 2 - resp.length: ${resp.length}`);

         _.each(resp, (parseObject) =>
         {
            const model = new this.model({}, { parseObject, updateParseObject: false });
            output.push(model);

Debug.log(`ParseCollection - parse - 3 - parseObject: ${JSON.stringify(model.toJSON())}`);
         });
      }

      return output;
   }
}

/**
 * Exports the ParseCollection class.
 */
export default ParseCollection;