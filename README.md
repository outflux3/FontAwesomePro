# Font Awesome Pro for ProcessWire

Loads a self-hosted Font Awesome Pro package in the ProcessWire admin, in place of
the Font Awesome that ships with the core — so the admin gets the full Pro icon
set, the Light/Thin/Sharp/Duotone styles, and an icon picker that offers all of
them.

The package lives outside the module, in `/site/templates/FontAwesome/`. Updating
Font Awesome and updating this module are separate acts: neither one disturbs the
other, and a ProcessWire core upgrade touches neither.

Requires ProcessWire 3.0.265 or newer, which is where `$config->adminIcons` was
introduced.

## Install

1. Download the Font Awesome **web** package from your Font Awesome account.
2. Unzip it into `/site/templates/FontAwesome/`, so that `css/` and `webfonts/`
   sit directly inside:

   ```
   site/templates/FontAwesome/
   ├── css/
   └── webfonts/
   ```

   You can instead leave the release directory intact —
   `site/templates/FontAwesome/fontawesome-pro-7.3.1-web/css/…` — which lets a
   newer release be unzipped alongside the old one and switched from the module
   config. Either layout is detected automatically.

3. **Delete `js/` and `metadata/` from the unzipped package.** Neither is used —
   this module loads web fonts, not the SVG framework — and together they are
   over 250MB of the download.
4. Install the module and pick your default icon style.

Nothing else is version-specific. The module reads the version, the available
styles and the icon list back off the files, so a future Font Awesome release is
a matter of unzipping it.

## Keep it out of your repository

Font Awesome Pro is commercially licensed. Add this to your site `.gitignore`:

```
/site/templates/FontAwesome/
```

The module's config screen warns if it cannot find a `.gitignore` covering it.

## Configuration

| Setting | Notes |
|---|---|
| **Package** | Only shown when more than one package is present. Switching is how you roll a Font Awesome update forward or back. |
| **Default icon style** | The style the admin's own icons are drawn in — page and template icons, buttons, navigation. Listed from the styles actually present in your package. Brands is excluded: it is a separate font rather than a style, and has its own option below. |
| **Additional styles to load** | Loaded alongside the default so you can use them in your own markup. Each one adds a web font to every admin page load. |
| **Load brand icons** | Brands live in their own font and belong to no style. |
| **Load version 4 shims** | Keeps older icon names working, including the `-o` outline names still emitted by the core and by third-party modules. On by default. |
| **Compatible icon width** | Font Awesome 7 makes every icon a fixed `1.25em` wide, where 4 and 6 sized to the glyph and left `fa-fw` to opt in. On by default, which keeps the admin's existing spacing. Only shown for Font Awesome 7 and newer. |
| **Replace the core Font Awesome** | On by default. Unchecked, the core stylesheets still load but are moved ahead of these so the Pro styles still win. |
| **Disable loading** | Turns the module off without uninstalling it. |
| **Rebuild icon cache** | The picker's icon list is parsed out of the package's `all.css` and cached, keyed on the package path and that file's modification time — so replacing or updating a package rebuilds it on its own. Only needed if you edited a stylesheet inside the package in place, or the picker is offering a list that no longer matches what is installed. |

### Reading the Status panel

The top of the config screen reports what the module actually did, not what it
should do. The rows worth knowing:

- **Loaded now** — the package stylesheets queued for the page you are looking
  at. Empty means the module did not run or found no package.
- **Core Font Awesome** — measured on the *previous* admin page view, because the
  theme appends its stylesheets after this form is built. Reload once to refresh
  it. A red warning here names the exact stylesheet that survived into the page
  and is overriding this package; that is the cause of blank-box icons.
- **Site icon version** — `$config->adminIcons['version']` as the site had it
  before this module intervened. AdminThemeUikit loads **Font Awesome 4** whenever
  this is below 6, so a site pinning it to `4` in `site/config.php` will keep
  pulling the core's 4.7 stylesheet in alongside this package.
- **Icon font** — the family the icons resolve to and the stylesheet that
  declares it. If this goes red, no style stylesheet is loaded and every icon
  will render as an empty box.
- **Another Font Awesome** — appears only when something else on the page loads
  its own copy. Names the exact file.
- **Reported to core** — the value this module set it to, which is what decides
  whether the admin emits Font Awesome 4 or 6+ class names.

## How it works

**Replacing the core stylesheets.** The admin themes append their Font Awesome
`<link>` at render time and echo it in the same file, with no hook in between, so
there is nowhere to remove it from. The module swaps `$config->styles` for a
`FilenameArray` subclass that intercepts core Font Awesome as it is added. That
covers AdminThemeUikit, AdminThemeDefault and AdminThemeReno.

A theme or module that writes its own `<link>` into the head never passes through
`$config->styles`, so the rendered markup is checked as a backstop and any
surviving core Font Awesome `<link>` removed there. This matters more than it
sounds: one core stylesheet loading *after* this module's is enough to take over
every icon, because its rules are later and equally specific. The visible symptom
is not an error but icons quietly rendering from the wrong Font Awesome version —
icons that exist in both versions look fine, while anything newer than the core's
copy renders as an empty box. The **Status** panel reports whether that is
happening.

