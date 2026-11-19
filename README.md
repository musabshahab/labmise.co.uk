# labmise.co.uk

Website for LABMISE, hosted on Cloudflare Workers. The site itself is plain HTML, CSS and
JavaScript in `public/`; a small Worker in `src/worker.js` handles the contact form.

## Layout

- `public/index.html` – all page content
- `public/assets/css/styles.css` – design
- `public/assets/js/main.js` – menu, tabs, calculator, contact form, booking
- `public/assets/fonts/` – Geist typeface, self-hosted (SIL Open Font License, see `OFL.txt`)
- `src/worker.js` – `/api/contact`: validates the form and emails the enquiry
- `wrangler.jsonc` – Cloudflare configuration

## Deploying

Cloudflare builds and deploys from GitHub on every push. Leave the build command empty; the
deploy command is `npx wrangler deploy`.

## Cloudflare settings the contact form needs

1. **DNS** – `labmise.co.uk` must use Cloudflare's nameservers.
2. **Email Service** – in the dashboard, set up Email Routing for the domain and add the inbox
   that should receive enquiries as a *verified destination address*.
3. **Secret `CONTACT_TO`** – on the Worker, under Settings → Variables and Secrets, add a secret
   named `CONTACT_TO` containing that inbox address.
4. *(Optional)* **Turnstile spam check** – create a Turnstile widget, add its secret key as a
   Worker secret named `TURNSTILE_SECRET`, and paste its site key into `data-turnstile-sitekey`
   on the contact form in `public/index.html`. Do both or neither.

Enquiries are sent from `website@labmise.co.uk` (the `CONTACT_FROM` value in `wrangler.jsonc`)
with the visitor's address as reply-to. Until `CONTACT_TO` is set, the form shows a message
asking visitors to email instead.

## Things to edit

- **Contact email** – search `public/` for `hello@labmise.co.uk` and replace every occurrence.
- **Booking** – paste your Cal.com or Calendly link into `data-booking-url` on the `#book`
  section of `public/index.html`. The section and its "Book a call" links stay hidden until then.
- **Client testimonials** – in the "In place of testimonials" section, copy one of the
  `<figure class="quote">` cards, replace the text with the client's words, and put it first.
  The dashed "Your testimonial here" card can then be removed.
- **Research figures** – every statistic links to the numbered Sources list at the bottom of
  the page. If you change or add a figure, update its source there.

## Run locally

```bash
npx wrangler dev
```

To exercise the form locally, create a `.dev.vars` file containing `CONTACT_TO=you@example.com`.
Emails are simulated locally, not sent.
