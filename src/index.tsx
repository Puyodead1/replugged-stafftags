import { Channel, User } from "discord-types/general";
import { Injector, components, plugins, settings, webpack } from "replugged";
import { AnyFunction, ObjectExports } from "replugged/dist/types";
import Tag from "./Components/Tag";
import { DefaultSettings, GuildMemberStoreType, Settings } from "./constants";
import "./style.css";
import { addNewSettings, fnKeyFindFailed, moduleFindFailed, resetSettings } from "./utils";
import ManifestJSON from "../manifest.json";

const inject = new Injector();
const { ErrorBoundary } = components;

export const cfg = await settings.init<Settings, keyof typeof DefaultSettings>(
  "me.puyodead1.StaffTags",
  DefaultSettings,
);

async function getMods() {
  const GuildMemberStore = await webpack.waitForStore<GuildMemberStoreType>("GuildMemberStore", {
    timeout: 10000,
  });
  if (!GuildMemberStore) return moduleFindFailed("getMember");
  /**
   * Get the module that renders bot tags in chat
   */
  const chatTagRenderMod = webpack.getBySource<Record<string, AnyFunction>>(".SYSTEM_TAG=0")!;

  const chatTagRenderFnName = webpack.getFunctionKeyBySource(
    chatTagRenderMod,
    "withMentionPrefix",
  )!;
  if (!chatTagRenderFnName) return fnKeyFindFailed("chatTagRenderMod");

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

  return {
    GuildMemberStore,
    chatTagRenderMod,
    chatTagRenderFnName,
    botTagRegularClasses,
    botTagCozyClasses,
  };
}

let Mods: Awaited<ReturnType<typeof getMods>>;

export async function start(): Promise<void> {
  if (cfg.get("shouldResetSettings", DefaultSettings.shouldResetSettings)) resetSettings();

  // add any new settings
  addNewSettings();

  Mods ??= await getMods();

  const {
    chatTagRenderMod,
    chatTagRenderFnName,
    botTagRegularClasses,
    botTagCozyClasses,
    GuildMemberStore,
  } = Mods!;
  // inject into chat
  inject.before(chatTagRenderMod, chatTagRenderFnName, (args) => {
    // Disable rendering custom tag if showing in chat is disabled
    if (!cfg.get("shouldDisplayInChat")) return args;

    if (args[0].decorations?.["1"]) {
      const className = `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} stafftag`;
      const a = (
        <ErrorBoundary fallback={<></>}>
          <Tag
            originalTag={null}
            getMemberMod={GuildMemberStore}
            args={{ channel: args[0].channel, user: args[0].message?.author }}
            className={className}
          />
        </ErrorBoundary>
      );
      args[0].decorations[1].push(a);
    }
    return args;
  });
}

export function stop(): void {
  inject.uninjectAll();
}

export { Settings } from "./Components/Settings";

export const _renderStaffTag = ({ user, channel }: { channel: Channel; user: User }) =>
  !plugins.getDisabled().includes(ManifestJSON.id) && user && channel && Mods ? (
    <ErrorBoundary fallback={<></>}>
      <Tag
        originalTag={null}
        getMemberMod={Mods.GuildMemberStore}
        args={{
          user,
          channel,
        }}
        className={`${Mods.botTagRegularClasses.botTagRegular} ${Mods.botTagRegularClasses.rem} stafftag`}
        isMemberList
      />
    </ErrorBoundary>
  ) : null;
