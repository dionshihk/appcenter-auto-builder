import {AppCenterBuilderConfiguration} from "./type";
import {AppBuilder} from "./AppBuilder";

export async function startAppCenterBuilder(config: AppCenterBuilderConfiguration): Promise<void> {
    try {
        const builder = new AppBuilder(config);
        await builder.build();
    } catch (e) {
        console.error("\nAppBuilder terminated due to the following error:");
        console.error(e);
        config.onError?.(e);
        process.exit(1);
    }
}
