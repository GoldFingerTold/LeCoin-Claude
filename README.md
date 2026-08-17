# Sitio web — LeCoin Recepciones

Sitio de una sola página (Inicio, Servicios, El Salón, Testimonios, Contacto) con el
contenido real de LeCoin Recepciones, migrado desde el sitio anterior en WordPress. Estilo
oscuro y elegante, con un panel de administración privado para editar textos, fotos, redes
sociales y moderar los testimonios que manda el público — igual que el de
`sitio-celine-stajcer/`, mismo stack (Node.js + Express + `node:sqlite`, sin build).

## Qué se migró y qué se sumó

- Todo el contenido real del sitio anterior: dirección, teléfono/WhatsApp, email, horario,
  las 3 estadísticas (50+ eventos, 10 años, 500+ clientes), la lista de servicios, la foto
  del salón y el logo.
- **Rediseño**: fondo oscuro en vez de blanco, y un único acento dorado en todos los
  íconos (el sitio anterior los tenía en ocho colores sin relación entre sí).
- **Función nueva — Testimonios con moderación**: el público deja su opinión desde un
  formulario en el sitio; queda "pendiente" y no se muestra hasta que se aprueba desde el
  panel. El dueño también puede cargar testimonios directamente ya aprobados.

## Instalación y uso local

Igual que `sitio-celine-stajcer/` — ver ese README para el detalle completo. En resumen:

```
npm install
copy .env.example .env
```

Editá `.env` con `ADMIN_PASSWORD` y `SESSION_SECRET` propios, después:

```
npm start
```

- Sitio público: http://localhost:3000
- Panel: http://localhost:3000/admin

Pestañas del panel: **Textos**, **Fotos** (portada + galería del salón), **Testimonios**
(bandeja de moderación + carga directa), **Redes sociales**, **Mensajes** (contacto),
**Cuenta** (cambiar contraseña / recuperación de emergencia con `ADMIN_RECOVERY_KEY`).

## Despliegue

Mismo camino que Celine: misma cuenta de Hostinger (plan Business, con lugar hasta 50
sitios), conectado por GitHub con auto-deploy en cada push. Repo pendiente de crear.

## Nota

Este README documenta el proyecto ya construido y probado en local — todavía **no está
desplegado**. Los pasos de despliegue se retoman cuando el contenido esté revisado y
aprobado.
