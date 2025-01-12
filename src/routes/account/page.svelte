<script>
  import SvgAccountCircle from "../../lib/icons/SvgAccountCircle.svelte";
  import Profile from "./Profile.svelte";
  import ChangeEmail from "./ChangeEmail.svelte";
  import ChangePassword from "./ChangePassword.svelte";
  import SendPasswordLink from "./SendPasswordLink.svelte";
  import RegisterSocialLogin from "./RegisterSocialLogin.svelte";
  import Logout from "./Logout.svelte";
  import { t } from "../../lib/store.svelte.js";
</script>

<h2><SvgAccountCircle /> {t().account()}</h2>
<Profile />
<RegisterSocialLogin />
<ChangeEmail />
<ChangePassword />
<SendPasswordLink />
<Logout />
