<script>
  import Actions from "./Actions.svelte";
  import ButtonOutlined from "../coarse-paper/ButtonOutlined.svelte";
  import ButtonFilled from "../coarse-paper/ButtonFilled.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";
  import SvgClose from "../icons/SvgClose.svelte";
  import SvgCheck from "../icons/SvgCheck.svelte";
  import { t } from "../store.svelte.js";

  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {boolean} changed
   * @property {boolean} valid
   * @property {function} onCancel
   * @property {function} onSave
   * @property {string} [error]
   * @property {boolean} [cancelOnlyChanged]
   * @property {boolean} [saveNotChanged]
   * @property {boolean} [wide]
   */

  /** @type {Props} */
  let {
    id,
    changed,
    valid,
    onCancel,
    onSave,
    error,
    cancelOnlyChanged = false,
    saveNotChanged = false,
    wide = false,
  } = $props();
</script>

{#snippet actions()}
  <ButtonOutlined
    id={`${id}-cancel`}
    icon={SvgClose}
    label={t().cancel()}
    onClick={onCancel}
    disabled={cancelOnlyChanged && !changed}
  />
  <ButtonFilled
    id={`${id}-save`}
    icon={SvgCheck}
    label={t().save()}
    onClick={onSave}
    disabled={!saveNotChanged && (!changed || !valid)}
  />
{/snippet}

<div class="flex flex-col w-full gap-4">
  {#if error}
    <ErrorMessage>{error}</ErrorMessage>
  {/if}
  {#if wide}
    <div class="flex flex-row w-full gap-4 lg:gap-6 justify-end">
      {@render actions()}
    </div>
  {:else}
    <Actions>
      {@render actions()}
    </Actions>
  {/if}
</div>
