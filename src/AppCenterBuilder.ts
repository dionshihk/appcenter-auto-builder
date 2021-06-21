import {APIService} from "./api/APIService";
import {AppCenterUtility} from "./AppCenterUtility";
import {RetryWhenError} from "./decorator/RetryWhenError";
import {IgnoreError} from "./decorator/IgnoreError";
import {AppCenterBuilderConfiguration, InitializeProjectRequest, ExtraEnvironmentVariableForDeploymentKeyItem, AppCenterBuildContext, BuildDownloadType} from "./type";
import {APIClient} from "./api/APIClient";

export class AppCenterBuilder {
    constructor(private readonly config: AppCenterBuilderConfiguration) {}

    async build(): Promise<AppCenterBuildContext> {
        await this.initNetworking();
        await this.createProject();
        await this.connectRepo();
        await this.setBuildConfiguration();

        const buildId = await this.triggerBuild();
        await AppCenterUtility.delay(this.config.buildEstDuration || (this.config.project.os === "iOS" ? 650 : 400));
        await this.checkBuildStatus(buildId);

        return {
            buildId: () => buildId,
            disconnect: () => this.disconnectRepo(),
            downloadPath: type => this.getDownloadPath(buildId, type),
        };
    }

    @RetryWhenError()
    private async initNetworking(): Promise<void> {
        this.log(`initialize networking ...`);

        const {apiToken, owner} = this.config;
        APIClient.init(apiToken, owner.name);

        if (owner.type === "individual") {
            const {name} = await APIService.getUser();
            if (name !== owner.name) {
                throw new Error(`Specified individual name [${owner.name}] does not match AppCenter owner name [${name}]`);
            }
        } else {
            const orgs = await APIService.getOrganizations();
            if (orgs.every(_ => _.name !== owner.name)) {
                throw new Error(`Specified organization name [${owner.name}] does not match any AppCenter organization names: \n${orgs.map(_ => _.name).join(" / ")}`);
            }
        }

        this.log(`networking initialized with validated AppCenter owner: ${owner.name}`, true);
    }

    @RetryWhenError()
    private async createProject(): Promise<void> {
        this.log("checking if project exists ...");

        const {
            project: {name, platform, os, description},
            owner,
        } = this.config;
        const projectExist = await APIService.checkProjectExist(name);

        if (projectExist) {
            this.log("project exists, updating ...");
            // We cannot update its name, because the name is the key to retrieval of existing projects
            await APIService.updateProject(name, {description});
            this.log(`project updated`, true);
        } else {
            this.log("project not exists, creating one ...");
            const request: InitializeProjectRequest = {display_name: name, name, os, platform, description};
            if (owner.type === "individual") {
                await APIService.createUserProject(request);
            } else {
                await APIService.createOrganizationProject(request);
            }
            this.log(`project created`, true);
        }
    }

    @RetryWhenError()
    private async connectRepo(): Promise<void> {
        const {name} = this.config.project;
        const {url} = this.config.repo;

        this.log("connecting to repo ...");
        await APIService.setRepoConfiguration(name, {repo_url: url});
        this.log("repo connected: " + url, true);
    }

    @RetryWhenError()
    private async setBuildConfiguration(): Promise<void> {
        this.log("setting build configuration ...");

        const {
            project: {name},
            repo: {branch = "master"},
            buildSetting,
            extraBuildEnvironmentVariables,
        } = this.config;

        if (extraBuildEnvironmentVariables) {
            const deploymentKeyItem = extraBuildEnvironmentVariables.find(_ => _.value.type === "deployment-key");
            if (deploymentKeyItem) {
                const value = deploymentKeyItem.value as ExtraEnvironmentVariableForDeploymentKeyItem;
                const existingDeployments = await APIService.getDeployments(name);
                const matchedDeployment = existingDeployments.find(_ => _.name === value.deploymentName);
                const deploymentKey = matchedDeployment?.key || (await APIService.createDeployment(name, value.deploymentName)).key;
                this.log(`deployment key fetched, injected into env variable as [${deploymentKeyItem.name}]`);
                buildSetting.environmentVariables.push({
                    name: deploymentKeyItem.name,
                    value: deploymentKey,
                    isSecret: true,
                });
            }

            const appSecretItem = extraBuildEnvironmentVariables.find(_ => _.value.type === "app-secret");
            if (appSecretItem) {
                const appSecret = (await APIService.getProject(name)).app_secret;
                this.log(`app secret fetched, injected into env variable as [${appSecretItem.name}]`);
                buildSetting.environmentVariables.push({
                    name: appSecretItem.name,
                    value: appSecret,
                    isSecret: true,
                });
            }
        }

        await APIService.setBuildConfiguration(name, branch, buildSetting);
        this.log(`build configuration set`, true);
    }

    @RetryWhenError()
    private async triggerBuild(): Promise<number> {
        this.log("triggering build ...");
        const {
            project: {name},
            repo: {branch = "master"},
        } = this.config;

        const {id} = await APIService.triggerBuild(name, branch);
        const buildURL = `https://appcenter.ms/users/${APIClient.ownerName()}/apps/${name}/build/branches/${branch}/builds/${id}`;
        this.log(`build #${id} triggered, check status at: ${buildURL}`);

        return id;
    }

    private async checkBuildStatus(buildId: number): Promise<void> {
        const {
            project: {name},
        } = this.config;

        let errorTimes = 0;
        let buildSuccess = false;
        while (true) {
            try {
                const response = await APIService.getBuildStatus(name, buildId);
                this.log(`build status checked, status: ${response.status}, result: ${response.result || "<N/A>"}`);
                if (response.status === "completed") {
                    if (response.result === "succeeded") {
                        buildSuccess = true;
                    }
                    break;
                } else {
                    await AppCenterUtility.delay(20);
                }
            } catch (e) {
                console.warn("[pollingBuildStatus] failed, retry in 10 seconds, error:");
                console.warn(e);
                await AppCenterUtility.delay(10);
                errorTimes++;

                if (errorTimes >= 30) {
                    // Believe it is time to break the loop
                    break;
                }
            }
        }

        if (!buildSuccess) {
            throw new Error("AppCenter Build not success, please visit AppCenter for details");
        }
    }

    @IgnoreError("Please disconnect repo manually after build completes")
    private async disconnectRepo(): Promise<void> {
        const {name} = this.config.project;
        await APIService.disconnectRepo(name);
    }

    @RetryWhenError()
    private async getDownloadPath(buildId: number, type: BuildDownloadType): Promise<string> {
        const {name} = this.config.project;
        const {uri} = await APIService.getBuildDownload(name, buildId, type);
        return uri;
    }

    private log(content: string, extraLineBreak: boolean = false): void {
        const {project, logLevel} = this.config;
        if (logLevel !== "none") {
            console.info(`[${project.name}] [${new Date().toLocaleString()}] ${content}`);
            if (extraLineBreak) {
                console.info("");
            }
        }
    }
}
