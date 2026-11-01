# faresjalled.org

Personal website and CV of Farés Jalled, served with GitHub Pages at
**https://faresjalled.org** (custom domain set in `CNAME`).

## Pages and files

| What | Where |
|---|---|
| CV page (experience, certifications, publications, Learn IT, Support me) | `index.html` |
| Free IT library: one section per book | `learn-it.html` |
| **Settings: visitor counter, visit emails, tipping** | `js/config.js` |
| Site behaviour (menu, counter, emails, tipping buttons, search) | `js/site.js` |
| Site styles | `css/custom.css` (base theme: `css/resume.min.css`) |
| Fonts (self-hosted, no Google Fonts requests) | `fonts/`, `css/fonts.css` |
| Skill logos (local, optimised) | `img/logos/` (credits in `img/logos/CREDITS.md`) |
| Libraries: Bootstrap 4 CSS, Font Awesome 4 | `vendor/` (do not edit) |

## Switching features on

Everything is configured in **`js/config.js`**.

### Visitor counter (GoatCounter, free, no cookies)

1. Sign up at <https://www.goatcounter.com> and choose the code **`faresjalled`**
   (or another code, and put it in `goatcounterCode`).
2. In the GoatCounter dashboard open *Settings* and tick
   **"Allow adding visitor counts on your website"**.
3. Done. The counter appears in the sidebar and footer once it has data. Until then it stays hidden.

GoatCounter's dashboard also shows where visitors come from, which pages they read, and their countries.

### Email for every new visitor (FormSubmit, free)

1. Temporarily set `formsubmitId` in `js/config.js` to your email address, publish, and visit your site once.
2. FormSubmit sends you an activation email. Confirm it.
3. FormSubmit then gives you a random ID for your address. Put that ID in `formsubmitId`
   (so your email address is not visible in the page source) and publish again.

Each visitor (browser) triggers at most one email per `emailEveryHours` (default 24 h), and known bots are skipped.
The email contains the page, where the visitor came from, time, language, time zone and screen size.

### Don't count your own visits

Open **https://faresjalled.org/?owner=on** once in each browser you use. Your visits are then neither counted nor emailed.
`?owner=off` undoes it.

### Tipping ("Buy me a green tea")

- `kofi`: your Ko-fi name (already `jasfar`).
- `paypalMe`: your PayPal.me name, which shows "1 / 3 / 5 teas" PayPal buttons with the amount filled in.
- `githubSponsors`: your GitHub name, once your GitHub Sponsors profile is approved.
- `teaPriceEUR`: the price of one tea for the PayPal buttons.

Empty values hide that option.

## Editing content

### Adding a certification

Copy an existing `<li>` in the `#certifications` list of `index.html` and change the text and link:

```html
<li>
  <i class="fa-li fa fa-trophy text-warning"></i>
  Course name · Provider · Month Year
  <a class="GFG" href="https://link-to-the-credential" target="_blank" rel="noopener">Show credential</a>
</li>
```

### Adding a book to the library

Copy one `<section class="book" ...>` block in `learn-it.html`, give it a new `id`, and change the
title, text and link. The search box picks it up automatically.

### Language levels

Each bar in `#languages` takes one of `basic`, `intermediate`, `advanced`, `expert`
(and `learning`) as a class; the widths are defined in `css/custom.css`.

### Adding a skill logo

Put the image in `img/logos/` (ideally 112 px high, `.svg` or `.webp`) and copy a line of the
`skill-logos` list in `index.html`. Logos are shown 56 px high, so set `height="56"` and a matching `width`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Privacy

The page loads nothing from other servers except the GoatCounter visitor counter (and FormSubmit, if visit emails
are switched on). The Spotify player only loads after a visitor clicks it. Because visits are now counted, consider adding
an Impressum and a privacy notice (Datenschutzerklärung), which German law generally expects on personal sites with
tracking or a donation link.

## Credits

Based on the [Start Bootstrap Resume](https://github.com/StartBootstrap/startbootstrap-resume)
template (MIT licence, see `LICENSE`). Fonts: Open Sans and Saira Extra Condensed (SIL Open Font
License, see `fonts/`). Library books: [GoalKicker](https://books.goalkicker.com/), CC BY-SA.
