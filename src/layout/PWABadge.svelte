<script>
  // @ts-nocheck

  import { useRegisterSW } from "virtual:pwa-register/svelte";

  import ButtonFilled from "../lib/coarse-paper/ButtonFilled.svelte";
  import { t } from "../lib/store.svelte.js";

  // check for updates every hour
  const period = 60 * 60 * 1000;

  /**
   * This function will register a periodic sync check every hour, you can modify the interval as needed.
   * @param swUrl {string}
   * @param r {ServiceWorkerRegistration}
   */
  function registerPeriodicSync(swUrl, r) {
    if (period <= 0) return;

    setInterval(async () => {
      if ("onLine" in navigator && !navigator.onLine) return;

      const resp = await fetch(swUrl, {
        cache: "no-store",
        headers: {
          cache: "no-store",
          "cache-control": "no-cache",
        },
      });

      if (resp?.status === 200) await r.update();
    }, period);
  }

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          /** @type {ServiceWorker} */
          const sw = e.target;
          if (sw.state === "activated") registerPeriodicSync(swUrl, r);
        });
      }
    },
  });
</script>

{#if $needRefresh}
  <div
    class="flex justify-center py-0.5 sticky top-0 z-50
      bg-light-error-container dark:bg-dark-error-container"
  >
    <ButtonFilled
      id="updateApp"
      label={t().updateApp()}
      onClick={() => updateServiceWorker(true)}
      danger
      dense
    />
  </div>
{/if}
