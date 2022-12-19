import { Guild, GuildMember } from "discord-types/general";
import { Settings } from "replugged";

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
  [USER_TYPES.STAFF]: "#C8682E",
  [USER_TYPES.MOD]: "#8D5C51",
  [USER_TYPES.ADMIN]: "#f04747",
  [USER_TYPES.GOWNER]: "#ED9F1B",
  [USER_TYPES.SOWNER]: "#ED9F1B",
};

export interface StaffTagsSettings extends Settings {
  shouldShowOwnerTags: boolean;
  shouldShowAdminTags: boolean;
  shouldShowModTags: boolean;
  shouldShowStaffTags: boolean;
  shouldDisplayInChat: boolean;
  shouldDisplayInMemberList: boolean;
  shouldShowCrowns: boolean;
  shouldShowForBots: boolean;
  useCustomTagColors: boolean;
  useCustomTagText: boolean;
  tagTexts: { [key: string]: string };
  tagColors: { [key: string]: string };
  changelogLastSeen: string | null;
  shouldResetSettings: boolean;
}

export const DefaultSettings: StaffTagsSettings = {
  shouldShowOwnerTags: true,
  shouldShowAdminTags: true,
  shouldShowModTags: true,
  shouldShowStaffTags: true,
  shouldDisplayInChat: true,
  shouldDisplayInMemberList: true,
  shouldShowCrowns: false,
  shouldShowForBots: true,
  useCustomTagColors: false,
  useCustomTagText: false,
  tagTexts: DEFAULT_TAG_TEXTS,
  tagColors: DEFAULT_TAG_COLORS,
  changelogLastSeen: null,
  shouldResetSettings: false,
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
