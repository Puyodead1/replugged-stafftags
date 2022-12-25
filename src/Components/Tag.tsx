import { Channel, Guild, User } from "discord-types/general";
import { common } from "replugged";
import { SettingsManager } from "replugged/dist/renderer/apis/settings";
import {
  DefaultSettings,
  DEFAULT_TAG_COLORS,
  DEFAULT_TAG_TEXTS,
  GetGuildFunction,
  GetMemberModule,
  StaffTagsSettings,
  USER_TYPES,
} from "../constants";
import { getContrastYIQ } from "../utils";
import crown from "./Crown";

const { React } = common;

interface TagProps {
  originalTag: React.ReactElement;
  cfg: SettingsManager<StaffTagsSettings>;
  args: { user: User; channel: Channel };
  className: string;
  getMemberMod: GetMemberModule;
  Tooltip: typeof React.Component;
}

function Tag(Tooltip: React.Component) {
  const Crown = crown(Tooltip);

  return function (props: TagProps) {
    const [shouldReturnOriginal, setShouldReturnOriginal] = React.useState(true);
    const [tagColor, setTagColor] = React.useState<string | undefined>();
    const [textColor, setTextColor] = React.useState<string>();
    const [tagText, setTagText] = React.useState<string>();

    const tagTexts = props.cfg.get("tagTexts", DefaultSettings.tagTexts);
    const tagColors = props.cfg.get("tagColors", DefaultSettings.tagColors);
    const useCustomTagColors = props.cfg.get(
      "useCustomTagColors",
      DefaultSettings.useCustomTagColors,
    );
    const shouldShowCrowns = props.cfg.get("shouldShowCrowns", DefaultSettings.shouldShowCrowns);

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
      const {
        guilds,
        constants: { Permissions },
      } = common;
      const { getGuild } = guilds as { getGuild: GetGuildFunction };

      const { user, channel } = props.args;
      if (!user || !channel) return;

      // if the user is a bot, and showing bot tags is disabled, return the original tag
      if (user.bot && !props.cfg.get("shouldShowForBots", DefaultSettings.shouldShowForBots))
        return;

      const guild = getGuild(channel.guild_id);

      const getTagText = (tagType: USER_TYPES): string => {
        return props.cfg.get("useCustomTagText", DefaultSettings.useCustomTagText)
          ? tagTexts![tagType]
          : DEFAULT_TAG_TEXTS[tagType];
      };

      let tagColorTmp, tagTypeTmp;

      if (guild) {
        const member = props.getMemberMod.getMember(guild.id, user.id);
        const permissions = getPermissionsRaw(guild, user.id, Permissions);
        const parsedPermissions = parseBitFieldPermissions(permissions, Permissions);

        if (guild.ownerId === user.id) {
          // user is the guild owner

          // if showing owner tags is disabled, return the original tag
          if (!props.cfg.get("shouldShowOwnerTags", DefaultSettings.shouldShowOwnerTags)) return;

          // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
          tagColorTmp = useCustomTagColors ? tagColors![USER_TYPES.SOWNER] : member?.colorString;

          // update the state
          tagTypeTmp = USER_TYPES.SOWNER;
        } else if (parsedPermissions.ADMINISTRATOR) {
          // user is an admin

          // if showing admin tags is disabled, return the original tag
          if (!props.cfg.get("shouldShowAdminTags", DefaultSettings.shouldShowAdminTags)) return;

          // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
          tagColorTmp = useCustomTagColors ? tagColors![USER_TYPES.ADMIN] : member?.colorString;

          // update the state
          tagTypeTmp = USER_TYPES.ADMIN;
        } else if (
          parsedPermissions.MANAGE_SERVER ||
          parsedPermissions.MANAGE_CHANNELS ||
          parsedPermissions.MANAGE_ROLES
        ) {
          // user is staff

          // if showing staff tags is disabled, return the original tag
          if (!props.cfg.get("shouldShowStaffTags", DefaultSettings.shouldShowStaffTags)) return;

          // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
          tagColorTmp = useCustomTagColors ? tagColors![USER_TYPES.STAFF] : member?.colorString;

          // update the state
          tagTypeTmp = USER_TYPES.STAFF;
        } else if (
          parsedPermissions.KICK_MEMBERS ||
          parsedPermissions.BAN_MEMBERS ||
          parsedPermissions.MANAGE_MEMBERS
        ) {
          // user is a mod

          // if showing mod tags is disabled, return the original tag
          if (!props.cfg.get("shouldShowModTags", DefaultSettings.shouldShowModTags)) return;

          // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
          tagColorTmp = useCustomTagColors ? tagColors![USER_TYPES.MOD] : member?.colorString;

          // update the state
          tagTypeTmp = USER_TYPES.MOD;
        }
      } else if (channel.type === 3 && channel.ownerId === user.id) {
        // group channel owner

        // if showing owner tags is disabled, return the original tag
        if (!props.cfg.get("shouldShowOwnerTags", DefaultSettings.shouldShowOwnerTags)) return;

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        tagColorTmp = useCustomTagColors
          ? tagColors![USER_TYPES.GOWNER]
          : DEFAULT_TAG_COLORS[USER_TYPES.GOWNER];

        // update the state
        tagTypeTmp = USER_TYPES.GOWNER;
      }

      if (tagTypeTmp) {
        setTagText(getTagText(tagTypeTmp));
        setTagColor(tagColorTmp);
        if (
          (!tagColorTmp && shouldShowCrowns) ||
          (shouldShowCrowns && props.cfg.get("useCrownGold", DefaultSettings.useCrownGold))
        ) {
          setTextColor("#faa81a");
        } else {
          setTextColor(shouldShowCrowns && tagColorTmp ? tagColorTmp : getContrastYIQ(tagColorTmp));
        }
        setShouldReturnOriginal(false);
      }
    }, []);

    if (shouldReturnOriginal || !tagText) return props.originalTag;

    return shouldShowCrowns ? (
      <span>
        {props.originalTag}
        <Crown text={tagText} className={props.className} color={textColor} />
      </span>
    ) : (
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
  };
}

export default Tag;
