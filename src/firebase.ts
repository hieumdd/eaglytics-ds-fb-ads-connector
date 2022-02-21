type FacebookCache = {
    data: FacebookData[];
    options: InsightsOptions;
    updatedAt: number;
};

const scriptProperties = PropertiesService.getScriptProperties();

const getGCPSAKey = () =>
    JSON.parse(scriptProperties.getProperty('GCP_SA_KEY'));

const SA_CREDS = getGCPSAKey();
const SA_KEY = SA_CREDS['private_key'];
const SA_EMAIL = SA_CREDS['client_email'];

const FIREBASE_REALTIME_DB_BASE_URL =
    'eaglytics-project-default-rtdb.firebaseio.com';
const FIREBASE_REALTIME_DB_COLLECTION = '/ds-cache/';

const getFirebaseService = () => {
    return OAuth2.createService('FirebaseCache')
        .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
        .setTokenUrl('https://accounts.google.com/o/oauth2/token')
        .setPrivateKey(SA_KEY)
        .setIssuer(SA_EMAIL)
        .setPropertyStore(scriptProperties)
        .setCache(CacheService.getScriptCache())
        .setScope([
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/firebase.database',
        ]);
};

/** Firebase interface */
const firebaseCache = (
    method: GoogleAppsScript.URL_Fetch.HttpMethod,
    url: string,
    data?: FacebookCache,
) => {
    const defaultOptions = {
        method,
        headers: {
            Authorization: 'Bearer ' + getFirebaseService().getAccessToken(),
        },
        contentType: 'application/json',
    };
    const options = data
        ? {
              ...defaultOptions,
              payload: JSON.stringify(data),
          }
        : defaultOptions;

    const res = UrlFetchApp.fetch(url, options);

    return method === 'get' ? JSON.parse(res.getContentText()) : undefined;
};

const getFromCache = (url: string) => firebaseCache('get', url);

const deleteFromCache = (url: string) => firebaseCache('delete', url);

const putInCache = (url: string, data: FacebookCache) =>
    firebaseCache('put', url, data);

/**
 * Build Key URL for firebase
 * @param options InsightsOptions to be used as key
 * @returns string
 */
const buildURL = (options: InsightsOptions): string => {
    return [
        'https://',
        FIREBASE_REALTIME_DB_BASE_URL,
        FIREBASE_REALTIME_DB_COLLECTION,
        Utilities.base64Encode(
            JSON.stringify(options) + Session.getEffectiveUser().getEmail(),
        ),
        '.json',
    ].join('');
};
