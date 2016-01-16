'use strict';

import Parse   from 'parse';
import encode  from 'parse/lib/browser/encode.js';

/**
 * Provides overrides necessary to integrate Parse serialization / deserialization with Backbone.
 */
export default class BackboneParseObject extends Parse.Object
{
   /**
    * Provides a constructor for clone.
    *
    * @param {string | object}   className - class name of object that has className field.
    * @param {object}            attributes - attributes hash.
    * @param {object}            options - Optional parameters
    */
   constructor(className, attributes, options)
   {
      super(className, attributes, options);
   }

   /**
    * Creates a new BackboneParseObject with identical attributes to this one.
    * @method clone
    * @return {BackboneParseObject}
    */
   clone()
   {
      const clone = new this.constructor();

      if (!clone.className) { clone.className = this.className; }
      if (clone.set) { clone.set(this.attributes); }

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
   _getSaveJSON()
   {
      const json = super._getSaveJSON();

      for (const attr in json)
      {
         if (typeof json[attr].parseObject === 'object')
         {
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
    * */
   toJSON(seen)
   {
      const seenEntry = this.id ? `${this.className}:${this.id}` : this;
      seen = seen || [seenEntry];

      const json = {};
      const attrs = this.attributes;

      for (const attr in attrs)
      {
         if ((attr === 'createdAt' || attr === 'updatedAt') && attrs[attr].toJSON)
         {
            json[attr] = attrs[attr].toJSON();
         }
         else if (typeof attrs[attr].parseObject === 'object')
         {
            json[attr] = encode(attrs[attr].parseObject, false, false, seen);
         }
         else
         {
            json[attr] = encode(attrs[attr], false, false, seen);
         }
      }
      const pending = this._getPendingOps();
      for (const attr in pending[0])
      {
         json[attr] = pending[0][attr].toJSON();
      }

      if (this.id)
      {
         json.objectId = this.id;
      }
      return json;
   }
}