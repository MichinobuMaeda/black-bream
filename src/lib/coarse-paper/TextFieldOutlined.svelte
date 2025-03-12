<script>
  import SvgErrorFill from "../icons/SvgErrorFill.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {string} [type]
   * @property {Object} value
   * @property {string} label
   * @property {string} [message]
   * @property {string} [error]
   * @property {boolean} [readonly]
   * @property {boolean} [disabled]
   * @property {boolean} [monospace]
   * @property {number} [lines]
   */

  /** @type {Props} */
  let {
    id,
    type = "text",
    value = $bindable(),
    label,
    message = "",
    error = "",
    readonly = false,
    disabled = false,
    monospace = undefined,
    lines = 1,
  } = $props();

  monospace ??= ["password", "email", "number"].includes(type);

  const onChange = (event) => {
    value = event.target.value;
  };
</script>

<div
  class={"flex flex-col grow" +
    (lines === 1 ? " h-[68px]" : "") +
    (disabled ? " opacity-40" : "")}
>
  <label
    for={id}
    class={"mt-2 py-2 px-2 relative block rounded-md border" +
      " focus-within:border-2" +
      " bg-light-form dark:bg-dark-form" +
      " text-light-on-surface dark:text-dark-on-surface" +
      (error
        ? " border-light-error dark:border-dark-error" +
          " text-light-error dark:text-dark-error"
        : " border-light-outline dark:border-dark-outline" +
          " focus-within:border-light-primary focus-within:dark:border-dark-primary")}
  >
    {#if lines === 1}
      <input
        {id}
        {type}
        bind:value
        class={"peer border-none w-full text-base" +
          " focus:border-none focus:outline-none focus:ring-0" +
          " placeholder-transparent dark:placeholder-transparent" +
          " bg-light-form dark:bg-dark-form" +
          (monospace ? " font-mono" : "")}
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
    {:else}
      <textarea
        {id}
        bind:value
        class={"peer border-none w-full text-base" +
          " focus:border-none focus:outline-none focus:ring-0" +
          " placeholder-transparent dark:placeholder-transparent" +
          " bg-light-form dark:bg-dark-form" +
          (monospace ? " font-mono" : "")}
        placeholder={label}
        rows={lines}
        {readonly}
        {disabled}
        onchange={onChange}>{value}</textarea
      >
      <span
        class={"peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm" +
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
    {/if}
    {#if error}
      <span
        class={"absolute top-2 size-6" +
          (type === "number" ? " end-8" : " end-2") +
          " text-light-error dark:text-dark-error"}
      >
        <SvgErrorFill />
      </span>
    {/if}
  </label>
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
