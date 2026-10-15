<script setup lang="ts">
const route = useRoute()
// Administration pages have their own navigation. Never render the customer
// storefront header/footer around the back-office interface.
const isAdminPage = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))
</script>

<template>
  <div>
    <SiteHeader v-if="!isAdminPage" />
    <NuxtPage />
    <SiteFooter v-if="!isAdminPage" />
  </div>
</template>
