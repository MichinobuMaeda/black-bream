<script>
  import Content from "../../lib/Content.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SuccessMessage from "../../lib/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import { sendPasswordResetLink } from "../../lib/repository.svelte.js";

  let result = $state(null);
  let timeoutId = null;

  const onClick = async () => {
    if (clearTimeout) {
      clearTimeout(timeoutId);
    }

    result = await sendPasswordResetLink(store.authUser?.email);

    if (!result.err) {
      timeoutId = setTimeout(
        () => {
          result = null;
          timeoutId = null;
        },
        3 * 60 * 1000,
      );
    }
  };
</script>

<Content>
  <div class="flex flex-col md:flex-row gap-4">
    <div class="flex flex-col gap-4">
      {m.descPasswordLink()}{m.allowEmailsFrom(store.conf.autoSendEmail)}
      {#if result?.err}
        <ErrorMessage>{m.errorOnDataSave()}</ErrorMessage>
      {:else if result}
        <SuccessMessage>{m.sentPasswordLink()}</SuccessMessage>
      {/if}
    </div>
    <div class="flex md:w-48 justify-end md:items-end">
      <ButtonFilled id="sendPasswordResetLink" label={m.send()} {onClick} />
    </div>
  </div>
</Content>
