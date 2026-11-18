# labmise.co.uk

Static website for LABMISE. No build step: plain HTML, CSS and JavaScript.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Things to edit

- **Contact email** – search `index.html` for `hello@labmise.co.uk` and replace every occurrence.
- **Client testimonials** – in the "In place of testimonials" section of `index.html`, copy one of the `<figure class="quote">` cards, replace the text with the client's words, and put it first. The dashed "Your testimonial here" card can then be removed.
- **Research figures** – every statistic links to the numbered list in the Sources section at the bottom of `index.html`. If you change or add a figure, add or update its source there.
- **Domain** – the canonical URL, `robots.txt`, `sitemap.xml` and social image all assume `https://labmise.co.uk/`.

## Files

- `index.html` – all page content
- `assets/css/styles.css` – design
- `assets/js/main.js` – menu, tabs, calculator, contact form (opens the visitor's email app; nothing is stored)
- `assets/fonts/` – Geist typeface, self-hosted (SIL Open Font License, see `OFL.txt`)
