<script>
  import Content from "../lib/Content.svelte";
  import ButtonDanger from "../lib/components/ButtonDanger.svelte";
  import SvgLogout from "../lib/icons/SvgLogout.svelte";
  import { m } from "../lib/i18n.svelte";
  import { getStore } from "../lib/store.svelte";

  let store = getStore();
</script>

<h2>{m().logout()}</h2>
<Content>
  <div>{m().logoutWarning()}</div>
  <div class="flex flex-row">
    <ButtonDanger
      id="logout"
      icon={SvgLogout}
      label={m().logout()}
      onClick={() => store.logout()}
    />
  </div>
</Content>
