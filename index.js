import glue from './src/glue.js';
import ilib from './ilib/lib/ilib.js';

// ensure the locale-specific date types are included and registered
import './src/dates.js';

ilib.enyo = glue;
ilib.enyo.version = '2.7.0';

export default ilib;
