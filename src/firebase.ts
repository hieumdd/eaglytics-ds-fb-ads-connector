type FacebookCache = {
    data: FacebookData[];
    options: InsightsOptions;
    updatedAt: number;
};

const FIREBASE_REALTIME_DB_BASE_URL =
    'eaglytics-project-default-rtdb.firebaseio.com';
const FIREBASE_REALTIME_DB_COLLECTION = '/ds-cache/';

/** Firebase interface */
const firebaseCache = (
    method: GoogleAppsScript.URL_Fetch.HttpMethod,
    url: string,
    data?: FacebookCache,
) => {
    const defaultOptions = {
        method,
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