**Telling the core what is loaded.** Since 3.0.265 every icon code path branches
on `$config->adminIcons['version']` — `wireIconMarkup()` picks between Font
Awesome 4 and 6+ class conventions, `ProcessWire.icon()` does the same in JS, and
`InputfieldIcon` chooses its bundled icon list. The module sets it to the version
it found on disk, which is what makes the rest of the admin agree with the
package.

**Redirecting the default style.** The core emits `<i class='fa fa-home'>` or
`<i class='fas fa-home'>`, both pinned to solid. Generated CSS reassigns the
`--fa-style` and `--fa-family` custom properties the base `.fa` rule reads, so
the whole admin follows the style you chose.

That CSS also redirects every style class whose stylesheet is *not* loaded. Font
Awesome puts each style's `@font-face` in that style's own file, so with Sharp
Solid selected the class `fas` names `"Font Awesome 7 Pro"` — a family with no
font behind it. `fab` is deliberately left out: brand glyphs exist in no other
font, so redirecting them would break them.

**Winning the cascade.** The generated CSS is prefixed `html body`, and the exact
amount of that prefix is load-bearing. Admin modules may inject a stylesheet
*after* the page has loaded — AdminOnSteroids pulls in the core Font Awesome 4
for its own pseudo-element icons — and nothing rendered server-side can come
later in the cascade than that, so ordering alone cannot win. Two elements and
one class out-ranks their bare `.fa` regardless of order, while still losing to
any two-class rule.

That last part is why this is not `!important`. `v4-shims.css` redirects Font
Awesome 4 style brand markup with `.fa.fa-trello`, and `!important` would beat
those too, forcing brand icons into a font that has no brand glyphs.

Two further rules follow from the same problem:

- Font Awesome 4 names each glyph per icon (`.fa-envelope-o::before { content:
  "\f003" }`) where Font Awesome 7 reads it from a custom property. Both
  selectors are `(0,1,1)`, so a tie goes to whichever loaded last. The version 7
  rule is restated with two elements in front to settle it by specificity.
- The shims pin the outline names to `"Font Awesome 7 Pro"` at weight 400, which
  assumes the classic regular stylesheet is loaded. It usually isn't. Their
  `.fa.fa-name` selectors deliberately out-rank the general rule, so each is
  restated against the family that *is* loaded — keeping weight 400 where a
  regular face of that family is available, so the outline names still mean
  "outline".

**The icon picker.** The core `InputfieldIcon` validates against its own bundled
list and silently blanks anything it does not recognise — which is every Pro-only
icon. Rather than fork it, the module merges the Pro list into each instance at
the points the core makes hookable. Font Awesome Pro 7.3.1 offers 5407 icon names
where the core's own list has 1895.

## Using Pro icons in your own forms

If your module builds an `InputfieldIcon` itself *and* assigns a Pro-only value,
widen it first — otherwise the core blanks the value before this module ever sees
the field:

```php
$f = $modules->get('InputfieldIcon');
$modules->get('FontAwesomePro')->extendIconInputfield($f);
$f->attr('value', 'fa-alarm-clock');
```

Template and field icons, which are where icons are normally chosen, are handled
already and need nothing.

## API

```php
$fa = $modules->get('FontAwesomePro');

$fa->version();               // '7.3.1'
$fa->isPro();                 // true
$fa->root();                  // ['name'=>…, 'path'=>…, 'url'=>…, 'version'=>…]
$fa->families();              // ['brands', 'duotone', 'light', 'sharp-solid', …]
$fa->styles();                // as above, minus brands — the selectable styles
$fa->defaultStyle();          // the style actually in use, never blank
$fa->icons();                 // ['fa-0', 'fa-1', …] every name in the package
$fa->fontFamilyName('solid'); // 'Font Awesome 7 Pro'
$fa->cssUrl('all');           // URL to css/all.css, cache-busted by version
```

## Known limitations

- **Outline names follow the default weight.** The `-o` names are redirected to
  the loaded family; where no regular face of it is loaded they take the default
  weight rather than staying Regular, because a weight with no font behind it
  renders nothing at all.
- **Another module's Font Awesome is reported, not removed.** Stripping a
  stylesheet another module depends on would break that module, so the Status
  panel names it and leaves the decision to you. The generated CSS is written to
  win the cascade against one regardless.
- **Web fonts only.** The SVG/JS framework is not supported. It fights
  ProcessWire's server-rendered `<i class='fa …'>` markup, and the web fonts
  cover every family.
- **Admin only.** Front-end templates can link the same files directly; use
  `$fa->cssUrl()` rather than hardcoding a path.

## Testing

`site/_dev-tests/fa-matrix.php` verifies the module against the package on disk
and against the Font Awesome the core ships:

```
php fa-matrix.php detect          # detection and icon parsing
php fa-matrix.php run --themes    # admin render, all three core themes
php fa-matrix.php icons           # icon picker
php fa-matrix.php clean           # restore
```
