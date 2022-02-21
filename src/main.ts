/**
 * Get moment.js for easier date manipulation
 */
eval(
    UrlFetchApp.fetch(
        'https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js',
    ).getContentText(),
);

const cc = DataStudioApp.createCommunityConnector();

/** Development */
const isAdminUser = () => true;

const getAuthType = () =>
    cc
        .newAuthTypeResponse()
        .setAuthType(cc.AuthType.NONE)
        .build();

const getConfig = (request: GetConfigRequest): GetConfigResponse => {
    const config = cc.getConfig();

    config
        .newTextInput()
        .setId('accountId')
        .setName('Facebook Ads Account ID');

    config
        .newTextInput()
        .setId('accessToken')
        .setName('Facebook Apps Access Token');

    config.setDateRangeRequired(true);

    return config.build();
};

const getFields = () => {
    const fields = cc.getFields();
    const types = cc.FieldType;
    const aggregations = cc.AggregationType;

    dimensions.forEach((key) =>
        fields
            .newDimension()
            .setId(key)
            .setName(key)
            .setType(types.TEXT),
    );

    metrics.forEach((key) =>
        fields
            .newMetric()
            .setId(key)
            .setName(key)
            .setType(types.NUMBER)
            .setAggregation(aggregations.SUM),
    );

    return fields;
};

const getSchema = (
    request: GetSchemaRequest<FacebookConfig>,
): GetSchemaResponse => {
    return {
        schema: getFields().build(),
    };
};

/** Get and validate Cache */
const getCache = (url: string) => {
    const cachedData = getFromCache(url);
    return cachedData && moment().unix() - cachedData.updatedAt <= 60 * 60 * 12
        ? cachedData
        : undefined;
};

/** Get or refresh Cache */
const getCachedData = (options: InsightsOptions): FacebookData[] => {
    const url = buildURL(options);
    const cachedData = getCache(url);

    if (cachedData) {
        console.log('using cache');
        return cachedData.data;
    } else {
        const lock = LockService.getUserLock();
        lock.tryLock(5 * 60 * 1000);
        if (lock.hasLock && !getCache(url)) {
            console.log('using api');
            const data = getInsights(options);
            deleteFromCache(url);
            putInCache(url, { data, options, updatedAt: moment().unix() });
            lock.releaseLock();
            return data;
        } else {
            lock.releaseLock();
            return getCachedData(options);
        }
    }
};

const getData = (request: GetDataRequest<FacebookConfig>): GetDataResponse => {
    const {
        configParams: { accessToken, accountId },
        dateRange: { startDate, endDate },
    } = request;

    const requestedFields = getFields().forIds(
        request.fields.map((field) => {
            return field.name;
        }),
    );

    const data = getCachedData({
        accessToken,
        accountId,
        startDate,
        endDate,
        fields: [...dimensions, ...metrics],
    });

    const rows = data.map((p) => ({
        values: requestedFields
            .asArray()
            .reduce((acc, cur) => [...acc, p[cur.getId()]], []),
    }));

    return {
        rows,
        schema: requestedFields.build(),
    };
};
