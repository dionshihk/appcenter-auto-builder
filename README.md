## Introduction

This project provides an all-in-one script for Microsoft AppCenter: https://appcenter.ms/

This script automates the whole flow to create project, connect repo, configure build settings, and generate mobile apps.

## Installation

With Node environment, add this script to your dev dependencies.

`yarn add appcenter-auto-builder --dev` 

Or
   
`npm install appcenter-auto-builder --save-dev`

## Usage

You can refer to the example in `test/index.demo.ts`:

https://github.com/dionshihk/appcenter-auto-builder/blob/master/test/index.demo.ts

More about `AppCenterBuilderConfiguration` interface can be found from `type.d.ts`, with proper comments.

## Good To Know

You are strongly suggested trying to create a project from scratch on AppCenter manually. Because of:

- Connect to your repo (`BitBucket/Github`) at least once manually, to authorize your AppCenter account with OAuth.
This step cannot be done with pure script.

- Learn the complicated build configuration data structure of iOS/Android project.
The official API specification is not well-documented.
GET `/v0.1/apps/{ownerName}/{appName}/repo_config` to find out the meaning of each field, in corresponding with `type.ts/BuildConfiguration` interface. 

- Build the app once, to figure out a great number for `AppCenterBuilderConfiguration.buildEstDuration`.
