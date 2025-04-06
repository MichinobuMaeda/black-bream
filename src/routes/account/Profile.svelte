<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, isUniqueUserName, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let name = $state(store.me?.name);
  let errorDisplayName = $derived(
    !name
      ? t().required()
      : !isUniqueUserName(name, store.me?.id)
        ? t().nameInUse()
        : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active && name !== store.me?.name);
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = store.me?.name;
  };

  const onSave = async () => {
    active = true;
    name = name.trim();
    result = await updateDocument("users", store.me?.id, { name });
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
        message={t().current(store.me?.name)}
        error={errorDisplayName}
      />
    </Fields>
    <ActionFields>
      <ActionSave
        id="updateProfile"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        cancelOnlyChanged
      />
    </ActionFields>
  </Wrap>
</Content>
