<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { loginWithPassword } from "../../lib/store.svelte.js";
  import { m } from "../../lib/store.svelte.js";
  import { validateEmail } from "../../lib/validator";

  let email = $state("");
  let password = $state("");
  let result = $state(undefined);
</script>

<h4>{m().loginWithPassword()}</h4>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="email"
        label={m().email()}
        type="email"
        bind:value={email}
        error={!email || validateEmail(email) ? "" : m().validEmailAddress()}
      />
      <PasswordFieldOutlined
        id="password"
        label={m().password()}
        bind:value={password}
      />
    </Fields>
    <Fields>
      {#if result === "credentialError"}
        <ErrorMessage>{m().passwordAuthError()}</ErrorMessage>
      {:else if result}
        <ErrorMessage>{m().authError()}</ErrorMessage>
      {/if}
      <Actions>
        <ButtonFilled
          id="login"
          label={m().login()}
          onClick={async () => {
            result = await loginWithPassword(email, password);
            if (result === null) {
              email = "";
              password = "";
            }
          }}
          disabled={!validateEmail(email) || !password}
        />
      </Actions>
    </Fields>
  </Wrap>
</Content>
