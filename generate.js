/*
 * ═══════════════════════════════════════════════════════════════════════════
 *  RCASTUR - REFORMAS Y CONSTRUCCIÓN ASTURIAS S.L.
 *  Generador de páginas estáticas con SEO avanzado
 *  Basado en la arquitectura de CubiertasDavid.com
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  USO:
 *    node generate.js
 *
 *  SALIDA:
 *    /dist/*.html  → Páginas HTML listas para Cloudflare Pages
 *    /dist/sitemap.xml
 *    /dist/robots.txt
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN GLOBAL DEL NEGOCIO
// ─────────────────────────────────────────────────────────────────────────────
const BUSINESS = {
  name:         'RCASTUR – Reformas y Construcción Asturias S.L.',
  shortName:    'RCASTUR',
  slogan:       'Construcción · Arquitectura Técnica · Inspecciones · Certificaciones',
  phone:        '985 000 000',
  phoneLink:    '+34985000000',
  whatsapp:     '34985000000',
  email:        'info@rcastur.es',
  emailObras:   'obra@rcastur.es',
  website:      'https://rcastur.es',
  logo:         'https://rcastur.es/img/logo-rcastur.png',
  favicon:      'https://rcastur.es/favicon.ico',

  address: {
    street:     'Calle Uría, 1',
    city:       'Oviedo',
    province:   'Asturias',
    postalCode: '33003',
    country:    'España',
    countryCode:'ES',
    region:     'Asturias',
  },

  geo: {
    lat:  43.3614,
    lon: -5.8494,
  },

  hours: [
    { days: 'Monday,Tuesday,Wednesday,Thursday,Friday', open: '08:00', close: '19:00' },
    { days: 'Saturday', open: '09:00', close: '14:00' },
  ],

  social: {
    facebook:  'https://facebook.com/rcastur',
    instagram: 'https://instagram.com/rcastur',
    linkedin:  'https://linkedin.com/company/rcastur',
  },

  rating: {
    value: '4.9',
    count: '47',
  },

  // Categorías Schema.org aplicables
  schemaTypes: [
    'GeneralContractor',
    'HomeAndConstructionBusiness',
    'LocalBusiness',
  ],

  // CNAE y actividad
  naics:   '236115',
  sic:     '1521',
};

// ─────────────────────────────────────────────────────────────────────────────
//  RUTAS DE ARCHIVOS
// ─────────────────────────────────────────────────────────────────────────────
const PATHS = {
  template:  './src/template.html',
  pages:     './src/pages.json',
  dist:      './paginas',
  imgBase:   '/img/',
  videoBase: '/video/',
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Formatea fecha ISO para sitemap */
function isoDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

/** Genera bloque JSON-LD completo para cada página */
function buildSchema(page) {
  const addr = BUSINESS.address;
  const geo  = BUSINESS.geo;

  const openingHours = BUSINESS.hours.map(h =>
    h.days.split(',').map(d => `${d.substring(0,2)} ${h.open}-${h.close}`).join(', ')
  ).join(', ');

  const base = {
    '@context':   'https://schema.org',
    '@type':      BUSINESS.schemaTypes,
    name:         BUSINESS.name,
    alternateName: BUSINESS.shortName,
    description:  page.metaDescription,
    url:          `${BUSINESS.website}/${page.slug !== 'index' ? page.slug + '.html' : ''}`,
    logo: {
      '@type': 'ImageObject',
      url:     BUSINESS.logo,
    },
    image:        page.ogImage
                    ? `${BUSINESS.website}/${page.ogImage}`
                    : BUSINESS.logo,
    telephone:    BUSINESS.phoneLink,
    email:        BUSINESS.email,
    address: {
      '@type':           'PostalAddress',
      streetAddress:     addr.street,
      addressLocality:   addr.city,
      addressRegion:     addr.province,
      postalCode:        addr.postalCode,
      addressCountry:    addr.countryCode,
    },
    geo: {
      '@type':     'GeoCoordinates',
      latitude:    geo.lat,
      longitude:   geo.lon,
    },
    openingHoursSpecification: BUSINESS.hours.map(h => ({
      '@type':    'OpeningHoursSpecification',
      dayOfWeek:  h.days.split(',').map(d => `https://schema.org/${d}`),
      opens:      h.open,
      closes:     h.close,
    })),
    aggregateRating: {
      '@type':       'AggregateRating',
      ratingValue:   BUSINESS.rating.value,
      reviewCount:   BUSINESS.rating.count,
      bestRating:    '5',
      worstRating:   '1',
    },
    areaServed: [
      'Oviedo', 'Gijón', 'Avilés', 'Siero', 'Mieres', 'Asturias'
    ].map(city => ({ '@type': 'City', name: city })),
    sameAs: Object.values(BUSINESS.social),
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    paymentAccepted:    'Cash, Credit Card, Bank Transfer',
    hasMap: `https://www.google.com/maps?q=${geo.lat},${geo.lon}`,
    naics: BUSINESS.naics,
  };

  // BreadcrumbList
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      {
        '@type':    'ListItem',
        position:   1,
        name:       'Inicio',
        item:       BUSINESS.website,
      },
      ...(page.breadcrumb || []).map((bc, i) => ({
        '@type':    'ListItem',
        position:   i + 2,
        name:       bc.name,
        item:       `${BUSINESS.website}/${bc.slug}.html`,
      })),
    ],
  };

  // Service Schema específico por página
  const service = page.serviceSchema ? {
    '@context':   'https://schema.org',
    '@type':      'Service',
    name:         page.serviceSchema.name,
    description:  page.serviceSchema.description,
    provider: {
      '@type': 'LocalBusiness',
      name:    BUSINESS.name,
    },
    areaServed: page.serviceSchema.area || 'Asturias',
    serviceType: page.serviceSchema.type || 'Construcción y Reformas',
  } : null;

  const schemas = [base, breadcrumb];
  if (service) schemas.push(service);

  return schemas.map(s => JSON.stringify(s, null, 2)).join('\n');
}

