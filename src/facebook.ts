const API_VER = 'v13.0';

type FacebookConfig = {
    accessToken: string;
    accountId: string;
};

type InsightsOptions = {
    accessToken: string;
    accountId: string;
    fields: string[];
    startDate: string;
    endDate: string;
};

type FacebookData = {
    date_start: string;
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

type FacebookDimension = {
    name: string;
    type_: (
        type: GoogleAppsScript.Data_Studio.CommunityConnector['FieldType'],
    ) => GoogleAppsScript.Data_Studio.FieldType;
};

type FacebookMetrics = FacebookDimension & {
    agg: (
        agg: GoogleAppsScript.Data_Studio.CommunityConnector['AggregationType'],
    ) => GoogleAppsScript.Data_Studio.AggregationType;
};

const dimensions: FacebookDimension[] = [
    { name: 'date_start', type_: (type) => type.YEAR_MONTH_DAY },
    { name: 'campaign_name', type_: (type) => type.TEXT },
    { name: 'adset_name', type_: (type) => type.TEXT },
    { name: 'ad_name', type_: (type) => type.TEXT },
];

const metrics: FacebookMetrics[] = [
    {
        name: 'clicks',
        type_: (type) => type.NUMBER,
        agg: (agg) => agg.SUM,
    },
    {
        name: 'spend',
        type_: (type) => type.NUMBER,
        agg: (agg) => agg.SUM,
    },
    {
        name: 'impressions',
        type_: (type) => type.NUMBER,
        agg: (agg) => agg.SUM,
    },
    { name: 'ctr', type_: (type) => type.NUMBER, agg: (agg) => agg.AVG },
    { name: 'cpc', type_: (type) => type.NUMBER, agg: (agg) => agg.AVG },
    { name: 'cpm', type_: (type) => type.NUMBER, agg: (agg) => agg.AVG },
];

const queryString = (key: string, value: string | number): string =>
    `${key}=${value}`;

/**
 * Build Facebook API URL
 * @param options InsightsOptions
 * @param after Pagination
 * @returns Insights URL
 */
const buildInsightsURL = (options: InsightsOptions, after?: string): string => {
    const params = [
        queryString('access_token', options.accessToken),
        queryString('level', 'ad'),
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

/**
 * Recursive fetch data from Facebook API
 * @param options InsightsOptions
 * @param _after Pagination
 * @returns Facebook Ads Insights Data
 */
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
