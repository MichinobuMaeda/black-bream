<script>
  import Content from "../lib/Content.svelte";
  import TextFieldOutlined from "../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../lib/components/ButtonFilled.svelte";
  import IconButton from "../lib/components/IconButton.svelte";
  import SvgVisibilityOff from "../lib/icons/SvgVisibilityOff.svelte";
  import SvgVisibilityOn from "../lib/icons/SvgVisibilityOn.svelte";
  import { getStore } from "../lib/store.svelte";
  import { m } from "../lib/i18n.svelte";
  import { signInWithEmailAndPassword } from "firebase/auth";

  let store = getStore();

  let email = $state("");
  let password = $state("");
  let passwordVisible = $state(false);
</script>

<Content>
  <div class="flex flex-row w-96">
    <TextFieldOutlined
      id="email"
      label={m().email()}
      type="email"
      bind:value={email}
    />
  </div>
  <div class="flex flex-row w-96">
    <TextFieldOutlined
      id="password"
      label={m().password()}
      type={passwordVisible ? "text" : "password"}
      bind:value={password}
    />
    <div class="flex py-4 px-2">
      <IconButton
        id="passwordVisible"
        icon={passwordVisible ? SvgVisibilityOff : SvgVisibilityOn}
        onClick={() => (passwordVisible = !passwordVisible)}
      />
    </div>
  </div>
  <div class="flex flex-row w-96 justify-end">
    <ButtonFilled
      id="login"
      label={m().login()}
      onClick={() => signInWithEmailAndPassword(store.auth, email, password)}
      disabled={!email || !password}
    />
  </div>
</Content>
