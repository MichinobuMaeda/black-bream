<script>
  import Content from "../../lib/Content.svelte";
  import { m } from "../../lib/i18n.svelte";
</script>

<h3>{m().changeEmail()}</h3>
<Content>
  <div>{m().guideChangingEmail()}</div>
</Content>
