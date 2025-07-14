<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let jobPosting = $state(!!store.conf.jobPosting);

  // Actions
  let result = $state(null);
  let changed = $derived(!active && !!store.conf.jobPosting !== jobPosting);
  let valid = true;
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    jobPosting = !!store.conf.jobPosting;
  };

  const onSave = async () => {
    active = true;
    result = await updateDocument("service", "conf", {
      jobPosting,
    });
    active = false;
  };
</script>

<h3>{t().postGenerator()}</h3>
<Content>
  <Wrap>
    <Fields>
      <div class="flex flex-row items-center">
        <Switch id="jobPosting" bind:checked={jobPosting} />
        <label for="jobPosting" class="ml-2">
          {t().jobPosting()}
        </label>
      </div>
    </Fields>
    <Fields>
      <ActionSave
        id="updatePostGenerator"
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
