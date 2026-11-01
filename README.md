# faresjalled.org

Personal website and CV of Farés Jalled, served with GitHub Pages at
**https://faresjalled.org** (custom domain set in `CNAME`).

## Editing

It is a single static page, so no build step is needed:

| What | Where |
|---|---|
| Page content (experience, certifications, publications, ...) | `index.html` |
| Site-specific styles (colours, language bars, buttons, Support box) | `css/custom.css` |
| Base theme styles | `css/resume.min.css` |
| Smooth scrolling, active menu item, language bar animation | `js/resume.min.js` (readable copy in `js/resume.js`) |
| Images and logos | `img/` |
| Third-party libraries (Bootstrap 4, jQuery, Font Awesome 4) | `vendor/`, do not edit, so they can be upgraded safely |

### Adding a certification

Copy an existing `<li>` in the `#certifications` list and change the text and link:

```html
<li>
  <i class="fa-li fa fa-trophy text-warning"></i>
  Course name · Provider · Month Year
  <a class="GFG" href="https://link-to-the-credential" target="_blank" rel="noopener">Show credential</a>
</li>
```

### Language levels

Each bar in `#languages` takes one of `basic`, `intermediate`, `advanced`, `expert`
(and `learning`) as a class; the widths are defined in `css/custom.css`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Credits

Based on the [Start Bootstrap Resume](https://github.com/StartBootstrap/startbootstrap-resume)
template (MIT licence, see `LICENSE`).
