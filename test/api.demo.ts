import {APIService} from "../src/api/APIService";
import {APIClient} from "../src/api/APIClient";

async function test() {
    try {
        APIClient.init("<Your API Token>", "<Your Account Name>");
        const response = await APIService.getBuildDownload("test-app-name", 1, "build");
        console.info(response);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
