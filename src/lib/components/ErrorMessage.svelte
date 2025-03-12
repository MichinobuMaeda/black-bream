<script>
  let { children } = $props();
</script>

<div class="text-light-error dark:text-dark-error">
  {@render children()}
</div>
