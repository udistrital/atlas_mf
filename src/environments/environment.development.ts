export const environment = {
  production: false,
  appname: 'atlas_mf',
  appMenu: 'Atlas Externo',
  PRUEBAS_ASSETS: 'https://pruebasassets.portaloas.udistrital.edu.co/',
  AUTENTICACION_MID: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/',
  MAIN_BACKEND: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/observatorio_crud/v1/',
  GESTOR_DOCUMENTAL: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1/',

  TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  TURNSTILE_VERIFY_URL: '/atlas_mid/v1/security/turnstile/verify',
  TURNSTILE_ACTION: 'atlas_external_access',

  PUBLIC_CLIENT_AUTH: {
    enabled: true,
    storageKey: 'access_token'
  },
  TOKEN: {
    CLIENTE_ID: 'I2DucF8LkGSPBw_XEn9QisZLYTga',
    RESPONSE_TYPE: 'id_token token',
    REDIRECT_URL: 'https://pruebasatlas.portaloas.udistrital.edu.co',
  },
  SECURITY: {
    maxApiRequestsPerMinute: 45,
    maxRouteChangesPerMinute: 35,
    earlyRequestWindowMs: 2500,
    captchaSolvedTtlMs: 15 * 60 * 1000,
    apiErrorThreshold: 6
  }
};
