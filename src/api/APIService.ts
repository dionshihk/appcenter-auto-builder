import {APIClient} from "./APIClient";
import {
    InitializeProjectRequest,
    SetRepositoryConfigurationRequest,
    SetRepositoryConfigurationResponse,
    BuildConfiguration,
    GetDeploymentResponse,
    GetRepositoryConfigurationRequest,
    TriggerBuildResponse,
    GetBuildStatusResponse,
    GetProjectResponse,
    GetUserResponse,
    GetOrganizationResponse,
    UpdateProjectRequest,
} from "../type";

/**
 * Reference: https://openapi.appcenter.ms/
 */
export class APIService {
    static async getUser(): Promise<GetUserResponse> {
        return APIClient.ajax("GET", "/v0.1/user", {});
    }

    static async getOrganizations(): Promise<GetOrganizationResponse[]> {
        return APIClient.ajax("GET", "/v0.1/orgs", {});
    }

    static async getProject(appName: string): Promise<GetProjectResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName", {appName, ownerName});
    }

    static async updateProject(appName: string, request: UpdateProjectRequest): Promise<GetProjectResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("PATCH", "/v0.1/apps/:ownerName/:appName", {appName, ownerName}, request);
    }

    static async createUserProject(request: InitializeProjectRequest): Promise<GetProjectResponse> {
        return APIClient.ajax("POST", "/v0.1/apps", {}, request);
    }

    static async createOrganizationProject(request: InitializeProjectRequest): Promise<GetProjectResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("POST", "/v0.1/orgs/:ownerName/apps", {ownerName}, request);
    }

    static async checkProjectExist(appName: string): Promise<boolean> {
        try {
            await APIService.getProject(appName);
            return true;
        } catch (e) {
            // If not exist, API 404 error
            return false;
        }
    }

    static async getRepoConfiguration(appName: string): Promise<GetRepositoryConfigurationRequest> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/repo_config", {ownerName, appName});
    }

    static async setRepoConfiguration(appName: string, request: SetRepositoryConfigurationRequest): Promise<SetRepositoryConfigurationResponse> {
        const ownerName = APIClient.ownerName();
        // No PUT method provided, repeated call has no side effects
        return APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/repo_config", {ownerName, appName}, request);
    }

    static async getBuildConfiguration(appName: string, branch: string): Promise<BuildConfiguration> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/branches/:branch/config", {ownerName, appName, branch});
    }

    static async setBuildConfiguration(appName: string, branch: string, request: BuildConfiguration): Promise<BuildConfiguration> {
        const ownerName = APIClient.ownerName();
        let config: BuildConfiguration | undefined;
        try {
            config = await APIService.getBuildConfiguration(appName, branch);
        } catch (e) {
            // If not exist, API 404 error
        }

        if (config) {
            return APIClient.ajax("PUT", "/v0.1/apps/:ownerName/:appName/branches/:branch/config", {ownerName, appName, branch}, {...config, ...request});
        } else {
            return APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/branches/:branch/config", {ownerName, appName, branch}, request);
        }
    }

    static async getBuildStatus(appName: string, buildId: number): Promise<GetBuildStatusResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/builds/:buildId", {appName, ownerName, buildId});
    }

    static async triggerBuild(appName: string, branch: string): Promise<TriggerBuildResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/branches/:branch/builds", {appName, ownerName, branch});
    }

    static async getDeployments(appName: string): Promise<GetDeploymentResponse[]> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("GET", "/v0.1/apps/:ownerName/:appName/deployments", {appName, ownerName});
    }

    static async createDeployment(appName: string, deploymentName: string): Promise<GetDeploymentResponse> {
        const ownerName = APIClient.ownerName();
        return APIClient.ajax("POST", "/v0.1/apps/:ownerName/:appName/deployments", {appName, ownerName}, {name: deploymentName});
    }

    static async disconnectRepo(appName: string): Promise<void> {
        const ownerName = APIClient.ownerName();
        await APIClient.ajax("DELETE", "/v0.1/apps/:ownerName/:appName/repo_config", {appName, ownerName});
    }
}
