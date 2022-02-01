const cc = DataStudioApp.createCommunityConnector();

const isAdminUser = () => true;

const getConfig = (request: GetConfigRequest): GetConfigResponse => {
    const config = cc.getConfig();

    config
        .newTextInput()
        .setId('accountId')
        .setName('Facebook Ads Account ID');

    metrics.reduce(
        (acc, cur) =>
            acc.addOption(
                config
                    .newOptionBuilder()
                    .setLabel(cur)
                    .setValue(cur),
            ),
        config
            .newSelectMultiple()
            .setId('metrics')
            .setName('Metrics'),
    );

    config.setDateRangeRequired(true);

    return config.build();
};

const getFields = (dimensions: string[], metrics: string[]) => {
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
    const {
        configParams: { metrics },
    } = request;

    return {
        schema: getFields(dimensions, metrics.split(',')).build(),
    };
};

const getData = (request: GetDataRequest<FacebookConfig>): GetDataResponse => {
    const {
        configParams: { accountId },
        dateRange: { startDate, endDate },
        fields,
    } = request;

    const requestedFields = getFields(
        dimensions,
        fields.map(({ name }) => name),
    ).forIds(
        request.fields.map((field) => {
            return field.name;
        }),
    );

    const data = getInsights({
        accountId,
        startDate,
        endDate,
        fields: fields.map(({ name }) => name),
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
