<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import SuccessMessage from "../../lib/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { loginWithEmailLink } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";

  let email = $state("");
  let result = $state(null);
  let timeoutId = null;

  const onClick = async () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    result = await loginWithEmailLink(email, store.conf.webAppUrl);

    if (!result.err) {
      email = "";
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

<h4>{t().loginWithoutPassword()}</h4>
<Content>
  <p>{t().allowEmailsFrom(store.conf.autoSendEmail)}</p>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="EmailLink.email"
        label={t().email()}
        type="email"
        bind:value={email}
        error={!email || validateEmail(email) ? "" : t().validEmailAddress()}
      />
    </Fields>
    <Fields>
      {#if result?.err}
        <ErrorMessage>{t().errorOnDataSend()}</ErrorMessage>
      {:else if result}
        <SuccessMessage>{t().sentEmailLink()}</SuccessMessage>
      {/if}
      <Actions>
        <ButtonFilled
          id="EmailLink.send"
          label={t().send()}
          {onClick}
          disabled={!validateEmail(email)}
        />
      </Actions>
    </Fields>
  </Wrap>
</Content>
