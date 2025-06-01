<script>
  import Content from "../../lib/components/Content.svelte";
  import Actions from "../../lib/components/Actions.svelte";
  import ButtonFilled from "../../lib/coarse-paper/ButtonFilled.svelte";
  import ErrorMessage from "../../lib/components/ErrorMessage.svelte";
  import { t } from "../../lib/store.svelte.js";
  import { callFunction } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  // Actions
  let result = $state(null);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onRun = async () => {
    active = true;
    result = await callFunction("runDaily", {});
    active = false;
  };
</script>

<h3>{t().runDailyJobManually()}</h3>
<Content>
  <Actions>
    <ButtonFilled
      id="run-daily-job"
      label={t().run()}
      onClick={onRun}
      disabled={active}
    ></ButtonFilled>
  </Actions>
  {#if error}
    <ErrorMessage>{error}</ErrorMessage>
  {:else if active}
    <div>{t().running()}...</div>
  {:else if result}
    <div>{t().complete()}</div>
  {:else}
    <div>--</div>
  {/if}
</Content>
