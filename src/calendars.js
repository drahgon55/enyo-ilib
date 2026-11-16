/**
 * Registers iLib's calendar and date classes with the synchronous registries
 * that `CalendarFactory` and `DateFactory` read.
 *
 * iLib used to populate those registries with a computed require:
 *
 *     Calendar._constructors[name] = require("./" + entry + "Cal.js");
 *
 * ES modules have no synchronous dynamic import, and the registries are read
 * synchronously, so the classes have to be imported statically and registered
 * ahead of time. Doing that inside `CalendarFactory` creates a circular import
 * -- `HanCal` reaches `CalendarFactory` again through `Astro`, `GregorianDate`
 * and `TimeZone` -- so the registration lives here instead, in a module that
 * nothing inside `ilib/lib` imports. The graph stays acyclic.
 *
 * The cost is that all ten calendars load eagerly rather than on first use.
 *
 * @module enyo-ilib/calendars
 */

import Calendar from "../ilib/lib/Calendar.js";
import IDate from "../ilib/lib/IDate.js";

import CopticCal from "../ilib/lib/CopticCal.js";
import EthiopicCal from "../ilib/lib/EthiopicCal.js";
import GregorianCal from "../ilib/lib/GregorianCal.js";
import HanCal from "../ilib/lib/HanCal.js";
import HebrewCal from "../ilib/lib/HebrewCal.js";
import IslamicCal from "../ilib/lib/IslamicCal.js";
import JulianCal from "../ilib/lib/JulianCal.js";
import PersianCal from "../ilib/lib/PersianCal.js";
import PersianAlgoCal from "../ilib/lib/PersianAlgoCal.js";
import ThaiSolarCal from "../ilib/lib/ThaiSolarCal.js";

import CopticDate from "../ilib/lib/CopticDate.js";
import EthiopicDate from "../ilib/lib/EthiopicDate.js";
import GregorianDate from "../ilib/lib/GregorianDate.js";
import HanDate from "../ilib/lib/HanDate.js";
import HebrewDate from "../ilib/lib/HebrewDate.js";
import IslamicDate from "../ilib/lib/IslamicDate.js";
import JulianDate from "../ilib/lib/JulianDate.js";
import PersianDate from "../ilib/lib/PersianDate.js";
import PersianAlgoDate from "../ilib/lib/PersianAlgoDate.js";
import ThaiSolarDate from "../ilib/lib/ThaiSolarDate.js";

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
