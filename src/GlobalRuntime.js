/**
 * GlobalRuntime.js (Parse) -- Initializes Backbone and Parse setting them to "root.Backbone" and "root.Parse"
 * if root exists. "root" is defined as self in the browser or global if on the server.
 */

'use strict';

import Backbone   from './ModuleRuntime.js';
import Parse      from 'parse';

// Establish the root object, `window` (`self`) in the browser, or `global` on the server.
// We use `self` instead of `window` for `WebWorker` support.
const root = (typeof self === 'object' && self.self === self && self) ||
 (typeof global === 'object' && global.global === global && global);

if (typeof root !== 'undefined' && root !== null)
{
   root.Backbone = Backbone;
   root.Parse = Parse;
}
else
{
   throw new Error('Could not find a valid global object.');
}

export default Backbone;