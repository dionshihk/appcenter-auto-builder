import * as fs from "fs";
import {XcodeSignatureConfiguration, XcodeSignatureHelperOptions} from "./type";
import path from "path";

export default class Utility {
    static fileContent(filePath: string, encoding?: BufferEncoding) {
        return fs.readFileSync(filePath).toString(encoding);
    }

    static delay(second: number) {
        return new Promise<void>(resolve => setTimeout(resolve, second * 1000));
    }

    static xcodeSignatureHelper({provisioningProfilePath, p12Password, p12Path}: XcodeSignatureHelperOptions): XcodeSignatureConfiguration {
        const provisioningProfileEncoded = Utility.fileContent(provisioningProfilePath, "base64");
        const certificateEncoded = Utility.fileContent(p12Path, "base64");
        return {
            provisioningProfileEncoded,
            certificateEncoded,
            provisioningProfileFilename: path.basename(provisioningProfilePath),
            certificateFilename: path.basename(p12Path),
            certificatePassword: p12Password,
        };
    }
}
