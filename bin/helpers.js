const { join } = require("path");
const { readdir, lstat, readFile } = require("fs");
const { promisify } = require("util");

const asyncReaddir = promisify(readdir);
const asyncLstat = promisify(lstat);
const asyncReadFile = promisify(readFile);

async function readNestedDir(dir, filter) {
  const files = [];
  await traverseDir(dir, (file) => files.push(file), filter);
  return files;
}

async function traverseDir(dir, callback, filter) {
  const files = await asyncReaddir(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const isDir = (await asyncLstat(fullPath)).isDirectory();

    if (isDir) {
      await traverseDir(fullPath, callback, filter);
    } else if (filter?.test(fullPath) || !filter) {
      callback(fullPath);
    }
  }
}

async function isFoundInFile(search, file) {
  const fileContent = await asyncReadFile(file, "utf-8");
  const regex = new RegExp(search);

  if (regex.test(fileContent)) {
    return true;
  }

  return false;
}

module.exports = {
  readNestedDir,
  traverseDir,
  isFoundInFile,
};
