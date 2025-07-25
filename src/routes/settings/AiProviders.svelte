<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import GroupedRadio from "../../lib/coarse-paper/GroupedRadio.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { aiProviders, updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  const items = aiProviders.map((provider) => ({
    label: provider.name,
    value: provider.id,
  }));

  // Fields
  let aiProvider = $state(store.conf.aiProvider || "");

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active && (store.conf.aiProvider || "") !== aiProvider,
  );
  let valid = true;
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    aiProvider = store.conf.aiProvider;
  };

  const onSave = async () => {
    active = true;
    result = await updateDocument("service", "conf", {
      aiProvider,
    });
    active = false;
  };
</script>

<h3>{t().aiProviders()}</h3>
<Content>
  <Wrap>
    <Fields>
      <GroupedRadio id="aiProviders" {items} bind:value={aiProvider} />
    </Fields>
    <Fields>
      <ActionSave
        id="updateAiProvider"
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
