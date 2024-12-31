<script>
  import SvgLogin from "../../lib/icons/SvgLogin.svelte";
  import EmailLink from "./EmailLink.svelte";
  import Password from "./Password.svelte";
  import SetPassword from "./SetPassword.svelte";
  import { m } from "../../lib/store.svelte.js";
</script>

<h2><SvgLogin /> {m().login()}</h2>
<EmailLink />
<Password />
<SetPassword />
