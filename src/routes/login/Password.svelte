<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import Actions from "../../lib/Actions.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import { login } from "../../lib/store.svelte";
  import { m } from "../../lib/i18n.svelte";

  let email = $state("");
  let password = $state("");
  let passwordVisible = $state(false);
  let result = $state(undefined);
</script>

<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="email"
        label={m().email()}
        type="email"
        bind:value={email}
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
            result = await login(email, password);
            if (result === null) {
              email = "";
              password = "";
            }
          }}
          disabled={!email || !password}
        />
      </Actions>
    </Fields>
  </Wrap>
</Content>
