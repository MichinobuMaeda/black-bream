<script>
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import List from "./List.svelte";
  import Create from "./Create.svelte";
  import Show from "./Show.svelte";
  import Edit from "./Edit.svelte";

  /**
   * @typedef {Object} Props
   * @param {object} params
   */

  /** @type {Props} */
  let { params } = $props();

  console.log(params?.item, params?.action);
</script>

<h2><SvgPerson /> {t().users()}</h2>
{#if params?.item === "new"}
  {#if store.manager}
    <Create />
  {/if}
{:else if params?.item}
  {#if params?.action === "edit"}
    {#if store.manager}
      <Edit item={params?.item} />
    {/if}
  {:else}
    <Show item={params?.item} />
  {/if}
{:else}
  <List />
{/if}
