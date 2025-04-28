<script>
  import Content from "../../lib/components/Content.svelte";
  import { t, store, dt } from "../../lib/store.svelte.js";

  let logs = $derived(store.logs.slice(0, 16));
</script>

<h3>{t().recentLogs()}</h3>
<Content>
  {#each logs as log (log.id)}
    <div class="font-mono">
      {dt(log.createdAt).formatDateTimeLong()}
      [{log.level}]
      {log.message.substring(0, 40)}
    </div>
  {/each}
</Content>
