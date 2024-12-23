<script>
  import { pop } from "svelte-spa-router";
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte";
  import {
    store,
    createDocument,
    isUniqueUserName,
  } from "../../lib/store.svelte";

  let name = $state("");
  let result = $state(undefined);

  const cancel = async () => {
    name = "";
    pop();
  };
</script>

<h3>
  <span class="size-6"><SvgPersonAdd /></span>
  {m().create()}
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
          message={result !== null || !!name ? m().required() : m().savedData()}
          error={!name
            ? m().required()
            : result !== null && !isUniqueUserName(null, name)
              ? m().nameInUse()
              : ""}
        />
      </Fields>
      <Fields>
        <ActionSave
          id="updateProfile"
          changed={true}
          valid={!!name && isUniqueUserName(null, name)}
          onCancel={cancel}
          onSave={async () => {
            name = name.trim();
            result = null;
            result = await createDocument("users", { name, users: [] });
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
