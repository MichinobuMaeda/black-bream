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
  import { sendPasswordResetLink } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";

  // Fields
  let enable = $state(store.conf.socialLogins?.includes("password_link"));
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

{#if enable}
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
{/if}
