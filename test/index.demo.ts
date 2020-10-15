import path from "path";
import {AppCenterBuilder, AppCenterBuilderConfiguration, AppCenterUtility} from "../src/index";

const config: AppCenterBuilderConfiguration = {
    apiToken: "<Your API Token>",
    project: {
        name: "test-rn-ios",
        os: "iOS",
        platform: "React-Native",
        description: "My test app",
    },
    repo: {
        url: "https://github.com/dionshihk/some-ios-project",
    },
    owner: {
        type: "individual",
        name: "<Your Account Name>",
    },
    buildSetting: {
        trigger: "manual",
        artifactVersioning: {buildNumberFormat: "buildId"},
        environmentVariables: [
            {name: "TEST_ENV_1", value: "1"},
            {name: "TEST_ENV_2", value: Date.now().toString()},
        ],
        toolsets: {
            javascript: {
                packageJsonPath: "package.json",
                nodeVersion: "12.x",
            },
            buildscripts: {
                "package.json": {
                    preBuild: `appcenter-pre-build.sh`,
                    postBuild: `appcenter-post-build.sh`,
                },
            },
            xcode: {
                podfilePath: "ios/Podfile",
                projectOrWorkspacePath: "ios/project.xcworkspace",
                scheme: "project",
                xcodeVersion: "11.2.1",
                ...AppCenterUtility.xcodeSignatureHelper({
                    provisioningProfilePath: path.resolve(__dirname, "./ios-cert/app.mobileprovision"),
                    p12Path: path.resolve(__dirname, "./ios-cert/ios.p12"),
                    p12Password: "<Your Cert Password>",
                }),
            },
        },
    },
    extraBuildEnvironmentVariables: [{name: "APP_SECRET", value: {type: "app-secret"}}],
    buildEstDuration: 200,
};

async function start() {
    try {
        const context = await new AppCenterBuilder(config).build();
        const buildId = context.buildId();
        console.info("Build done, ID: " + buildId);

        const downloadURL = await context.downloadPath("build");
        const localPath = path.resolve(__dirname, "./build-download/test.ipa");
        await AppCenterUtility.extractBuildZip(downloadURL, localPath);
        console.info("Download bundle to: " + localPath);

        await context.disconnect();
        console.info("Download done, repo disconnected");
    } catch (e) {
        console.error(e);
    }
}

start();
