import fs from "fs-extra";
import axios, {AxiosResponse} from "axios";
import path from "path";
import {Stream} from "stream";
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

    static readableFileSize(size: number): string {
        const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        let i = 0;
        while (size >= 1024) {
            size /= 1024;
            i++;
        }
        return size.toFixed(2) + " " + units[i];
    }

    static async downloadChunkedFile(uri: string, path: string): Promise<void> {
        return new Promise<void>(resolve => {
            https.get(uri, response => {
                const writer = fs.createWriteStream(path);
                response.on("data", chunk => writer.write(chunk));
                response.on("end", () => {
                    writer.close();
                    resolve();
                });
            });
        });
    }

    /**
     * @param uri: should be GetBuildDownloadResponse.uri, which is a zip archive including the bundle
     * @param targetPath: should end with extension ".ipa" or ".apk"
     */
    static async extractBuildZip(uri: string, targetPath: string): Promise<void> {
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

        const targetFolder = path.dirname(targetPath) + "/";
        const tmpUnzippedFolder = fs.mkdtempSync(targetFolder);

        try {
            log(`Downloading from: ${uri}`);
            const tmpDownloadPath = tmpUnzippedFolder + "/download.zip";
            await AppCenterUtility.downloadChunkedFile(uri, tmpDownloadPath);
            log(`File size: ${AppCenterUtility.readableFileSize(fs.statSync(tmpDownloadPath).size)}`);
            log(`Downloaded to: ${tmpDownloadPath}`);

            log(`Extracting to: ${tmpUnzippedFolder}`);
            const zip = await unzipper.Open.file(tmpDownloadPath);
            await zip.extract({path: tmpUnzippedFolder});

            const bundleFilePath = retrieveBundlePath(tmpUnzippedFolder);
            log(`Bundle file located: ${bundleFilePath}`);

            if (fs.existsSync(targetPath)) {
                fs.removeSync(targetPath);
                log(`Target file ${targetPath} exists already, removed`);
            }

            log(`Moving bundle to: ${targetPath}`);
            fs.moveSync(bundleFilePath, targetPath);
        } finally {
            fs.removeSync(tmpUnzippedFolder);
        }
    }
}
