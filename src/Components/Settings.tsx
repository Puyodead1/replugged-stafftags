import { common, components, util, webpack } from "replugged";
import { cfg } from "..";
import { DEFAULT_TAG_TEXTS, USER_TYPES } from "../constants";
import { resetSettings } from "../utils";
const { SwitchItem, TextInput, Button, FormItem, Divider, Text } = components;
const { React } = common;

const ManifestJSON = require("../../manifest.json");

const classes = (await webpack.waitForModule(webpack.filters.byProps("labelRow"))) as Record<
  string,
  string
>;

export function Settings() {
  const useCustomTagText = util.useSetting(cfg, "useCustomTagText");
  const useCustomTagColors = util.useSetting(cfg, "useCustomTagColors");
  const useCustomTagPermissions = util.useSetting(cfg, "useCustomTagPermissions");

  const [tagTexts, setTagTexts] = React.useState(cfg.get("tagTexts", DEFAULT_TAG_TEXTS));
  const [canReset, setCanReset] = React.useState(true);

  const updateTagText = (type: USER_TYPES, text: string) => {
    const newState = { ...tagTexts, [type]: text };
    setTagTexts(newState);
    cfg.set("tagTexts", newState);
  };

  return (
    <div>
      <SwitchItem
        note="Toggle rendering Server Owner tags."
        {...util.useSetting(cfg, "shouldShowServerOwnerTags")}>
        Show Server Owner Tags
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering Group Owner tags."
        {...util.useSetting(cfg, "shouldShowGroupOwnerTags")}>
        Show Group Owner Tags
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering Admin tags."
        {...util.useSetting(cfg, "shouldShowAdminTags")}>
        Show Admin Tags
      </SwitchItem>

      <SwitchItem note="Toggle rendering Mod tags." {...util.useSetting(cfg, "shouldShowModTags")}>
        Show Mod Tags
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering Staff tags."
        {...util.useSetting(cfg, "shouldShowStaffTags")}>
        Show Staff Tags
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering tags for bots."
        {...util.useSetting(cfg, "shouldShowForBots")}>
        Show for Bots
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering tags in chat."
        {...util.useSetting(cfg, "shouldDisplayInChat")}>
        Show in Chat
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering tags in the member list."
        {...util.useSetting(cfg, "shouldDisplayInMemberList")}>
        Show in Member List
      </SwitchItem>

      <SwitchItem
        note="Toggle rendering crowns instead of tags."
        {...util.useSetting(cfg, "shouldShowCrowns")}>
        Use Crowns
      </SwitchItem>

      <SwitchItem
        note="Toggle if crowns should be rendered in gold. This will force crowns to be rendered in gold instead of the tag color."
        {...util.useSetting(cfg, "useCrownGold")}>
        Force Gold Crowns
      </SwitchItem>

      {/* TODO: */}
      <SwitchItem
        note="Toggle changing the color of bot tags."
        {...util.useSetting(cfg, "modifyBotTagColor")}
        disabled>
        Modify Bot Tag Color
      </SwitchItem>

      {/* TODO: Color Pickers */}
      <SwitchItem note="Use Custom Tag Colors" {...useCustomTagColors} disabled>
        Use Custom Tag Colors
      </SwitchItem>

      {useCustomTagColors.value && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Server Owner</label>
                </div>
                {/* TODO: Color Picker Component */}
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Group Owner</label>
                </div>
                {/* TODO: Color Picker Component */}
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Admin</label>
                </div>
                {/* TODO: Color Picker Component */}
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Mod</label>
                </div>
                {/* TODO: Color Picker Component */}
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Staff</label>
                </div>
                {/* TODO: Color Picker Component */}
              </div>
            </FormItem>
          </div>

          <Divider />
        </div>
      )}

      <SwitchItem
        note="Enables customizing text of the tags. Enable to show settings."
        {...useCustomTagText}>
        Use Custom Tag Text
      </SwitchItem>

      {useCustomTagText.value && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Server Owner</label>
                </div>
                <TextInput
                  // note={"Changing this will change the text shown in Owner Tags"}
                  onChange={(c) => updateTagText(USER_TYPES.SOWNER, c)}
                  value={tagTexts[USER_TYPES.SOWNER]}
                  // required={true}
                />
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Group Owner</label>
                </div>
                <TextInput
                  // note={"Changing this will change the text shown in Owner Tags"}
                  onChange={(c) => updateTagText(USER_TYPES.GOWNER, c)}
                  value={tagTexts[USER_TYPES.GOWNER]}
                  // required={true}
                />
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Admin</label>
                </div>
                <TextInput
                  // note={"Changing this will change the text shown in Admin Tags"}
                  onChange={(c) => updateTagText(USER_TYPES.ADMIN, c)}
                  value={tagTexts[USER_TYPES.ADMIN]}
                  // required={true}
                />
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Mod</label>
                </div>
                <TextInput
                  // note={"Changing this will change the text shown in Mod Tags"}
                  onChange={(c) => updateTagText(USER_TYPES.MOD, c)}
                  value={tagTexts[USER_TYPES.MOD]}
                  // required={true}
                />
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Staff</label>
                </div>
                <TextInput
                  // note={"Changing this will change the text shown in Staff Tags"}
                  onChange={(c) => updateTagText(USER_TYPES.STAFF, c)}
                  value={tagTexts[USER_TYPES.STAFF]}
                  // required={true}
                />
              </div>
            </FormItem>
          </div>

          <Divider />
        </div>
      )}

      {/* TODO: Implement */}
      <SwitchItem
        note="Enables customizing permissions for tags. Enable to show settings."
        {...useCustomTagPermissions}
        disabled>
        Use Custom Tag Permissions
      </SwitchItem>

      {useCustomTagPermissions.value && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Mod</label>
                </div>
                {/* TODO: Multi-select */}
              </div>
            </FormItem>

            <FormItem>
              <div style={{ marginBottom: 10 }}>
                <div className={classes.labelRow}>
                  <label className={classes.title}>Staff</label>
                </div>
                {/* TODO: Multi-select */}
              </div>
            </FormItem>
          </div>

          <Divider />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          {/* TODO: Changelog component */}
          <Button onClick={() => {}} style={{ margin: "0 5px" }} disabled>
            Show Changelog
          </Button>
          {/* TODO: Only enable this if settings were changed from defaults */}
          <Button
            onClick={() => {
              resetSettings();
              setCanReset(false);
            }}
            style={{ margin: "0 5px" }}
            color={Button.Colors.RED}
            disabled={!canReset}>
            Reset Settings
          </Button>
        </div>
        <Text style={{ textAlign: "center" }}>StaffTags V{ManifestJSON.version}</Text>
      </div>

      {/* TODO: Put the permissions for these tags in a section */}
      {/* TODO: Show default permissions and custom permissions when implemented */}
      {/* <div style={{ color: "white" }}>
        <p>Owner: Is the owner of a Server or Group Chat</p>
        <p>Admin: Has the Administrator permission</p>

        <p>
          Mod: Has one of the following permissions
          <ul>
            <li>- Kick Members</li>
            <li>- Ban Members</li>
            <li>- Manage Messages</li>
          </ul>
        </p>

        <p>
          Staff: Has one of the following permissions
          <ul>
            <li>- Manage Server</li>
            <li>- Manage Channels</li>
            <li>- Manage Roles</li>
          </ul>
        </p>
      </div> */}
    </div>
  );
}
