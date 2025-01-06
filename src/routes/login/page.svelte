<script>
  import SvgLogin from "../../lib/icons/SvgLogin.svelte";
  import EmailLink from "./EmailLink.svelte";
  import Password from "./Password.svelte";
  import PasswordLink from "./PasswordLink.svelte";
  import { m } from "../../lib/i18n.svelte.js";
</script>

<h2><SvgLogin /> {m.login()}</h2>
<EmailLink />
<Password />
<PasswordLink />
