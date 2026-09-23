# atlas_mf

Cliente público de consulta para Atlas/Observatorios construido en Angular 17 a partir de la estructura de `verificacion_firma_digital_mf` y la lógica de visualización del cliente Vue `observatorios_cliente`.

## Alcance

- Sin login interactivo.
- Sin pantallas de administración.
- Sin creación, actualización ni eliminación de datos.
- Solo consulta de procesos, factores, características, estructuras, tablas, documentos y paneles/gráficas.
- Captcha visible únicamente cuando el cliente detecta señales de actividad sospechosa.

## Rutas principales

- `/procesos`
- `/procesos/:proceso_id/factores`
- `/procesos/:proceso_id/factores/:factor_id/estructuras`
- `/procesos/:proceso_id/factores/:factor_id/caracteristica/:estructura_id`

## Seguridad de solo lectura

El cliente aplica un interceptor HTTP que bloquea métodos `POST`, `PUT`, `PATCH` y `DELETE` desde Angular. La única excepción técnica queda fuera de `HttpClient`: el `fetch` inicial opcional para obtener token público `clientAuth`, igual que en la base de verificación externa.

> Importante: el frontend ayuda a evitar errores de interfaz, pero la restricción real debe existir también en backend/CORS/permisos del API.

## Captcha bajo sospecha

Se usa `ng-recaptcha` para Angular 17. El captcha se muestra cuando se detecta alguna de estas señales:

- Muchas peticiones en una ventana corta.
- Navegación excesiva en pocos segundos.
- Peticiones tempranas sin interacción humana.
- Errores repetidos del API.

Para una validación fuerte, el token emitido por reCAPTCHA debe verificarse en backend. En esta versión queda preparado el punto de integración y se bloquean nuevas consultas cuando el captcha está requerido y aún no se ha resuelto.

## Ejecutar

```bash
npm install
npm start
```

## Build

```bash
npm run build:test
npm run build:prod
```
# atlas_mf
