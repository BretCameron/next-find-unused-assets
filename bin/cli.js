const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { readNestedDir, isFoundInFile } = require("./helpers");
const { promisify } = require("util");
const { unlink } = require("fs");
const { log } = require("./log");

const asyncUnlink = promisify(unlink);

async function isAssetFound(asset, buildFiles) {
  for (const buildFile of buildFiles) {
    const searchTerm = asset?.match(/[^\/]+$/)?.[0] || "";

    if (await isFoundInFile(searchTerm, buildFile)) {
      return true;
    }
  }

  return false;
}

async function run() {
  const argv = await yargs(hideBin(process.argv)).argv;

  const publicDir = argv.publicDir || "public";
  const buildDir = argv.buildDir || ".next";
  const dryRun = !!argv["dry-run"];

  const [assets, buildFiles] = await Promise.all([
    readNestedDir(publicDir, /\.jpg$/),
    readNestedDir(buildDir, /\.js$/),
  ]);

  for (const asset of assets) {
    const isFound = await isAssetFound(asset, buildFiles);

    if (!isFound) {
      if (dryRun) {
        log(`Unused:  ${asset.replace(/^.*public\//, "")}`, "red");
      } else {
        log(`Deleting asset: ${asset.replace(/^.*public\//, "")}`, "red");
        await asyncUnlink(asset);
      }
    } else {
      log(`  Used:  ${asset.replace(/^.*public\//, "")}`, "cyan");
    }
  }

  process.exit(0);
}

module.exports = {
  run,
};
