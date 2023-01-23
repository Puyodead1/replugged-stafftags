import { Logger } from "replugged";
import { cfg } from ".";
import { DefaultSettings, Settings } from "./constants";

export const logger = Logger.plugin("StaffTags");

export function getContrastYIQ(hexcolor: string | undefined): "#000000" | "#ffffff" | undefined {
  if (!hexcolor) return;
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

export function moduleFindFailed(moduleName: string): void {
  logger.error(`Failed to find ${moduleName} module! Cannot continue`);
}

export function fnKeyFindFailed(fnName: string): void {
  logger.error(`Failed to find ${fnName} function key! Cannot continue`);
}

export function getColorSetting(tagType: number): string | number {
  const colors = cfg.get("tagColors");
  const hex = colors[tagType];
  return hex ? parseInt(hex.slice(1), 16) : 0;
}

export function _numberToHex(color: number): string {
  const r = (color & 0xff0000) >>> 16;
  const g = (color & 0xff00) >>> 8;
  const b = color & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

export function resetSettings(): void {
  logger.log("Resetting settings");

  // remove old settings
  for (const key of Object.keys(cfg.all())) {
    cfg.delete(key as keyof Settings);
  }

  // add new settings
  addNewSettings();

  cfg.set("shouldResetSettings", false);
}

export function addNewSettings(): void {
  for (const [key, value] of Object.entries(DefaultSettings)) {
    if (!cfg.has(key as keyof Settings)) {
      logger.log(`Adding new setting ${key} with value`, value);
      cfg.set(key as keyof Settings, value as never);
    }
  }
}
