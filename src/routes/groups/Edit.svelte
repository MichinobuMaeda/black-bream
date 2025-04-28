<script>
  import { pop } from "svelte-spa-router";
  import { serverTimestamp } from "firebase/firestore";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store, isUniqueGroupName } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let group = store.groups.find((group) => group.id === item);
  let active = $state(false);

  // Fields
  let name = $state(group.name);
  let deleted = $state(!!group.deletedAt);

  let errorDisplayName = $derived(
    !name
      ? t().required()
      : !isUniqueGroupName(name, group.id)
        ? t().nameInUse()
        : "",
  );

  let userItems = store.users.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  let currentUsers = $derived(group.users ?? []);
  let users = $state(group.users ?? []);
  const isSelectedUsersChanged = () =>
    users.length !== currentUsers.length ||
    !users.every((id) => currentUsers.includes(id));

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (name !== group.name ||
        deleted !== !!group.deletedAt ||
        isSelectedUsersChanged()),
  );
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    name = group.name;
    pop();
  };

  const onSave = async () => {
    active = true;
    name = name.trim();

    result = await updateDocument("groups", group.id, {
      name,
      users,
      deletedAt: deleted ? serverTimestamp() : null,
    });

    active = false;
    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {t().edit()}
</h3>
{#if store.manager}
  <Content>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={t().displayName()}
        type="text"
        bind:value={name}
        message={t().current(group.name)}
        error={errorDisplayName}
      />
      {#if !["admins", "managers"].includes(group.id)}
        <div class="flex grow gap-4 items-center">
          <Switch id="deleted" bind:checked={deleted} />
          {t().deleted()}
        </div>
      {/if}
    </Fields>
  </Content>
  <h4>{t().members()}</h4>
  <Content>
    <GroupedCheckBox id="groups" items={userItems} bind:value={users} />
  </Content>
  <Content>
    <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
  </Content>
{/if}
