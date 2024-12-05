<script>
  import { marked } from "marked";

  /**
   * @typedef {Object} Props
   * @property {string} src
   */

  /** @type {Props} */
  let { src = "" } = $props();
</script>

<div class="markdown">
  {@html marked.parse(src)}
</div>
