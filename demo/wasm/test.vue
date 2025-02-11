<script setup lang="ts">
import { ref, watch } from 'vue';
import { get } from './fib.asm';

const fibN = ref(1);
const fibRS = ref(0)


watch(() => fibN.value, async () => {

    const fib = await get('fib');

    fibRS.value = fib?.(Math.min(+fibN.value, 40));
});

</script>

<template>
    <div>
        递归 fib<input type="number" v-model="fibN" /> = {{ fibRS }} (max input:40)
    </div>
</template>

<style scoped lang="scss"></style>
