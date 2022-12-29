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

const CHAT_TAG_RENDER_REGEX = /\w+.withMentionPrefix,\w+=void\s0!==\w/;
const TOOLTIP_REGEX = /shouldShowTooltip:!1/;

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
   * get the module that renders the bot tag in chat
   */
  const chatTagRenderMod = await webpack.waitForModule<{ [key: string]: AnyFunction }>(
    webpack.filters.bySource(CHAT_TAG_RENDER_REGEX),
  );
  if (!chatTagRenderMod) return moduleFindFailed("chatTagRenderMod");

  // const fnName = webpack.getFunctionKeyBySource(CHAT_TAG_RENDER_REGEX, chatTagRenderMod) as string;
  // if (!fnName) return fnKeyFindFailed("chatTagRenderMod");

  /**
   * get the module for tooltips
   */
  const tooltipMod = await webpack.waitForModule<Record<string, typeof React.Component>>(
    webpack.filters.bySource(TOOLTIP_REGEX),
  );
  const Tooltip = tooltipMod && webpack.getFunctionBySource<any>(TOOLTIP_REGEX, tooltipMod);
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

  inject.before(chatTagRenderMod, "Z" as any, ([args]) => {
    console.log(args);
    // Disable rendering custom tag if showing in chat is disabled
    if (!cfg.get("shouldDisplayInChat", DefaultSettings.shouldDisplayInChat)) return undefined;

    const className = `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} ownertag`;

    if (args.decorations && args.decorations["1"] && args.message && args.message.author) {
      const tag = Tag({
        cfg,
        getMemberMod,
        args: args,
        className,
        Tooltip,
      });
      if (tag) args.decorations["1"].push(tag);
    }
    return args;

    // return React.createElement(Tag, {
    //   originalTag,
    //   cfg,
    //   getMemberMod,
    //   args: args[0],
    //   className,
    //   Tooltip,
    // });
  });
}

export function stop(): void {
  inject.uninjectAll();
}
