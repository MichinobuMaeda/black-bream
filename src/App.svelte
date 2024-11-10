<script>
  import PWABadge from "./lib/PWABadge.svelte";

  import { createState } from "./lib/state.svelte";
  import Header from "./lib/Header.svelte";
  import Loading from "./lib/Loading.svelte";

  let state = createState();
</script>

<div
  class="flex flex-col-reverse sm:flex-row
    bg-lightSurfaceVariant dark:bg-darkSurfaceVariant"
>
  <Header pages={state.pages} bind:page={state.page} />
  <div
    class="min-h-screen w-full lg:w-[1048px]
    bg-lightBackground dark:bg-darkBackground
    text-lightOnBackground dark:text-darkOnBackground"
  >
    <main class="flex flex-col m-[12px] mb-auto">
      {#if state.loading || state.page === null}
        <Loading />
      {:else}
        <div class="flex flex-col px-2 pt-2 sm:pt-8 pb-6 gap-4 sm:gap-8">
          <p>Page: {state.page}</p>
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
        <h2
          class="flex sticky top-9 px-2 pt-2 bg-lightPrimaryContainer text-lightOnPrimaryContainer"
        >
          Sticky header 1
        </h2>
        <div class="flex flex-col px-2 pt-2 sm:pt-8 pb-6 gap-4 sm:gap-8">
          <p>Quick fox jumps over the lazy dog.</p>
          <p>Quick fox jumps over the lazy dog.</p>
          <p>Quick fox jumps over the lazy dog.</p>
          <p>Quick fox jumps over the lazy dog.</p>
          <p>Quick fox jumps over the lazy dog.</p>
          <p>Quick fox jumps over the lazy dog.</p>
          <p>Quick fox jumps over the lazy dog.</p>
        </div>
        <h2
          class="flex sticky top-9 bg-lightSecondaryContainer text-lightOnSecondaryContainer"
        >
          Sticky header 2
        </h2>
        <div class="flex flex-col px-2 pt-2 sm:pt-8 pb-6 gap-4 sm:gap-8">
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
        </div>
      {/if}
    </main>
  </div>
</div>

<PWABadge />
