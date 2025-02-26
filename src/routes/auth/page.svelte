<script>
  import { push } from "svelte-spa-router";
  import Content from "../../lib/components/Content.svelte";
  import {
    setThreadsLongAccessToken,
    setTwitterAccessToken,
  } from "../../lib/firebase";

  /**
   * @typedef {Object} Props
   * @param {object} params
   */

  /** @type {Props} */
  let { params } = $props();

  let result = $state(null);

  switch (params.item) {
    case "threads":
      switch (params.action) {
        case "callback":
          if (params.status === "ok") {
            (async () => {
              result = await setThreadsLongAccessToken(params.data);
              if (!result.err) {
                push("/settings");
              }
            })();
          } else {
            result = { err: params.data };
          }
          break;
        default:
          result = { err: "Invalid action" };
      }
      break;
    case "twitter":
      switch (params.action) {
        case "callback":
          if (params.status !== "ng") {
            (async () => {
              result = await setTwitterAccessToken(params.status, params.data);
              if (!result.err) {
                push("/settings");
              }
            })();
          } else {
            result = { err: params.data };
          }
          break;
        default:
          result = { err: "Invalid action" };
      }
      break;
    default:
      result = { err: "Invalid item" };
  }
</script>

<Content>
  {result?.err}
</Content>
