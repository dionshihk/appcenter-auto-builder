import {AppCenterCleaner, AppCenterCleanerConfiguration} from "../src/index";

const config: AppCenterCleanerConfiguration = {
    apiToken: "<Your API Token>",
    owner: {
        type: "individual",
        name: "<Your Account Name>",
    },
    projectFilter: () => ["my-unwanted-project"],
};

async function start() {
    try {
        await new AppCenterCleaner(config).clean();
    } catch (e) {
        console.error(e);
    }
}

start();
