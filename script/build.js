const chalk = require("chalk");
const childProcess = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const package = require("../package");
const selectShell = require("select-shell");

let versionUpdated = false;

function spawn(command, args, errorMessage) {
    const isWindows = process.platform === "win32"; // spawn with {shell: true} can solve .cmd resolving, but prettier doesn't run correctly on mac/linux
    const result = childProcess.spawnSync(isWindows ? command + ".cmd" : command, args, {stdio: "inherit"});
    if (result.error) {
        console.error(result.error);
        process.exit(1);
    }
    if (result.status !== 0) {
        console.error(chalk`{red.bold ${errorMessage}}`);
        console.error(`non-zero exit code returned, code=${result.status}, command=${command} ${args.join(" ")}`);
        process.exit(1);
    }
}

/**
 * @param question: string
 * @param options: string[]
 * @param onSelect: (selectedIndex: number) => void;
 *  selectedIndex is assured between [0, options.length - 1]
 * @param onCancel: () => void;
 */
function selectOption(question, options, onSelect, onCancel) {
    console.info(chalk`{green.bold ${question}}`);
    const select = selectShell({pointer: "▸ ", pointerColor: "yellow", multiSelect: false});

    options.forEach((text, index) => select.option(text, index));
    select.list();
    select.on("select", selectedOptions => onSelect(selectedOptions[0].value));
    select.on("cancel", onCancel);
}

function checkVersion() {
    console.info(chalk`{green.bold [task]} {white.bold checkVersion}`);
    console.info(chalk`{cyan.bold.underline Local} {white.bold util version:} {cyan.bold ${package.version}}`);
    process.stdout.write(chalk`{white.bold.underline NPM} {white.bold util version:} `);
    spawn("npm", ["show", "@pinnacle0/util", "version"], "retrieving version from npm server failed, please check your connection");

    selectOption("Do you wish to update the LOCAL version?", ["Yes", "No"], index => (index === 0 ? updateVersion() : build()), build);
}

function updateVersion() {
    const nextVersions = [];
    const currentVersions = package.version.split(".");
    nextVersions[0] = currentVersions.map((_, index) => (index === 2 ? parseInt(_) + 1 : _)).join(".");
    nextVersions[1] = currentVersions.map((_, index) => (index === 1 ? parseInt(_) + 1 : index > 1 ? 0 : _)).join(".");
    nextVersions[2] = currentVersions.map((_, index) => (index === 0 ? parseInt(_) + 1 : 0)).join(".");

    selectOption(
        "Which version identifier do you wish to increment?",
        [`Patch (${package.version} -> ${nextVersions[0]})`, `Minor (${package.version} -> ${nextVersions[1]})`, `Major (${package.version} -> ${nextVersions[2]})`],
        index => {
            const newPackage = {...package};
            newPackage.version = nextVersions[index];
            fs.writeFile(`${__dirname}/../package.json`, JSON.stringify(newPackage), "utf8", function (err) {
                if (err) {
                    console.info(chalk`{red.bold An error has occurred: ${err}}`);
                }
                spawn("prettier", ["--config", "node/prettier.json", "--write", "package.json"], "run prettier on package.json failed, please fix");
                versionUpdated = true;
                console.info(chalk`{green.bold Updated version number from} {red.bold ${package.version}} {green.bold to} {cyan.bold ${nextVersions[index]}}`);
                build();
            });
        },
        () => {
            console.info(chalk`{red.bold Version update cancelled. Continuing build with original version number.}`);
            build();
        }
    );
}

function cleanup() {
    console.info(chalk`{green.bold [task]} {white.bold cleanup}`);
    fs.emptyDirSync("build");
}

function checkCodeStyle() {
    console.info(chalk`{green.bold [task]} {white.bold check code style}`);
    return spawn("prettier", ["--config", "node/prettier.json", "--list-different", "{src,test}/**/*.{ts,tsx}"], "check code style failed, please format above files");
}

function copyAsset() {
    const sourceDirectory = path.resolve(__dirname, "../src");
    const files = fs.readdirSync(sourceDirectory).map(dir => path.join(sourceDirectory, dir));
    while (files.length > 0) {
        const filename = files.shift();
        if (fs.statSync(filename).isDirectory()) {
            files.push(...fs.readdirSync(filename).map(file => path.join(filename, file)));
        } else if (/\.tsx?$/.test(filename)) {
            const regex = /require\((.*)\)/g;
            const fileContent = fs.readFileSync(filename).toString();
            let copiedAssetCount = 0;
            let matchedArray;

            while ((matchedArray = regex.exec(fileContent)) !== null) {
                copiedAssetCount++;
                const assetFilePath = path.join(path.dirname(filename), matchedArray[1].replace(/"/g, ""));
                if (fs.pathExistsSync(assetFilePath)) {
                    fs.copySync(assetFilePath, assetFilePath.replace(/src/, "build/dist/lib"));
                } else {
                    throw new Error(`Failed to copy asset file: ${assetFilePath}`);
                }
            }

            if (copiedAssetCount > 0) {
                console.info(chalk`{green.bold [task]} {white.bold copy asset}: ${path.dirname(filename)}, ${copiedAssetCount} assets copied`);
            }
        }
    }
}

function test() {
    console.info(chalk`{green.bold [task]} {white.bold test}`);
    return spawn("jest", ["--config", "node/jest.json"], "test failed, please fix");
}

function lint() {
    console.info(chalk`{green.bold [task]} {white.bold lint}`);
    return spawn("eslint", ["{src,test}/**/*.{ts,tsx}"], "lint failed, please fix");
}

function compile() {
    console.info(chalk`{green.bold [task]} {white.bold compile}`);
    return spawn("tsc", ["-p", "node/tsconfig.json"], "compile failed, please fix");
}

function distribute() {
    console.info(chalk`{green.bold [task]} {white.bold distribute}`);
    fs.mkdirsSync("build/dist/lib");
    fs.copySync("build/out/src", "build/dist/lib/", {dereference: true});
    fs.copySync("package.json", "build/dist/package.json", {dereference: true});
    fs.copySync("README.md", "build/dist/README.md", {dereference: true});
    fs.removeSync("build/out");
}

function confirmPublish() {
    const noPublishFn = () => console.info(chalk`{yellow.bold Remark: Your build has} {red.bold NOT} {yellow.bold been published to npm.}`);
    selectOption(
        "Publish latest build to npm?",
        ["Confirm", "Cancel"],
        index => (index === 0 ? spawn("yarn", ["publish", "build/dist"], "publish to npm failed, please run yarn login to login first") : noPublishFn()),
        noPublishFn
    );
}

function build() {
    cleanup();
    checkCodeStyle();
    test();
    lint();
    compile();
    copyAsset();
    distribute();

    console.info(chalk`{yellow.bold Build Successfully}`);

    if (versionUpdated) {
        confirmPublish();
    }
}

checkVersion();
