<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import {
    store,
    m,
    updateDocument,
    isUniqueUserName,
  } from "../../lib/store.svelte.js";

  let name = $state(store.user.name);
  let result = $state(undefined);
</script>

<h3>{m().profile()}</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={m().displayName()}
        type="text"
        bind:value={name}
        message={result !== null || name !== store.user.name
          ? `${m().current()}: ${store.user.name}`
          : m().savedData()}
        error={!name
          ? m().required()
          : name !== store.user.name && !isUniqueUserName(store.user.id, name)
            ? m().nameInUse()
            : ""}
      />
    </Fields>
    <Fields>
      <ActionSave
        id="updateProfile"
        changed={name !== store.user.name}
        valid={!!name && isUniqueUserName(store.user.id, name)}
        onCancel={() => {
          name = store.user.name;
        }}
        onSave={async () => {
          name = name.trim();
          result = await updateDocument("users", store.user.id, { name });
        }}
        error={result ? m().errorOnDataSave() : ""}
        cancelOnlyChanged
      />
    </Fields>
  </Wrap>
</Content>
