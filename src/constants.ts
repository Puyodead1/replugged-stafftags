export const USER_TYPES = {
  NONE: "None",
  STAFF: "Staff",
  MOD: "Mod",
  ADMIN: "Admin",
  SOWNER: "Server Owner",
  GOWNER: "Group Owner",
};

export const DEFAULT_TAG_TEXTS = {
  STAFF: "Staff",
  MOD: "Mod",
  ADMIN: "Admin",
  OWNER: "Owner",
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
