import { Channel, Guild, User } from "discord-types/general";
import { common } from "replugged";
import { NamespacedSettings } from "replugged/dist/renderer/apis/settings";
import {
  DEFAULT_TAG_COLORS,
  DEFAULT_TAG_TEXTS,
  GetGuildFunction,
  GetMemberModule,
  StaffTagsSettings,
  USER_TYPES,
} from "../constants";
import { getContrastYIQ } from "../utils";

const { React } = common;

interface TagProps {
  originalTag: React.ReactElement;
  settings: NamespacedSettings<StaffTagsSettings>;
  getMemberMod: GetMemberModule;
  args: { user: User; channel: Channel };
  className: string;
}

function Tag(props: TagProps) {
  const [shouldReturnOriginal, setShouldReturnOriginal] = React.useState(true);
  const [tagColor, setTagColor] = React.useState();
  const [textColor, setTextColor] = React.useState();
  const [tagText, setTagText] = React.useState();
  const [allSettings, setAllSettings] = React.useState();

  const getPermissionsRaw = (
    guild: Guild,
    userId: string,
    Permissions: Record<string, bigint>,
  ): bigint => {
    let permissions = 0n;

    const member = props.getMemberMod.getMember(guild.id, userId);

    if (guild && member) {
      if (guild.ownerId === userId) {
        permissions = BigInt(Permissions.ADMINISTRATOR);
      } else {
        /* @everyone is not inlcuded in the member's roles */
        permissions |= BigInt(guild.roles[guild.id]?.permissions);

        for (const roleId of member.roles) {
          const rolePerms = guild.roles[roleId]?.permissions;
          // eslint-disable-next-line no-undefined
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

  const parseBitFieldPermissions = (allowed: bigint, Permissions: Record<string, bigint>) => {
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

  React.useEffect(() => {
    props.settings.all().then(setAllSettings).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (!allSettings) return;

    const {
      guilds,
      constants: { Permissions },
    } = common;
    const { getGuild } = guilds as { getGuild: GetGuildFunction };

    const { user, channel } = props.args;

    // if the user is a bot, and showing bot tags is disabled, return the original tag
    if (user.bot && !allSettings.shouldShowForBots) return;

    const guild = getGuild(channel.guild_id);

    const getTagText = (tagType: USER_TYPES): Promise<string> => {
      return allSettings.useCustomTagText
        ? allSettings.tagTexts[tagType]
        : DEFAULT_TAG_TEXTS[tagType];
    };

    let tagColor, tagType;

    if (guild) {
      const member = props.getMemberMod.getMember(guild.id, user.id);
      const permissions = getPermissionsRaw(guild, user.id, Permissions);
      const parsedPermissions = parseBitFieldPermissions(permissions, Permissions);

      if (guild.ownerId === user.id) {
        // user is the guild owner

        // if showing owner tags is disabled, return the original tag
        if (!allSettings.shouldShowOwnerTags) return;

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.SOWNER]
          : member?.colorString;

        // update the state
        tagType = USER_TYPES.SOWNER;
      } else if (parsedPermissions.ADMINISTRATOR) {
        // user is an admin

        // if showing admin tags is disabled, return the original tag
        if (!allSettings.shouldShowAdminTags) return;

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.ADMIN]
          : member?.colorString;

        // update the state
        tagType = USER_TYPES.ADMIN;
      } else if (
        parsedPermissions.MANAGE_SERVER ||
        parsedPermissions.MANAGE_CHANNELS ||
        parsedPermissions.MANAGE_ROLES
      ) {
        // user is staff

        // if showing staff tags is disabled, return the original tag
        if (!allSettings.shouldShowStaffTags) return;

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.STAFF]
          : member?.colorString;

        // update the state
        tagType = USER_TYPES.STAFF;
      } else if (
        parsedPermissions.KICK_MEMBERS ||
        parsedPermissions.BAN_MEMBERS ||
        parsedPermissions.MANAGE_MEMBERS
      ) {
        // user is a mod

        // if showing mod tags is disabled, return the original tag
        if (!allSettings.shouldShowModTags) return;

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.MOD]
          : member?.colorString;

        // update the state
        tagType = USER_TYPES.MOD;
      }
    } else if (channel.type === 3 && channel.ownerId === user.id) {
      // group channel owner

      // if showing owner tags is disabled, return the original tag
      if (!allSettings.shouldShowOwnerTags) return;

      // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
      tagColor = allSettings.useCustomTagColors
        ? allSettings.tagColors[USER_TYPES.GOWNER]
        : DEFAULT_TAG_COLORS[USER_TYPES.GOWNER];

      // update the state
      tagType = USER_TYPES.GOWNER;
    }

    if (tagType) {
      setTagText(getTagText(tagType));
      setTagColor(tagColor);
      setTextColor(getContrastYIQ(tagColor));
      setShouldReturnOriginal(false);
    }
  }, [allSettings]);

  if (shouldReturnOriginal || !textColor || !tagText) return props.originalTag;

  return (
    <span>
      {props.originalTag}
      <span
        className={props.className}
        style={{
          backgroundColor: tagColor,
          color: textColor,
        }}>
        {tagText}
      </span>
    </span>
  );
}

export default Tag;
