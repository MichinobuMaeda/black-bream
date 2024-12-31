<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import SuccessMessage from "../../lib/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { store, m, loginWithEmailLink } from "../../lib/store.svelte.js";
  import { validateEmail } from "../../lib/validator";

  let email = $state("");
  let sent = $state(undefined);
  let timeoutId = undefined;
</script>

<h4>{m().loginWithoutPassword()}</h4>
<Content>
  <p>{m().allowEmailsFrom({ email: store.conf.autoSendEmail })}</p>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="emailSendTo"
        label={m().email()}
        type="email"
        bind:value={email}
        error={!email || validateEmail(email) ? "" : m().validEmailAddress()}
      />
    </Fields>
    <Fields>
      {#if sent === null}
        <SuccessMessage>{m().sentEmailLink()}</SuccessMessage>
      {:else if !!sent}
        <ErrorMessage>{m().errorOnDataSend()}</ErrorMessage>
      {/if}
      <Actions>
        <ButtonFilled
          id="send"
          label={m().send()}
          onClick={async () => {
            if (clearTimeout) {
              clearTimeout(timeoutId);
            }
            sent = await loginWithEmailLink(email, store.conf.webAppUrl);
            if (sent === null) {
              email = "";
              timeoutId = setTimeout(
                () => {
                  sent = undefined;
                },
                3 * 60 * 1000,
              );
            }
          }}
          disabled={!validateEmail(email)}
        />
      </Actions>
    </Fields>
  </Wrap>
</Content>
