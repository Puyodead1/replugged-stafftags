# Replugged Staff Tags

Displays owner, admin, and staff tags similar to bot tags, they can appear in the member list and/or
chat.

Chat Preview ![Chat](https://i.imgur.com/6NwdauH.png)

---

## Notes

- As repluged is still in a developer preview, there is no settings page. However you can edit
  settings with the API via the console.
  - You can find defaults in [constants.ts](src/constants.ts#L46).
  - Get settings: `await replugged.settings.get("me.puyodead1.StaffTags").all()`
  - Update a setting:
    `await replugged.settings.get("me.puyodead1.StaffTags").set("customTagColorsEnabled", true)`
  - Reset settings:
    `await replugged.settings.get("me.puyodead1.StaffTags").set("shouldResetSettings", true)` then
    reload the plugin either by reloading discord or with
    `await replugged.plugins.reload("me.puyodead1.StaffTags")`
  - Note that not all settings are currently implemented.
