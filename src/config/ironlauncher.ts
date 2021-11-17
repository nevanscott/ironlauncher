import { sep } from "path";
import GetInputs from "../inputs/GetInputs";
import {
  ICLIConfig,
  IronlauncherConfig,
  IronLauncherTemplate,
  IronLauncherVariant,
} from "../types";
import { flags, inputs } from "../utils/cli";
import { isNotEmpty, nameExists } from "../utils/dir-ops";
import { isOutOfSync } from "../utils/sync";

class IronLauncher implements IronlauncherConfig {
  // Initial Values
  #auth: boolean = false;
  #base: boolean = false;
  #views: boolean = false;
  #json = false;
  #fs = false;
  #dryRun = false;
  #devMode = process.env.DEV === "true";
  #verbose = false;
  #displayHelp: boolean = false;
  #name: string = "";
  #isOutOfSync: boolean = false;
  #isCurrentFolder: boolean = false;

  // Constructor
  constructor(private flags: ICLIConfig, private inputs: string[]) {
    this.#setAuth();
    this.#setBase();
    this.#setVerbose();
    this.#setJson();
    this.#setViews();
    this.#setFs();
    this.#setDryRun();
    this.#setDisplayHelp();
    this.#setName();
  }

  // Setup values from inputs and flags from CLI

  #setName() {
    // const {inputs, flags} = this
    let [name = ""] = this.inputs;

    const isEmpty = !isNotEmpty();

    if (name.trim() === "." && !isEmpty) {
      return;
    }

    if (name.trim() === ".") {
      this.#name = process.cwd().split(sep).slice(-1)[0];
      this.#isCurrentFolder = true;
      return;
    }

    const exists = nameExists(name);
    if (exists) {
      return;
    }

    this.#name = name;
  }

  #setDisplayHelp(startingValue = false) {
    const { help, h } = this.flags;

    this.#displayHelp =
      this.#isBoolean(startingValue) ||
      this.#isBoolean(help) ||
      this.#isBoolean(h) ||
      this.inputs.includes("help");
  }

  #setDryRun(startingValue = false) {
    const { ["dry-run"]: dryRun = false, dryRun: dryRunCommand } = this.flags;

    this.#dryRun =
      this.#isBoolean(startingValue) ||
      this.#isBoolean(dryRun) ||
      this.#isBoolean(dryRunCommand);
  }

  #setBase(startingValue = false) {
    const { base, b } = this.flags;
    this.#base =
      this.#isBoolean(startingValue) ||
      this.#isBoolean(base) ||
      this.#isBoolean(b);
  }

  #setViews(startingValue = false) {
    const { views } = this.flags;
    this.#views = this.#isBoolean(startingValue) || this.#isBoolean(views);
  }

  #setFs(startingValue = false) {
    const { fs, fullStack, fullstack } = this.flags;

    this.#fs =
      this.#isBoolean(startingValue) ||
      this.#isBoolean(fs) ||
      this.#isBoolean(fullStack) ||
      this.#isBoolean(fullstack);
  }

  #setJson(startingValue = false) {
    const { json } = this.flags;
    this.#json = this.#isBoolean(startingValue) || this.#isBoolean(json);
  }

  #setVerbose(startingValue = false) {
    const { v, verbose } = this.flags;
    this.#verbose =
      this.#isBoolean(startingValue) ||
      this.#isBoolean(v) ||
      this.#isBoolean(verbose);
  }

  #setAuth(startingValue = false) {
    const { a = false, auth = false } = this.flags;
    this.#auth =
      this.#isBoolean(startingValue) ||
      this.#isBoolean(a) ||
      this.#isBoolean(auth);
  }

  #isBoolean(option: string | boolean = false) {
    return (
      (typeof option === "boolean" ||
        JSON.parse(JSON.stringify(option)) === "boolean") &&
      option == true
    );
  }

  // GETTERS
  get name() {
    return this.#name;
  }

  get variant(): IronLauncherVariant {
    if (this.#auth) {
      return "auth";
    }
    return "base";
  }

  get base() {
    return this.#base;
  }

  get template(): IronLauncherTemplate {
    if (this.fs) {
      return "fullstack";
    }

    if (this.json) {
      return "json";
    }
    return "views";
  }

  get views() {
    return this.#views;
  }

  get verbose() {
    return this.#verbose;
  }

  get devMode() {
    return this.#devMode;
  }

  get fs() {
    return this.#fs;
  }

  get json() {
    return this.#json;
  }

  get dryRun() {
    return this.#dryRun;
  }

  get auth() {
    return this.#auth;
  }

  get displayHelp() {
    return this.#displayHelp;
  }

  get isOutOfSync() {
    return this.#isOutOfSync;
  }

  get isCurrentFolder() {
    return this.#isCurrentFolder;
  }

  // Methods

  public debug(): void {
    console.log(`---- TEMPLATE ----`);
    console.log(`TEMPLATE: - ${this.template}`);
    console.log(`---- VARIANT ----`);
    console.log(
      `VARIANT: ${this.#auth ? "auth" : this.#base ? "base" : "not_defined"}`
    );
    console.log(`NAME: ${this.name}`);

    console.log(`---- DEBUG ----`);
    console.log(`DRYRUN: ${this.dryRun}`);

    console.log(`---- displayHelp ----`);
    console.log(`DISPLAY_HELP: ${this.displayHelp}`);
  }

  get variantDefined() {
    return this.#base || this.#auth;
  }

  get templateDefined() {
    return this.#json || this.#fs || this.#views;
  }

  private async arrangeName() {
    const { name } = await GetInputs.getName();
    this.#name = name;
  }

  private async arrangeVariant() {
    const { variant } = await GetInputs.getVariant();
    if (variant) {
      this.#auth = true;
    } else {
      this.#base = true;
    }
  }

  private async arrangeTemplate() {
    const { project } = await GetInputs.getProject();
    console.log("project:", project);
    if (project === "fullstack") {
      this.#fs = true;
    }
    if (project === "json") {
      this.#json = true;
    }
    if (project === "views") {
      this.#views = true;
    }
  }

  async init() {
    if (!this.devMode) {
      const isBad = await isOutOfSync();
      this.#isOutOfSync = isBad;
      if (isBad) {
        return;
      }
    }
    if (!this.name) {
      await this.arrangeName();
    }

    if (!this.templateDefined) {
      await this.arrangeTemplate();
    }

    if (!this.variantDefined) {
      await this.arrangeVariant();
    }
  }
}

const ironlauncherConfig = new IronLauncher(flags, inputs);

export default ironlauncherConfig;