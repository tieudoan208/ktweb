<script setup>
import { inject, onMounted } from "vue";

const props = defineProps({
    field: { type: String, required: true },
    name: { type: String, required: true },
    css: { type: String, default: '' },
    editor: { type: String, default: '' },
    filter: { type: String, default: 'none' },
    dec: { type: Number, default: 0 },
    type: {
        type: String,
        default: 'text',
        validator: val =>
            ['text', 'date', 'month', 'money', 'status', 'trend', 'payment', 'shipping', 'custom'].includes(val)
    },
    format: { type: String, default: false },
    dataSource: { type: Array, default: () => [] },
    width: { type: String, default: null }
});

const registerColumn = inject("registerColumn");

onMounted(() => {
    if (registerColumn) registerColumn(props);
});
</script>

<template>
    <span style="display:none"></span>
</template>
