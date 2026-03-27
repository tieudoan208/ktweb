<template>
  <div class="ac-wrap" ref="inputRef">
    <!-- ── INPUT ── -->
    <div class="ac-input-wrap">
      <input
        ref="inputElRef"
        type="text"
        v-model="searchText"
        :class="inputClass"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />
      <!-- Badge MỚI khi đang giữ giá trị tự nhập -->
      <span v-if="isNewMode && allowNew" class="ac-badge-new">MỚI</span>
    </div>

    <!-- ── DROPDOWN ── -->
    <Teleport to="body">
      <div
        v-if="showDropdown"
        ref="dropdownRef"
        class="ac-dropdown"
        :style="dropdownStyle"
      >
        <!-- ════ LIST MODE ════ -->
        <template v-if="dropdownMode === 'list'">
          <!-- Empty -->
          <div v-if="filteredItems.length === 0 && !showAddNew" class="ac-empty">
            Không có kết quả
          </div>

          <!-- Rows -->
          <ul v-if="pagedItems.length > 0" class="ac-list" :style="{ maxHeight }">
            <li
              v-for="(item, idx) in pagedItems"
              :key="item[valueField]"
              class="ac-item"
              :class="{ 'ac-item--active': idx === highlightedIndex }"
              @mousedown.prevent="selectItem(item)"
              @mouseover="highlightedIndex = idx"
            >
              <!-- Chế độ columns tuỳ chỉnh -->
              <template v-if="columns.length > 0">
                <div class="ac-row-cols">
                  <span
                    v-for="col in resolvedColumns"
                    :key="col.field"
                    :style="colStyle(col)"
                  >{{ item[col.field] }}</span>
                </div>
              </template>
              <!-- Chế độ label + subtitle -->
              <template v-else>
                <div class="ac-label">{{ item[labelField] }}</div>
                <div v-if="subTitleField && item[subTitleField]" class="ac-subtitle">
                  {{ item[subTitleField] }}
                </div>
              </template>
            </li>
          </ul>

          <!-- rowCount footer -->
          <div v-if="rowCountInfo" class="ac-footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ rowCountInfo }}
          </div>

          <!-- Nút thêm mới -->
          <div
            v-if="showAddNew"
            class="ac-add-new"
            :class="{ 'ac-item--active': highlightedIndex === pagedItems.length }"
            @mousedown.prevent="confirmNew"
            @mouseover="highlightedIndex = pagedItems.length"
          >
            <span class="ac-add-icon">+</span>
            <span>{{ addNewLabel }}</span>
          </div>
        </template>

        <!-- ════ GRID MODE ════ -->
        <template v-else-if="dropdownMode === 'grid'">
          <!-- Header -->
          <div v-if="showHeader" class="ac-grid-header">
            <div
              v-for="col in resolvedColumns"
              :key="'h-' + col.field"
              :style="colStyle(col)"
              class="ac-grid-header-cell"
            >{{ col.label }}</div>
          </div>

          <!-- Empty -->
          <div v-if="filteredItems.length === 0 && !showAddNew" class="ac-empty">
            Không có kết quả
          </div>

          <!-- Rows -->
          <div v-if="pagedItems.length > 0" class="ac-grid-body" :style="{ maxHeight }">
            <div
              v-for="(item, idx) in pagedItems"
              :key="item[valueField]"
              class="ac-item ac-grid-row"
              :class="{ 'ac-item--active': idx === highlightedIndex }"
              @mousedown.prevent="selectItem(item)"
              @mouseover="highlightedIndex = idx"
            >
              <div
                v-for="col in resolvedColumns"
                :key="col.field"
                :style="colStyle(col)"
                class="ac-grid-cell"
              >
                <!-- Cột chính: hiện kèm subtitle -->
                <template v-if="col.isMain">
                  <div class="ac-label">{{ item[col.field] }}</div>
                  <div v-if="subTitleField && item[subTitleField]" class="ac-subtitle">
                    {{ item[subTitleField] }}
                  </div>
                </template>
                <!-- Cột phụ -->
                <template v-else-if="!col.isSub">
                  <span class="ac-cell-text">{{ item[col.field] }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- rowCount footer -->
          <div v-if="rowCountInfo" class="ac-footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ rowCountInfo }}
          </div>

          <!-- Nút thêm mới -->
          <div
            v-if="showAddNew"
            class="ac-add-new"
            :class="{ 'ac-item--active': highlightedIndex === pagedItems.length }"
            @mousedown.prevent="confirmNew"
            @mouseover="highlightedIndex = pagedItems.length"
          >
            <span class="ac-add-icon">+</span>
            <span>{{ addNewLabel }}</span>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────
const props = defineProps({
  /** Giá trị v-model: valueField khi chọn từ list, text string khi allowNew */
  modelValue: {
    default: null
  },
  /** Mảng dữ liệu nguồn */
  dataSource: {
    type: Array,
    default: () => []
  },
  /** Trường dùng làm giá trị emit (default: 'id') */
  valueField: {
    type: String,
    default: 'id'
  },
  /** Trường hiển thị chính trong input và dropdown (default: 'text') */
  labelField: {
    type: String,
    default: 'text'
  },
  /**
   * Trường phụ đề — font nhỏ hơn, màu xám, bên dưới labelField.
   * Hoạt động ở cả list và grid mode.
   */
  subTitleField: {
    type: String,
    default: ''
  },
  /**
   * Chế độ hiển thị dropdown:
   * - 'list' (default): danh sách dọc đơn giản
   * - 'grid': bảng nhiều cột có header
   */
  dropdownMode: {
    type: String,
    default: 'list',
    validator: (v) => ['list', 'grid'].includes(v)
  },
  /**
   * Cấu hình cột khi dropdownMode='grid' (hoặc list với nhiều cột):
   * [{ field, label, width, align, isMain }]
   * - isMain: true → cột này hiển thị kèm subTitleField bên dưới
   * Nếu không truyền → tự sinh từ labelField + subTitleField
   */
  columns: {
    type: Array,
    default: () => []
  },
  /**
   * Chiều rộng dropdown (CSS string, vd: '400px', '100%').
   * Hữu ích khi grid cần rộng hơn input.
   */
  dropdownWidth: {
    type: String,
    default: null   // null = follow input width
  },
  /** Chiều cao tối đa vùng scroll của dropdown */
  maxHeight: {
    type: String,
    default: '260px'
  },
  /**
   * Số dòng tối đa render trong dropdown. 0 = không giới hạn.
   * Khi filteredItems.length > rowCount:
   *   - Chỉ render rowCount dòng đầu
   *   - Footer hiện: "Hiển thị X / Y kết quả — gõ thêm để thu hẹp"
   * Khuyến nghị: đặt 50 khi dataSource > 500 bản ghi.
   */
  rowCount: {
    type: Number,
    default: 0
  },
  /**
   * Cho phép nhập giá trị mới không có trong list.
   * - Khi true: hiện nút "+ Thêm '...'" ở cuối dropdown
   * - Khi xác nhận: emit update:modelValue = text string (không phải id)
   *                 emit new-item = { text }
   * - Badge "MỚI" xuất hiện trên input khi đang giữ giá trị tự nhập
   */
  allowNew: {
    type: Boolean,
    default: false
  },
  /**
   * Tuỳ chỉnh label nút thêm mới.
   * Dùng {text} để chèn text đang gõ. Vd: 'Thêm tag "{text}"'
   */
  newItemLabel: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  /** Bootstrap size: 'sm' | 'md' */
  size: {
    type: String,
    default: 'sm'
  },
  /** CSS class bổ sung cho phần tử input */
  inputCss: {
    type: String,
    default: ''
  }
})

// ─────────────────────────────────────────────
//  Emits
// ─────────────────────────────────────────────
const emit = defineEmits([
  /** Giá trị đã chọn (valueField) hoặc text string khi allowNew */
  'update:modelValue',
  /** Fired khi user xác nhận nhập mới: { text: string } */
  'new-item'
])

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
const inputRef         = ref(null)   // wrapper div
const inputElRef       = ref(null)   // native input element
const dropdownRef      = ref(null)   // dropdown div (teleport)
const searchText       = ref('')
const showDropdown     = ref(false)
const highlightedIndex = ref(-1)
/** true khi v-model đang giữ giá trị text mới (không có trong dataSource) */
const isNewMode        = ref(false)

// Vị trí dropdown (absolute theo viewport vì dùng Teleport)
const dropdownPos = ref({ top: 0, left: 0, width: 0 })

// ─────────────────────────────────────────────
//  Computed
// ─────────────────────────────────────────────
const inputClass = computed(() => {
  const cls = ['form-control']
  if (props.size === 'sm') cls.push('form-control-sm')
  if (props.inputCss) cls.push(props.inputCss)
  if (isNewMode.value) cls.push('ac-input--new')
  return cls
})

/** Cột hiển thị cuối cùng: props.columns nếu có, ngược lại tự sinh */
const resolvedColumns = computed(() => {
  if (props.columns.length > 0) return props.columns
  const cols = [{ field: props.labelField, label: '', width: 'auto', align: 'left', isMain: true }]
  if (props.subTitleField)
    cols.push({ field: props.subTitleField, label: '', width: 'auto', align: 'left', isSub: true })
  return cols
})

/** Có hiển thị dòng tiêu đề header hay không (chỉ grid mode có label) */
const showHeader = computed(() =>
  props.dropdownMode === 'grid' && resolvedColumns.value.some(c => c.label)
)

/** Tìm label hiển thị từ modelValue */
const getLabelByValue = (val) => {
  if (val === null || val === undefined || val === '') return ''
  const found = props.dataSource.find(item => item[props.valueField] == val)
  if (found) return String(found[props.labelField] || '')
  // allowNew: val là text tự nhập
  if (props.allowNew && typeof val === 'string') return val
  return ''
}

/** Danh sách sau khi lọc theo từ khoá (full, chưa cắt) */
const filteredItems = computed(() => {
  const keyword = (searchText.value || '').toLowerCase().trim()
  if (!keyword) return props.dataSource
  return props.dataSource.filter(item => {
    const fields = [
      props.labelField,
      props.subTitleField,
      ...resolvedColumns.value.map(c => c.field)
    ].filter(Boolean)
    return fields.some(f => String(item[f] || '').toLowerCase().includes(keyword))
  })
})

/** Danh sách thực sự render (cắt theo rowCount) */
const pagedItems = computed(() => {
  if (props.rowCount > 0 && filteredItems.value.length > props.rowCount)
    return filteredItems.value.slice(0, props.rowCount)
  return filteredItems.value
})

/** Số dòng bị ẩn do rowCount */
const hiddenCount = computed(() =>
  filteredItems.value.length - pagedItems.value.length
)

/** Text footer khi có dòng bị ẩn */
const rowCountInfo = computed(() => {
  if (hiddenCount.value <= 0) return ''
  return `Hiển thị ${pagedItems.value.length.toLocaleString()} / ${filteredItems.value.length.toLocaleString()} kết quả — gõ thêm để thu hẹp`
})

/** Item khớp chính xác với text đang gõ */
const exactMatch = computed(() => {
  const kw = (searchText.value || '').toLowerCase().trim()
  if (!kw) return null
  return props.dataSource.find(
    item => String(item[props.labelField] || '').toLowerCase() === kw
  ) || null
})

/** Hiển thị nút thêm mới khi: allowNew + có text + không khớp chính xác */
const showAddNew = computed(() =>
  props.allowNew &&
  searchText.value.trim().length > 0 &&
  !exactMatch.value
)

/** Label nút thêm mới */
const addNewLabel = computed(() => {
  const text = searchText.value.trim()
  if (props.newItemLabel) return props.newItemLabel.replace('{text}', text)
  return `Thêm "${text}"`
})

/** Tổng số lựa chọn cho keyboard nav (pagedItems + nút addNew) */
const totalOptions = computed(() =>
  pagedItems.value.length + (showAddNew.value ? 1 : 0)
)

/** Style cho dropdown (position absolute theo viewport qua Teleport) */
const dropdownStyle = computed(() => ({
  position:  'fixed',
  zIndex:    9999,
  top:       dropdownPos.value.top + 'px',
  left:      dropdownPos.value.left + 'px',
  width:     (props.dropdownWidth || dropdownPos.value.width + 'px'),
  minWidth:  dropdownPos.value.width + 'px',
  border:    '1px solid #ced4da',
  background: '#fff',
  borderRadius: '0 0 6px 6px',
  boxShadow: '0 6px 20px rgba(0,0,0,.13)',
  overflow:  'hidden'
}))

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
/** Style cho từng cell trong list/grid */
const colStyle = (col) => ({
  width:      col.width || 'auto',
  flex:       col.width === 'auto' ? '1' : 'none',
  textAlign:  col.align || 'left',
  padding:    '0 4px'
})

/** Tính toán vị trí dropdown dựa trên inputRef */
const updateDropdownPos = () => {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownPos.value = {
    top:   rect.bottom,
    left:  rect.left,
    width: rect.width
  }
}

// ─────────────────────────────────────────────
//  Watchers
// ─────────────────────────────────────────────
watch(() => props.modelValue, (newVal) => {
  if (!showDropdown.value) {
    searchText.value = getLabelByValue(newVal)
    if (props.allowNew && newVal !== null && newVal !== undefined && newVal !== '') {
      isNewMode.value = !props.dataSource.find(i => i[props.valueField] == newVal)
    } else {
      isNewMode.value = false
    }
  }
}, { immediate: true })

watch(() => props.dataSource, () => {
  if (!showDropdown.value) searchText.value = getLabelByValue(props.modelValue)
})

watch(showDropdown, async (val) => {
  if (val) {
    await nextTick()
    updateDropdownPos()
  }
})

// ─────────────────────────────────────────────
//  Actions
// ─────────────────────────────────────────────
const onInput = () => {
  showDropdown.value = true
  highlightedIndex.value = -1
  isNewMode.value = false
  emit('update:modelValue', null)
}

const selectItem = (item) => {
  searchText.value = String(item[props.labelField] || '')
  isNewMode.value = false
  emit('update:modelValue', item[props.valueField])
  showDropdown.value = false
  highlightedIndex.value = -1
}

/** Xác nhận nhập giá trị mới */
const confirmNew = () => {
  const text = searchText.value.trim()
  if (!text) return
  isNewMode.value = true
  emit('update:modelValue', text)
  emit('new-item', { text })
  showDropdown.value = false
  highlightedIndex.value = -1
}

const onKeydown = (event) => {
  if (!showDropdown.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      showDropdown.value = true
      updateDropdownPos()
    }
    return
  }
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, totalOptions.value - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value === pagedItems.value.length && showAddNew.value) {
        confirmNew()
      } else if (highlightedIndex.value >= 0 && pagedItems.value[highlightedIndex.value]) {
        selectItem(pagedItems.value[highlightedIndex.value])
      } else if (showAddNew.value && filteredItems.value.length === 0) {
        confirmNew()
      }
      break
    case 'Escape':
      showDropdown.value = false
      searchText.value = getLabelByValue(props.modelValue)
      break
    case 'Tab':
      if (highlightedIndex.value === pagedItems.value.length && showAddNew.value) {
        confirmNew()
      } else if (highlightedIndex.value >= 0 && pagedItems.value[highlightedIndex.value]) {
        selectItem(pagedItems.value[highlightedIndex.value])
      } else {
        showDropdown.value = false
        if (props.allowNew && searchText.value.trim() && !exactMatch.value) {
          confirmNew()
        } else {
          searchText.value = getLabelByValue(props.modelValue)
        }
      }
      break
  }
}

const onBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
    if (props.allowNew) {
      const text = searchText.value.trim()
      if (!text) {
        isNewMode.value = false
        emit('update:modelValue', null)
      } else if (exactMatch.value) {
        selectItem(exactMatch.value)
      } else {
        confirmNew()
      }
    } else {
      const matched = props.dataSource.find(
        item => String(item[props.labelField] || '').toLowerCase() === searchText.value.toLowerCase()
      )
      if (!matched) searchText.value = getLabelByValue(props.modelValue)
    }
  }, 200)
}

const onFocus = () => {
  showDropdown.value = true
  highlightedIndex.value = -1
  updateDropdownPos()
}

// ─────────────────────────────────────────────
//  Click outside
// ─────────────────────────────────────────────
const handleClickOutside = (event) => {
  const inInput    = inputRef.value?.contains(event.target)
  const inDropdown = dropdownRef.value?.contains(event.target)
  if (!inInput && !inDropdown) {
    showDropdown.value = false
    if (!props.allowNew) searchText.value = getLabelByValue(props.modelValue)
  }
}

// Cập nhật vị trí dropdown khi scroll / resize
const handleScrollResize = () => {
  if (showDropdown.value) updateDropdownPos()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll',  handleScrollResize, true)
  window.addEventListener('resize',  handleScrollResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll',  handleScrollResize, true)
  window.removeEventListener('resize',  handleScrollResize)
})
</script>

