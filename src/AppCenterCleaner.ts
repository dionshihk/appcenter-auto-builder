import {AppCenterCleanerIncludeModeConfiguration, AppCenterCleanerExcludeModeConfiguration, GetProjectsResponse} from "./type";
import {APIClient} from "./api/APIClient";
import {APIService} from "./api/APIService";

export class AppCenterCleaner {
    private appCenterProjects: string[] = [];
    private projectsToRemove: string[] = [];

    constructor(private readonly config: AppCenterCleanerExcludeModeConfiguration | AppCenterCleanerIncludeModeConfiguration) {}

    async clean() {
        try {
            const {apiToken, owner} = this.config;

            APIClient.init(apiToken, owner.name);
            await this.initNetworking();
            await this.getAppCenterProjects();
            this.filterProjects();
            await this.deleteProjects();
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    private async initNetworking(): Promise<void> {
        this.log("initialize networking...");

        const {owner} = this.config;

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

    private async getAppCenterProjects() {
        this.log("fetching existing projects...");

        const {owner} = this.config;

        let projects: GetProjectsResponse[] = [];
        if (owner.type === "individual") {
            projects = await APIService.getUserProjects();
        } else {
            projects = await APIService.getOrganizationProjects();
        }

        this.appCenterProjects = projects.map(project => project.name);

        this.log("projects fetched", true);
    }

    private filterProjects() {
        this.log("filter projects to delete...");

        if ("include" in this.config) {
            this.log(`filtering project in include mode...`);
            const {include} = this.config;
            this.projectsToRemove = include(this.appCenterProjects);
        } else {
            this.log(`filtering project in exclude mode...`);
            const {exclude} = this.config;
            const projectsToKeep = exclude(this.appCenterProjects);
            this.projectsToRemove = this.appCenterProjects.filter(_ => !projectsToKeep.includes(_));
        }

        this.log(`found ${this.projectsToRemove.length} projects need to be deleted`, true);
    }

    private async deleteProjects() {
        if (this.config.dryMode) {
            this.log(`dry mode detected, logging projects instead...`);
            for (const app of this.projectsToRemove) {
                console.info(app);
            }
            this.log(`AppCenter cleanup completed`, true);
        } else {
            this.log("deleting projects...");
            for (const app of this.projectsToRemove) {
                await APIService.deleteProject(app);
            }
            this.log(`${this.projectsToRemove.length} projects are gracefully removed`, true);
        }
    }

    private log(content: string, extraLineBreak: boolean = false): void {
        console.info(`[${new Date().toLocaleString()}] ${content}`);
        if (extraLineBreak) {
            console.info("");
        }
    }
}
