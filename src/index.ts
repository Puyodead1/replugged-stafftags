/* eslint-disable no-undefined */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Injector, webpack } from "replugged";
import { DEFAULT_TAG_TEXTS, Guild, GuildMember, USER_TYPES } from "./constants";
import "./style.css";
const inject = new Injector();

const settings = {
  customTextEnabled: false,
  tagText: {
    admin: "admin",
    owner: "owner",
    mod: "mod",
    staff: "staff",
  } as { [key: string]: string },
};

function getTagText(tagType: string): string {
  switch (tagType) {
    case USER_TYPES.ADMIN:
      tagType = "admin";
      break;
    case USER_TYPES.GOWNER:
    case USER_TYPES.SOWNER:
      tagType = "owner";
      break;
    case USER_TYPES.MOD:
      tagType = "mod";
      break;
    case USER_TYPES.STAFF:
      tagType = "staff";
      break;
  }
  // const customTextEnabled = this.settings.get("customTagText", false);
  // const tagText = this.settings.get(`${tagType}TagText`);
  const { customTextEnabled } = settings;
  const tagText = settings.tagText[`${tagType}TagText`];
  return customTextEnabled ? tagText : DEFAULT_TAG_TEXTS[tagType];
}

export async function start(): Promise<void> {
  const { Permissions } = webpack.common.constants;

  const getGuildMod = (await webpack.waitForModule(
    webpack.filters.byProps("getGuild", "getGuildCount", "getGuilds", "isLoaded"),
  )) as {
    getGuild: (id: string) => Guild;
    getGuilds: () => { [key: string]: Guild };
  };
  const getChannelMod = (await webpack.waitForModule(webpack.filters.byProps("getChannel"))) as {
    getChannel: (id: string) => {
      name: string;
    };
  };
  const getMemberMod = Object.values(
    await webpack.waitForModule(webpack.filters.byProps("getMember")),
  ).find((x) => x.getMember) as {
    getMember: (guildId: string, memberId: string) => GuildMember;
  } | null;

  if (!getMemberMod) {
    console.error("Failed to find getMember module! Cannot continue");
    return;
  }

  const MessageTimestamp = webpack.getBySource(/\w+\.showTimestamp,\w+=\w+\.showTimestampOnHover/);

  const parseBitFieldPermissions = (allowed: bigint) => {
    const permissions = {} as { [key: string]: boolean };
    for (const perm of Object.keys(Permissions)) {
      if (!perm.startsWith("all")) {
        if (BigInt(allowed) & BigInt(Permissions[perm])) {
          permissions[perm] = true;
        }
      }
    }
    return permissions;
  };

  const getPermissionsRaw = (guild: Guild, userId: string) => {
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
  };

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
