<script>
  import Content from "../../lib/components/Content.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { DEFAULT_TZ } from "../../lib/datetime";
  import { validateTimeZone } from "../../lib/validator";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let tz = $state(store.conf.tz || DEFAULT_TZ);

  let errorTz = $derived(
    tz ? (validateTimeZone(tz) ? "" : t().validTimeZoneName()) : t().required(),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active && tz !== store.conf.tz);
  let valid = $derived(!errorTz);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    tz = store.conf.tz || DEFAULT_TZ;
  };

  const onSave = async () => {
    active = true;
    result = await updateDocument("service", "conf", { tz });
    active = false;
  };
</script>

<h3>{t().timeZone()}</h3>
<Content>
  <TextFieldOutlined
    id="timeZone"
    label={t().timeZone()}
    type="text"
    bind:value={tz}
    message={t().validTimeZoneName()}
    error={errorTz}
  />
  <ActionSave
    id="timeZoneSave"
    {changed}
    {valid}
    {onCancel}
    {onSave}
    {error}
    cancelOnlyChanged
    wide
  />
</Content>
