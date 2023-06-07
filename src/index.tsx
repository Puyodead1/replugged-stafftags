import { components, Injector, settings, webpack } from "replugged";
import { AnyFunction, ObjectExports } from "replugged/dist/types";
import Tag from "./Components/Tag";
import { DefaultSettings, GetMemberModule, Settings } from "./constants";
import "./style.css";
import { addNewSettings, fnKeyFindFailed, logger, moduleFindFailed, resetSettings } from "./utils";
import { Channel, User } from "discord-types/general";

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
  const chatTagRenderMod = await webpack.waitForModule<{ [key: string]: AnyFunction }>(
    webpack.filters.bySource(".botTagCompact"),
  );
  if (!chatTagRenderMod) return moduleFindFailed("chatTagRenderMod");

  const chatTagRenderFnName = webpack.getFunctionKeyBySource(chatTagRenderMod, /isRepliedMessage/)!;
  if (!chatTagRenderFnName) return fnKeyFindFailed("chatTagRenderMod");

  const memberListModule = await webpack.waitForModule<{
    [key: string]: {
      $$typeof: symbol;
      compare: null;
      type: AnyFunction;
    };
  }>(webpack.filters.bySource("({canRenderAvatarDecorations:"), {
    timeout: 10000,
  });
  if (!memberListModule) return moduleFindFailed("memberListModule");

  const memberListMemo = Object.entries(memberListModule).find(([_, v]) => v.type)?.[1];
  if (!memberListMemo) return logger.error("Failed to get member list item memo");

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
  inject.instead(chatTagRenderMod, chatTagRenderFnName, ([args], fn) => {
    const originalTag = fn(args) as React.ReactElement;

    // Disable rendering custom tag if showing in chat is disabled
    if (!cfg.get("shouldDisplayInChat")) return originalTag;

    const className = `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} stafftag`;

    return (
      <ErrorBoundary>
        <Tag
          originalTag={originalTag}
          getMemberMod={getMemberMod}
          args={args}
          className={className}
        />
      </ErrorBoundary>
    );
  });

  // inject into member list
  const unpatchMemo = inject.after(
    memberListMemo,
    "type",
    (_args, res: { type: AnyFunction }, _) => {
      inject.after(
        res.type.prototype,
        "renderDecorators",
        (args, res, instance: { props?: { user: User; channel: Channel } }) => {
          // Disable rendering custom tag if showing in member list is disabled
          if (!cfg.get("shouldDisplayInMemberList")) return res;

          const user = instance?.props?.user;
          const channel = instance?.props?.channel;
          if (Array.isArray(res?.props?.children) && user && channel) {
            const className = `${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} stafftag`;
            const a = (
              <ErrorBoundary>
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
            res.props.children.unshift(a);
          }
          return res;
        },
      );

      unpatchMemo();
    },
  );
}

export function stop(): void {
  inject.uninjectAll();
}

export { Settings } from "./Components/Settings";
