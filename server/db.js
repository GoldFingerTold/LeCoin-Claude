// Conexión a SQLite + esquema + contenido semilla.
// Mismo patrón que sitio-celine-stajcer/server/db.js (node:sqlite, sin dependencias
// nativas). Se ejecuta una sola vez al arrancar: si la base ya existe, no vuelve a
// sembrar nada.

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'site.db'));
db.exec('PRAGMA journal_mode = WAL');

function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    visible INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_read INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_user (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  );
`);

// --- Contenido semilla (texto real del sitio actual de LeCoin Recepciones) ---
const DEFAULT_CONTENT = {
  site_name: 'LeCoin Recepciones',
  site_tagline: 'Salón de eventos y recepciones',

  nav_home_label: 'Inicio',
  nav_servicios_label: 'Nuestros Servicios',
  nav_salon_label: 'El Salón',
  nav_testimonios_label: 'Testimonios',
  nav_contacto_label: 'Contacto',

  banner_image: '/img/seed/banquete.png',
  banner_title: 'LeCoin Recepciones',
  banner_subtitle: 'Un lugar especial donde tus momentos se convierten en recuerdos inolvidables.',

  stat_1_number: '50+',
  stat_1_label: 'Eventos realizados',
  stat_2_number: '10',
  stat_2_label: 'Años de trayectoria',
  stat_3_number: '500+',
  stat_3_label: 'Clientes satisfechos',

  servicios_heading: 'Nuestros Servicios',
  servicios_subheading: 'Todo lo que necesitás para un evento inolvidable',
  servicios_text: [
    'Capacidad para 120 invitados, en un espacio climatizado pensado para tu comodidad y la de tus invitados.',
    'Iluminación selectiva y suite privada para los momentos más importantes de la noche.',
    'Shows en vivo, pantalla de proyección y DJ profesional para acompañar cada instante.',
    'Efectos especiales (humo, láser) que le dan a tu evento ese toque distinto.',
    'Catering gourmet personalizado, adaptado a tu gusto y al de tus invitados.'
  ].join('\n\n'),

  salon_heading: 'El Salón',
  salon_subheading: 'Conocé el espacio',
  salon_text: 'Un salón pensado para que cada celebración sea única: climatizado, con capacidad para 120 invitados, iluminación selectiva y todo el equipamiento necesario para que tu evento salga exactamente como lo imaginaste.',

  // Apagado por defecto: si nadie lo activa desde el panel, la portada queda tal cual,
  // sin esta sección (ver public/js/main.js, que la oculta cuando enabled !== '1').
  proximo_evento_enabled: '0',
  proximo_evento_label: 'Próximo evento',
  proximo_evento_text: '',
  proximo_evento_media_type: 'image',
  proximo_evento_image: '',
  proximo_evento_video_url: '',

  testimonios_heading: 'Testimonios',
  testimonios_subheading: 'Lo que dicen quienes ya celebraron acá',
  testimonios_form_heading: 'Dejá tu opinión',
  testimonios_form_text: 'Si ya celebraste tu evento con nosotros, nos encantaría conocer tu experiencia.',

  contact_heading: 'Contacto',
  contact_subheading: 'Coordinemos una visita al salón.',
  contact_address: 'Dr. Ramón Carrillo 2486, San Martín',
  contact_phone: '11 2461-5068',
  contact_email: 'info@lecoinrecepciones.com.ar',
  contact_hours: 'Lunes a Viernes, 09:00 a 18:00 hs',

  footer_text: 'LeCoin Recepciones'
};

const DEFAULT_SOCIAL = [
  { platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/5491124615068?text=Hola!%20Quisiera%20coordinar%20una%20visita%20al%20sal%C3%B3n.' }
];

function seedIfEmpty() {
  const contentCount = db.prepare('SELECT COUNT(*) AS n FROM content').get().n;
  if (contentCount === 0) {
    const insert = db.prepare('INSERT INTO content (key, value) VALUES (?, ?)');
    const insertMany = transaction((entries) => {
      for (const [key, value] of entries) insert.run(key, String(value));
    });
    insertMany(Object.entries(DEFAULT_CONTENT));
  }

  const galleryCount = db.prepare('SELECT COUNT(*) AS n FROM gallery_images').get().n;
  if (galleryCount === 0) {
    db.prepare('INSERT INTO gallery_images (url, alt_text, position) VALUES (?, ?, 0)').run(
      '/img/seed/banquete.png',
      'Banquete elegante con detalles sofisticados'
    );
  }

  const socialCount = db.prepare('SELECT COUNT(*) AS n FROM social_links').get().n;
  if (socialCount === 0) {
    const insert = db.prepare(
      'INSERT INTO social_links (platform, label, url, visible, position) VALUES (?, ?, ?, 1, ?)'
    );
    const insertMany = transaction((items) => {
      items.forEach((item, i) => insert.run(item.platform, item.label, item.url, i));
    });
    insertMany(DEFAULT_SOCIAL);
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS n FROM admin_user').get().n;
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD || 'cambiar-esta-clave';
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admin_user (username, password_hash) VALUES (?, ?)').run('admin', hash);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        '[aviso] No hay ADMIN_PASSWORD en .env: se creó el usuario admin con la clave por defecto ' +
        '"cambiar-esta-clave". Copiá .env.example a .env y definí una clave propia antes de publicar el sitio.'
      );
    }
  }
}

seedIfEmpty();

db.transaction = transaction;

module.exports = db;
