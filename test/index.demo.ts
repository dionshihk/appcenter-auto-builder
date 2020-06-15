import {startAppCenterBuilder} from "../src";
import {AppCenterBuilderConfiguration} from "../src/type";
import Utility from "../src/Utility";
import path from "path";

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
                ...Utility.xcodeSignatureHelper({
                    provisioningProfilePath: path.resolve(__dirname, "./ios-cert/app.mobileprovision"),
                    p12Path: path.resolve(__dirname, "./ios-cert/ios.p12"),
                    p12Password: "<Your Cert Password>",
                }),
            },
        },
    },
    extraBuildEnvironmentVariables: [{name: "APP_SECRET", value: {type: "app-secret"}}],
    disconnectRepoOnFinish: false,
    buildEstDuration: 200,
};

startAppCenterBuilder(config);
