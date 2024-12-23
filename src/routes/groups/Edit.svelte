<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte";
  import {
    store,
    isUniqueGroupName,
    updateDocument,
  } from "../../lib/store.svelte";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let group = store.groups.find((group) => group.id === item);
  let name = $state(group.name);
  let unavailable = $state(!!group.deletedAt);
  let result = $state(undefined);

  const cancel = async () => {
    name = group.name;
    pop();
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {m().edit()}
</h3>
{#if store.manager}
  <Content>
    <Wrap>
      <Fields>
        <TextFieldOutlined
          id="displayName"
          label={m().displayName()}
          type="text"
          bind:value={name}
          message={result !== null || name !== group.name
            ? `${m().current()}: ${group.name}`
            : m().savedData()}
          error={!name
            ? m().required()
            : result !== null &&
                name !== group.name &&
                !isUniqueGroupName(group.id, name)
              ? m().nameInUse()
              : ""}
        />
        {#if !["admins", "managers"].includes(group.id)}
          <div class="flex grow gap-4 items-center">
            <Switch id="unavailable" bind:checked={unavailable} />
            {m().unavailable()}
          </div>
        {/if}
      </Fields>
      <Fields>
        <ActionSave
          id="saveGroup"
          changed={name !== group.name || unavailable !== !!group.deletedAt}
          valid={!!name && isUniqueGroupName(group.id, name)}
          onCancel={cancel}
          onSave={async () => {
            name = name.trim();
            result = null;
            result = await updateDocument("groups", group.id, {
              name,
              deletedAt: unavailable ? new Date() : null,
            });
            if (!result) {
              await cancel();
            }
          }}
          error={result ? m().errorOnDataSave() : ""}
        />
      </Fields>
    </Wrap>
  </Content>
{/if}
