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
    /**
     * For details, please refer to:
     * https://openapi.appcenter.ms/#/build/branchConfigurations_create
     */
    buildSetting: BuildConfiguration;
    /**
     * It is helpful if you want to inject some project-specific values as part of environmentVariables.
     * For example, if you specify `{extraBuildEnvironmentVariables: [{MY_SECRET: "<appSecretKey>"}]}`,
     * {MY_SECRET: "Your Real App Secret Key ..."} will be appended into buildSetting.environmentVariables, with isSecret = true.
     */
    extraBuildEnvironmentVariables?: Array<{
        name: string;
        value: ExtraEnvironmentVariableForAppSecret | ExtraEnvironmentVariableForDeploymentKeyItem;
    }>;
    /**
     * Default: false
     */
    disconnectRepoOnFinish?: boolean;
    /**
     * If none, only error & warning will be printed to console.
     * If verbose, all information including every step execution will be printed to console.
     * Default: "verbose"
     */
    logLevel?: "none" | "verbose";
    /**
     * An estimated build duration (in second).
     * After this duration, the script will poll the build completion status.
     * Default: 650 for iOS, 400 for Android
     */
    buildEstDuration?: number;
    /**
     * There is no mechanism to recover, all you can do here is to log the error, notify the developer, or etc.
     */
    onError?: (error: any) => void;
}

export type ProjectOS = "iOS" | "Android";

export type ProjectPlatform = "React-Native" | "Objective-C-Swift" | "Java" | "UWP" | "Cordova" | "Unity" | "Xamarin" | "Unknown";

export type OwnerType = "individual" | "organization";

export type ExtraEnvironmentVariableForDeploymentKeyItem = {type: "deployment-key"; deploymentName: string};

export type ExtraEnvironmentVariableForAppSecret = {type: "app-secret"};

export interface XcodeSignatureHelperOptions {
    provisioningProfilePath: string;
    p12Path: string;
    p12Password: string;
}

export interface XcodeSignatureConfiguration {
    certificateFileId?: string;
    certificateFilename?: string;
    certificateEncoded?: string;
    certificatePassword?: string;
    provisioningProfileFileId?: string;
    provisioningProfileFilename?: string;
    provisioningProfileEncoded?: string;
}

export interface BuildConfiguration {
    trigger: "continuous" | "manual";
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
            keystorePassword?: string;
            keyAlias?: string;
            keyPassword?: string;
            keystoreFilename?: string;
            keystoreEncoded: string;
        };
        xcode?: {
            projectOrWorkspacePath: string;
            scheme: string;
            xcodeVersion: string;
            podfilePath: string;
            appExtensionProvisioningProfileFiles?: Array<{
                fileName: string;
                fileId: string;
                uploadId: string;
                targetBundleIdentifier: string;
            }>;
        } & XcodeSignatureConfiguration;
        xamarin?: {
            slnPath?: string;
            isSimBuild?: boolean;
            args?: string;
            configuration?: string;
            p12File?: string;
            p12Pwd?: string;
            provProfile?: string;
            monoVersion?: string;
            sdkBundle?: string;
            symlink?: string;
        };
    };
    testsEnabled?: boolean;
    badgeIsEnabled?: boolean;
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

export interface GetDeploymentResponse {
    name: string;
    key: string;
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
