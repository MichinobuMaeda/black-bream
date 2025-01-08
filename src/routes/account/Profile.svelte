<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument, isUniqueUserName } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let name = $state(store.user.name);
  let errorDisplayName = $derived(
    !name
      ? t().required()
      : !isUniqueUserName(store, name, store.user.id)
        ? t().nameInUse()
        : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active && name !== store.user.name);
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = store.user.name;
  };

  const onSave = async () => {
    active = true;
    name = name.trim();
    result = await updateDocument("users", store.user.id, { name });
    active = false;
  };
</script>

<h3>{t().profile()}</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={t().displayName()}
        type="text"
        bind:value={name}
        message={t().current(store.user.name)}
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
