<script>
  import Content from "../../lib/Content.svelte";
  import { t } from "../../lib/store.svelte.js";
</script>

<h3>{t().changeEmail()}</h3>
<Content>
  <div>{t().guideChangingEmail()}</div>
</Content>
