// Ruta pública: recibe el formulario de contacto y lo guarda para que Celine lo vea
// en el panel (no envía email: no hay credenciales SMTP configuradas. Si más adelante
// se quiere notificar por correo, se puede sumar nodemailer acá).

const express = require('express');
const db = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: 'Falta el nombre.' });
  if (!email || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'El email no es válido.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Falta el mensaje.' });

  db.prepare(
    'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), email.trim(), (phone || '').trim(), message.trim());

  res.json({ ok: true });
});

module.exports = router;
