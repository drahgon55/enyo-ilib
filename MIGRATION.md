# enyo-ilib 2.7.0 — CommonJS to native ES modules

This branch (`esm`, cut from tag `2.7.0`) converts enyo-ilib to native ES
modules, so it loads in a browser from `<script type="module">` with no bundler.
It is the fourth of four: [enyo](https://github.com/drahgon55/enyo/tree/esm),
[onyx](https://github.com/drahgon55/onyx/tree/esm) and
[layout](https://github.com/drahgon55/layout/tree/esm) came first, and enyo's
`MIGRATION.md` is the fullest account of the shared recipe.

To see it work, serve a directory **above** the checkout, because the harness
resolves both `enyo/` and `enyo-ilib/` through an import map:

```bash
python3 test-esm/serve.py 8791 /path/to/the/folder/holding/these/checkouts
```

then <http://localhost:8791/enyo-ilib/test-esm/index.html>.

## What this package actually is

The brief for this conversion described the repository as mostly "ilib locale
data." It is worth stating what it really contains, because it changes the size
of the job by two orders of magnitude:

| | |
| --- | --- |
| `ilib/locale/` | **3556 JSON files** — this *is* the locale data, and it needs nothing |
| `ilib/lib/` | **106 CommonJS modules** — the vendored iLib library itself |
| `src/` | 4 modules of enyo glue |
| `index.js` | the package entry point |

`src/glue.js` and `src/dates.js` import 18 modules directly out of `ilib/lib`,
so converting only the enyo-facing files would have left those imports pointing
at CommonJS a browser cannot load. The real scope was ~110 files, not 4.

**This forks vendored iLib.** Future upstream iLib updates will need converting
again. The alternative was a package that cannot load without a bundler, which
defeats the purpose, so the cost is accepted here — but it is a real cost and
the one thing in these four repositories that will age badly.

## The conversion

iLib made two things easy. Its specifiers already carry the extension —
`require("./Locale.js")` — so **no path rewriting was needed at all**; and the
dependency graph over all 500 code requires is acyclic. 457 of the 466 requires
and 101 of the 107 exports were therefore a one-line rewrite.

Five files needed judgement rather than a codemod.

### The computed requires

`CalendarFactory` and `DateFactory` filled a **synchronous** constructor
registry with a computed specifier:

```js
Calendar._constructors[name] = require("./" + entry + "Cal.js");
```

ES modules have no synchronous dynamic import, and the registry is read
synchronously, so the classes have to be registered ahead of time.

The first attempt imported them into `CalendarFactory` — and created a cycle.
`HanCal` reaches `CalendarFactory` again through `Astro`, `GregorianDate` and
`TimeZone`, so any edge from the factory to a calendar class closes the loop.
`test-esm/check-cycles.mjs` caught it immediately and named the seven-module
SCC.

Registration now lives in `src/dates.js`, which nothing under `ilib/lib`
imports, so the graph stays acyclic. `src/dates.js` already existed to force the
ten `Date` classes to load, and `index.js` already imported it, so the
registration belongs there rather than in a new module. The factories are left
as plain lookups. The cost is that all ten calendars load eagerly rather than on
first use — which is what `DateFactory`'s own comment already asked for:
*"Statically depend on these even though we don't use them to guarantee they are
loaded into the cache already."*

### The path macro — where ES modules win

`glue.js` set the root for all locale-data loading to:

```js
this.base = '@../ilib/';
```

`@` is an **enyo-dev build-time path macro**. Nothing in enyo resolves it at
runtime (`path.js` and `pathResolver.js` do not mention it), so without the
bundler it stays a literal string and no locale data loads at all. ES modules
answer this natively:

```js
this.base = new URL('../ilib/', import.meta.url).href;
```

That is the absolute URL of the `ilib/` directory next to `glue.js`, with no
build step and nothing to configure. **This is the only place across the four
repositories where the module system expresses something the CommonJS version
needed a build for**, rather than the other way round.

The locale data itself is unaffected: 3556 JSON files fetched over `enyo/Ajax`
at runtime, exactly as before. Because the data is *fetched* rather than
imported, a check on module state can pass while nothing loaded — see
Verification.

### The other three

- **`ilib.js`** exported from inside `if (typeof(module) !== 'undefined')`,
  which `export` may not appear in. It now sets `ilib.ilib = ilib` for the
  backwards-compatible alias and default-exports at the end of the file, since
  the rest of the file keeps adding to the object.
- **`ZoneInfo.js`** imported `PackedBuffer` only on nodejs and qt through a
  conditional require; that is a plain static import now. Its qt branch reads
  `ilib` through a static import instead of a require.
- **`NodeLoader.js`** is converted but keeps `fs` and `util` as bare Node
  specifiers, so it does not resolve in a browser. Nothing in the package
  imports it, so this is harmless; it is excluded from the cycle check and from
  the cold-load harness, and `test-esm/gen-modules.js` says why.

## What was lost

**`ZoneInfo`'s nodejs path no longer works.** It needed `require("fs")` inside a
platform switch. `fs` cannot be imported statically without making the module
unresolvable in a browser, and ES modules have no synchronous require, so that
branch now throws a message pointing here. The browser branch below it —
`XMLHttpRequest`, which is the one this package uses — is untouched.

This is the first genuine capability loss across the four repositories. It does
not affect browser use, and it is not worth distorting the package to avoid, but
it is a regression and not a cosmetic one.

`src/zoneinfo.js` also loses its `typeof(require('enyo'))` platform test, which
cannot work in a module. That one costs nothing: the `case "enyo"` branch it
selected is commented out in the source, so it fell through to the browser path
regardless.

## Import map: two entries, not one

```html
<script type="importmap">
{ "imports": {
	"enyo/": "/enyo/",
	"enyo-ilib": "/enyo-ilib/index.js",
	"enyo-ilib/": "/enyo-ilib/"
} }
</script>
```

`"enyo-ilib/"` is a *prefix* mapping and does **not** resolve the bare specifier
`enyo-ilib`, which is exactly what `import 'enyo-ilib';` is — the form onyx's
i18n modules use. Without the first entry the browser reports
`Failed to resolve module specifier "enyo-ilib"`. This did not arise in the
other three packages because nothing imports them bare.

Note the doubled path for anything inside iLib:
`enyo-ilib/ilib/lib/DateFmt.js`, because the vendored library sits in an `ilib/`
directory inside the package.

## Verification

Static:

- No `require(` or `module.exports` in `src/`, `ilib/lib` or `index.js`.
- Every file parses as an ES module.
- `node test-esm/check-cycles.mjs` — 110 modules, 493 static imports, no
  cycles. Proven in both directions: re-adding the `CalendarFactory → HanCal`
  import makes it name a five-module cycle and exit 1.

In a browser (Chrome, served by `test-esm/serve.py`): `test-esm/index.html`,
**13/13**. Every check asserts an effect rather than a resolution, because for
this package in particular almost everything can link successfully and still do
nothing:

- `import 'enyo-ilib'` is a side-effect import, so the check is that
  `ilib.enyo.version` is set and the ten calendars are *registered*, not that
  the import resolved.
- Registration is proven by `DateFactory` actually constructing all ten types,
  not by the registry being populated.
- The path macro is proven by `DateFmt` formatting `11/16/26` from fetched data
  and by 22 successful requests under `ilib/locale/`, not by inspecting `base`.

Both substantive changes were confirmed to fail when reverted, and they fail
**different** checks, so the two concerns are independently covered:

| broken on purpose | result |
| --- | --- |
| `this.base` back to `'@../ilib/'` | FAIL ×3, ending in *"No formats available for calendar gregorian in locale en-US"* — no data loads |
| `import './src/dates.js'` removed from `index.js` | FAIL ×4 — nine of ten calendars unregistered, `DateFactory` cannot construct them |

### A clean console is not achievable here

Every load produces about twenty 404s to `/resources/...` at the document root.
That is `glue.js`:

```js
this._loadManifest('', 'resources'); // the app's resources dir
```

iLib deliberately probing an app-level override directory. It is pre-existing,
unrelated to this conversion, and a *library* has no business shipping a stub
manifest to silence it. So the harness asserts it positively — *"the only
failing requests are the app-resources probe"*, with every request under
`ilib/locale/` required to return 200 — rather than filtering those URLs out of
a clean-console assertion. An exclusion would have made any other failing
request invisible too.

## Still outstanding

- **The cold-load page has not been run yet.** `test-esm/all-modules.html` and
  `load-one.html` are in place and import each of the 110 modules in a document
  of its own, but browser tooling became unavailable before that run. The static
  cycle check covers the same failure mode deterministically and is clean.
- **onyx's two i18n modules** (`src/i18n/DatePicker.js`, `src/i18n/TimePicker.js`)
  still carry bare `enyo-ilib` specifiers, pending the rewrite in that
  repository. Their three specifiers resolve to `enyo-ilib/index.js`,
  `enyo-ilib/ilib/lib/DateFmt.js` and `enyo-ilib/ilib/lib/DateFactory.js`.
- **`.jshintrc` and the gulp lint task** are stale here for the same reason as
  in the other three repositories: jshint cannot parse `import`/`export`.
- **`nodeglue.js`** is left alone. It is the Node entry point and was already
  broken before this branch — it requires `./ilib/js/ilib-dyn-full.js`, a
  prebuilt bundle that is not in the repository, and `./zoneinfo.js` at a path
  that does not exist.
