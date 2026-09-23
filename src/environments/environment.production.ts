export const environment = {
  production: true,
  appname: 'atlas_mf',
  appMenu: 'Atlas Externo',
  PRUEBAS_ASSETS: 'https://assets.portaloas.udistrital.edu.co/',
  ASSETS_SERVICE: 'https://assets.portaloas.udistrital.edu.co/',
  AUTENTICACION_MID: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/',
  MAIN_BACKEND: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/observatorio_crud/v1/',
  GESTOR_DOCUMENTAL: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1/',
  TURNSTILE_SITE_KEY: '',
  /*
   * Este endpoint NO es Cloudflare.
   * Es un endpoint del propio backend/MID que
   * validará el token contra Cloudflare.
   */
  TURNSTILE_VERIFY_URL: '',
  PUBLIC_CLIENT_AUTH: {
    enabled: true,
    storageKey: 'access_token'
  },
  TOKEN: {
    CLIENTE_ID: 'PDpmPDMZfxv_xLxiZXyPr1s1Rk4a',
    RESPONSE_TYPE: 'id_token token',
    REDIRECT_URL: 'https://atlas.portaloas.udistrital.edu.co',
  },
  SECURITY: {
    maxApiRequestsPerMinute: 45,
    maxRouteChangesPerMinute: 35,
    earlyRequestWindowMs: 2500,
    captchaSolvedTtlMs: 15 * 60 * 1000,
    apiErrorThreshold: 6
  }
};
