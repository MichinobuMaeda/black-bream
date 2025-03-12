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
    bg-light-surface-dim dark:bg-dark-surface-dim"
>
  {#if store.authUser === undefined || store.conf === undefined}
    <Loading />
  {:else}
    <MainMenu />
    <div
      class="min-h-screen w-full lg:w-[1048px]
      bg-light-surface-container-lowest dark:bg-dark-surface-container-lowest
      text-light-on-surface dark:text-dark-on-surface"
    >
      <main class="flex flex-col mb-auto pb-4">
        <Header />
        {@render children()}
      </main>
    </div>
  {/if}
</div>
