<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import Actions from "../../lib/components/Actions.svelte";
  import SuccessMessage from "../../lib/components/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/components/ErrorMessage.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/coarse-paper/ButtonFilled.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { loginWithEmailLink } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";

  let enable = $state(store.conf.socialLogins?.includes("email_link"));
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

{#if enable}
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
      <ActionFields>
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
      </ActionFields>
    </Wrap>
  </Content>
{/if}
