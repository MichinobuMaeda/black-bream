<script>
  let { children } = $props();
</script>

<div class="flex flex-row w-full gap-4 lg:gap-6 justify-end lg:justify-start">
  {@render children()}
</div>
