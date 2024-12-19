<script>
  import SvgLogin from "../../lib/icons/SvgLogin.svelte";
  import Password from "./Password.svelte";
  import { m } from "../../lib/i18n.svelte";
</script>

<h2><SvgLogin /> {m().login()}</h2>
<Password />
