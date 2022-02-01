type GetAuthTypeResponse = object;

type GetSchemaRequest<T> = {
    configParams: T;
};
type GetSchemaResponse = {
    schema: object[];
};

type GetConfigRequest = {
    languageCode: string;
};
type GetConfigResponse = object;

type ConfigParams = {
    [configId: string]: string;
};
type GetDataRequest<T> = {
    configParams: T;
    scriptParams: {
        sampleExtraction: boolean;
        lastRefresh: string;
    };
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    fields: Array<{
        name: string;
    }>;
};

type GetDataRowValue = string | number | boolean;
type GetDataRow = {
    values: Array<GetDataRowValue>;
};
type GetDataRows = Array<GetDataRow>;

type GetDataResponse = {
    schema: object[];
    rows: GetDataRows;
};

type UserPassCredentials = {
    userPass: {
        username: string;
        password: string;
    };
};

type UserTokenCredentials = {
    userToken: {
        username: string;
        token: string;
    };
};

type KeyCredentials = {
    key: string;
};

type SetCredentialsRequest =
    | UserPassCredentials
    | UserTokenCredentials
    | KeyCredentials;

type SetCredentialsResponse = {
    errorCode: 'NONE' | 'INVALID_CREDENTIALS';
};

type Field = {
    name: string;
    dataType: string;
};
