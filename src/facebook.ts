const API_VER = 'v12.0';
const AUTHORIZATION_BASE_URL = `https://www.facebook.com/${API_VER}/dialog/oauth`;
const TOKEN_URL = `https://graph.facebook.com/${API_VER}/oauth/access_token`;

type FacebookConfig = {
    accountId: string;
    metrics: string;
};

type InsightsOptions = {
    accountId: string;
    fields: string[];
    startDate: string;
    endDate: string;
};

type FacebookData = {
    [key: string]: string | number;
};

type FacebookInsightsRes = {
    data: FacebookData[];
    paging: {
        cursors: {
            before: string;
            after: string;
        };
        next: string;
    };
};

const dimensions = [
    'date_start',
    // 'campaign_id',
    // 'adset_id',
    // 'ad_id',
    // 'campaign_name',
    // 'adset_name',
    // 'ad_name',
];

const metrics = ['clicks', 'spend', 'impressions'];

const queryString = (key: string, value: string | number) => `${key}=${value}`;

const buildInsightsURL = (options: InsightsOptions, after?: string) => {
    const params = [
        queryString('access_token', getOAuthService().getAccessToken()),
        queryString('level', 'account'),
        queryString('fields', options.fields.join(',')),
        queryString('time_increment', 1),
        queryString(
            'time_range',
            JSON.stringify({
                since: options.startDate,
                until: options.endDate,
            }),
        ),
        queryString('limit', 500),
    ];
    return (
        `https://graph.facebook.com/${API_VER}/act_${options.accountId}/insights?` +
        (after
            ? [...params, queryString('after', after)].join('&')
            : params.join('&'))
    );
};

const getInsights = (
    options: InsightsOptions,
    _after?: string,
): FacebookData[] => {
    const res = <FacebookInsightsRes>(
        JSON.parse(
            UrlFetchApp.fetch(
                encodeURI(buildInsightsURL(options, _after)),
            ).getContentText(),
        )
    );
    const {
        data,
        paging: {
            cursors: { after },
            next,
        },
    } = res;

    return next ? [...data, ...getInsights(options, after)] : data;
};
