<script>
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
    monospace = false,
    lines = 1,
  } = $props();

  const onChange = (event) => {
    value = event.target.value;
  };
</script>

<div
  class={"flex flex-col grow" +
    (lines === 1 ? " h-14" : "") +
    (disabled ? " opacity-40" : "")}
>
  <label
    for={id}
    class="mt-2 py-2 px-2 relative block rounded-md border
      border-lightOutline dark:border-darkOutline
      focus-within:border-lightOutline focus-within:dark:border-darkOutline
      bg-lightForm dark:bg-darkForm
      text-lightOnSurface dark:text-darkOnSurface"
  >
    {#if lines === 1}
      <input
        {id}
        {type}
        bind:value
        class={"peer border-none w-full text-base " +
          "focus:border-none focus:outline-none focus:ring-0 " +
          "placeholder-lightSurface dark:placeholder-darkSurface " +
          "bg-lightForm dark:bg-darkForm " +
          "text-lightOnSurface dark:text-darkOnSurface" +
          (monospace ? " font-mono" : "")}
        placeholder={label}
        {readonly}
        {disabled}
      />
    {:else}
      <textarea
        {id}
        bind:value
        class={"peer border-none w-full text-base " +
          "focus:border-none focus:outline-none focus:ring-0 " +
          "placeholder-lightSurface dark:placeholder-darkSurface " +
          "bg-lightForm dark:bg-darkForm " +
          "text-lightOnSurface dark:text-darkOnSurface" +
          (monospace ? " font-mono" : "")}
        placeholder={label}
        rows={lines}
        {readonly}
        {disabled}
        onchange={onChange}>{value}</textarea
      >
    {/if}
    <span
      class="peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm
        peer-focus:top-0 peer-focus:text-xs pointer-events-none
        absolute start-2 top-0 -translate-y-1/2 p-0.5 text-xs transition-all
        bg-lightForm dark:bg-darkForm
        text-lightOnSurface dark:text-darkOnSurface"
    >
      {label}
    </span>
  </label>
  {#if !error}
    <div
      class="text-sm pl-2
        text-lightOnSurface dark:text-darkOnSurface"
    >
      {message}
    </div>
  {:else}
    <div
      class="text-sm pl-2
        text-lightError dark:text-darkError"
    >
      {error}
    </div>
  {/if}
</div>
