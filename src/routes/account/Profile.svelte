<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import {
    updateDocument,
    isUniqueUserName,
  } from "../../lib/repository.svelte.js";

  // Fields
  let name = $state(store.user.name);
  let errorDisplayName = $derived(
    !name
      ? m.required()
      : !isUniqueUserName(name, store.user.id)
        ? m.nameInUse()
        : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(name !== store.user.name);
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? m.errorOnDataSave() : "");

  const onCancel = () => {
    name = store.user.name;
  };

  const onSave = async () => {
    name = name.trim();
    result = await updateDocument("users", store.user.id, { name });
  };
</script>

<h3>{m.profile()}</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={m.displayName()}
        type="text"
        bind:value={name}
        message={m.current(store.user.name)}
        error={errorDisplayName}
      />
    </Fields>
    <Fields>
      <ActionSave
        id="updateProfile"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        cancelOnlyChanged
      />
    </Fields>
  </Wrap>
</Content>
