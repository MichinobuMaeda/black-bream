<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte";
  import {
    store,
    isUniqueUserName,
    updateDocument,
  } from "../../lib/store.svelte";

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
  <Content>
    <ActionSave
      id="saveUser"
      changed={name !== user.name || unavailable !== !!user.deletedAt}
      valid={!!name && isUniqueUserName(user.id, name)}
      onCancel={cancel}
      onSave={async () => {
        name = name.trim();
        result = null;
        result = await updateDocument("users", user.id, {
          name,
          deletedAt: unavailable ? new Date() : null,
        });
        if (!result) {
          await cancel();
        }
      }}
      error={result ? m().errorOnDataSave() : ""}
      wide
    />
  </Content>
{/if}
