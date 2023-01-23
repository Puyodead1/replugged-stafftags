import { common, Injector, settings, webpack } from "replugged";
import { AnyFunction } from "replugged/dist/types";
import Tag from "./Components/Tag";
import { DefaultSettings, GetMemberModule, Settings } from "./constants";
import "./style.css";
import { addNewSettings, fnKeyFindFailed, moduleFindFailed, resetSettings } from "./utils";

const inject = new Injector();
const { React } = common;

export const cfg = await settings.init<Settings, keyof typeof DefaultSettings>(
  "me.puyodead1.StaffTags",
  DefaultSettings,
);

export async function start(): Promise<void> {
  if (cfg.get("shouldResetSettings", DefaultSettings.shouldResetSettings)) resetSettings();

  // add any new settings
  addNewSettings();

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

  const fnName = webpack.getFunctionKeyBySource(/isRepliedMessage/, chatTagRenderMod)!;
  if (!fnName) return fnKeyFindFailed("chatTagRenderMod");

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

  inject.instead(chatTagRenderMod, fnName as string, ([args], fn) => {
    const originalTag = fn(args) as React.ReactElement;

    // Disable rendering custom tag if showing in chat is disabled
    if (!cfg.get("shouldDisplayInChat")) return originalTag;

    const className = `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} stafftags`;

    return React.createElement(Tag, {
      originalTag,
      getMemberMod,
      args,
      className,
    });
  });
}

export function stop(): void {
  inject.uninjectAll();
}

export { Settings } from "./Components/Settings";
