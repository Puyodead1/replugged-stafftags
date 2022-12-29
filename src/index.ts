/* eslint-disable */
import { common, Injector, settings, webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import tag from "./Components/Tag";
import {
  DefaultSettings,
  GetChannelFunction,
  GetMemberModule,
  StaffTagsSettings,
} from "./constants";
import "./style.css";
const inject = new Injector();
const { React } = common;

function moduleFindFailed(moduleName: string): void {
  console.error(`Failed to find ${moduleName} module! Cannot continue`);
}

function fnKeyFindFailed(fnName: string): void {
  console.error(`Failed to find ${fnName} function key! Cannot continue`);
}

export async function start(): Promise<void> {
  const cfg = await settings.init<StaffTagsSettings>("me.puyodead1.StaffTags");

  if (cfg.get("shouldResetSettings", DefaultSettings.shouldResetSettings)) {
    console.log("[StaffTags] Resetting settings");
    // clear the settings
    for (const key of Object.keys(cfg.all())) {
      cfg.delete(key);
    }
    cfg.set("shouldReset", false);
  }

  // add any new settings
  for (const [key, value] of Object.entries(DefaultSettings)) {
    if (!cfg.has(key)) {
      console.log(`[StaffTags] Adding new settings ${key} with value`, value);
      cfg.set(key, value as any);
    }
  }

  // update any settings that have changed
  // for (const key of Object.keys(DefaultSettings)) {
  //   const value = cfg.get(key);
  //   if (value !== DefaultSettings[key]) {
  //     console.log(`[StaffTags] Updating setting ${key} to`, DefaultSettings[key]);
  //     cfg.set(key, DefaultSettings[key]);
  //   }
  // }

  // remove any settings that no longer exist
  // for (const key of Object.keys(cfg.all())) {
  //   if (!(key in DefaultSettings)) {
  //     console.log(`[StaffTags] Removing setting ${key} because it no longer exists`);
  //     cfg.delete(key);
  //   }
  // }

  /**
   * Get the `getChannel` function
   */
  const { getChannel } = await webpack.waitForModule<{
    getChannel: GetChannelFunction;
  }>(webpack.filters.byProps("getChannel"));

  if (!getChannel) return moduleFindFailed("getChannel");

  /**
   * getMember module
   */
  const getMemberMod = Object.values(
    await webpack.waitForModule(webpack.filters.byProps("getMember")),
  ).find((x) => typeof x === "object") as GetMemberModule;
  if (!getMemberMod) return moduleFindFailed("getMember");

  /**
   * Get the module that renders bot tags in chat
   */
  const chatTagRenderMod = await webpack.waitForModule<{ [key: string]: AnyFunction }>(
    webpack.filters.bySource(".botTagCompact"),
  );
  if (!chatTagRenderMod) return moduleFindFailed("chatTagRenderMod");

  const fnName = webpack.getFunctionKeyBySource(/isRepliedMessage/, chatTagRenderMod) as string;
  if (!fnName) return fnKeyFindFailed("chatTagRenderMod");

  /**
   * Get the tooltip module
   */
  const tooltipMod = await webpack.waitForModule<Record<string, typeof React.Component>>(
    webpack.filters.bySource(/shouldShowTooltip:!1/),
  );
  const Tooltip =
    tooltipMod && webpack.getFunctionBySource<any>(/shouldShowTooltip:!1/, tooltipMod);
  if (!Tooltip) return moduleFindFailed("Tooltip");

  /**
   * Get some classes
   */
  const botTagRegularClasses = await webpack.waitForModule<{
    botTagRegular: string;
    rem: string;
  }>(webpack.filters.byProps("botTagRegular"));
  if (!botTagRegularClasses) return moduleFindFailed("botTagRegular");

  const botTagCozyClasses = await webpack.waitForModule<{
    botTagCozy: string;
  }>(webpack.filters.byProps("botTagCozy"));
  if (!botTagCozyClasses) return moduleFindFailed("botTagCozy");

  const Tag = tag(Tooltip);

  inject.instead(chatTagRenderMod, fnName, ([args], fn) => {
    const originalTag = fn(args) as React.ReactElement;

    // Disable rendering custom tag if showing in chat is disabled
    if (!cfg.get("shouldDisplayInChat", DefaultSettings.shouldDisplayInChat)) return originalTag;

    const className = `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} ownertag`;

    return React.createElement(Tag, {
      originalTag,
      cfg,
      getMemberMod,
      args: args,
      className,
      Tooltip,
    });
  });
}

export function stop(): void {
  inject.uninjectAll();
}
