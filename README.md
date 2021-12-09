## Introduction

This project provides an all-in-one script for Microsoft AppCenter: https://appcenter.ms/

This script automates the whole flow to create project, connect repo, configure build settings, and generate mobile apps.

## Installation

With Node environment, add this script to your dev dependencies.

`yarn add appcenter-auto-builder --dev`

Or

`npm install appcenter-auto-builder --save-dev`

## Usage - **AppCenterBuilder**

With a proper `AppCenterBuilderConfiguration` config, you can run it with `AppCenterBuilder`.

It returns a `Promise`, which resolves when the build succeeds, or rejects when errors occur.

The resolved object is an `AppCenterBuildContext`, with which you can handle the bundle, disconnect the repo, etc.

```typescript
import {AppCenterBuilderConfiguration, AppCenterBuilder} from "appcenter-auto-builder";

const config: AppCenterBuilderConfiguration = {
    apiToken: "<Your API Token>",
    project: {
        name: "test-react-native-ios",
        os: "iOS",
        platform: "React-Native",
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
            xcode: {
                 ....
            },
        },
    },
};

new AppCenterBuilder(config).build();
```

A complete TypeScript example (with async usage) can be found here:

https://github.com/dionshihk/appcenter-auto-builder/blob/master/test/index.demo.ts

To learn more about `AppCenterBuilderConfiguration` interface, please read `type.d.ts`, with proper comments.

## Usage - **AppCenterCleaner**

With a proper `AppCenterCleanerIncludeModeConfiguration` or `AppCenterCleanerExcludeModeConfiguration` config, you can run it with `AppCenterCleaner`.

```typescript
import {AppCenterCleaner, AppCenterCleanerIncludeModeConfiguration, AppCenterCleanerExcludeModeConfiguration} from "appcenter-auto-builder";

const includeModeConfig: AppCenterCleanerIncludeModeConfiguration = {
    apiToken: "<Your API Token>",
    owner: {
        type: "individual",
        name: "<Your Account Name>",
    },
    dryMode: false,
    include: appCenterProjects => ["my-unwanted-project"],
};

new AppCenterCleaner(includeModeConfig).clean();

// or

const excludeModeConfig: AppCenterCleanerExcludeModeConfiguration = {
    apiToken: "<Your API Token>",
    owner: {
        type: "individual",
        name: "<Your Account Name>",
    },
    dryMode: false,
    exclude: appCenterProjects => ["my-favorite-project"],
};

new AppCenterCleaner(excludeModeConfig).clean();
```

## Good To Know

You are strongly suggested trying to create a project from scratch on AppCenter manually. Because of:

-   Connect to your repo (`BitBucket/Github`) at least once manually, to authorize your AppCenter account with OAuth.
    This step cannot be done with pure script.

-   Learn the complicated build configuration data structure of iOS/Android project.
    The official API specification is not well-documented.
    GET `/v0.1/apps/{ownerName}/{appName}/repo_config` to find out the meaning of each field, in corresponding with `type.ts/BuildConfiguration` interface.

-   Build the app once, to figure out a great number for `AppCenterBuilderConfiguration.buildEstDuration`.
