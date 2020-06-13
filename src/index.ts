import {InitConfiguration} from "./type";
import {AppBuilder} from "./AppBuilder";

export async function startAppCenterBuild(config: InitConfiguration): Promise<void> {
    try {
        const builder = new AppBuilder(config);
        await builder.build();
    } catch (e) {
        console.error("AppBuilder terminated due to the following error:");
        console.error(e);
        config.onError?.(e);
        process.exit(1);
    }
}
