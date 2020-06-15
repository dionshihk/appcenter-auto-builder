const chalk = require("chalk");
const childProcess = require("child_process");
const fs = require("fs-extra");

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

function cleanup() {
    console.info(chalk`{green.bold [task]} {white.bold cleanup}`);
    fs.emptyDirSync("build");
}

function checkCodeStyle() {
    console.info(chalk`{green.bold [task]} {white.bold check code style}`);
    return spawn("prettier", ["--config", "./prettier.config.js", "--list-different", "{src,test}/**/*.ts"], "check code style failed, please format above files");
}

function compile() {
    console.info(chalk`{green.bold [task]} {white.bold compile}`);
    return spawn("tsc", ["-p", "./tsconfig.json"], "compile failed, please fix");
}

function distribute() {
    console.info(chalk`{green.bold [task]} {white.bold distribute}`);
    fs.mkdirsSync("build/dist");
    fs.copySync("build/out/src", "build/dist", {dereference: true});
    fs.copySync("package.json", "build/dist/package.json", {dereference: true});
    fs.copySync("README.md", "build/dist/README.md", {dereference: true});
    fs.removeSync("build/out");
}

function build() {
    cleanup();
    checkCodeStyle();
    compile();
    distribute();

    console.info(chalk`{yellow.bold Build Successfully}`);
    console.info(chalk`{yellow.bold You can publish to npm via:} npm publish build/dist`);
}

build();
