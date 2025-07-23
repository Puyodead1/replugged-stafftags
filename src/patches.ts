import { PlaintextPatch } from "replugged/types";

import ManifestJSON from "../manifest.json";

export default [
  {
    find: ".MEMBER_LIST_ITEM_AVATAR_DECORATION_PADDING)",
    replacements: [
      {
        match: /decorators:(\(0,\w+\.jsx\).+?}\))/,
        replace: (_, prefix: string) =>
          `decorators:[replugged?.plugins?.getExports('${ManifestJSON.id}')?._renderStaffTag(arguments[0].user),${prefix}]`,
      },
      // if not last one because of
      {
        match: /decorators:\[/,
        replace: (_) =>
          `decorators:[replugged?.plugins?.getExports('${ManifestJSON.id}')?._renderStaffTag(arguments[0]),`,
      },
    ],
  },
] as PlaintextPatch[];
