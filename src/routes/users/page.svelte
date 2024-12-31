<script>
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import { m } from "../../lib/store.svelte.js";
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

  console.log(params.item, params.action);
</script>

<h2><SvgPerson /> {m().users()}</h2>
{#if params.item === "new"}
  <Create />
{:else if params.item}
  {#if params.action === "edit"}
    <Edit item={params.item} />
  {:else}
    <Show item={params.item} />
  {/if}
{:else}
  <List />
{/if}
