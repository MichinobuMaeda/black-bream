<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import Actions from "../../lib/components/Actions.svelte";
  import ErrorMessage from "../../lib/components/ErrorMessage.svelte";
  import PasswordFieldOutlined from "../../lib/coarse-paper/PasswordFieldOutlined.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/coarse-paper/ButtonFilled.svelte";
  import { loginWithPassword } from "../../lib/firebase.js";
  import { t } from "../../lib/store.svelte.js";
  import { validateEmail } from "../../lib/validator";

  // Fields
  let email = $state("");
  let password = $state("");

  let errorEmail = $derived(
    !email || validateEmail(email) ? "" : t().validEmailAddress(),
  );

  // Actions
  let result = $state(null);
  let valid = $derived(validateEmail(email) && password);

  const onClick = async () => {
    result = await loginWithPassword(email, password);

    if (!result.err) {
      email = "";
      password = "";
      result = null;
    }
  };
</script>

<h4>{t().loginWithPassword()}</h4>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="email"
        label={t().email()}
        type="email"
        bind:value={email}
        error={errorEmail}
      />
      <PasswordFieldOutlined
        id="password"
        label={t().password()}
        bind:value={password}
      />
    </Fields>
    <ActionFields>
      {#if result?.err === "credentialError"}
        <ErrorMessage>{t().passwordAuthError()}</ErrorMessage>
      {:else if result?.err}
        <ErrorMessage>{t().authError()}</ErrorMessage>
      {/if}
      <Actions>
        <ButtonFilled
          id="login"
          label={t().login()}
          {onClick}
          disabled={!valid}
        />
      </Actions>
    </ActionFields>
  </Wrap>
</Content>
