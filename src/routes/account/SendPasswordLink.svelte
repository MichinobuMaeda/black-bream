<script>
  import Content from "../../lib/components/Content.svelte";
  import ButtonFilled from "../../lib/coarse-paper/ButtonFilled.svelte";
  import SuccessMessage from "../../lib/components/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/components/ErrorMessage.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { sendPasswordResetLink } from "../../lib/firebase.js";

  let enable = $state(store.conf.socialLogins?.includes("password_link"));
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

{#if enable}
  <Content>
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex flex-col gap-4">
        {t().descPasswordLink()}{t().allowEmailsFrom(store.conf.autoSendEmail)}
        {#if result?.err}
          <ErrorMessage>{t().errorOnDataSave()}</ErrorMessage>
        {:else if result}
          <SuccessMessage>{t().sentPasswordLink()}</SuccessMessage>
        {/if}
      </div>
      <div class="flex md:w-48 justify-end md:items-end">
        <ButtonFilled id="sendPasswordResetLink" label={t().send()} {onClick} />
      </div>
    </div>
  </Content>
{/if}
