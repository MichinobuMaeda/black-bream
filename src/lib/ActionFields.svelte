<script>
  let { children } = $props();
</script>

<div class="flex flex-col gap-2 sm:gap-4 lg:gap-6 max-w-[440px] justify-end">
  {@render children()}
</div>
