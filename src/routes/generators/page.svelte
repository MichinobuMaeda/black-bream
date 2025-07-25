<script>
  import SvgCognition from "../../lib/icons/SvgCognition.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import List from "./List.svelte";
  import Create from "./Create.svelte";
  import Edit from "./Edit.svelte";
  import Generate from "./Generate.svelte";

  import JobPosting from "./Generate.svelte";

  /**
   * @typedef {Object} Props
   * @param {Object} params
   */

  /** @type {Props} */
  let { params } = $props();

  console.log(params?.item, params?.action);
</script>

<h2><SvgCognition /> {t().generators()}</h2>
{#if (store.operator || store.manager) && store.conf?.aiProvider}
  {#if params?.item === "new"}
    <Create />
  {:else if params?.item === "jobposting"}
    <JobPosting />
  {:else if params?.item}
    {#if store.generators.length > 0}
      {#if params.action === "post"}
        <Generate item={params?.item} />
      {:else}
        <Edit item={params?.item} />
      {/if}
    {/if}
  {:else}
    <List />
  {/if}
{/if}
