<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let days = $state(store.conf.queuingThresholdDays || 2);

  let errorDays = $derived(
    days ? (days > 1 ? "" : t().greaterOrEqual(2)) : t().required(),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active && days !== store.conf.queuingThresholdDays);
  let valid = $derived(!errorDays);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    days = store.conf.queuingThresholdDays || 2;
  };

  const onSave = async () => {
    active = true;
    result = await updateDocument("service", "conf", {
      queuingThresholdDays: days,
    });
    active = false;
  };
</script>

<h3>{t().queuingThresholdDays()}</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="queuingThresholdDays"
        label={t().queuingThresholdDays()}
        type="number"
        bind:value={days}
        message={t().greaterOrEqual(2)}
        error={errorDays}
      />
    </Fields>
    <ActionFields>
      <ActionSave
        id="queuingThresholdDaysSave"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        cancelOnlyChanged
        wide
      />
    </ActionFields>
  </Wrap>
</Content>
