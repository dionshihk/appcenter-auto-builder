export interface InitConfiguration {
    apiToken: string;
    project: {
        name: string;
        os: ProjectOS;
        platform: ProjectPlatform;
        description?: string;
    };
    repo: {
        url: string;
        /**
         * Default: "master"
         */
        branch?: string;
    };
    owner: {
        type: OwnerType;
        name: string;
    };
    buildSetting: BuildConfiguration;
    /**
     * Default: false
     */
    disconnectRepoOnFinish?: boolean;
    /**
     * If none, only error & warning will be printed to console.
     * If verbose, all information including every step execution will be printed to console.
     * Default: verbose
     */
    logLevel?: "none" | "verbose";
    /**
     * There is no mechanism to recover, all you can do here is to log the error, notify the developer, or etc.
     */
    onError?: (error: any) => void;
}

export type ProjectOS = "iOS" | "Android";

export type ProjectPlatform = "React-Native" | "Objective-C-Swift" | "Java" | "UWP" | "Cordova" | "Unity" | "Xamarin" | "Unknown";

export type OwnerType = "individual" | "organization";

export type InnerEnvironmentVariableForDeploymentKeyItem = {type: "deployment-key"; deploymentName: string};

export type InnerEnvironmentVariableForAppSecret = {type: "app-secret"};

export interface BuildConfiguration {
    trigger: "continous" | "manual";
    artifactVersioning: {buildNumberFormat: "buildId" | "timestamp"};
    environmentVariables: Array<{
        name: string;
        value: string;
        isSecret?: boolean;
    }>;
    toolsets: {
        buildscripts?: {
            [key: string]: {
                postBuild?: string;
                postClone?: string;
                preBuild?: string;
            };
        };
        testcloud?: {
            deviceSelection: string;
            frameworkType: string;
            frameworkProperties: {[key: string]: any};
        };
        javascript?: {
            nodeVersion: string;
            packageJsonPath: string;
            runTests?: boolean;
        };
        android?: {
            buildVariant: string;
            automaticSigning: boolean;
            gradleWrapperPath: string;
            module: string;
            buildBundle?: boolean;
            runTests?: boolean;
            runLint?: boolean;
            isRoot?: boolean;
        };
        xcode?: {
            certificatePassword?: string;
            certificateFilename?: string;
            provisioningProfileFilename?: string;
            certificateFileId?: string;
            provisioningProfileFileId?: string;
            appExtensionProvisioningProfileFiles?: Array<{
                fileName: string;
                fileId: string;
                uploadId: string;
                targetBundleIdentifier: string;
            }>;
            projectOrWorkspacePath: string;
            scheme: string;
            xcodeVersion: string;
            podfilePath: string;
            provisioningProfileEncoded?: string;
            certificateEncoded?: string;
        };
    };
    /**
     * Attention:
     * innerEnvironmentVariables is not part of AppBuildConfiguration API spec.
     * It is helpful if you want to inject some project-specific values as part of environmentVariables.
     *
     * For example, if you specify `{innerEnvironmentVariables: [{MY_SECRET: "<appSecretKey>"}]}`,
     * {MY_SECRET: "Your Real App Secret Key ..."} will be appended into environmentVariables, with isSecret = true.
     */
    innerEnvironmentVariables?: Array<{
        name: string;
        value: InnerEnvironmentVariableForAppSecret | InnerEnvironmentVariableForDeploymentKeyItem;
    }>;
}

export interface InitializeProjectRequest {
    display_name: string;
    name: string;
    os: ProjectOS;
    platform: ProjectPlatform;
    description?: string;
}

/**
 * Not every field can be updated, after the project is created.
 */
export type UpdateProjectRequest = Pick<Partial<InitializeProjectRequest>, "name" | "display_name" | "description">;

export interface GetProjectResponse {
    id: string;
    display_name: string;
    app_secret: string;
    // There are more fields here, but we do not need
}

export interface GetUserResponse {
    id: string;
    display_name: string;
    name: string;
    email: string;
}

export interface GetOrganizationResponse {
    display_name: string;
    name: string;
}

export interface GetRepositoryConfigurationRequest {
    type: "github" | "bitbucket";
    state: "unauthorized" | "inactive" | "active";
    repo_url: string;
    id: string;
    user_email: string;
}

export interface SetRepositoryConfigurationRequest {
    repo_url: string;
}

export interface SetRepositoryConfigurationResponse {
    message: string;
}

export interface CreateDeploymentKeyResponse {
    name: string;
    key: string;
    latest_release: Object | null;
}

export interface TriggerBuildResponse {
    id: number;
    buildNumber: string;
    queueTime: string;
    startTime: string;
    finishTime: string;
    lastChangedDate: string;
    status: string;
    result: string;
    sourceBranch: string;
    sourceVersion: string;
}

export interface GetBuildStatusResponse {
    id: 0;
    buildNumber: string;
    queueTime: Date;
    startTime: Date;
    finishTime: Date;
    lastChangedDate: Date;
    status: "notStarted" | "inProgress" | "completed";
    result?: "canceled" | "succeeded" | "failed";
}
