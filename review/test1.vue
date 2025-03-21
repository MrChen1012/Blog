<template>
    <button @click="increment">Count is: {{ count }}</button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const count = ref<number>(0)

onMounted(() => {
    console.log(`The initial count is ${count.value}.`)
})

const increment = () => {
    count.value++
}
</script>

<style lang="scss" scoped></style>
