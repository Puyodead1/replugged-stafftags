/* eslint-disable */

import { Channel, User } from "discord-types/general";
import { ReactElement } from "react";
import { AnyFunction, Injector, settings as repluggedSettings, webpack } from "replugged";
import Tag from "./Components/Tag";
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
const inject = new Injector();

function getTagText(
  tagType: string,
  // settings: NamespacedSettings<StaffTagsSettings>,
): string {
  // const customTagTextEnabled = (await settings.get("customTagTextEnabled")) as boolean;
  // const tagTexts = (await settings.get("tagTexts")) as { [key: string]: string };
  // return customTagTextEnabled ? tagTexts[tagType] : DEFAULT_TAG_TEXTS[tagType];
  return DEFAULT_TAG_TEXTS[tagType];
}

function moduleFindFailed(moduleName: string): void {
  console.error(`Failed to find ${moduleName} module! Cannot continue`);
}

function parseBitFieldPermissions(allowed: bigint, Permissions: Record<string, bigint>) {
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

function getPermissionsRaw(
  guild: Guild,
  userId: string,
  getMemberMod: GetMemberModule,
  Permissions: Record<string, bigint>,
) {
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

function getContrastYIQ(hexcolor: string) {
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

export async function start(): Promise<void> {
  const { Permissions } = webpack.common.constants;
  const { guilds } = webpack.common;
  const { getGuild } = guilds as { getGuild: GetGuildFunction };

  const settings = repluggedSettings.get<StaffTagsSettings>("me.puyodead1.StaffTags");

  // set any missing settings to default
  for await (const [key, value] of Object.entries(DefaultSettings)) {
    const has = await settings.has(key);
    if (!has) {
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

  const tagRenderMod = await webpack.waitForModule<{ x: AnyFunction }>(
    webpack.filters.bySource(".botTagCompact"),
  );
  if (!tagRenderMod) return moduleFindFailed("tagRenderMod");

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

  if (tagRenderMod) {
    inject.instead(tagRenderMod, "x", (args, fn) => {
      const originalTag = fn(...args) as ReactElement;

      const { user, channel } = args[0] as {
        user: User;
        channel: Channel;
      };
      if (user.bot && !DefaultSettings.showForBots) return fn(...args);
      const guild = getGuild(channel.guild_id);

      const data = {} as { tagColor?: string; textColor?: string; tagText: string };

      if (guild) {
        const member = getMemberMod.getMember(guild.id, user.id);
        const permissions = getPermissionsRaw(guild, user.id, getMemberMod, Permissions);
        const parsedPermissions = parseBitFieldPermissions(permissions, Permissions);

        if (guild.ownerId === user.id) {
          // user is the guild owner
          const tagColor = "#ED9F1B"; // TODO: settings 'ownerTagColor'
          // TODO: setting 'useCustomColor'
          data.tagColor = tagColor || member?.colorString;
          data.textColor = getContrastYIQ(tagColor || member?.colorString);
          data.tagText = getTagText(USER_TYPES.SOWNER);
        } else if (parsedPermissions.ADMINISTRATOR) {
          // user is an admin
          const tagColor = "#B4B4B4"; // TODO: settings 'adminTagColor'
          // TODO: setting 'useCustomColor'
          data.tagColor = tagColor || member?.colorString;
          data.textColor = getContrastYIQ(tagColor || member?.colorString);
          data.tagText = getTagText(USER_TYPES.ADMIN);
        } else if (
          parsedPermissions.MANAGE_SERVER ||
          parsedPermissions.MANAGE_CHANNELS ||
          parsedPermissions.MANAGE_ROLES
        ) {
          // user is staff
          const tagColor = "#8D5C51"; // TODO: settings 'staffTagColor'
          // TODO: setting 'useCustomColor'
          data.tagColor = tagColor || member?.colorString;
          data.textColor = getContrastYIQ(tagColor || member?.colorString);
          data.tagText = getTagText(USER_TYPES.STAFF);
        } else if (
          parsedPermissions.KICK_MEMBERS ||
          parsedPermissions.BAN_MEMBERS ||
          parsedPermissions.MANAGE_MEMBERS
        ) {
          // user is a mod
          const tagColor = "#C8682E"; // TODO: settings 'modTagColor'
          // TODO: setting 'useCustomColor'
          data.tagColor = tagColor || member?.colorString;
          data.textColor = getContrastYIQ(tagColor || member?.colorString);
          data.tagText = getTagText(USER_TYPES.MOD);
        } else {
          return originalTag;
        }
      } else if (channel.type === 3 && channel.ownerId === user.id) {
        // group owner
        const tagColor = "#ED9F1B"; // TODO: settings 'ownerTagColor';
        // TODO: setting 'useCustomColor'
        data.tagColor = tagColor;
        data.textColor = getContrastYIQ(tagColor);
        data.tagText = getTagText(USER_TYPES.SOWNER);
      } else {
        return originalTag;
      }

      return Tag({
        originalTag,
        className: `${botTagCozyClasses.botTagCozy} ${botTagRegularClasses.botTagRegular} ${botTagRegularClasses.rem} ownertag`,
        tagText: data.tagText,
        tagColor: data.tagColor,
        textColor: data.textColor,
      });
    });
  }
}

export function stop(): void {
  inject.uninjectAll();
}
