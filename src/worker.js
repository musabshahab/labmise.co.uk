// LABMISE Worker: static site + contact form endpoint.
// Requests that match a file in ./public are served directly by Cloudflare and never reach
// this code. Everything else lands here.

const MAX = { name: 120, company: 160, email: 254, message: 5000 };
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const clean = (value, max) =>
  String(value ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max);

// Header values must be a single line.
const oneLine = (value) => value.replace(/\s+/g, ' ').trim();

async function turnstileOk(token, secret, ip) {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}

async function handleContact(request, env) {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' });

  // Only accept submissions made from this site.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json(403, { ok: false, error: 'Forbidden.' });
  }

  let data;
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json(400, { ok: false, error: 'Could not read the form.' });
  }

  // Honeypot: real visitors never see or fill this field. Pretend it worked.
  if (clean(data.website, 200)) return json(200, { ok: true });

  const name = oneLine(clean(data.name, MAX.name));
  const company = oneLine(clean(data.company, MAX.company));
  const email = oneLine(clean(data.email, MAX.email));
  const message = clean(data.message, MAX.message);

  if (!name || !message || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'Please give your name, a valid email address and a message.' });
  }

  if (env.TURNSTILE_SECRET) {
    const token = clean(data['cf-turnstile-response'], 4096);
    const passed = await turnstileOk(token, env.TURNSTILE_SECRET, request.headers.get('cf-connecting-ip'));
    if (!passed) return json(400, { ok: false, error: 'Spam check failed. Please try again.' });
  }

  if (!env.EMAIL || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('Contact form is not configured: need EMAIL binding, CONTACT_TO and CONTACT_FROM.');
    return json(503, { ok: false, error: 'The form is not set up yet. Please email us instead.' });
  }

  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: 'LABMISE website' },
      replyTo: email,
      subject: `Automation enquiry — ${company || name}`,
      text: `${message}\n\n—\nName: ${name}\nCompany: ${company || '(not given)'}\nEmail: ${email}\n\nSent from the contact form on ${new URL(request.url).host}`,
    });
  } catch (err) {
    console.error('Email send failed:', err && err.code, err && err.message);
    return json(502, { ok: false, error: 'We could not send your message. Please email us instead.' });
  }

  return json(200, { ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);
    // Anything else that is not a file in ./public: let the asset server answer (404).
    return env.ASSETS.fetch(request);
  },
};
