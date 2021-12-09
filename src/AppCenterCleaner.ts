import {AppCenterCleanerConfiguration, GetProjectsResponse} from "./type";
import {APIClient} from "./api/APIClient";
import {APIService} from "./api/APIService";
import {AppCenterUtility} from "./AppCenterUtility";
import {RetryWhenError} from "./decorator/RetryWhenError";
import {IgnoreError} from "./decorator/IgnoreError";

export class AppCenterCleaner {
    private appCenterProjects: string[] = [];

    constructor(private readonly config: AppCenterCleanerConfiguration) {}

    async clean() {
        const {apiToken, owner, projectFilter} = this.config;

        APIClient.init(apiToken, owner.name);
        await this.initNetworking();
        await this.getAppCenterProjects();

        const projectsToRemove = projectFilter(this.appCenterProjects).filter(_ => this.appCenterProjects.includes(_));
        await this.deleteProjects(projectsToRemove);
    }

    @RetryWhenError()
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

    @RetryWhenError()
    private async getAppCenterProjects() {
        this.log("fetching existing projects...");

        let projects: GetProjectsResponse[];
        if (this.config.owner.type === "individual") {
            projects = await APIService.getUserProjects();
        } else {
            projects = await APIService.getOrganizationProjects();
        }
        this.appCenterProjects = projects.map(project => project.name);

        this.log(`${this.appCenterProjects.length} projects fetched`, true);
    }

    private async deleteProjects(projectsToRemove: string[]) {
        if (projectsToRemove.length === 0) {
            this.log(`done, no matched projects`, true);
        } else {
            for (const app of this.appCenterProjects) {
                if (projectsToRemove.includes(app)) {
                    console.info("\x1b[41m%s\x1b[0m", app);
                } else {
                    console.info("\x1b[2m%s\x1b[0m", app);
                }
            }

            if (await AppCenterUtility.confirm(`${projectsToRemove.length} projects (marked with RED) will be removed, are you sure?`)) {
                for (const app of projectsToRemove) {
                    await this.deleteProject(app);
                }
            }
        }
    }

    @IgnoreError()
    private async deleteProject(name: string) {
        this.log(`Removing project [${name}] ...`);
        await APIService.deleteProject(name);
    }

    private log(content: string, extraLineBreak: boolean = false): void {
        console.info(`[${new Date().toLocaleString()}] ${content}`);
        if (extraLineBreak) {
            console.info("");
        }
    }
}
