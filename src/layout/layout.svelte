<script>
  import PWABadge from "./PWABadge.svelte";
  import MainMenu from "./MainMenu.svelte";
  import Loading from "./Loading.svelte";
  import Header from "./Header.svelte";
  import { store } from "../lib/store.svelte.js";

  let { children } = $props();
</script>

<PWABadge />
<div
  class="flex flex-col-reverse sm:flex-row
    bg-lightSurfaceDim dark:bg-darkSurfaceDim"
>
  {#if store.authUser === undefined || store.conf === undefined}
    <Loading />
  {:else}
    <MainMenu />
    <div
      class="min-h-screen w-full lg:w-[1048px]
      bg-lightSurfaceContainerLowest dark:bg-darkSurfaceContainerLowest
      text-lightOnSurface dark:text-darkOnSurface"
    >
      <main class="flex flex-col mb-auto">
        <Header />
        {@render children()}
      </main>
    </div>
  {/if}
</div>
