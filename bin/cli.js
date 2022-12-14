/**
 * TODO
 *  - add ability to specify file extensions
 *  - add ability to exclude files
 */

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { readNestedDir, isFoundInFile } = require("./helpers");
const { promisify } = require("util");
const { unlink } = require("fs");
const { log } = require("./log");

const asyncUnlink = promisify(unlink);

async function isAssetFound(asset, buildFiles) {
  for (const buildFile of buildFiles) {
    const searchTerm = asset?.file.match(/[^\/]+$/)?.[0] || "";

    if (await isFoundInFile(searchTerm, buildFile.file)) {
      return true;
    }
  }

  return false;
}

function humanFileSize(size) {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}

async function run() {
  const argv = await yargs(hideBin(process.argv)).argv;

  const publicDir = argv.publicDir || "public";
  const buildDir = argv.buildDir || ".next";
  const dryRun = !!argv["dry-run"];

  const [assets, buildFiles] = await Promise.all([
    readNestedDir(publicDir, /\.(jpg|jpeg|png|gif|webp)$/),
    readNestedDir(buildDir, /\.js$/),
  ]);

  let totalUsed = 0;
  let totalUnused = 0;
  let totalUsedSize = 0;
  let totalUnusedSize = 0;

  for (const asset of assets) {
    const isFound = await isAssetFound(asset, buildFiles);

    if (!isFound) {
      totalUnused++;
      totalUnusedSize += asset.size;

      if (dryRun) {
        log(`Unused:  ${asset.file}`, "red");
      } else {
        log(`Deleting asset: ${asset.file}`, "red");
        await asyncUnlink(asset.file);
      }
    } else {
      totalUsed++;
      totalUsedSize += asset.size;
      log(`  Used:  ${asset.file}`, "cyan");
    }
  }

  console.log(``);
  console.log(
    `  Total used assets: ${totalUsed} (${humanFileSize(totalUsedSize)})`
  );
  console.log(
    `Total unused assets: ${totalUnused} (${humanFileSize(totalUnusedSize)})`
  );

  process.exit(0);
}

module.exports = {
  run,
};
