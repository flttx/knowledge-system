# PWA behavior

The app exposes a Next.js-generated manifest at `/manifest.webmanifest` with a
standalone display mode, `/home` as the start URL, and local 192px/512px SVG
icons.

T22 does not add a Service Worker. This keeps the installable shell simple and
avoids caching private Notes, Sources, Highlights, Inbox data, or authenticated
API responses. Authentication continues to use the existing session cookie;
there is no separate PWA login or sync system.
