'use strict';

import extend  from 'backbone-es6/src/extend.js';

/**
 * Provides extend functionality for Model that is compatible to the Parse SDK.
 *
 * @param {string|object}  className   - Class name or object hash w/ className key
 * @param {object}         protoProps  - instance properties
 * @param {object}         staticProps - class properties
 * @returns {*}            Subclass of parent class.
 */
export default function modelExtend(className, protoProps, staticProps)
{
   if (typeof className !== 'string')
   {
      if (className && typeof className.className === 'string')
      {
         return modelExtend(className.className, className, protoProps);
      }
      else
      {
         throw new Error(`(Parse) Backbone.Model.extend - the first argument should be the className.`);
      }
   }

   const child = extend.call(this, protoProps, staticProps);

   child.className = className;

   return child;
}