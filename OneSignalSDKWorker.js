/* Cofre Didáctico — Service Worker de OneSignal (notificaciones push)
   Aislado en /onesignal/ para no colisionar con el service worker de la PWA
   (que vive en el scope raíz del sitio y maneja el modo offline). */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
