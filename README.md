# Replugged Staff Tags

Displays bot like tags in Chat and Member List indicating if a user is a Group DM or Guild Owner,
and depending on the users permissions Admin, Mod, or Staff.

### Chat Preview

![Chat](https://i.imgur.com/6NwdauH.png)

---

## Notes

- Member List is not implemented.
- Crowns are not implemented.
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
