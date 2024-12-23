<script>
  import { link } from "svelte-spa-router";

  import SvgError from "../lib/icons/SvgError.svelte";
  import Content from "../lib/Content.svelte";
  import SvgArrowBackIosNew from "../lib/icons/SvgArrowBackIosNew.svelte";
  import SvgHome from "../lib/icons/SvgHome.svelte";
  import { m } from "../lib/i18n.svelte.js";
</script>

<h2><SvgError /> {m().pageNotFound()}</h2>
<Content>
  <div>{m().NavigationForPageNotFound()}</div>
  <div class="flex flex-row gap-8 justify-center">
    {#if window.history.length > 2}
      <button
        class="text-link flex flex-row text-lightLink dark:text-darkLink gap-1"
        on:click={() => history.back()}
      >
        <span class="h-6"><SvgArrowBackIosNew /></span>
        {m().goBack()}
      </button>
    {/if}
    <a href="/" use:link class="flex flex-row gap-1">
      <span class="h-6"><SvgHome /></span>
      {m().home()}
    </a>
  </div>
</Content>
