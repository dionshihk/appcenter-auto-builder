import {APIClient} from "./APIClient";
import {
    InitializeProjectRequest,
    SetRepositoryConfigurationRequest,
    SetRepositoryConfigurationResponse,
    AppBuildConfiguration,
    CreateDeploymentKeyResponse,
    GetRepositoryConfigurationRequest,
    TriggerBuildResponse,
    GetBuildStatusResponse,
    GetProjectResponse,
} from "../type";

export class APIService {
    static async createProject(request: InitializeProjectRequest): Promise<GetProjectResponse> {
        const organizationName = APIClient.ownerName();
        return APIClient.ajax("POST", "/v0.1/orgs/:organizationName/apps", {organizationName}, request);
    }

    static async getAppSecret(appName: string): Promise<string> {
        const ownerName = APIClient.ownerName();
        const {app_secret}: GetProjectResponse = await APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName", {appName, ownerName}, null);
        return app_secret;
    }

    static async getRepositoryConfiguration(appName: string): Promise<GetRepositoryConfigurationRequest> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/repo_config", {ownerName, appName}, null);
    }

    static async setRepositoryConfiguration(appName: string, request: SetRepositoryConfigurationRequest): Promise<SetRepositoryConfigurationResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/repo_config", {ownerName, appName}, request);
    }

    static async checkAppExist(appName: string): Promise<boolean> {
        try {
            const ownerName = APIClient.ownerName();
            await APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName", {ownerName, appName}, {});
            return true;
        } catch (e) {
            // Throw API 404 if the app not exist
            return false;
        }
    }

    static async getBuildConfiguration(appName: string, branch: string): Promise<AppBuildConfiguration> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/branches/:branch/config", {ownerName, appName, branch}, null);
    }

    static async setBuildConfiguration(appName: string, branch: string, request: AppBuildConfiguration): Promise<AppBuildConfiguration> {
        const ownerName = APIClient.ownerName();
        let config;
        try {
            config = await APIService.getBuildConfiguration(appName, branch);
        } catch (e) {
            console.info(`[${appName}] build configuration not found or unidentified error occurred, ignore and proceed`);
        }

        // should call PUT instead if have config already
        if (!config) {
            return APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/branches/:branch/config", {ownerName, appName, branch}, request);
        } else {
            return APIClient.ajax("PUT", "/v0.1/apps/:ownerName/:appName/branches/:branch/config", {ownerName, appName, branch}, {...config, ...request});
        }
    }

    static async getDeploymentKey(appName: string): Promise<string> {
        const ownerName = APIClient.ownerName();
        const deployments: CreateDeploymentKeyResponse[] = await APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/deployments", {appName, ownerName}, null);
        if (deployments.length === 0) {
            // all app use Staging deployment key
            const response: CreateDeploymentKeyResponse = await APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/deployments", {appName, ownerName}, {name: "Staging"});
            return response.key;
        } else {
            return deployments[0].key;
        }
    }

    static async checkBuildStatus(appName: string, buildId: number): Promise<GetBuildStatusResponse> {
        const ownerName = APIClient.ownerName();
        const response: GetBuildStatusResponse = await APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/builds/:buildId", {appName, ownerName, buildId}, null);
        return response;
    }

    static async triggerAppBuild(appName: string, branch: string): Promise<{buildId: number; buildURL: string}> {
        const ownerName = APIClient.ownerName();
        const response: TriggerBuildResponse = await APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/branches/:branch/builds", {appName, ownerName, branch}, null);

        return {
            buildId: response.id,
            buildURL: `https://appcenter.ms/users/${ownerName}/apps/${appName}/build/branches/${branch}/builds/${response.id}`,
        };
    }

    static async disconnectRepo(appName: string): Promise<void> {
        const ownerName = APIClient.ownerName();
        await APIClient.ajax("DELETE", "/v0.1/apps/:ownerName/:appName/repo_config", {appName, ownerName}, null);
    }
}
