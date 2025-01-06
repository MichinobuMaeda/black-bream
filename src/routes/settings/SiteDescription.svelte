<script>
  import Content from "../../lib/Content.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/repository.svelte.js";

  // Fields
  let desc = $state(store.conf.desc);

  let errorDesc = $derived(desc ? "" : m.required());

  // Actions
  let result = $state(null);
  let changed = $derived(desc !== store.conf.desc);
  let valid = $derived(!errorDesc);
  let error = $derived(result?.err ? m.errorOnDataSave() : "");

  const onCancel = () => {
    desc = store.conf.desc;
  };

  const onSave = async () => {
    result = await updateDocument("service", "conf", { desc });
  };
</script>

<h3>{m.siteDesc()}</h3>
<Content>
  <TextFieldOutlined
    id="siteDesc"
    label={m.siteDesc()}
    type="text"
    bind:value={desc}
    lines={10}
    message={m.inMarkdown()}
    error={errorDesc}
  />
  <ActionSave
    id="siteDesc"
    {changed}
    {valid}
    {onCancel}
    {onSave}
    {error}
    cancelOnlyChanged
    wide
  />
</Content>
