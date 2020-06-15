import {APIService} from "../src/api/APIService";
import {APIClient} from "../src/api/APIClient";

async function test() {
    try {
        APIClient.init("<Your API Token>", "<Your Owner Name>");
        const response = await APIService.getRepoConfiguration("dev-game-ios");
        console.info(response);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
