# v14 · Reconocimiento visual sin foto de referencia

Esta versión añade un modo experimental de identificación visual mediante IA.

## Qué cambia
- Si un monumento no tiene `target_path`, la cámara puede arrancar igualmente.
- La aplicación toma una imagen periódicamente y la envía a la Edge Function `identify-monument`.
- La función recibe los monumentos candidatos cercanos por GPS y devuelve el candidato identificado.
- El reconocimiento exige dos identificaciones consecutivas con confianza >= 0,80.
- Si existe foto de referencia, el reconocimiento ORB anterior sigue disponible como respaldo.

## Configuración necesaria en Supabase
1. Desplegar `supabase/functions/identify-monument/index.ts` como Edge Function llamada `identify-monument`.
2. Crear el secreto `OPENAI_API_KEY` en Supabase. La clave NO debe ponerse en `config.js` ni en el navegador.
3. Probar la cámara en HTTPS desde el móvil.

La función usa la Responses API de OpenAI y un modelo con entrada de imagen. El coste de las llamadas depende del modelo y de la cantidad de capturas enviadas.


## v14.1 · modo de prueba en oficina
La pantalla principal incluye «Prueba de reconocimiento IA». Permite probar la cámara sin GPS ni monumentos reales. Los candidatos de prueba son: extintor de oficina, ordenador portátil y taza de oficina. La prueba usa la misma Edge Function `identify-monument` que el reconocimiento real.
