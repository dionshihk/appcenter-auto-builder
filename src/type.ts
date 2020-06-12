export interface InitConfiguration {
    apiToken: string;
    project: {
        name: string;
        os: ProjectOS;
        platform: ProjectPlatform;
    };
    repo: {
        url: string;
        branch?: string; // Default: master
    };
    owner: {
        type: "individual" | "organization";
        name: string;
    };
    buildSetting: AppBuildConfiguration;
    disconnectRepoOnFinish?: boolean; // Default: false
    logLevel?: "none" | "verbose"; // Default: verbose
}

export type ProjectOS = "iOS" | "Android";

export type ProjectPlatform = "React-Native" | "Objective-C-Swift" | "Java" | "UWP" | "Cordova" | "Unity" | "Xamarin" | "Unknown";

export interface InitializeProjectRequest {
    display_name: string;
    name: string;
    os: ProjectOS;
    platform: ProjectPlatform;
}

export interface GetProjectResponse {
    id: string;
    app_secret: string;
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

export interface AppBuildConfiguration {
    environmentVariables: Array<{
        name: string;
        value: string;
        isSecret?: boolean;
    }>;
    /**
     * Attention:
     * innerEnvironmentVariables is not part of AppBuildConfiguration API spec.
     * It is helpful if you want to inject some project-specific values as part of environmentVariables.
     *
     * For example, if you specify `{innerEnvironmentVariables: [{MY_SECRET: "<appSecretKey>"}]}`,
     * {MY_SECRET: "Your Real App Secret Key ..."} will be appended into environmentVariables, with isSecret = true.
     */
    innerEnvironmentVariables: Array<{
        name: string;
        value: "<deploymentKey>" | "<appSecretKey>";
    }>;
    artifactVersioning: {buildNumberFormat: "buildId" | "timestamp"};
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
