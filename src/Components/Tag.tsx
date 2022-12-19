/* eslint-disable */

import { Channel, Guild, User } from "discord-types/general";
import React, { Component } from "react";
import { webpack } from "replugged";
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

interface TagProps {
  originalTag: React.ReactElement;
  settings: NamespacedSettings<StaffTagsSettings>;
  getMemberMod: GetMemberModule;
  args: { user: User; channel: Channel };
  className: string;
}

interface TagState {
  shouldReturnOriginal: boolean;
  tagText?: string;
  tagColor?: string;
  textColor?: string;
}

class Tag extends Component<TagProps, TagState> {
  state = {
    shouldReturnOriginal: false,
  } as TagState;

  async componentDidMount(): Promise<void> {
    const { guilds } = webpack.common;
    const { getGuild } = guilds as { getGuild: GetGuildFunction };
    const { Permissions } = webpack.common.constants;

    const { user, channel } = this.props.args;
    const allSettings = await this.props.settings.all();

    // if the user is a bot, and showing bot tags is disabled, return the original tag
    if (user.bot && !allSettings.shouldShowForBots) {
      this.setState({ shouldReturnOriginal: true });
      return;
    }

    const guild = getGuild(channel.guild_id);

    if (guild) {
      const member = this.props.getMemberMod.getMember(guild.id, user.id);
      const permissions = this.getPermissionsRaw(guild, user.id, Permissions);
      const parsedPermissions = this.parseBitFieldPermissions(permissions, Permissions);

      if (guild.ownerId === user.id) {
        // user is the guild owner

        // if showing owner tags is disabled, return the original tag
        if (!allSettings.shouldShowOwnerTags) {
          this.setState({ shouldReturnOriginal: true });
          return;
        }

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        const tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.SOWNER]
          : member?.colorString;

        // update the state
        this.setState({
          ...this.state,
          tagColor,
          tagText: await this.getTagText(USER_TYPES.SOWNER),
          textColor: getContrastYIQ(tagColor),
        });
      } else if (parsedPermissions.ADMINISTRATOR) {
        // user is an admin

        // if showing admin tags is disabled, return the original tag
        if (!allSettings.shouldShowAdminTags) {
          this.setState({ shouldReturnOriginal: true });
          return;
        }

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        const tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.ADMIN]
          : member?.colorString;

        // update the state
        this.setState({
          ...this.state,
          tagColor,
          tagText: await this.getTagText(USER_TYPES.ADMIN),
          textColor: getContrastYIQ(tagColor),
        });
      } else if (
        parsedPermissions.MANAGE_SERVER ||
        parsedPermissions.MANAGE_CHANNELS ||
        parsedPermissions.MANAGE_ROLES
      ) {
        // user is staff

        // if showing staff tags is disabled, return the original tag
        if (!allSettings.shouldShowStaffTags) {
          this.setState({ shouldReturnOriginal: true });
          return;
        }

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        const tagColor = allSettings.useCustomTagColors
          ? allSettings.tagColors[USER_TYPES.STAFF]
          : member?.colorString;

        // update the state
        this.setState({
          ...this.state,
          tagColor,
          tagText: await this.getTagText(USER_TYPES.STAFF),
          textColor: getContrastYIQ(tagColor),
        });
      } else if (
        parsedPermissions.KICK_MEMBERS ||
        parsedPermissions.BAN_MEMBERS ||
        parsedPermissions.MANAGE_MEMBERS
      ) {
        // user is a mod

        // if showing mod tags is disabled, return the original tag
        if (!allSettings.shouldShowModTags) {
          this.setState({ shouldReturnOriginal: true });
          return;
        }

        // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
        const tagColor = allSettings.tagColors[USER_TYPES.MOD];

        // update the state
        this.setState({
          ...this.state,
          tagColor: allSettings.useCustomTagColors ? tagColor : member?.colorString,
          tagText: await this.getTagText(USER_TYPES.MOD),
          textColor: getContrastYIQ(tagColor),
        });
      } else {
        this.setState({ shouldReturnOriginal: true });
        return;
      }
    } else if (channel.type === 3 && channel.ownerId === user.id) {
      // group channel owner

      // if showing owner tags is disabled, return the original tag
      if (!allSettings.shouldShowOwnerTags) {
        this.setState({ shouldReturnOriginal: true });
        return;
      }

      // get the tag color from settings if custom tag colors are enabled, otherwise use the member's color
      const tagColor = allSettings.useCustomTagColors
        ? allSettings.tagColors[USER_TYPES.GOWNER]
        : DEFAULT_TAG_COLORS[USER_TYPES.GOWNER];
      // update the state
      this.setState({
        ...this.state,
        tagColor,
        tagText: await this.getTagText(USER_TYPES.GOWNER),
        textColor: getContrastYIQ(tagColor),
      });
    }
  }

  async getTagText(tagType: USER_TYPES): Promise<string> {
    const allSettings = await this.props.settings.all();
    return allSettings.useCustomTagText
      ? allSettings.tagTexts[tagType]
      : DEFAULT_TAG_TEXTS[tagType];
  }

  getPermissionsRaw(guild: Guild, userId: string, Permissions: Record<string, bigint>): bigint {
    let permissions = 0n;

    const member = this.props.getMemberMod.getMember(guild.id, userId);

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

  parseBitFieldPermissions(allowed: bigint, Permissions: Record<string, bigint>) {
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

  render() {
    return this.state.shouldReturnOriginal ? (
      this.props.originalTag
    ) : (
      <span>
        {this.props.originalTag}
        <span
          className={this.props.className}
          style={{
            backgroundColor: this.state.tagColor,
            color: this.state.textColor,
          }}>
          {this.state.tagText}
        </span>
      </span>
    );
  }
}

export default (props: TagProps) => (
  <Tag
    className={props.className}
    originalTag={props.originalTag}
    settings={props.settings}
    getMemberMod={props.getMemberMod}
    args={props.args}
  />
);
