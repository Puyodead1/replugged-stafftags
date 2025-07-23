import { Guild, GuildMember } from "discord-types/general";
import { Store } from "replugged/dist/renderer/modules/common/flux";

export enum USER_TYPES {
  NONE = 0,
  STAFF = 1,
  MOD = 2,
  ADMIN = 3,
  SOWNER = 4,
  GOWNER = 5,
}

export const DEFAULT_TAG_TEXTS = {
  [USER_TYPES.STAFF]: "Staff",
  [USER_TYPES.MOD]: "Mod",
  [USER_TYPES.ADMIN]: "Admin",
  [USER_TYPES.GOWNER]: "Group Owner",
  [USER_TYPES.SOWNER]: "Server Owner",
} as { [key: string]: string };

export const DEFAULT_TAG_COLORS = {
  [USER_TYPES.STAFF]: "#8D5C51",
  [USER_TYPES.MOD]: "#C8682E",
  [USER_TYPES.ADMIN]: "#B4B4B4",
  [USER_TYPES.GOWNER]: "#ED9F1B",
  [USER_TYPES.SOWNER]: "#ED9F1B",
};

export const DEFAULT_TAG_PERMISSIONS = {
  [USER_TYPES.STAFF]: [],
  [USER_TYPES.MOD]: [],
};

export interface Settings {
  shouldShowServerOwnerTags: boolean;
  shouldShowGroupOwnerTags: boolean;
  shouldShowAdminTags: boolean;
  shouldShowModTags: boolean;
  shouldShowStaffTags: boolean;
  shouldShowCrowns: boolean;
  shouldShowForBots: boolean;
  shouldDisplayInChat: boolean;
  shouldDisplayInMemberList: boolean;
  useCustomTagColors: boolean;
  useCustomTagText: boolean;
  useCustomTagPermissions: boolean;
  tagTexts: { [key: number]: string };
  tagColors: { [key: number]: string };
  tagPermissions: { [key: number]: unknown[] };
  changelogLastSeen: string | null;
  shouldResetSettings: boolean;
  modifyBotTagColor: boolean;
  useCrownGold: boolean;
}

export const DefaultSettings: Settings = {
  shouldShowServerOwnerTags: true,
  shouldShowGroupOwnerTags: true,
  shouldShowAdminTags: true,
  shouldShowModTags: true,
  shouldShowStaffTags: true,
  shouldShowCrowns: false,
  shouldShowForBots: true,
  shouldDisplayInChat: true,
  shouldDisplayInMemberList: true,
  useCustomTagColors: false,
  useCustomTagText: false,
  useCustomTagPermissions: false,
  tagTexts: DEFAULT_TAG_TEXTS,
  tagColors: DEFAULT_TAG_COLORS,
  tagPermissions: DEFAULT_TAG_PERMISSIONS,
  changelogLastSeen: null,
  shouldResetSettings: false,
  modifyBotTagColor: false,
  useCrownGold: true,
};

export type GetMemberFunction = (guildId: string, userId: string) => GuildMember | undefined;
export type GetGuildFunction = (id: string) => Guild | undefined;
export type GetGuildsFunction = () => { [key: string]: Guild };

export interface GuildMemberStoreType extends Store {
  getMember: GetMemberFunction;
}
