<script>
  let { children } = $props();
</script>

<div class="flex flex-col p-2 sm:p-4 lg:p-6 gap-2 sm:gap-4 lg:gap-6 text-base">
  {@render children()}
</div>
