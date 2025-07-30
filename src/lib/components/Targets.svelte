<script>
  import GroupedCheckBox from "../coarse-paper/GroupedCheckBox.svelte";
  import Wrap from "./Wrap.svelte";
  import { postTargets } from "../../lib/firebase.js";
  import { store } from "../../lib/store.svelte.js";

  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {Array<string>} value
   */

  /** @type {Props} */
  let { id, value = $bindable() } = $props();

  let items = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));
</script>

<Wrap>
  <GroupedCheckBox {id} {items} bind:value />
</Wrap>
