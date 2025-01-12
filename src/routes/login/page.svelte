<script>
  import SvgLogin from "../../lib/icons/SvgLogin.svelte";
  import EmailLink from "./EmailLink.svelte";
  import Password from "./Password.svelte";
  import PasswordLink from "./PasswordLink.svelte";
  import SocialLogin from "./SocialLogin.svelte";
  import { t } from "../../lib/store.svelte.js";
</script>

<h2><SvgLogin /> {t().login()}</h2>
<EmailLink />
<Password />
<PasswordLink />
<SocialLogin />
