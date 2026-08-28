# Roadmap

Notes toward the pieces this module still lacks, and what the research so far
concluded. Recorded because the reasoning is easy to lose and expensive to
rediscover.

## Where this came from

The 2026 rebuild was deliberately scoped to the admin: load a self-hosted Font
Awesome Pro package, tell the core about it, and widen the core icon picker by
injection rather than forking it. No Fieldtype or Inputfield was ever in that
plan. What follows is the extension of it.

To be genuinely useful the module wants three things. It has the first.

1. **Admin styling and icon loading** — done.
2. **An Inputfield**, so icons can be picked for front-end output, Deck cards
   and shortcuts, or anywhere else.
3. **Insertion into a rich text editor** — deferred, see below.

## The lesson that makes an Inputfield cheap

Everything painful about supporting the core picker came from one line in
`InputfieldIcon::setAttribute()`: it validates an assigned value against its own
bundled list and silently blanks anything else. That single behaviour is the
reason this module needs four separate hooks, reflection into a protected
property, and a value-restoring pass on the template and field editors.

`baumrock/RockIcons` sidesteps all of it:

```php
class InputfieldRockIcons extends InputfieldText implements InputfieldHasTextValue
```

No list, no validation, nothing to wipe — the value is just a string. A picker
built this way needs none of the machinery in `addIconHooks()`. It also means
the field can be swapped for any other icon inputfield without a migration,
because what is stored is plain text either way.

## Reference modules

**`baumrock/RockIcons`** — active, MIT since January 2026. Inputfield only, no
Fieldtype. Discovers icons by globbing `.svg` files under
`/site/templates/RockIcons/<set>/`, and its config points at Font Awesome,
Tabler, Solar and icones.js.org as sources. Worth knowing that it is an **SVG**
picker: using it for Font Awesome means shipping thousands of SVG files rather
than using the webfont already loaded here. Different architecture, not a
drop-in, but the Inputfield pattern above is worth copying.

**`baumrock/RockAwesome`** — Fieldtype plus Inputfield, Font Awesome specific,
last commit January 2024. Superseded by RockIcons.

## Keeping the picker decoupled

A picker should not have to know about this module, and this module should not
have to know about any picker. The seam already exists: `$config->adminIcons` is
core-owned, is already published to `ProcessWire.config.adminIcons`, and already
carries `type` and `version`. One more key is enough:

```php
$config->adminIcons = ['type' => 'fa', 'version' => '7.3.1', 'listUrl' => '…'];
```

Whoever holds the icons publishes a URL; whoever draws a picker reads it, and
falls back to the core list when it is absent. That lets the same picker serve
Font Awesome, Lucide, Tabler or a Kit with no cross-references, and it is worth
raising with Ryan before settling on a key name, since the structure is his.

Sizing, measured against Font Awesome Pro 7.3.1: 5407 names is 94.6KB of JSON,
**21.8KB gzipped**. Too heavy to inline on every admin request, fine as a URL
fetched when a picker opens.

## Why not reuse the core picker

For the record, since it looks like the obvious shortcut. The core picker puts
every option in the DOM at page load and builds a tile for each on first search:

| | page HTML | `<option>` elements |
|---|---|---|
| extended | 431KB | 5430 |
| core only | 238KB | 1918 |

That is ~193KB of extra HTML on every page carrying an icon field, paid whether
or not anyone opens the picker, plus a one-off build of 5407 DOM nodes on the
first keystroke. Fetching on demand and rendering only matches avoids both.

The core picker also mis-renders newer brand icons, because ProcessWire chooses
the prefix from a hardcoded list of brand names — 495 of them against Font
Awesome 7.3.1's 609. This module works around that with a font-family fallback,
but a purpose-built picker would simply read the package and know.

## Rich text insertion — deferred

The hardest of the three and the least settled. Options, roughly in order of
increasing cost:

- **Textformatter with a placeholder.** Safest, and one already exists in the
  modules directory. Needs a way to insert and preview before inserting, even if
  what you see while editing is only a text token.
- **A CKEditor 6 plugin.** One exists in the CKEditor plugin directory. Building
  one coordinated with this module would let the icon list match exactly what is
  installed, which a generic plugin cannot do.
- Building and bundling CKEditor plugins in ProcessWire is its own undertaking;
  worth treating as a separate project rather than part of this module.

A Lucide picker for CKEditor already exists in-house (RivertownSolar), so the
interaction design is at least a solved problem even if the plumbing is not.
