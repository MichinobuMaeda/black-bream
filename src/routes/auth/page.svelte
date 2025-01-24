<script>
  import Content from "../../lib/Content.svelte";
  import { setThreadsLongAccessToken } from "../../lib/firebase";

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
          result = setThreadsLongAccessToken(window.location.search);
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
