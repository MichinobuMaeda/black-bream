<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import SuccessMessage from "../../lib/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import { sendPasswordResetLink } from "../../lib/repository.svelte.js";
  import { validateEmail } from "../../lib/validator";

  // Fields
  let email = $state("");

  let errorEmail = $derived(
    !email || validateEmail(email) ? "" : m.validEmailAddress(),
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

<h4>{m.setPassword()}</h4>
<Content>
  <div>
    {m.descPasswordLink()}{m.allowEmailsFrom(store.conf.autoSendEmail)}
  </div>
  {#if result?.err}
    <ErrorMessage>{m.errorOnDataSend()}</ErrorMessage>
  {:else if result}
    <SuccessMessage>{m.sentPasswordLink()}</SuccessMessage>
  {/if}
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="passwordLinkSendTo"
        label={m.email()}
        type="email"
        bind:value={email}
        error={errorEmail}
      />
    </Fields>
    <Fields>
      <Actions>
        <ButtonFilled
          id="sendPasswordResetLink"
          label={m.send()}
          {onClick}
          disabled={valid}
        />
      </Actions>
    </Fields>
  </Wrap>
</Content>
