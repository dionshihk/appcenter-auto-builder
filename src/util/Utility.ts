import * as fs from "fs";

export default class Utility {
    static readFile(filePath: string, encoding?: BufferEncoding) {
        return fs.readFileSync(filePath).toString(encoding);
    }

    static delay(second: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, second * 1000));
    }
}
