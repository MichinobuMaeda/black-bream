<script>
  import SvgLogin from "../../lib/icons/SvgLogin.svelte";
  import Email from "./Email.svelte";
  import { m } from "../../lib/i18n.svelte";
</script>

<h2><SvgLogin /> {m().login()}</h2>
<Email />
