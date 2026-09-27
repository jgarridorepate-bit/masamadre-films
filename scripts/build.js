#!/usr/bin/env node
/*
 * Build step: generates real, crawlable static pages from content/*.json
 * on top of the single-page app in index.html.
 *
 * Output (all generated, safe to delete — regenerated on every build):
 *   /en/index.html                        English homepage
 *   /proyectos/{slug}/index.html          Spanish project page
 *   /en/proyectos/{slug}/index.html       English project page
 *   /sitemap.xml
 *   /robots.txt
 *
 * Runs on every Netlify build (including ones triggered by the CMS),
 * so these pages are always in sync with content/projects.json,
 * content/about.json and content/contact.json.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var SITE = 'https://masamadrefilms.com';

function readJSON(p) { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }

// ---------- same slug logic as index.html, kept in sync on purpose ----------
function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function paras(s) { return String(s || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); }

function loadProjects() {
  var used = {};
  var raw = readJSON('content/projects.json').projects || [];
  return raw.filter(function (r) { return r && r.title && r.published !== false; }).map(function (r) {
    var slug = slugify(r.slug || r.title) || 'proyecto', n = 2, base = slug;
    while (used[slug]) slug = base + '-' + (n++);
    used[slug] = true;
    return {
      slug: slug,
      title: r.title,
      image: r.image || '',
      short: { es: r.short_es || '', en: r.short_en || r.short_es || '' },
      synopsis: { es: paras(r.synopsis_es), en: (paras(r.synopsis_en).length ? paras(r.synopsis_en) : paras(r.synopsis_es)) }
    };
  });
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function absImg(src) {
  if (!src) return SITE + '/img/landing-1920.webp';
  if (/^https?:/.test(src)) return src;
  return SITE + '/' + src.replace(/^\/+/, '');
}

var TEMPLATE = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Replaces the single-instance tags in <head> that carry per-page metadata.
function withMeta(html, m) {
  html = html.replace(/<html lang="es">/, '<html lang="' + m.lang + '">');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(m.title) + '</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(m.description) + '">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(m.title) + '">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(m.description) + '">');
  html = html.replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + esc(m.image) + '">');
  html = html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + esc(m.canonical) + '">');
  html = html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + esc(m.canonical) + '">');
  // Strip any existing hreflang block from the source (root index.html carries its own) and re-add ours.
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, '');
  var extra = '<base href="' + SITE + '/">\n' +
    m.hreflang.map(function (a) { return '<link rel="alternate" hreflang="' + a.hreflang + '" href="' + a.href + '">'; }).join('\n') + '\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    (m.forceLang ? '<script>window.__FORCE_LANG=' + JSON.stringify(m.forceLang) + ';</script>\n' : '') +
    (m.forceHash ? '<script>if(!location.hash) location.hash=' + JSON.stringify(m.forceHash) + ';</script>\n' : '');
  html = html.replace('</head>', extra + '</head>');
  return html;
}

function writeFile(rel, content) {
  var full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function main() {
  var projects = loadProjects();
  var urls = []; // { loc, alternates: [{hreflang, href}] }

  // ES homepage keeps living at index.html (source-controlled) — nothing to generate.
  urls.push({ loc: SITE + '/', alternates: [{ hreflang: 'es', href: SITE + '/' }, { hreflang: 'en', href: SITE + '/en/' }, { hreflang: 'x-default', href: SITE + '/' }] });

  // EN homepage — same app shell, forced to English, no project pre-selected.
  var enHome = withMeta(TEMPLATE, {
    lang: 'en',
    title: 'Masamadre Films — Genre film production, Madrid',
    description: 'Masamadre Films is an independent production company based in Madrid, focused on genre and horror film.',
    image: SITE + '/img/landing-1920.webp',
    canonical: SITE + '/en/',
    forceLang: 'en',
    hreflang: [
      { hreflang: 'es', href: SITE + '/' },
      { hreflang: 'en', href: SITE + '/en/' },
      { hreflang: 'x-default', href: SITE + '/' }
    ]
  });
  writeFile('en/index.html', enHome);

  projects.forEach(function (p) {
    var esUrl = SITE + '/proyectos/' + p.slug + '/';
    var enUrl = SITE + '/en/proyectos/' + p.slug + '/';
    var hreflang = [
      { hreflang: 'es', href: esUrl },
      { hreflang: 'en', href: enUrl },
      { hreflang: 'x-default', href: esUrl }
    ];

    var esPage = withMeta(TEMPLATE, {
      lang: 'es', title: p.title + ' | Masamadre Films',
      description: clean(p.short.es || p.synopsis.es[0] || '').slice(0, 160) || 'Masamadre Films.',
      image: absImg(p.image), canonical: esUrl, forceLang: 'es', forceHash: 'p-' + p.slug, hreflang: hreflang
    });
    writeFile('proyectos/' + p.slug + '/index.html', esPage);

    var enPage = withMeta(TEMPLATE, {
      lang: 'en', title: p.title + ' | Masamadre Films',
      description: clean(p.short.en || p.synopsis.en[0] || '').slice(0, 160) || 'Masamadre Films.',
      image: absImg(p.image), canonical: enUrl, forceLang: 'en', forceHash: 'p-' + p.slug, hreflang: hreflang
    });
    writeFile('en/proyectos/' + p.slug + '/index.html', enPage);

    urls.push({ loc: esUrl, alternates: hreflang });
    urls.push({ loc: enUrl, alternates: hreflang });
  });

  // ---------- sitemap.xml ----------
  var today = new Date().toISOString().slice(0, 10);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.map(function (u) {
      return '  <url>\n    <loc>' + esc(u.loc) + '</loc>\n    <lastmod>' + today + '</lastmod>\n' +
        u.alternates.map(function (a) { return '    <xhtml:link rel="alternate" hreflang="' + a.hreflang + '" href="' + esc(a.href) + '"/>'; }).join('\n') + '\n' +
        '  </url>\n';
    }).join('') +
    '</urlset>\n';
  writeFile('sitemap.xml', xml);

  // ---------- robots.txt ----------
  writeFile('robots.txt', 'User-agent: *\nDisallow: /admin/\nSitemap: ' + SITE + '/sitemap.xml\n');

  console.log('Built ' + projects.length + ' project(s) x2 languages, EN homepage, sitemap.xml, robots.txt.');
}

main();
