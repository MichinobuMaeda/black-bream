<script>
  import { pop } from "svelte-spa-router";
  import SvgGroupAdd from "../../lib/icons/SvgGroupAdd.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import {
    createDocument,
    isUniqueGroupName,
  } from "../../lib/repository.svelte.js";

  // Fields
  let name = $state("");
  let errorDisplayName = $derived(
    !name ? m.required() : !isUniqueGroupName(null, name) ? m.nameInUse() : "",
  );

  // Actions
  let result = $state(null);
  const changed = true;
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? m.errorOnDataSave() : "");

  const onCancel = async () => {
    name = "";
    pop();
  };

  const onSave = async () => {
    name = name.trim();

    result = await createDocument("groups", { name, users: [] });

    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgGroupAdd /></span>
  {m.create()}
</h3>
{#if store.manager}
  <Content>
    <Wrap>
      <Fields>
        <TextFieldOutlined
          id="displayName"
          label={m.displayName()}
          type="text"
          bind:value={name}
          message={m.required()}
          error={errorDisplayName}
        />
      </Fields>
      <Fields>
        <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
      </Fields>
    </Wrap>
  </Content>
{/if}
