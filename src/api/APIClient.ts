import axios, {AxiosError, AxiosRequestConfig, Method, AxiosResponse, AxiosInstance} from "axios";

export class APIClient {
    private static appCenterOwnerName: string | undefined;
    private static axiosClient: AxiosInstance | undefined;

    static init(apiToken: string, ownerName: string): void {
        if (APIClient.axiosClient) {
            return;
        }

        const client = axios.create({
            baseURL: "https://api.appcenter.ms",
            headers: {"X-API-TOKEN": apiToken},
        });
        client.interceptors.response.use(
            (response: AxiosResponse) => response.data,
            (error: AxiosError<{message?: string}>) => {
                throw new Error(
                    `fail to call ${error.config?.url || "<unknown URL>"} (${error.config?.method?.toUpperCase() || "<unknown method>"}), response code [${error.response?.status}], message [${error
                        .response?.data.message}]`
                );
            }
        );

        APIClient.axiosClient = client;
        APIClient.appCenterOwnerName = ownerName;
    }

    static ownerName(): string {
        if (!APIClient.appCenterOwnerName) {
            throw new Error("APIClient.init() must be called before ownerName()");
        }
        return APIClient.appCenterOwnerName;
    }

    static ajax<Request, Response>(method: Method, path: string, pathParams: object, request: Request | null = null): Promise<Response> {
        if (!APIClient.axiosClient) {
            throw new Error("APIClient.init() must be called before ajax()");
        }

        const config: AxiosRequestConfig = {
            method,
            url: APIClient.urlParams(path, pathParams),
        };

        if (request) {
            if (method === "GET" || method === "DELETE") {
                config.params = request;
            } else if (method === "POST" || method === "PUT" || method === "PATCH") {
                config.data = request;
            }
        }

        return APIClient.axiosClient.request(config);
    }

    private static urlParams(pattern: string, params: object): string {
        if (!params) {
            return pattern;
        }

        let url = pattern;

        Object.entries(params).forEach(([name, value]) => {
            const encodedValue = encodeURIComponent(value.toString());
            url = url.replace(":" + name, encodedValue);
        });

        return url;
    }
}
