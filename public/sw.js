// Importa o "motor" de notificações do OneSignal pra dentro do nosso próprio
// service worker — assim não ficam dois service workers brigando pelo mesmo
// espaço (o que fazia a notificação nunca aparecer, mesmo sendo entregue).
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Service worker mínimo — não faz cache agressivo (evita conteúdo desatualizado
// num painel que muda com frequência). Ele existe principalmente pra satisfazer
// o critério de "instalável" do Chrome/Android (exige um service worker
// registrado com um handler de fetch).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
