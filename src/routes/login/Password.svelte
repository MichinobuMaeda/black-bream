<script>
  import Content from "../../lib/Content.svelte";
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
  <div class="flex flex-row max-w-96">
    <TextFieldOutlined
      id="email"
      label={m().email()}
      type="email"
      bind:value={email}
    />
  </div>
  <div class="flex flex-row max-w-96">
    <PasswordFieldOutlined
      id="password"
      label={m().password()}
      bind:value={password}
    />
  </div>
  {#if result === "credentialError"}
    <div class="flex mt-2 text-lightError dark:text-darkError">
      {m().passwordAuthError()}
    </div>
  {:else if result}
    <div class="flex mt-2 text-lightError dark:text-darkError">
      {m().authError()}
    </div>
  {/if}
  <div class="flex flex-row max-w-96 justify-end">
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
  </div>
</Content>
