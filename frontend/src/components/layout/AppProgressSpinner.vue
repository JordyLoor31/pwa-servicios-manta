<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'
</script>

<template>
    <div class="flex justify-center">
        <ProgressSpinner
            :stroke-width="18"
            animation-duration=".5s"
            style="width: 50px; height: 50px"
            :pt="{
                circleTrack: { style: { stroke: 'transparent' } }
            }"
        />
    </div>
</template>

<style scoped>
:deep(.p-progressspinner-circle) {
    stroke: var(--color-pacific) !important;
}
</style>
