# Replugged Staff Tags

> **Warning**  
> This branch is experimental!
>
> Use a different module for injection, which doesn't render into replies

Displays bot like tags in Chat and Member List indicating if a user is a Group DM or Guild Owner,
and depending on the users permissions Admin, Mod, or Staff.

---

Chat Preview

![Chat](https://i.imgur.com/6NwdauH.png)

Crown Mode

![Crowns](https://i.imgur.com/JUpp25w.png)

## ![Crowns2](https://i.imgur.com/ZzEIbRY.png)

## Notes

- Member List is not implemented.
- As repluged is still in a developer preview, there is no settings page. However you can edit
  settings with the API via the console.
  - You can find defaults in [constants.ts](src/constants.ts#L46).
  - Start by initializing the settings:
    `const stcfg = await replugged.settings.init("me.puyodead1.StaffTags")`
  - Get settings: `stcfg.all()`
  - Update a setting: `stcfg.set("useCustomTagColors", true)`
  - Reset settings: `stcfg.set("shouldResetSettings", true)` then reload Discord. (note: trying to
    reload the plugin will not work.)
  - Note that not all settings are currently implemented.
