<script>
  import PWABadge from "./lib/PWABadge.svelte";

  import { authUser, conf, activePage } from "./lib/state.svelte";
  import Header from "./lib/Header.svelte";
  import Loading from "./lib/Loading.svelte";
  import { PAGE_UNSETTLED } from "./lib/const.svelte";
</script>

<div
  class="@apply flex flex-row justify-center
    bg-lightSurfaceVariant dark:bg-darkSurfaceVariant"
>
  <div
    class="flex flex-col w-full max-w-screen-sm
      bg-lightBackground dark:bg-darkBackground
      text-lightOnBackground dark:text-darkOnBackground"
  >
    <div class="flex flex-col min-h-screen justify-between">
      <Header
        top={true}
        user={null}
        page={$activePage}
        onClick={(page) => activePage.set(page)}
      />
      <main class="flex justify-center mb-auto">
        {#if $activePage === PAGE_UNSETTLED}
          <Loading />
        {:else}
          <div class="flex flex-col px-2 pt-2 sm:pt-8 pb-6 gap-4 sm:gap-8">
            <p>Page: {$activePage}</p>
            {#if $authUser === undefined}
              <p>Loading auth ...</p>
            {:else}
              <p>Auth has been loaded.</p>
              {#if $authUser === null}
                <p>User: guest</p>
              {:else}
                <p>User: {$authUser.uid}</p>
              {/if}
            {/if}
            {#if $conf === undefined}
              <p>Loading conf ...</p>
            {:else}
              <p>Conf has been loaded.</p>
            {/if}
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
      <Header
        top={false}
        user={null}
        page={$activePage}
        onClick={(page) => activePage.set(page)}
      />
    </div>
  </div>
</div>

<PWABadge />

<style>
</style>