/** Genera las etiquetas de apertura de hora en formato Schema */
function buildOpeningHoursMeta() {
  return BUSINESS.hours.map(h =>
    `<meta itemprop="openingHours" content="${
      h.days.split(',').map(d => d.substring(0,2)).join(',')
    } ${h.open}-${h.close}">`
  ).join('\n    ');
}

// ─────────────────────────────────────────────────────────────────────────────
//  GENERADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
function generate() {
  // Verificar archivos fuente
  if (!fs.existsSync(PATHS.template)) {
    console.error('❌ No se encuentra src/template.html');
    process.exit(1);
  }
  if (!fs.existsSync(PATHS.pages)) {
    console.error('❌ No se encuentra src/pages.json');
    process.exit(1);
  }

  const template = fs.readFileSync(PATHS.template, 'utf8');
  const pages    = JSON.parse(fs.readFileSync(PATHS.pages, 'utf8'));

  // Crear /dist si no existe
  if (!fs.existsSync(PATHS.dist)) fs.mkdirSync(PATHS.dist, { recursive: true });

  const today     = isoDate();
  const sitemapUrls = [];

  console.log(`\n🔨 RCASTUR — Generando ${pages.length} páginas...\n`);

  pages.forEach((page, i) => {
    const isHome    = page.slug === 'index';
    const canonical = isHome
      ? `${BUSINESS.website}/`
      : `${BUSINESS.website}/${page.slug}.html`;

    const ogImage = page.ogImage
      ? `${BUSINESS.website}/${page.ogImage}`
      : `${BUSINESS.website}/img/og-default.jpg`;

    // Prioridad y frecuencia para sitemap
    const priority  = isHome ? '1.0' : (page.priority || '0.8');
    const changefreq= page.changefreq || 'monthly';

    // Construir schema JSON-LD
    const schemaJson = buildSchema(page);

    // ── Reemplazos en template ────────────────────────────────────────────
    let html = template

      // ── SEO HEAD ───────────────────────────────────────────────────────
      .replace(/\{\{TITLE\}\}/g,            page.title)
      .replace(/\{\{META_DESC\}\}/g,        page.metaDescription)
      .replace(/\{\{META_KEYWORDS\}\}/g,    page.keywords || '')
      .replace(/\{\{CANONICAL\}\}/g,        canonical)
      .replace(/\{\{OG_TITLE\}\}/g,         page.ogTitle || page.title)
      .replace(/\{\{OG_DESC\}\}/g,          page.ogDesc  || page.metaDescription)
      .replace(/\{\{OG_IMAGE\}\}/g,         ogImage)
      .replace(/\{\{OG_URL\}\}/g,           canonical)
      .replace(/\{\{OG_LOCALE\}\}/g,        'es_ES')
      .replace(/\{\{SITE_NAME\}\}/g,        BUSINESS.name)
      .replace(/\{\{TWITTER_TITLE\}\}/g,    page.ogTitle || page.title)
      .replace(/\{\{TWITTER_DESC\}\}/g,     page.ogDesc  || page.metaDescription)
      .replace(/\{\{TWITTER_IMAGE\}\}/g,    ogImage)
      .replace(/\{\{GEO_LAT\}\}/g,          String(BUSINESS.geo.lat))
      .replace(/\{\{GEO_LON\}\}/g,          String(BUSINESS.geo.lon))
      .replace(/\{\{GEO_REGION\}\}/g,       `ES-${BUSINESS.address.province.toUpperCase().substring(0,2)}`)
      .replace(/\{\{GEO_PLACENAME\}\}/g,    BUSINESS.address.city)
      .replace(/\{\{ROBOTS\}\}/g,           page.robots || 'index, follow')
      .replace(/\{\{SCHEMA_JSON\}\}/g,      schemaJson)
      .replace(/\{\{OPENING_HOURS\}\}/g,    buildOpeningHoursMeta())
      .replace(/\{\{LAST_MODIFIED\}\}/g,    today)
      .replace(/\{\{LANG\}\}/g,             'es')

      // ── NEGOCIO ────────────────────────────────────────────────────────
      .replace(/\{\{BUSINESS_NAME\}\}/g,    BUSINESS.name)
      .replace(/\{\{SHORT_NAME\}\}/g,       BUSINESS.shortName)
      .replace(/\{\{PHONE\}\}/g,            BUSINESS.phone)
      .replace(/\{\{PHONE_LINK\}\}/g,       BUSINESS.phoneLink)
      .replace(/\{\{WHATSAPP\}\}/g,         BUSINESS.whatsapp)
      .replace(/\{\{EMAIL\}\}/g,            BUSINESS.email)
      .replace(/\{\{EMAIL_OBRAS\}\}/g,      BUSINESS.emailObras)
      .replace(/\{\{WEBSITE\}\}/g,          BUSINESS.website)
      .replace(/\{\{SLOGAN\}\}/g,           BUSINESS.slogan)

      // ── DIRECCIÓN ──────────────────────────────────────────────────────
      .replace(/\{\{ADDRESS_STREET\}\}/g,   BUSINESS.address.street)
      .replace(/\{\{ADDRESS_CITY\}\}/g,     BUSINESS.address.city)
      .replace(/\{\{ADDRESS_PROVINCE\}\}/g, BUSINESS.address.province)
      .replace(/\{\{ADDRESS_CP\}\}/g,       BUSINESS.address.postalCode)

      // ── CONTENIDO ──────────────────────────────────────────────────────
      .replace(/\{\{H1\}\}/g,               page.h1)
      .replace(/\{\{H2\}\}/g,               page.h2 || '')
      .replace(/\{\{HERO_TEXT\}\}/g,        page.heroText || page.h1)
      .replace(/\{\{HERO_SUBTEXT\}\}/g,     page.heroSubtext || BUSINESS.slogan)
      .replace(/\{\{CONTENIDO\}\}/g,        page.contenido || '')
      .replace(/\{\{SLUG\}\}/g,             page.slug)

      // ── REDES SOCIALES ─────────────────────────────────────────────────
      .replace(/\{\{FACEBOOK\}\}/g,         BUSINESS.social.facebook)
      .replace(/\{\{INSTAGRAM\}\}/g,        BUSINESS.social.instagram)
      .replace(/\{\{LINKEDIN\}\}/g,         BUSINESS.social.linkedin)

      // ── ASSETS ─────────────────────────────────────────────────────────
      .replace(/\{\{LOGO\}\}/g,             '/img/logo-rcastur.png')
      .replace(/\{\{FAVICON\}\}/g,          '/favicon.ico')
      .replace(/\{\{HERO_VIDEO\}\}/g,       '/video/hero-bg.mp4')
      .replace(/\{\{YEAR\}\}/g,             String(new Date().getFullYear()));

    // Guardar HTML
    const filename = isHome ? 'index.html' : `${page.slug}.html`;
    fs.writeFileSync(path.join(PATHS.dist, filename), html, 'utf8');

    sitemapUrls.push({ url: canonical, priority, changefreq, lastmod: today });

    const bar = '█'.repeat(Math.ceil(((i + 1) / pages.length) * 20));
    console.log(`  ✅ [${String(i+1).padStart(2,'0')}/${pages.length}] ${filename.padEnd(45)} ${bar}`);
  });

  // ── GENERAR SITEMAP.XML ────────────────────────────────────────────────────
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(PATHS.dist, 'sitemap.xml'), sitemap, 'utf8');
  console.log('\n  📄 sitemap.xml generado');

  // ── GENERAR ROBOTS.TXT ────────────────────────────────────────────────────
  const robots = `User-agent: *
Allow: /

Sitemap: ${BUSINESS.website}/sitemap.xml

# Bloquear carpetas internas
Disallow: /node_modules/
Disallow: /src/
`;
  fs.writeFileSync(path.join(PATHS.dist, 'robots.txt'), robots, 'utf8');
  console.log('  📄 robots.txt generado');

  // ── GENERAR _REDIRECTS (Cloudflare Pages) ─────────────────────────────────
  const redirects = `# RCASTUR - Cloudflare Pages Redirects
/ /index.html 200
`;
  fs.writeFileSync(path.join(PATHS.dist, '_redirects'), redirects, 'utf8');
  console.log('  📄 _redirects generado');

  // ── GENERAR _HEADERS (Cloudflare Pages) ───────────────────────────────────
  const headers = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
  Cache-Control: public, max-age=86400

/*.html
  Cache-Control: public, max-age=3600

/img/*
  Cache-Control: public, max-age=604800

/video/*
  Cache-Control: public, max-age=2592000
`;
  fs.writeFileSync(path.join(PATHS.dist, '_headers'), headers, 'utf8');
  console.log('  📄 _headers generado');

  console.log(`\n🎉 ¡Listo! ${pages.length} páginas + sitemap + robots + _redirects + _headers`);
  console.log(`📁 Carpeta de salida: ${path.resolve(PATHS.dist)}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
generate();
