/* eslint-disable */
import { ReactElement } from "react";
import { AnyFunction, Injector, settings as repluggedSettings, webpack } from "replugged";
import Tag from "./Components/Tag";
import {
  DefaultSettings,
  GetChannelFunction,
  GetGuildFunction,
  GetMemberModule,
  StaffTagsSettings,
} from "./constants";
import "./style.css";
const inject = new Injector();

function moduleFindFailed(moduleName: string): void {
  console.error(`Failed to find ${moduleName} module! Cannot continue`);
}

export async function start(): Promise<void> {
  const { guilds } = webpack.common;
  const { getGuild } = guilds as { getGuild: GetGuildFunction };

  const settings = repluggedSettings.get<StaffTagsSettings>("me.puyodead1.StaffTags");
  let allSettings = await settings.all();

  if (allSettings.shouldResetSettings) {
    console.log("[StaffTags] Resetting settings");
    // clear the settings
    for (const key of Object.keys(allSettings)) {
      await settings.delete(key);
    }
    await settings.set("shouldReset", false as any);
  }

  // add any new settings
  for await (const [key, value] of Object.entries(DefaultSettings)) {
    const has = await settings.has(key);
    if (!has) {
      console.log(`[StaffTags] Adding new settings ${key} with value`, value);
      await settings.set(key, value as any);
    }
  }

  // // update any settings that have changed
  // for (const key of Object.keys(DefaultSettings)) {
  //   const value = await settings.get(key);
  //   if (value !== DefaultSettings[key]) {
  //     console.log(`[StaffTags] Updating setting ${key} to`, DefaultSettings[key]);
  //     await settings.set(key, DefaultSettings[key] as any);
  //   }
  // }

  // remove any settings that no longer exist
  allSettings = await settings.all();
  for (const key of Object.keys(allSettings)) {
    if (!(key in DefaultSettings)) {
      console.log(`[StaffTags] Removing setting ${key} because it no longer exists`);
      await settings.delete(key);
    }
  }

  if (!getGuild) return moduleFindFailed("getGuild");

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

  const chatTagRenderMod = await webpack.waitForModule<{ x: AnyFunction }>(
    webpack.filters.bySource(".botTagCompact"),
  );
  if (!chatTagRenderMod) return moduleFindFailed("tagRenderMod");

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

  if (chatTagRenderMod) {
    inject.instead(chatTagRenderMod, "x", (args, fn) => {
      const shouldShow = allSettings.shouldDisplayInChat;
      const originalTag = fn(...args) as ReactElement;

      // Disable rendering custom tag if showing in chat is disabled
      if (!shouldShow) return originalTag;

      const className = `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} ownertag`;

      return Tag({
        originalTag,
        settings,
        getMemberMod,
        args: args[0],
        className,
      });
    });
  }
}

export function stop(): void {
  inject.uninjectAll();
}
