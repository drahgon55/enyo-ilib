/**
 * ilib doesn't load the non-Gregorian calendars and dates initially. These imports pull each
 * Date in (which in turn imports the relevant Calendar), and register both with the synchronous
 * registries that DateFactory and CalendarFactory read.
 *
 * ilib used to fill those registries with a computed require:
 *
 *     IDate._constructors[name] = require("./" + entry + "Date.js");
 *
 * ES modules have no synchronous dynamic import and the registries are read synchronously, so the
 * classes are imported statically and registered here. Registering from inside CalendarFactory
 * instead would make the graph circular -- HanCal reaches CalendarFactory again through Astro,
 * GregorianDate and TimeZone -- and nothing under ilib/lib imports this module, so it stays
 * acyclic. The cost is that all ten calendars load eagerly rather than on first use.
 *
 * @module enyo-ilib/dates
 */

import Calendar from '../ilib/lib/Calendar.js';
import IDate from '../ilib/lib/IDate.js';

import CopticCal from '../ilib/lib/CopticCal.js';
import EthiopicCal from '../ilib/lib/EthiopicCal.js';
import GregorianCal from '../ilib/lib/GregorianCal.js';
import HanCal from '../ilib/lib/HanCal.js';
import HebrewCal from '../ilib/lib/HebrewCal.js';
import IslamicCal from '../ilib/lib/IslamicCal.js';
import JulianCal from '../ilib/lib/JulianCal.js';
import PersianCal from '../ilib/lib/PersianCal.js';
import PersianAlgoCal from '../ilib/lib/PersianAlgoCal.js';
import ThaiSolarCal from '../ilib/lib/ThaiSolarCal.js';

import CopticDate from '../ilib/lib/CopticDate.js';
import EthiopicDate from '../ilib/lib/EthiopicDate.js';
import GregorianDate from '../ilib/lib/GregorianDate.js';
import HanDate from '../ilib/lib/HanDate.js';
import HebrewDate from '../ilib/lib/HebrewDate.js';
import IslamicDate from '../ilib/lib/IslamicDate.js';
import JulianDate from '../ilib/lib/JulianDate.js';
import PersianDate from '../ilib/lib/PersianDate.js';
import PersianAlgoDate from '../ilib/lib/PersianAlgoDate.js';
import ThaiSolarDate from '../ilib/lib/ThaiSolarDate.js';

var calendars = {
	"coptic":       CopticCal,
	"ethiopic":     EthiopicCal,
	"gregorian":    GregorianCal,
	"han":          HanCal,
	"hebrew":       HebrewCal,
	"islamic":      IslamicCal,
	"julian":       JulianCal,
	"persian":      PersianCal,
	"persian-algo": PersianAlgoCal,
	"thaisolar":    ThaiSolarCal
};

var dates = {
	"coptic":       CopticDate,
	"ethiopic":     EthiopicDate,
	"gregorian":    GregorianDate,
	"han":          HanDate,
	"hebrew":       HebrewDate,
	"islamic":      IslamicDate,
	"julian":       JulianDate,
	"persian":      PersianDate,
	"persian-algo": PersianAlgoDate,
	"thaisolar":    ThaiSolarDate
};

var name;
for (name in calendars) {
	if (!Calendar._constructors[name]) Calendar._constructors[name] = calendars[name];
}
for (name in dates) {
	if (!IDate._constructors[name]) IDate._constructors[name] = dates[name];
}

export default {calendars: calendars, dates: dates};
