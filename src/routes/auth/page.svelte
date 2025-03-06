<script>
  import { push } from "svelte-spa-router";
  import Content from "../../lib/components/Content.svelte";
  import { callFunction } from "../../lib/firebase";
  import {
    loadTwitterState,
    loadTwitterChallenge,
  } from "../../lib/localstorage.js";
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
            const code = params.data;
            (async () => {
              result = await callFunction("setThreadsAccessToken", { code });
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
          {
            const param = {
              status: loadTwitterState(),
              challenge: loadTwitterChallenge(),
              code: params.data,
            };
            if (params.status === param.status) {
              (async () => {
                result = await callFunction("setTwitterAccessToken", param);
                if (!result.err) {
                  push("/settings");
                }
              })();
            } else {
              result = { err: params.data };
            }
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
