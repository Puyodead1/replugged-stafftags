/* eslint-disable no-undefined */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Injector, settings as repluggedSettings, webpack } from "replugged";
import { NamespacedSettings } from "replugged/dist/renderer/apis/settings";
import {
  DefaultSettings,
  DEFAULT_TAG_TEXTS,
  GetChannelFunction,
  GetGuildFunction,
  GetMemberModule,
  Guild,
  StaffTagsSettings,
  USER_TYPES,
} from "./constants";
import "./style.css";
const { Permissions } = webpack.common.constants;
const { guilds } = webpack.common;
const { getGuild } = guilds as { getGuild: GetGuildFunction };
const inject = new Injector();

async function getTagText(
  tagType: string,
  settings: NamespacedSettings<StaffTagsSettings>,
): Promise<string> {
  const customTagTextEnabled = (await settings.get("customTagTextEnabled")) as boolean;
  const tagTexts = (await settings.get("tagTexts")) as { [key: string]: string };
  return customTagTextEnabled ? tagTexts[tagType] : DEFAULT_TAG_TEXTS[tagType];
}

function moduleFindFailed(moduleName: string): void {
  console.error(`Failed to find ${moduleName} module! Cannot continue`);
}

function parseBitFieldPermissions(allowed: bigint) {
  const permissions = {} as { [key: string]: boolean };
  for (const perm of Object.keys(Permissions)) {
    if (!perm.startsWith("all")) {
      if (BigInt(allowed) & BigInt(Permissions[perm])) {
        permissions[perm] = true;
      }
    }
  }
  return permissions;
}

function getPermissionsRaw(guild: Guild, userId: string, getMemberMod: GetMemberModule) {
  let permissions = 0n;

  const member = getMemberMod.getMember(guild.id, userId);

  if (guild && member) {
    if (guild.ownerId === userId) {
      permissions = BigInt(Permissions.ADMINISTRATOR);
    } else {
      /* @everyone is not inlcuded in the member's roles */
      permissions |= BigInt(guild.roles[guild.id]?.permissions);

      for (const roleId of member.roles) {
        const rolePerms = guild.roles[roleId]?.permissions;
        if (rolePerms !== undefined) {
          permissions |= BigInt(rolePerms);
        }
      }
    }

    /* If they have administrator they have every permission */
    if (
      (BigInt(permissions) & BigInt(Permissions.ADMINISTRATOR)) ===
      BigInt(Permissions.ADMINISTRATOR)
    ) {
      return Object.values(Permissions).reduce((a, b) => BigInt(a) | BigInt(b), 0n);
    }
  }

  return permissions;
}

export async function start(): Promise<void> {
  const settings = repluggedSettings.get<StaffTagsSettings>("me.puyodead1.StaffTags");

  // set any missing settings to default
  for await (const [key, value] of Object.entries(DefaultSettings)) {
    const has = await settings.has(key);
    if (!has) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await settings.set(key, value as any);
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

  /**
   * Get the MessageTimestamp component
   */
  const MessageTimestamp = webpack.getBySource(/\w+\.showTimestamp,\w+=\w+\.showTimestampOnHover/);
  if (!MessageTimestamp) return moduleFindFailed("MessageTimestamp");

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

  // just some tests
  const g = getGuild("1000926524452647132");
  if (g) {
    console.log("Guild", g);
    console.log("Member", getMemberMod.getMember(g.id, "498989696412549120"));
    console.log("Channel", getChannel("1000955966520557689"));
    console.log("Permissions Raw", getPermissionsRaw(g, "498989696412549120", getMemberMod));
    console.log(
      `Permissions`,
      parseBitFieldPermissions(getPermissionsRaw(g, "498989696412549120", getMemberMod)),
    );
    console.log(`getTagText`, await getTagText(USER_TYPES.MOD, settings));
  }

  // if (typingMod && getChannelMod) {
  //   inject.instead(typingMod, "startTyping", ([channel]) => {
  //     const channelObj = getChannelMod.getChannel(channel as string);
  //     console.log(`Typing prevented! Channel: #${channelObj?.name ?? "unknown"} (${channel}).`);
  //   });
  // }
}

export function stop(): void {
  inject.uninjectAll();
}
