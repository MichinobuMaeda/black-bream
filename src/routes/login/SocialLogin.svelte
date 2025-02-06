<script>
  import Content from "../../lib/components/Content.svelte";
  import ButtonFilled from "../../lib/coarse-paper/ButtonFilled.svelte";
  import ErrorMessage from "../../lib/components/ErrorMessage.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { socialLoginProviders, socialLogin } from "../../lib/firebase.js";

  const providers = $derived(
    socialLoginProviders.filter(
      (item) =>
        !item.id.endsWith("_link") &&
        store.conf.socialLogins?.includes(item.id),
    ),
  );

  let result = $state(null);
  let timeoutId = null;

  const onClick = async (id) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    result = await socialLogin(id);

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

{#if providers.length}
  <h4>{t().socialLogin()}</h4>
  <Content>
    {#if result?.err}
      <ErrorMessage>{t().errorOnDataSend()}</ErrorMessage>
    {/if}
    <div class="flex flex-wrap gap-8">
      {#each providers as provider}
        <div class="flex">
          <ButtonFilled
            id={provider.id}
            label={provider.label}
            onClick={() => onClick(provider.id)}
          />
        </div>
      {/each}
    </div>
    <div>{t().aboutSocialLogin()}</div>
  </Content>
{/if}
