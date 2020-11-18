#!/usr/bin/env node
const path = require("path");
const cli = require("./utils/cli");
const ask = require("./utils/ask");
const copy = require("copy-template-dir");

const getName = require("./utils/getName");
const init = require("./utils/init");
const question = require("./utils/question");
const { inDir, outDir } = require("./utils/paths");
const performCopy = require("./utils/performCopy");
const alert = require("cli-alerts");
const { input, flags, showHelp } = cli;

async function main() {
  init();
  if (input.includes("help")) {
    return showHelp(0);
  }
  let { name, issue } = getName(cli);

  if (!name) {
    name = await question({
      message: "Project name?",
      issue,
      name: "name",
      hint: "(This will be the name in package.json)",
    });
  }

  // return;
  const inDirPath = inDir(flags.auth);
  const outDirPath = outDir(name);

  const vars = { name };
  performCopy({ inDirPath, outDirPath, vars });
}

main();