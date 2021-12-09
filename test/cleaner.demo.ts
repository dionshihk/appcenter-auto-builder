import {AppCenterCleaner, AppCenterCleanerIncludeModeConfiguration, AppCenterCleanerExcludeModeConfiguration, AppCenterCleanerConfigurationBase} from "../src/index";

const configBase: AppCenterCleanerConfigurationBase = {
    apiToken: "<Your API Token>",
    owner: {
        type: "individual",
        name: "<Your Account Name>",
    },
    dryMode: false,
};

const includeModeConfig: AppCenterCleanerIncludeModeConfiguration = {
    ...configBase,
    include: appCenterProjects => ["my-unwanted-project"],
};
const excludeModeConfig: AppCenterCleanerExcludeModeConfiguration = {
    ...configBase,
    exclude: appCenterProjects => ["my-favorite-project"],
};

async function start() {
    try {
        await new AppCenterCleaner(includeModeConfig || excludeModeConfig).clean();
    } catch (e) {
        console.error(e);
    }
}

start();
