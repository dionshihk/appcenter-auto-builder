import {InitConfiguration} from "./type";
import {AppBuilder} from "./AppBuilder";

export function startAppCenterBuild(config: InitConfiguration): Promise<void> {
    return new AppBuilder(config).build();
}
