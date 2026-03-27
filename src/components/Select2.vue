<!-- Select2.vue -->
<template>
  <div ref="containerRef"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Nếu SelectInput là global thì bỏ dòng import này.
// Nếu bạn có module/class SelectInput thì import đúng path:
/// import SelectInput from '@/path/to/SelectInput'

const props = defineProps({
  modelValue: { type: [Object, Array, String, Number], default: null },
  data: { type: Array, default: () => [] },

  placeholder: { type: String, default: 'Chọn...' },
  searchPlaceholder: { type: String, default: 'Tìm kiếm...' },

  multiple: { type: Boolean, default: false },
  searchable: { type: Boolean, default: true },
  clearable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },

  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },

  pageSize: { type: Number, default: 50 },
  loadingText: { type: String, default: 'Đang tải...' },
  noDataText: { type: String, default: 'Không có dữ liệu' },
  noResultsText: { type: String, default: 'Không tìm thấy kết quả' },
  showFooterButton: { type: Boolean, default: false },
  footerButtonText: { type: String, default: 'Thêm mới' },
  textField: { type: String, default: 'text' },
  valueField: { type: String, default: 'id' },
  subFields: { type: Array, default: () => [] },
  tableMode: { type: Boolean, default: false },
  tableColumns: { type: Array, default: () => [] },
  showTableHeader: { type: Boolean, default: true },
  treeMode: { type: Boolean, default: false },
  parentField: { type: String, default: 'parent' },
  height: { type: Number, default: null },
  setWidth: { type: [Number, String], default: null },
})

const emit = defineEmits([
  'update:modelValue',
  'select',
  'unselect',
  'clear',
  'search',
  'open',
  'close',
  'footer-button-click',
])

const containerRef = ref(null)
let selectInstance = null

const initializeSelect = () => {
  if (!containerRef.value) return

  // Destroy existing instance
  if (selectInstance) {
    selectInstance.destroy()
    selectInstance = null
  }

  // Create new instance
  selectInstance = new SelectInput(containerRef.value, {
    data: Array.isArray(props.data) ? props.data : [],
    placeholder: props.placeholder,
    searchPlaceholder: props.searchPlaceholder,
    multiple: props.multiple,
    searchable: props.searchable,
    clearable: props.clearable,
    disabled: props.disabled,
    size: props.size,
    pageSize: props.pageSize,
    loadingText: props.loadingText,
    noDataText: props.noDataText,
    noResultsText: props.noResultsText,
    showFooterButton: props.showFooterButton,
    footerButtonText: props.footerButtonText,
    textField: props.textField,
    valueField: props.valueField,
    subFields: props.subFields,
    tableMode: props.tableMode,
    tableColumns: props.tableColumns,
    showTableHeader: props.showTableHeader,
    treeMode: props.treeMode,
    parentField: props.parentField,
    height: props.height,
    setWidth: props.setWidth,

    onSelect: (item) => {
      emit('update:modelValue', item[props.valueField])
      emit('select', item)
    },
    onUnselect: (item) => {
      emit('update:modelValue', "")
      emit('unselect', item)
    },
    onClear: (data) => {
      emit('update:modelValue', props.multiple ? [] : null)
      emit('clear', data)
    },
    onSearch: (query) => emit('search', query),
    onOpen: () => emit('open'),
    onClose: () => emit('close'),
    onFooterButtonClick: () => emit('footer-button-click'),
  })

  // Set initial value
  if (props.modelValue != null) {
    selectInstance.setValue(props.modelValue)
  }
}

// Watch data changes
watch(
  () => (props.data),
  async (value) => {
    if (selectInstance) {
      const validData = Array.isArray(props.data) ? props.data : [];
      selectInstance.setData(validData);  // CHỜ 1 tick để list render xong rồi mới set value
      await nextTick();
      await syncValueToUI(props.modelValue);
    }
  },
  { deep: true }
)

// Watch modelValue changes

watch(
  () => props.modelValue,
  async (newValue) => {
    if (!selectInstance) return
    syncValueToUI(newValue)
  }
)
const syncValueToUI = async (value) => {
  if (!selectInstance) return;

  const current = selectInstance.getValue();

  // So sánh nhanh, không stringify
  selectInstance.setValue(value);
};
// Watch disabled changes
watch(
  () => props.disabled,
  (newValue) => {
    if (!selectInstance) return
    newValue ? selectInstance.disable() : selectInstance.enable()
  }
)

onMounted(() => {
  nextTick(() => initializeSelect())
})

onUnmounted(() => {
  if (selectInstance) {
    selectInstance.destroy()
    selectInstance = null
  }
})

// Methods (Expose)
const clear = () => selectInstance?.clear()
const getValue = () => (selectInstance ? selectInstance.getValue() : null)
const setValue = (value) => selectInstance?.setValue(value)
const setData = (data) => selectInstance?.setData(data)

defineExpose({
  clear,
  getValue,
  setValue,
  setData,
})
</script>
