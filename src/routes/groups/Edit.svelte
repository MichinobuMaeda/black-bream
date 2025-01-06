<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/components/GroupedCheckBox.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import {
    isUniqueGroupName,
    updateDocument,
  } from "../../lib/repository.svelte.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let group = store.groups.find((group) => group.id === item);

  // Fields
  let name = $state(group.name);
  let unavailable = $state(!!group.deletedAt);

  let errorDisplayName = $derived(
    !name
      ? m.required()
      : !isUniqueGroupName(group.id, name)
        ? m.nameInUse()
        : "",
  );

  // Actions
  let result = $state(null);

  let userItems = store.users.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  let currentUsers = $derived(group.users ?? []);
  let users = $state(group.users ?? []);
  const isSelectedUsersChanged = () =>
    users.length !== currentUsers.length ||
    !users.every((id) => currentUsers.includes(id));

  let changed = $derived(
    name !== group.name ||
      unavailable !== !!group.deletedAt ||
      isSelectedUsersChanged(),
  );
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? m.errorOnDataSave() : "");

  const onCancel = async () => {
    name = group.name;
    pop();
  };

  const onSave = async () => {
    name = name.trim();

    result = await updateDocument("groups", group.id, {
      name,
      users,
      deletedAt: unavailable ? new Date() : null,
    });

    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {m.edit()}
</h3>
{#if store.manager}
  <Content>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={m.displayName()}
        type="text"
        bind:value={name}
        message={m.current(group.name)}
        error={errorDisplayName}
      />
      {#if !["admins", "managers"].includes(group.id)}
        <div class="flex grow gap-4 items-center">
          <Switch id="unavailable" bind:checked={unavailable} />
          {m.unavailable()}
        </div>
      {/if}
    </Fields>
  </Content>
  <h4>{m.members()}</h4>
  <Content>
    <GroupedCheckBox id="groups" items={userItems} bind:value={users} />
  </Content>
  <Content>
    <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
  </Content>
{/if}
