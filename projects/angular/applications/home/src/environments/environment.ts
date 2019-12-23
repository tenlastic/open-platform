// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  databaseApiBaseUrl: 'http://localhost:3002/databases',
  loginApiBaseUrl: 'http://localhost:3000/logins',
  namespaceApiBaseUrl: 'http://localhost:3001/namespaces',
  passwordResetApiBaseUrl: 'http://localhost:3000/password-resets',
  production: false,
  userApiBaseUrl: 'http://localhost:3000/users',
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
