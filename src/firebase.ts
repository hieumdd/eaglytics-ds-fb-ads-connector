type FacebookCache = {
    data: FacebookData[];
    options: InsightsOptions;
    updatedAt: number;
};

const scriptProperties = PropertiesService.getScriptProperties();

const getGCPSAKey = () => JSON.parse(scriptProperties.getProperty('GCP_SA_KEY'));

const SA_CREDS = getGCPSAKey();
const SA_KEY = SA_CREDS['private_key'];
const SA_EMAIL = SA_CREDS['client_email'];

const FIREBASE_REALTIME_DB_BASE_URL = 'eaglytics-project-default-rtdb.firebaseio.com';
const FIREBASE_REALTIME_DB_COLLECTION = '/ds-cache';

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

const firebaseCache = (method: string, url: string, data?: FacebookCache) => {
    const options: any = {
        method,
        headers: {
            Authorization: 'Bearer ' + getFirebaseService().getAccessToken(),
        },
        contentType: 'application/json',
    };

    if (method === 'put') {
        options['payload'] = JSON.stringify(data);
    }

    const res = UrlFetchApp.fetch(url, options);

    if (method === 'get') {
        const responseObject = JSON.parse(res.getContentText());
        if (responseObject === null) {
            return null;
        } else {
            return responseObject.data
        }
    }
};

const getFromCache = (url: string) => firebaseCache('get', url);

const deleteFromCache = (url: string) => firebaseCache('delete', url);

const putInCache = (url: string, data: FacebookCache) => firebaseCache('put', url, data);

const buildURL = (options: InsightsOptions) => {
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
