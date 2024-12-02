<script>
  import SelectLanguage from "../lib/SelectLanguage.svelte";
  import HeadingLevel2 from "../lib/HeadingLevel2.svelte";
  import { getStore } from "../lib/store.svelte";

  let state = getStore();
</script>

<SelectLanguage />
<div
  class="flex flex-col p-2 sm:p-4 lg:p-8 gap-2 sm:gap-4 lg:gap-8 text-base
  bg-lightSurfaceContainerLowest dark:bg-darkSurfaceContainerLowest
  text-lightOnSurface dark:text-darkOnSurface"
>
  <p>Page: Login</p>
  <p>Auth has been loaded.</p>
  {#if state.authUser === null}
    <p>User: guest</p>
  {:else}
    <p>User: {state.authUser.uid}</p>
  {/if}
  <p>Conf has been loaded.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
</div>
<HeadingLevel2 title="Sticky header 1" />
<div
  class="flex flex-col p-2 sm:p-4 lg:p-8 gap-2 sm:gap-4 lg:gap-8 text-base
  bg-lightSurfaceContainerLowest dark:bg-darkSurfaceContainerLowest
  text-lightOnSurface dark:text-darkOnSurface"
>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
</div>
<HeadingLevel2 title="Sticky header 2" />
<div
  class="flex flex-col p-2 sm:p-4 lg:p-8 gap-2 sm:gap-4 lg:gap-8 text-base
  bg-lightSurfaceContainerLowest dark:bg-darkSurfaceContainerLowest
  text-lightOnSurface dark:text-darkOnSurface"
>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <p>Quick fox jumps over the lazy dog.</p>
  <div>last.</div>
</div>
