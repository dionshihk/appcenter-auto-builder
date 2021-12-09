const childProcess = require("child_process");
const fs = require("fs-extra");

function spawn(command, args) {
    const isWindows = process.platform === "win32"; // spawn with {shell: true} can solve .cmd resolving, but prettier doesn't run correctly on mac/linux
    const result = childProcess.spawnSync(isWindows ? command + ".cmd" : command, args, {stdio: "inherit"});
    if (result.error) {
        console.error(result.error);
        process.exit(1);
    }
    if (result.status !== 0) {
        console.error(`non-zero exit code returned, code=${result.status}, command=${command} ${args.join(" ")}`);
        process.exit(1);
    }
}

function cleanup() {
    console.info("Cleaning up ...");
    fs.emptyDirSync("build");
}

function checkCodeStyle() {
    console.info("Checking code style ...");
    return spawn("prettier", ["--config", "./prettier.config.js", "--list-different", "{src,test}/**/*.ts"]);
}

function compile() {
    console.info("Compiling TypeScript ...");
    return spawn("tsc", ["-p", "./tsconfig.json"]);
}

function distribute() {
    console.info("Distributing ...");
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

    console.info("Build done, you can publish to npm via `npm publish ./build/dist/`");
}

build();
