<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/components/GroupedCheckBox.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import {
    store,
    m,
    isUniqueUserName,
    updateDocument,
  } from "../../lib/store.svelte.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let user = store.users.find((user) => user.id === item);
  let name = $state(user.name);
  let unavailable = $state(!!user.deletedAt);
  let result = $state(undefined);

  let allGroups = store.groups.filter((group) => !group.deletedAt);
  let groupItems = allGroups.map((group) => ({
    value: group.id,
    label: group.name,
  }));
  const getSelectedGroups = () =>
    allGroups
      .filter((group) => (group.users ?? []).includes(user.id))
      .map((group) => group.id);
  let groups = $state(getSelectedGroups());
  const isSelectedGroupsChanged = () =>
    groups.length !== getSelectedGroups().length ||
    !groups.every((id) => getSelectedGroups().includes(id));
  const cancel = async () => {
    name = user.name;
    await pop();
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {m().edit()}
</h3>
{#if store.manager}
  <Content>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={m().displayName()}
        type="text"
        bind:value={name}
        message={result !== null || name !== user.name
          ? `${m().current()}: ${user.name}`
          : m().savedData()}
        error={!name
          ? m().required()
          : result !== null &&
              name !== user.name &&
              !isUniqueUserName(user.id, name)
            ? m().nameInUse()
            : ""}
      />
      {#if store.user.id !== user.id}
        <div class="flex grow gap-4 items-center">
          <Switch id="unavailable" bind:checked={unavailable} />
          {m().unavailable()}
        </div>
      {/if}
    </Fields>
  </Content>
  <h4>{m().memberOf()}</h4>
  <Content>
    <GroupedCheckBox id="groups" items={groupItems} bind:value={groups} />
  </Content>
  <Content>
    <ActionSave
      id="saveUser"
      changed={name !== user.name ||
        unavailable !== !!user.deletedAt ||
        isSelectedGroupsChanged()}
      valid={!!name && isUniqueUserName(user.id, name)}
      onCancel={cancel}
      onSave={async () => {
        name = name.trim();
        result = null;
        let actions = [];
        if (name !== user.name) {
          actions.push(
            updateDocument("users", user.id, {
              name,
              deletedAt: unavailable ? new Date() : null,
            }),
          );
        }
        actions.concat(
          store.groups
            .filter((group) =>
              groups
                .filter((id) => !getSelectedGroups().includes(id))
                .includes(group.id),
            )
            .map((group) =>
              updateDocument("groups", group.id, {
                users: [...group.users.filter((id) => id !== user.id), user.id],
              }),
            ),
        );
        actions.concat(
          store.groups
            .filter((group) =>
              getSelectedGroups()
                .filter((id) => !groups.includes(id))
                .includes(group.id),
            )
            .map((group) =>
              updateDocument("groups", group.id, {
                users: group.users.filter((id) => id !== user.id),
              }),
            ),
        );
        result = (await Promise.all(actions)).reduce(
          (acc, cur) => (cur ? cur : acc),
          null,
        );
        if (!result) {
          await cancel();
        }
      }}
      error={result ? m().errorOnDataSave() : ""}
      wide
    />
  </Content>
{/if}
