<script>
  import SvgTask from "../../lib/icons/SvgTask.svelte";
  import { t } from "../../lib/store.svelte.js";
  // import { t, store } from "../../lib/store.svelte.js";
  // import List from "./List.svelte";
  // import Create from "./Create.svelte";
  // import Show from "./Show.svelte";
  // import Edit from "./Edit.svelte";

  /**
   * @typedef {Object} Props
   * @param {Object} params
   */

  /** @type {Props} */
  let { params } = $props();

  console.log(params?.item, params?.action);
</script>

<h2><SvgTask /> {t().posts()}</h2>
<!-- {#if store.operator || store.manager}
  {#if params?.item === "new"}
    <Create />
  {:else if params?.item}
    {#if params?.action === "edit"}
      {#if store.operator}
        <Edit item={params?.item} />
      {/if}
    {:else}
      <Show item={params?.item} />
    {/if}
  {:else}
    <List />
  {/if}
{:else if params?.item}
  <Show item={params?.item} />
{:else}
  <List />
{/if} -->
