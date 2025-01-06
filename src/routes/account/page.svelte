<script>
  import SvgAccountCircle from "../../lib/icons/SvgAccountCircle.svelte";
  import Profile from "./Profile.svelte";
  import ChangeEmail from "./ChangeEmail.svelte";
  import ChangePassword from "./ChangePassword.svelte";
  import SendPasswordLink from "./SendPasswordLink.svelte";
  import Logout from "./Logout.svelte";
  import { m } from "../../lib/i18n.svelte.js";
</script>

<h2><SvgAccountCircle /> {m.account()}</h2>
<Profile />
<ChangeEmail />
<ChangePassword />
<SendPasswordLink />
<Logout />
