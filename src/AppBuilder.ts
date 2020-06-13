import {APIService} from "./api/APIService";
import Utility from "./util/Utility";
import {RetryWhenError} from "./util/RetryWhenError";
import {InitConfiguration, InitializeProjectRequest, InnerEnvironmentVariableForDeploymentKeyItem} from "./type";
import {APIClient} from "./api/APIClient";

export class AppBuilder {
    constructor(private readonly config: InitConfiguration) {}

    async build() {
        await this.initNetworking();
        await this.createProject();
        await this.connectRepo();
        await this.setBuildConfiguration();
        await this.triggerBuildAndWait();
        await this.disconnectRepo();
    }

    private async initNetworking() {
        this.log(`initialization networking ...`);

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
    private async createProject() {
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
    private async connectRepo() {
        const {name} = this.config.project;
        const {url} = this.config.repo;

        this.log("connecting to repo ...");
        await APIService.setRepoConfiguration(name, {repo_url: url});
        this.log("repo connected: " + url, true);
    }

    @RetryWhenError()
    private async setBuildConfiguration() {
        this.log("setting build configuration ...");

        const {name} = this.config.project;
        const {branch = "master"} = this.config.repo;
        const {buildSetting} = this.config;

        if (buildSetting.innerEnvironmentVariables) {
            const deploymentKeyItem = buildSetting.innerEnvironmentVariables.find(_ => _.value.type === "deployment-key");
            if (deploymentKeyItem) {
                const value = deploymentKeyItem.value as InnerEnvironmentVariableForDeploymentKeyItem;
                const deploymentKey = await APIService.getDeploymentKey(name, value.deploymentName);
                this.log(`deployment key fetched, added into env variable as [${deploymentKeyItem.name}]`);
                buildSetting.environmentVariables[deploymentKeyItem.name] = deploymentKey;
            }

            const appSecretItem = buildSetting.innerEnvironmentVariables.find(_ => _.value.type === "app-secret");
            if (appSecretItem) {
                const appSecret = (await APIService.getProject(name)).app_secret;
                this.log(`app secret fetched, added into env variable as [${appSecretItem.name}]`);
                buildSetting.environmentVariables[appSecretItem.name] = appSecret;
            }

            delete buildSetting.innerEnvironmentVariables;
        }

        await APIService.setBuildConfiguration(name, branch, {...buildSetting, trigger: "manual"});
        this.log(`build configuration set`, true);
    }

    private async triggerBuildAndWait() {
        this.log("triggering build");

        const {name, os} = this.config.project;
        const {branch = "master"} = this.config.repo;

        const {buildId, buildURL} = await APIService.triggerAppBuild(name, branch);
        this.log(`build #${buildId} triggered, check status at: ${buildURL}`);
        await Utility.delay(os === "iOS" ? 650 : 400);

        let buildSuccess = false;
        while (true) {
            try {
                const response = await APIService.checkBuildStatus(name, buildId);
                this.log(`build status polled, status: ${response.status}, result: ${response.result || "<N/A>"}`);
                if (response.status === "completed") {
                    if (response.result === "succeeded") {
                        buildSuccess = true;
                    }
                    break;
                } else {
                    await Utility.delay(20);
                }
            } catch (e) {
                console.warn("[pollingBuildStatus] failed, retry in 10 seconds, error:");
                console.warn(e);
                await Utility.delay(10);
            }
        }

        if (!buildSuccess) {
            throw new Error("AppCenter Build not success, please visit AppCenter for details");
        }
    }

    @RetryWhenError()
    private async disconnectRepo() {
        if (this.config.disconnectRepoOnFinish) {
            this.log("disconnecting repository ...");
            await APIService.disconnectRepo(this.config.project.name);
            this.log("disconnecting repository ...");
        }
    }

    private log(content: string, extraLineBreak: boolean = false) {
        const {project, logLevel} = this.config;
        if (logLevel !== "none") {
            console.info(`[${project.name}] [${new Date().toLocaleString()}] ${content}`);
            if (extraLineBreak) {
                console.info("");
            }
        }
    }
}
