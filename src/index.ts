import {InitConfiguration} from "./type";
import {AppBuilder} from "./AppBuilder";
import Utility from "./util/Utility";

export async function startAppCenterBuild(config: InitConfiguration): Promise<void> {
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

export const xcodeSignatureHelper = Utility.xcodeSignatureHelper;
