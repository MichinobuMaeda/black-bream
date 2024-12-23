<script>
  import Content from "../../lib/Content.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store, updateDocument } from "../../lib/store.svelte";

  let desc = $state(store.conf.desc);
  let result = $state(undefined);
</script>

<h3>{m().siteDesc()}</h3>
<Content>
  <TextFieldOutlined
    id="siteDesc"
    label={m().siteDesc()}
    type="text"
    bind:value={desc}
    lines={10}
    message={result !== null || desc !== store.conf.desc
      ? m().inMarkdown()
      : m().savedData()}
    error={desc ? "" : m().required()}
  />
  <ActionSave
    id="siteDesc"
    changed={desc !== store.conf.desc}
    valid={!!desc}
    onCancel={() => {
      desc = store.conf.desc;
    }}
    onSave={async () => {
      result = await updateDocument("service", "conf", { desc });
    }}
    error={!result ? "" : m().errorOnDataSave()}
    cancelOnlyChanged
    wide={true}
  />
</Content>
