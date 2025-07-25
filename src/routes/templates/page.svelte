<script>
  import SvgTextSnippet from "../../lib/icons/SvgTextSnippet.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import List from "./List.svelte";
  import Create from "./Create.svelte";
  import Post from "./../posts/Create.svelte";
  import Edit from "./Edit.svelte";

  /**
   * @typedef {Object} Props
   * @param {Object} params
   */

  /** @type {Props} */
  let { params } = $props();

  console.log(params?.item, params?.action);
</script>

<h2><SvgTextSnippet /> {t().templates()}</h2>
{#if store.operator || store.manager}
  {#if params?.item === "new"}
    <Create />
  {:else if params?.item}
    {#if store.templates.length > 0}
      {#if params.action === "post"}
        <Post initial={store.templates.find((t) => t.id === params?.item)} />
      {:else}
        <Edit item={params?.item} />
      {/if}
    {/if}
  {:else}
    <List />
  {/if}
{/if}
