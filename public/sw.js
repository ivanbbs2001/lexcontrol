// Service worker mínimo: permite instalar o app; não faz cache de dados (o Firestore cuida do offline).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
