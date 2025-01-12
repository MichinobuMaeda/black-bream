<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import { t } from "../../lib/store.svelte.js";
  import { socialLogin } from "../../lib/firebase.js";

  const providers = [
    {
      id: "google",
      label: "Google",
    },
  ];

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

<h4>{t().socialLogin()}</h4>
<Content>
  {#if result?.err}
    <ErrorMessage>{t().errorOnDataSend()}</ErrorMessage>
  {/if}
  <Wrap>
    {#each providers as provider}
      <div class="flex">
        <ButtonFilled
          id={provider.id}
          label={provider.label}
          onClick={() => onClick(provider.id)}
        />
      </div>
    {/each}
  </Wrap>
  <div>{t().aboutSocialLogin()}</div>
</Content>
