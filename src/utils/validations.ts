import { isNotEmpty } from "./dir-ops/isNotEmpty";
import { nameExists } from "./dir-ops/nameExists";

export function validateName(value: string) {
  if (value === ".") {
    if (isNotEmpty()) {
      return `This directory is not empty, please choose a different name\n`;
    }
    return true;
  }

  if (nameExists(value)) {
    return `This directory already exists`;
  }
  return !value ? "Please add a value\n" : true;
}