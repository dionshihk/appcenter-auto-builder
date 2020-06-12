import {APIService} from "./api/APIService";
import Utility from "./util/Utility";
import {RetryWhenError} from "./util/RetryWhenError";
import {InitConfiguration} from "./type";

/**
 * Usage:
 * yarn ts-node <merchant>/build.ts demo-game-ios
 */
interface Config {
    envName: string;
    displayName: string;
    staticBucketName: string;
    isDev?: boolean;
    iosConfig?: {
        gameProvisionalProfilePath: string;
        portalProvisionalProfilePath: string;
        iosCertificatePath: string;
    };
}

export class AppBuilder {
    constructor(private readonly config: InitConfiguration) {}

    async build() {
        await this.createProject();
        await this.connectRepo();
        await this.setBuildConfiguration();
        await this.triggerBuildAndWait();
        await this.disconnectRepo();
    }

    @RetryWhenError()
    private async createProject() {
        this.log("checking if project exists ...");
        const {name, platform, os} = this.config.project;
        const appExist = await APIService.checkAppExist(name);
        if (appExist) {
            this.log("project exists, proceed", true);
        } else {
            this.log("project not exists, creating one ...");
            await APIService.createProject({display_name: name, name, os, platform});
            console.info(`project created`, true);
        }
    }

    @RetryWhenError()
    private async connectRepo() {
        const {name} = this.config.project;
        const {url} = this.config.repo;
        this.log("connecting to repo");
        await APIService.setRepositoryConfiguration(name, {repo_url: url});
        this.log("repo connected: " + url, true);
    }

    @RetryWhenError()
    private async setBuildConfiguration() {
        this.log("setting build configuration ...");

        const {name} = this.config.project;
        const {branch = "master"} = this.config.repo;
        const {buildSetting} = this.config;
        if (buildSetting.innerEnvironmentVariables) {
            const deploymentKey = await APIService.getDeploymentKey(name);
            const appSecret = await APIService.getAppSecret(name);

            buildSetting.innerEnvironmentVariables.forEach(({name, value}) => {
                switch (value) {
                    case "<appSecretKey>":
                        buildSetting.environmentVariables[name] = appSecret;
                        break;
                    case "<deploymentKey>":
                        buildSetting.environmentVariables[name] = deploymentKey;
                        break;
                }
            });
            delete buildSetting.innerEnvironmentVariables;
        }

        await APIService.setBuildConfiguration(name, branch, buildSetting);
        this.log(`build configuration set`, true);
    }

    private async triggerBuildAndWait(): Promise<void> {
        // console.info(`\n[${this.projectName}] triggering build process ...`);
        // const {buildId, buildURL} = await APIService.triggerAppBuild(this.projectName, this.config.isDev ? "master" : "release");
        // console.info(`[${this.projectName}] build process triggered, waiting for status change, build ID: ${buildId}`);
        // console.info(`[${this.projectName}] build URL: ${buildURL}`);
        // await Utility.delay(this.projectName.endsWith("ios") ? 650 : 400);
        //
        // while (true) {
        //     try {
        //         const response = await APIService.checkBuildStatus(this.projectName, buildId);
        //         console.info(`[${this.projectName}] build status polled, status: ${response.status}, result: ${response.result || "<N/A>"}`);
        //         if (response.status === "completed") {
        //             console.info(`[${this.projectName}] build status updated: \n${JSON.stringify(response)}`);
        //             return response.result === "succeeded";
        //         } else {
        //             await Utility.delay(20);
        //         }
        //     } catch (e) {
        //         console.info(`[${this.projectName}] build status polling failed, retry in 10 seconds`);
        //         console.error(e);
        //         await Utility.delay(10);
        //     }
        // }
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
