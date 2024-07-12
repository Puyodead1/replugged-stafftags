import { Channel, User } from "discord-types/general";
import { Injector, components, settings, webpack } from "replugged";
import { AnyFunction, ObjectExports } from "replugged/dist/types";
import Tag from "./Components/Tag";
import { DefaultSettings, GetMemberModule, Settings } from "./constants";
import "./style.css";
import { addNewSettings, fnKeyFindFailed, moduleFindFailed, resetSettings } from "./utils";

const inject = new Injector();
const { ErrorBoundary } = components;

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
    await webpack.waitForModule<ObjectExports>(webpack.filters.byProps<string>("getMember")),
  ).find((x) => typeof x === "object") as GetMemberModule;
  if (!getMemberMod) return moduleFindFailed("getMember");

  /**
   * Get the module that renders bot tags in chat
   */
  const chatTagRenderMod = webpack.getBySource<Record<string, AnyFunction>>(".SYSTEM_TAG=0")!;

  const chatTagRenderFnName = webpack.getFunctionKeyBySource(
    chatTagRenderMod,
    "withMentionPrefix",
  )!;
  if (!chatTagRenderFnName) return fnKeyFindFailed("chatTagRenderMod");

  const memberListMod = await webpack.waitForModule<Record<string, AnyFunction>>(
    webpack.filters.bySource(".MEMBER_LIST_ITEM_AVATAR_DECORATION_PADDING)"),
    {
      timeout: 10000,
    },
  );
  if (!memberListMod) return moduleFindFailed("memberListModule");

  const memberListFnName = webpack.getFunctionKeyBySource(memberListMod, "isTyping")!;
  if (!memberListFnName) return fnKeyFindFailed("memberListMod");

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
            getMemberMod={getMemberMod}
            args={{ channel: args[0].channel, user: args[0].message?.author }}
            className={className}
          />
        </ErrorBoundary>
      );
      args[0].decorations[1].push(a);
    }
    return args;
  });

  // inject into member list
  inject.after(
    memberListMod,
    memberListFnName,
    ([{ user, channel }]: [{ user: User; channel: Channel }], res: React.ReactElement, _) => {
      // Disable rendering custom tag if showing in member list is disabled
      if (!cfg.get("shouldDisplayInMemberList")) return res;
      if (!res?.props?.children && typeof res?.props?.children != "function") return;

      const children = res?.props?.children();
      if (Array.isArray(children?.props?.decorators?.props?.children) && user && channel) {
        const className = `${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} stafftag`;
        const a = (
          <ErrorBoundary fallback={<></>}>
            <Tag
              originalTag={null}
              getMemberMod={getMemberMod}
              args={{
                user,
                channel,
              }}
              className={className}
              isMemberList
            />
          </ErrorBoundary>
        );

        children?.props?.decorators?.props?.children.unshift(a);
      }

      res.props.children = () => {
        return children;
      };
    },
  );
}

export function stop(): void {
  inject.uninjectAll();
}

export { Settings } from "./Components/Settings";
