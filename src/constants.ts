import { Settings } from "replugged";

export enum USER_TYPES {
  NONE = "None",
  STAFF = "Staff",
  MOD = "Mod",
  ADMIN = "Admin",
  SOWNER = "Server Owner",
  GOWNER = "Group Owner",
}

export const DEFAULT_TAG_TEXTS = {
  [USER_TYPES.STAFF]: "Staff",
  [USER_TYPES.MOD]: "Mod",
  [USER_TYPES.ADMIN]: "Admin",
  [USER_TYPES.GOWNER]: "Owner",
  [USER_TYPES.SOWNER]: "Owner",
} as { [key: string]: string };

export interface Guild {
  id: string;
  name: string;
  acronym: string;
  description: string | null;
  icon: string | null;
  splash: string | null;
  banner: string | null;
  features: string[];
  preferredLocale: string;
  ownerId: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  application_id: string | null;
  roles: {
    [key: string]: {
      id: string;
      name: string;
      permissions: string;
      mentionable: boolean;
      position: number;
      originalPosition: number;
      color: number;
      colorString: string | null;
      hoist: boolean;
      managed: boolean;
      tags: object;
      icon: string | null;
      unicodeEmoji: string | null;
      flags: number;
    };
  };
  afkChannelId: string | null;
  afkTimeout: number;
  systemChannelId: string | null;
  joinedAt: string;
  verificationLevel: number;
  explicitContentFilter: number;
  defaultMessageNotifications: number;
  mfaLevel: number;
  vanityURLCode: string | null;
  premiumTier: number;
  premiumSubscriberCount: number;
  premiumProgressBarEnabled: boolean;
  systemChannelFlags: number;
  discoverySplash: string | null;
  rulesChannelId: string | null;
  safetyAlertsChannelId: string | null;
  publicUpdatesChannelId: string | null;
  maxStageVideoChannelUsers: number;
  maxVideoChannelUsers: number;
  maxMembers: number;
  nsfwLevel: number;
  applicationCommandCounts: object;
  hubType: number | null;
}

export interface GuildMember {
  userId: string;
  nick: string | null;
  guildId: string;
  avatar: string | null;
  roles: string[];
  colorString: string | null;
  colorRoleId: string | null;
  iconRoleId: string | null;
  hoistRoleId: string | null;
  premiumSince: string | null;
  isPending: boolean;
  joinedAt: string;
  communicationDisabledUntil: string | null;
  fullProfileLoadedTimestamp: number;
  flags: number;
}

export interface StaffTagsSettings extends Settings {
  showOwnerTags: boolean;
  showAdminTags: boolean;
  showModTags: boolean;
  showStaffTags: boolean;
  displayInMessages: boolean;
  displayInMemberList: boolean;
  showCrowns: boolean;
  showForBots: boolean;
  customTagColorsEnabled: boolean;
  customTagTextEnabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customTagColors: any; // TODO:
  tagTexts: { [key: string]: string };
}

export const DefaultSettings: StaffTagsSettings = {
  showOwnerTags: true,
  showAdminTags: true,
  showModTags: true,
  showStaffTags: true,
  displayInMessages: true,
  displayInMemberList: true,
  showCrowns: false,
  showForBots: true,
  customTagColorsEnabled: false,
  customTagTextEnabled: false,
  customTagColors: {}, // TODO:
  tagTexts: {
    STAFF: "Staff",
    MOD: "Mod",
    ADMIN: "Admin",
    OWNER: "Owner",
  },
};

export type GetMemberFunction = (guildId: string, userId: string) => GuildMember | undefined;
export type GetChannelFunction = (id: string) =>
  | {
      name: string;
    }
  | undefined;
export type GetGuildFunction = (id: string) => Guild | undefined;
export type GetGuildsFunction = () => { [key: string]: Guild };

export interface GetMemberModule {
  getMember: GetMemberFunction;
}
