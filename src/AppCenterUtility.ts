import fs from "fs-extra";
import path from "path";
import https from "https";
import unzipper from "unzipper";
import {XcodeSignatureConfiguration, XcodeSignatureHelperOptions} from "./type";

export class AppCenterUtility {
    static fileContent(filePath: string, encoding?: BufferEncoding): string {
        return fs.readFileSync(filePath).toString(encoding);
    }

    static delay(second: number): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve, second * 1000));
    }

    static xcodeSignatureHelper({provisioningProfilePath, p12Password, p12Path}: XcodeSignatureHelperOptions): XcodeSignatureConfiguration {
        const provisioningProfileEncoded = AppCenterUtility.fileContent(provisioningProfilePath, "base64");
        const certificateEncoded = AppCenterUtility.fileContent(p12Path, "base64");
        return {
            provisioningProfileEncoded,
            certificateEncoded,
            provisioningProfileFilename: path.basename(provisioningProfilePath),
            certificateFilename: path.basename(p12Path),
            certificatePassword: p12Password,
        };
    }

    /**
     * @param uri: should be GetBuildDownloadResponse.uri, which is a zip archive including the bundle
     * @param targetPath: should end with extension ".ipa" or ".apk"
     */
    static extractBuildZip(uri: string, targetPath: string): Promise<void> {
        // Throws if cannot locate the bundle file
        const retrieveBundlePath = (unzippedFolder: string): string => {
            const ext = path.extname(targetPath); // ".ipa" or ".apk"
            if (!ext) {
                throw new Error(`${targetPath} has no extension`);
            }
            const files = fs.readdirSync(unzippedFolder).map(_ => path.join(unzippedFolder, _));
            while (files.length > 0) {
                const file = files.shift()!; // Must exist
                if (fs.statSync(file).isDirectory()) {
                    files.push(...fs.readdirSync(file).map(_ => path.join(file, _)));
                } else {
                    if (path.extname(file) === ext) {
                        return file;
                    }
                }
            }
            throw new Error(`Cannot locate a file ending with ${ext} in zip`);
        };
        const log = (text: string) => console.info(`[Extract Build Zip] ${text}`);

        log(`Downloading from ${uri} ...`);
        return new Promise<void>((resolve, reject) => {
            https
                .get(uri, response => {
                    if (response.statusCode === 200) {
                        const targetFolder = path.dirname(targetPath) + "/";
                        const tmpUnzippedFolder = fs.mkdtempSync(targetFolder);
                        log(`Response received, unzip at ${tmpUnzippedFolder} ...`);

                        response.pipe(unzipper.Extract({path: tmpUnzippedFolder})).on("close", () => {
                            try {
                                const bundleFilePath = retrieveBundlePath(tmpUnzippedFolder);
                                log(`Bundle file located: ${bundleFilePath}`);

                                if (fs.existsSync(targetPath)) {
                                    log(`Target file ${targetPath} exists, removing ...`);
                                    fs.removeSync(targetPath);
                                }

                                log(`Moving bundle to ${targetPath} ...`);
                                fs.moveSync(bundleFilePath, targetPath);
                            } catch (e) {
                                log(`Failed to locate bundle path`);
                                reject(e);
                            } finally {
                                fs.removeSync(tmpUnzippedFolder);
                            }
                        });
                    } else {
                        reject("Response Status Not OK: " + response.statusCode);
                    }
                })
                .on("error", reject);
        });
    }
}