<style scoped>
/* ── Wrapper ── */
.ac-wrap {
  position: relative;
  display: block;
}

/* ── Input wrapper (để đặt badge MỚI) ── */
.ac-input-wrap {
  position: relative;
}
.ac-input-wrap input {
  width: 100%;
}
.ac-input-wrap input.ac-input--new {
  padding-right: 52px;
  border-color: rgba(34, 197, 94, 0.55) !important;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12) !important;
}

/* ── Badge MỚI ── */
.ac-badge-new {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.4);
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.12em 0.48em;
  border-radius: 3px;
  letter-spacing: 0.06em;
  pointer-events: none;
  line-height: 1.4;
}

/* ── Dropdown (Teleport → body, position: fixed) ── */
.ac-dropdown {
  /* vị trí được set inline qua dropdownStyle */
}

/* ── Empty ── */
.ac-empty {
  padding: 9px 13px;
  font-size: 0.84rem;
  color: #6c757d;
}

/* ── List ── */
.ac-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

/* ── Item (shared list + grid) ── */
.ac-item {
  padding: 8px 13px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.1s;
}
.ac-item:hover,
.ac-item.ac-item--active {
  background: #eef4ff;
  color: #2563eb;
}
.ac-item:last-child {
  border-bottom: none;
}

/* ── Label & subtitle ── */
.ac-label {
  font-size: 0.84rem;
  line-height: 1.35;
}
.ac-subtitle {
  font-size: 0.72rem;
  color: #888;
  margin-top: 2px;
  line-height: 1.2;
}
.ac-item.ac-item--active .ac-subtitle {
  color: rgba(37, 99, 235, 0.6);
}

