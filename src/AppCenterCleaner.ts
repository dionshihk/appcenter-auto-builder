import {AppCenterCleanerConfiguration, GetProjectsResponse} from "./type";
import {APIClient} from "./api/APIClient";
import {APIService} from "./api/APIService";
import * as readline from "readline";

export class AppCenterCleaner {
    private readonly rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    private appCenterProjects: string[] = [];
    private projectsToRemove: string[] = [];

    constructor(private readonly config: AppCenterCleanerConfiguration) {}

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

        const {projectFilter: filter} = this.config;
        this.projectsToRemove = filter(this.appCenterProjects);

        this.log(`found ${this.projectsToRemove.length} projects need to be deleted`, true);
    }

    private async deleteProjects() {
        this.log("Projects marked with red color will be removed:");
        for (const app of this.appCenterProjects) {
            if (this.projectsToRemove.includes(app)) {
                console.info("\x1b[41m%s\x1b[0m", app);
            } else {
                console.info("\x1b[2m%s\x1b[0m", app);
            }
        }

        const confirmed = await this.booleanPrompt("Are you sure to delete all projected listed above ? (yes/no)\r\n");

        if (confirmed) {
            this.log("deleting projects...");
            for (const app of this.projectsToRemove) {
                await APIService.deleteProject(app);
            }
            this.log(`${this.projectsToRemove.length} projects are gracefully removed`, true);
        } else {
            this.log(`AppCenter cleanup terminated`, true);
        }

        process.exit(0);
    }

    private log(content: string, extraLineBreak: boolean = false): void {
        console.info(`[${new Date().toLocaleString()}] ${content}`);
        if (extraLineBreak) {
            console.info("");
        }
    }

    private async booleanPrompt(question: string) {
        return new Promise<boolean>(resolve => {
            this.rl.question(question, result => {
                const truthy = ["yes", "y"];
                const falsy = ["no", "n"];
                if (truthy.includes(result.toLowerCase())) {
                    resolve(true);
                } else if (falsy.includes(result.toLowerCase())) {
                    resolve(false);
                } else {
                    throw new Error("Unexpected input detected...");
                }
            });
        });
    }
}
