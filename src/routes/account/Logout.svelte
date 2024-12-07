<script>
  import Content from "../../lib/Content.svelte";
  import ButtonDanger from "../../lib/components/ButtonDanger.svelte";
  import SvgLogout from "../../lib/icons/SvgLogout.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { logout } from "../../lib/store.svelte";
</script>

<h3>{m().logout()}</h3>
<Content>
  <div>{m().logoutWarning()}</div>
  <div class="flex flex-row">
    <ButtonDanger
      id="logout"
      icon={SvgLogout}
      label={m().logout()}
      onClick={() => logout()}
    />
  </div>
</Content>