/* ── Row cols (list custom columns) ── */
.ac-row-cols {
  display: flex;
  gap: 8px;
  align-items: center;
}
.ac-row-cols span {
  font-size: 0.84rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── rowCount footer ── */
.ac-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  font-size: 0.72rem;
  color: #888;
}

/* ── Nút thêm mới ── */
.ac-add-new {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  cursor: pointer;
  border-top: 1px dashed #d1d5db;
  font-size: 0.84rem;
  transition: background 0.1s;
}
.ac-add-new:hover,
.ac-add-new.ac-item--active {
  background: rgba(22, 163, 74, 0.08);
  color: #16a34a;
}
.ac-add-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #2563eb;
  color: #fff;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  transition: background 0.1s;
}
.ac-add-new:hover .ac-add-icon,
.ac-add-new.ac-item--active .ac-add-icon {
  background: #16a34a;
}

/* ── Grid header ── */
.ac-grid-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 5px 10px;
}
.ac-grid-header-cell {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Grid body ── */
.ac-grid-body {
  overflow-y: auto;
}
.ac-grid-row {
  display: flex;
  align-items: center;
  padding: 7px 10px;
}
.ac-grid-cell {
  overflow: hidden;
}
.ac-cell-text {
  font-size: 0.83rem;
}
</style>