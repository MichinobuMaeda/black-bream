<script>
  import SvgVisibilityOff from "../icons/SvgVisibilityOff.svelte";
  import SvgVisibilityOn from "../icons/SvgVisibilityOn.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {Object} value
   * @property {string} label
   * @property {string} [message]
   * @property {string} [error]
   * @property {boolean} [readonly]
   * @property {boolean} [disabled]
   */

  /** @type {Props} */
  let {
    id,
    value = $bindable(),
    label,
    message = "",
    error = "",
    readonly = false,
    disabled = false,
  } = $props();

  let visible = $state(false);
</script>

<div class="flex flex-col grow h-[68px]">
  <div class="flex flex-row items-center">
    <label
      for={id}
      class={"mt-2 py-2 px-2 grow relative block rounded-md border" +
        " focus-within:border-2" +
        " bg-light-form dark:bg-dark-form" +
        " text-light-on-surface dark:text-dark-on-surface" +
        (error
          ? " border-light-error dark:border-dark-error"
          : " border-light-outline dark:border-dark-outline" +
            " focus-within:border-light-primary dark:focus-within:border-dark-primary")}
    >
      <input
        {id}
        type={visible ? "text" : "password"}
        bind:value
        class={"peer border-none w-full text-base" +
          " focus:border-none focus:outline-hidden focus:ring-0" +
          " placeholder-transparent dark:placeholder-transparent" +
          " bg-light-form dark:bg-dark-form" +
          " text-light-on-surface dark:text-dark-on-surface" +
          " font-mono"}
        placeholder={label}
        {readonly}
        {disabled}
      />
      <span
        class={"peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm" +
          " peer-focus:top-0 peer-focus:text-xs pointer-events-none" +
          " absolute start-2 top-0 -translate-y-1/2 p-0.5 text-xs transition-all" +
          " bg-light-form dark:bg-dark-form" +
          (error
            ? " text-light-error dark:text-dark-error"
            : " text-light-on-surface-variant dark:text-dark-on-surface-variant" +
              " peer-focus:text-light-primary dark:peer-focus:text-dark-primary")}
      >
        {label}
      </span>
    </label>
    <button
      id={`${id}-visible`}
      type="button"
      class={"text-base w-6 h-6 mx-2 pt-1" +
        (disabled
          ? " text-light-outline dark:text-dark-outline" + " opacity-50"
          : error
            ? " text-light-error dark:text-dark-error"
            : " text-light-outline dark:text-dark-outline")}
      onclick={() => {
        visible = !visible;
      }}
    >
      {#if visible}
        <SvgVisibilityOn />
      {:else}
        <SvgVisibilityOff />
      {/if}
    </button>
  </div>
  {#if !error}
    <div
      class="text-sm pl-2 line-clamp-1 text-ellipsis
        text-light-on-surface dark:text-dark-on-surface"
    >
      {message}
    </div>
  {:else}
    <div
      class="text-sm pl-2 line-clamp-1 text-ellipsis
        text-light-error dark:text-dark-error"
    >
      {error}
    </div>
  {/if}
</div>
