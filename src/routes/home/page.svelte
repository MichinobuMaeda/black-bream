<script>
  import SvgHome from "../../lib/icons/SvgHome.svelte";
  import RecentPosts from "./RecentPosts.svelte";
  import RecentLogs from "./RecentLogs.svelte";
  import { t } from "../../lib/store.svelte.js";
</script>

<h2><SvgHome /> {t().home()}</h2>
<RecentPosts />
<RecentLogs />
