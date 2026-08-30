// Conexión a MongoDB Atlas + contenido semilla. Migrado desde node:sqlite (mismo motivo
// que los demás sitios): el disco de la app en Hostinger no sobrevive a un redeploy.

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    'Falta la variable de entorno MONGODB_URI (el connection string de MongoDB Atlas). ' +
    'Copiá .env.example a .env y completala antes de arrancar el servidor.'
  );
}

const client = new MongoClient(uri);
let db = null;

function getDb() {
  if (!db) throw new Error('La base de datos todavía no está conectada. Llamá a connect() primero.');
  return db;
}

async function connect() {
  await client.connect();
  db = client.db();
  await ensureIndexes();
  await seedIfEmpty();
  console.log('Conectado a MongoDB Atlas.');
}

async function ensureIndexes() {
  await db.collection('gallery_images').createIndex({ position: 1 });
  await db.collection('social_links').createIndex({ position: 1 });
  await db.collection('testimonials').createIndex({ status: 1, position: 1 });
  await db.collection('contact_messages').createIndex({ created_at: -1 });
}

// --- Contenido semilla (texto real del sitio de Le Coin Eventos) ---
const DEFAULT_CONTENT = {
  site_name: 'Le Coin Eventos',
  logo_image: '/img/seed/logo.png',
  site_tagline: 'Salón de eventos y recepciones',

  nav_home_label: 'Inicio',
  nav_servicios_label: 'Nuestros Servicios',
  nav_salon_label: 'El Salón',
  nav_testimonios_label: 'Testimonios',
  nav_contacto_label: 'Contacto',

  banner_image: '/img/seed/banquete.png',
  banner_title: 'Le Coin Eventos',
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

  footer_text: 'Le Coin Eventos'
};

const DEFAULT_SOCIAL = [
  { platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/5491124615068?text=Hola!%20Quisiera%20coordinar%20una%20visita%20al%20sal%C3%B3n.' }
];

const DEFAULT_GALLERY = [
  { url: '/img/seed/banquete.png', alt_text: 'Banquete elegante con detalles sofisticados' }
];

async function seedIfEmpty() {
  const contentDoc = await db.collection('content').findOne({ _id: 'main' });
  if (!contentDoc) {
    await db.collection('content').insertOne({ _id: 'main', ...DEFAULT_CONTENT });
  } else {
    const missing = {};
    for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
      if (!(key in contentDoc)) missing[key] = value;
    }
    if (Object.keys(missing).length > 0) {
      await db.collection('content').updateOne({ _id: 'main' }, { $set: missing });
    }
  }

  const galleryCount = await db.collection('gallery_images').countDocuments();
  if (galleryCount === 0) {
    await db.collection('gallery_images').insertMany(
      DEFAULT_GALLERY.map((item, i) => ({ ...item, position: i }))
    );
  }

  const socialCount = await db.collection('social_links').countDocuments();
  if (socialCount === 0) {
    await db.collection('social_links').insertMany(
      DEFAULT_SOCIAL.map((item, i) => ({ ...item, visible: true, position: i }))
    );
  }

  const adminDoc = await db.collection('admin_user').findOne({ _id: 'admin' });
  if (!adminDoc) {
    const password = process.env.ADMIN_PASSWORD || 'cambiar-esta-clave';
    const hash = bcrypt.hashSync(password, 10);
    await db.collection('admin_user').insertOne({ _id: 'admin', password_hash: hash });
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        '[aviso] No hay ADMIN_PASSWORD en .env: se creó el usuario admin con la clave por defecto ' +
        '"cambiar-esta-clave". Copiá .env.example a .env y definí una clave propia antes de publicar el sitio.'
      );
    }
  }
}

module.exports = { connect, getDb, ObjectId };
