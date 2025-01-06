<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { loginWithPassword } from "../../lib/repository.svelte.js";
  import { m } from "../../lib/i18n.svelte.js";
  import { validateEmail } from "../../lib/validator";

  // Fields
  let email = $state("");
  let password = $state("");

  let errorEmail = $derived(
    !email || validateEmail(email) ? "" : m.validEmailAddress(),
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

<h4>{m.loginWithPassword()}</h4>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="email"
        label={m.email()}
        type="email"
        bind:value={email}
        error={errorEmail}
      />
      <PasswordFieldOutlined
        id="password"
        label={m.password()}
        bind:value={password}
      />
    </Fields>
    <Fields>
      {#if result?.err === "credentialError"}
        <ErrorMessage>{m.passwordAuthError()}</ErrorMessage>
      {:else if result?.err}
        <ErrorMessage>{m.authError()}</ErrorMessage>
      {/if}
      <Actions>
        <ButtonFilled
          id="login"
          label={m.login()}
          {onClick}
          disabled={!valid}
        />
      </Actions>
    </Fields>
  </Wrap>
</Content>
