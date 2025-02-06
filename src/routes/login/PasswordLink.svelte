<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import ActionFields from "../../lib/ActionFields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import SuccessMessage from "../../lib/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { sendPasswordResetLink } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";

  // Fields
  let email = $state("");

  let errorEmail = $derived(
    !email || validateEmail(email) ? "" : t().validEmailAddress(),
  );

  // Actions
  let result = $state(null);
  let timeoutId = null;

  let valid = $derived(!validateEmail(email));

  const onClick = async () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    result = await sendPasswordResetLink(email);

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

<h4>{t().setPassword()}</h4>
<Content>
  <div>
    {t().descPasswordLink()}{t().allowEmailsFrom(store.conf.autoSendEmail)}
  </div>
  {#if result?.err}
    <ErrorMessage>{t().errorOnDataSend()}</ErrorMessage>
  {:else if result}
    <SuccessMessage>{t().sentPasswordLink()}</SuccessMessage>
  {/if}
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="passwordLinkSendTo"
        label={t().email()}
        type="email"
        bind:value={email}
        error={errorEmail}
      />
    </Fields>
    <ActionFields>
      <Actions>
        <ButtonFilled
          id="sendPasswordResetLink"
          label={t().send()}
          {onClick}
          disabled={valid}
        />
      </Actions>
    </ActionFields>
  </Wrap>
</Content>
