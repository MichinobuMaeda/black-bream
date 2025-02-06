<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import ButtonFilled from "../../lib/coarse-paper/ButtonFilled.svelte";
  import ErrorMessage from "../../lib/components/ErrorMessage.svelte";
  import { t } from "../../lib/store.svelte.js";
  import { registerSocialLogin } from "../../lib/firebase.js";

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

    result = await registerSocialLogin(id);

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

<h3>{t().socialLogin()}</h3>
<Content>
  <div>{t().aboutRegisterSocialLogin()}</div>
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
</Content>
