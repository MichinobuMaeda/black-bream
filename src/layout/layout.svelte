<script>
  import PWABadge from "./PWABadge.svelte";
  import MainMenu from "./MainMenu.svelte";
  import Loading from "./Loading.svelte";
  import Header from "./Header.svelte";
  import { store } from "../lib/store.svelte.js";

  let { children } = $props();
</script>

<PWABadge />
<div class="flex bg-light-surface-dim dark:bg-dark-surface-dim">
  {#if store.authUser === undefined || store.conf === undefined}
    <Loading />
  {:else}
    <div
      class="flex flex-col-reverse sm:flex-col w-full lg:w-auto
      bg-light-surface-container-lowest dark:bg-dark-surface-container-lowest
      text-light-on-surface dark:text-dark-on-surface"
    >
      {#if store.test}
        <div class="flex flex-col z-60 sticky bottom-6 sm:top-0">
          <Header />
        </div>
      {:else}
        <div class="flex flex-col z-60 sticky bottom-0 sm:top-0">
          <Header />
        </div>
      {/if}
      <div class="flex flex-row min-h-screen">
        <div class="hidden sm:flex">
          <MainMenu />
        </div>
        <main class="flex flex-col mb-auto pb-4 w-full lg:w-[1048px]">
          {@render children()}
        </main>
        {#if store.test}
          <div class="flex sm:hidden absolute right-0 bottom-14">
            {#if store.menu}
              <MainMenu />
            {/if}
          </div>
        {:else}
          <div class="flex sm:hidden absolute right-0 bottom-8">
            {#if store.menu}
              <MainMenu />
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
