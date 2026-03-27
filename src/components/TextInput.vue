<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

// ======== Props & Emits =========
const props = defineProps({
    modelValue: { type: String, default: '' },
    size: { type: String, default: "sm" },
    disabled: { type: Boolean, default: false },
    css: { type: String, default: "" },
    required: { type: Boolean, default: false },
    type: {
        type: String,
        default: 'text',
        validator: value =>
            ['date', 'month', 'year', 'text', 'number', "dec", "password"].includes(value)
    },
    dec: { type: Number, default: 0 },
    placeholder: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);
const inputValue = ref(props.modelValue);
const showPopup = ref(false);
const currentDate = ref(new Date());
const selectedDate = ref(null);
const viewMode = ref('date');
const inputRef = ref(null);
const displayValue = ref('');
const cssClass = ref("form-control");
var dec = props.dec || 0;

const showCalendarButton = computed(() => {
    return ['date', 'month', 'year'].includes(props.type);
});

const inputType = computed(() => {
    // Nếu là password thì trả về 'password', các loại khác trả về 'text'
    if (props.type === 'password') {
        return 'password';
    }
    return 'text';
});
const calendarDays = computed(() => {

    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);


    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    const currentDateLoop = new Date(startDate);

    while (currentDateLoop <= endDate) {
        days.push({
            date: currentDateLoop.getDate(),
            month: currentDateLoop.getMonth(),
            year: currentDateLoop.getFullYear(),
            isCurrentMonth: currentDateLoop.getMonth() === month,
            fullDate: new Date(currentDateLoop)
        });
        currentDateLoop.setDate(currentDateLoop.getDate() + 1);
    }

    return days;
});
const months = computed(() => [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]);
const years = computed(() => {
    const currentYear = currentDate.value.getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i);
    }
    return years;
});

// Watchers
watch(() => props.modelValue, (newVal) => {
    // debugger;
    if (props.type === 'number') {
        inputValue.value = utils.convert.toFormatNumber(newVal, dec);
    }
    else
        inputValue.value = newVal;
});

if (props.size == "sm") {
    cssClass.value = cssClass.value + " form-control-sm";
    if (props.type == 'date' || props.type == "month" || props.type == "year") {
        cssClass.value = cssClass.value + " text-center";
    }
    else if (props.type == "number") {
        cssClass.value = cssClass.value + " text-end";
    }
}
if (!utils.string.isNullOrEmty(props.css)) {
    cssClass.value = cssClass.value + " " + props.css;
}
//Keydown event handler
const onKeydown = (event) => {
    var keyCode = Slick.keyCode;
    var newchar = event.key;
    var keycode = event.keyCode | event.which;
    var position = utils.getCaret(event.target), textLength = event.target.value.length;
    var old = event.target.value;
    if (event.ctrlKey || event.altKey) {
        if (event.key === 'c' || event.key === 'C') {
            console.log('Bạn vừa nhấn Ctrl + C');
            return;
        }
        if (event.key === 'z' || event.key === 'Z') {
            console.log('Bạn vừa nhấn Ctrl + Z');
            return;
        }
        if (event.key === 'x' || event.key === 'X' || event.key === 'v' || event.key === 'V') {
            console.log(`Bạn vừa nhấn Ctrl + ${event.key.toUpperCase()}`);
            return;
        }
        if (event.key === 'a' || event.key === 'A') {
            console.log('Bạn vừa nhấn Ctrl + A');
            return;
        }
    }
    switch (keycode) {
        case keyCode.LEFT:
        case keyCode.RIGHT:
        case keyCode.HOME:
        case keyCode.F2:
        case keyCode.SHIFT:
        case keyCode.CONTROL:
        case keyCode.INSERT:
        case keyCode.END:
            {
                return;
            }
        case keyCode.TAB:
        case keyCode.ENTER:
            {
                // Tự động chuyển sang control tiếp theo hoặc quay lại (Shift+Tab)
                event.preventDefault();

                // Lấy tất cả các input và select-input__selection (bỏ qua button calendar)
                const allInputs = Array.from(document.querySelectorAll('input:not([disabled]):not(.select-input__search-field), textarea:not([disabled])'));
                const allSelects = Array.from(document.querySelectorAll('.select-input__selection:not(.disabled)'));

                // Kết hợp và sắp xếp theo vị trí trong DOM
                const focusableElements = [...allInputs, ...allSelects].sort((a, b) => {
                    const posA = a.compareDocumentPosition(b);
                    return posA & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
                });

                const currentIndex = focusableElements.indexOf(event.target);

                // Xác định hướng di chuyển: Shift+Tab = quay lại, Tab/Enter = tiếp theo
                const isBackward = event.shiftKey && keycode === keyCode.TAB;

                if (isBackward) {
                    // Shift+Tab: Quay lại control trước đó
                    if (currentIndex > 0) {
                        const prevElement = focusableElements[currentIndex - 1];

                        // Nếu element trước đó là Select2
                        if (prevElement.classList.contains('select-input__selection')) {
                            const selectContainer = prevElement.closest('.select-input');
                            if (selectContainer) {
                                prevElement.click();
                                setTimeout(() => {
                                    const searchInput = selectContainer.querySelector('.select-input__search-field');
                                    if (searchInput) {
                                        searchInput.focus();
                                    }
                                }, 100);
                            }
                        } else {
                            // Element thông thường, focus bình thường
                            prevElement.focus();
                        }
                    }
                } else {
                    // Tab/Enter: Chuyển sang control tiếp theo
                    if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                        const nextElement = focusableElements[currentIndex + 1];

                        // Nếu element tiếp theo là Select2
                        if (nextElement.classList.contains('select-input__selection')) {
                            const selectContainer = nextElement.closest('.select-input');
                            if (selectContainer) {
                                nextElement.click();
                                setTimeout(() => {
                                    const searchInput = selectContainer.querySelector('.select-input__search-field');
                                    if (searchInput) {
                                        searchInput.focus();
                                    }
                                }, 100);
                            }
                        } else {
                            // Element thông thường, focus bình thường
                            nextElement.focus();
                        }
                    }
                }
                return;
            }
        case keyCode.BACKSPACE:
            {
                if (position.start == 0 && position.end == 0)
                    return;
                if (props.type === 'number') {
                    var newVal = (old.substring(0, position.start - 1) + old.substring(position.end));
                    event.target.value = newVal;
                    emit('update:modelValue', utils.convert.formatToNumber(newVal));
                    utils.setCaret(event.target, position.start - 1, position.start - 1);
                    event.preventDefault();
                }
                else if (props.type === 'date' || props.type === 'month' || props.type === 'year') {
                    var charLost = "";
                    if (position.start == 3 || (props.type === 'date' && position.start == 6)) {
                        position.start = position.start - 1;
                    }

                    var newVal = old.substring(0, position.start - 1) + "_" + old.substring(position.start);
                    event.target.value = newVal;
                    emit('update:modelValue', newVal);
                    utils.setCaret(event.target, position.start - 1, position.start - 1);
                    event.preventDefault();
                }
                else if (props.type === 'text') {
                    if (position.start == position.end) {
                        position.end = position.end + 1;
                    }
                    var newVal = old.substring(0, position.start - 1) + old.substring(position.end);
                    event.target.value = newVal;
                    emit('update:modelValue', newVal);
                    utils.setCaret(event.target, position.start - 1, position.start - 1);
                    event.preventDefault();
                }
                return true;
            }
        case keyCode.DELETE:
            {
                if (props.type === 'number') {
                    var cur = old.substring(position.start, position.end);
                    if (cur == "." && position.start < old.length)
                        position.end = position.end + 1;
                    var newVal = old.substring(0, position.start) + old.substring(position.end + 1);

                    event.target.value = newVal;
                    emit('update:modelValue', utils.convert.formatToNumber(newVal));
                    utils.setCaret(event.target, position.start, position.start);
                }
                else if (props.type === 'date' || props.type === 'month' || props.type === 'year') {
                    //debugger;
                    if (position.start == old.length)
                        return;
                    var charLost = "";
                    if (position.start == 2 || (props.type === 'date' && position.start == 5)) {
                        position.start = position.start + 1;
                    }
                    var newVal = old.substring(0, position.start) + "_" + old.substring(position.start + 1);
                    event.target.value = newVal;
                    emit('update:modelValue', newVal);
                    utils.setCaret(event.target, position.start + 1, position.start + 1);

                }
                else if (props.type === 'text') {
                    if (position.start == position.end && position.start < old.length) {
                        position.end = position.end + 1;
                    }
                    if (position.start == old.length)
                        return;
                    var newVal = old.substring(0, position.start) + old.substring(position.end);
                    event.target.value = newVal;
                    emit('update:modelValue', newVal);
                    utils.setCaret(event.target, position.start, position.start);
                }

                event.preventDefault();
                return true;
            }

    }

    if (props.type === 'number') {
        var check = "0123456789";
        if (dec > 0) {
            check = check + ".";
        }
        if (check.indexOf(newchar) < 0 || (newchar == "0" && old == "0")//{
            || (newchar == "." && old.indexOf(".") >= 0)) {
            event.preventDefault();
            return false;
        }
        var newVal = old.substr(0, position.start) + newchar + old.substr(position.end);
        var newcharNumber = utils.convert.toFormatNumber(newVal, dec);
        event.target.value = newcharNumber;
        emit('update:modelValue', utils.convert.formatToNumber(newcharNumber));

        utils.setCaret(event.target, newcharNumber.length, newcharNumber.length);
        event.preventDefault();
    }
    else if (props.type === 'date' || props.type === 'month' || props.type === 'year') {
        if (props.type === 'year') {
            // Year: max 4 digits
            if (position.end >= 4 && position.start >= 4) { event.preventDefault(); return true; }
        } else {
            if (position.end >= 10 && position.start >= 10) { event.preventDefault(); return true; }
        }
        var check = "0123456789";
        var index = check.indexOf(event.key);
        if (index === -1) {
            event.preventDefault();
            return true;
        }
        var charLost = "";

        if (props.type === 'year') {
            // Year doesn't have separator
            var newVal = old.toString().substring(0, position.start) + newchar + old.toString().substring(position.start + 1);
            event.target.value = newVal;
            emit('update:modelValue', newVal);
            utils.setCaret(event.target, position.start + 1, position.start + 1);
        } else {
            if (position.start == 2 || (position.start == 5 && props.type == "date")) {
                if (old.substring(position.start, position.start + 1) == "/")
                    charLost = "";
                else
                    charLost = "/";
                position.start++;
            }

            var newVal = old.toString().substring(0, position.start) + charLost + newchar + old.toString().substring(position.start + 1);
            event.target.value = newVal;
            emit('update:modelValue', newVal);
            utils.setCaret(event.target, position.start + 1, position.start + 1);
        }
        event.preventDefault();
    }
    else {
        if (newchar == undefined || newchar.length > 1) return; // Chặn các phím đặc biệt) 
        var newVal = old.substr(0, position.start) + newchar + old.substr(position.end);
        event.target.value = newVal;
        emit('update:modelValue', newVal);
        utils.setCaret(event.target, position.start + 1, position.start + 1);
        event.preventDefault();
    }
}
// Handle paste event: wait for browser to apply paste then update v-model
const onPaste = (event) => {
    setTimeout(() => {
        const newVal = event.target.value;
        if (props.type === 'number') {
            emit('update:modelValue', utils.convert.formatToNumber(newVal));
        }
        else {
            emit('update:modelValue', newVal);
        }
    }, 0);
};

// Handle cut event: wait for browser to apply cut then update v-model
const onCut = (event) => {
    setTimeout(() => {
        const newVal = event.target.value;
        if (props.type === 'number') {
            emit('update:modelValue', utils.convert.formatToNumber(newVal));
        }
        else {
            emit('update:modelValue', newVal);
        }
    }, 0);
};
const togglePopup = () => {
    if (!showCalendarButton.value) return;

    showPopup.value = !showPopup.value;
    if (showPopup.value) {
        initializeCalendar();
    }
};

const initializeCalendar = () => {
    if (props.type === 'date') {
        viewMode.value = 'date';
    } else if (props.type === 'month') {
        viewMode.value = 'month';
    } else if (props.type === 'year') {
        viewMode.value = 'year';
    }

    if (inputValue.value) {
        const parts = inputValue.value.split('/');
        if (props.type === 'date' && parts.length === 3) {
            currentDate.value = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (props.type === 'month' && parts.length === 2) {
            currentDate.value = new Date(parts[1], parts[0] - 1, 1);
        } else if (props.type === 'year' && parts.length === 1) {
            currentDate.value = new Date(parts[0], 0, 1);
        }
    }
};
const selectDate = (day) => {
    if (props.type === 'date') {
        const dateStr = `${day.date.toString().padStart(2, '0')}/${(day.month + 1).toString().padStart(2, '0')}/${day.year}`;
        inputValue.value = dateStr;
        emit('update:modelValue', dateStr);
        showPopup.value = false;
    }
};
const selectMonth = (monthIndex) => {
    if (props.type === 'month') {
        const dateStr = `${(monthIndex + 1).toString().padStart(2, '0')}/${currentDate.value.getFullYear()}`;
        inputValue.value = dateStr;
        emit('update:modelValue', dateStr);
        showPopup.value = false;
    } else if (props.type === 'date') {
        currentDate.value.setMonth(monthIndex);
        currentDate.value = new Date(currentDate.value);
        viewMode.value = 'date';
    }
};
const selectYear = (year) => {
    if (props.type === 'year') {
        inputValue.value = year.toString();
        emit('update:modelValue', year);
        showPopup.value = false;
    } else {
        currentDate.value.setFullYear(year);
        currentDate.value = new Date(currentDate.value);
        if (props.type === 'month') {
            viewMode.value = 'month';
        } else {
            viewMode.value = 'date';
        }
    }
};
const previousMonth = () => {
    currentDate.value.setMonth(currentDate.value.getMonth() - 1);
    currentDate.value = new Date(currentDate.value);
};
const nextMonth = () => {
    currentDate.value.setMonth(currentDate.value.getMonth() + 1);
    currentDate.value = new Date(currentDate.value);
};
const previousYear = () => {
    currentDate.value.setFullYear(currentDate.value.getFullYear() - 1);
    currentDate.value = new Date(currentDate.value);
};
const nextYear = () => {
    currentDate.value.setFullYear(currentDate.value.getFullYear() + 1);
    currentDate.value = new Date(currentDate.value);
};
const isSelectedDate = (day) => {
    if (!inputValue.value) return false;
    const parts = inputValue.value.split('/');
    if (parts.length === 3) {
        return day.date == parts[0] &&
            day.month == parts[1] - 1 &&
            day.year == parts[2];
    }
    return false;
};
const isSelectedMonth = (monthIndex) => {
    if (!inputValue.value) return false;
    const parts = inputValue.value.split('/');
    if (props.type === 'month' && parts.length === 2) {
        return monthIndex == parts[0] - 1 &&
            currentDate.value.getFullYear() == parts[1];
    }
    return false;
};
const isSelectedYear = (year) => {
    if (!inputValue.value) return false;
    if (props.type === 'year') {
        return year == inputValue.value;
    }
    return false;
};
const handleClickOutside = (event) => {
    if (inputRef.value && !inputRef.value.contains(event.target)) {
        showPopup.value = false;
    }
};
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

</script>

<template>
    <div class="datetime-input-container" ref="inputRef">
        <div class="input-group">
            <input :type="inputType" :class="cssClass" :value="inputValue" :disabled="disabled"
                :placeholder="placeholder" :required="required" @keydown="onKeydown" @paste="onPaste" @cut="onCut"
                autocomplete="off">
            <button v-if="showCalendarButton" class="btn btn-sm btn-outline-success" type="button" @click="togglePopup">
                <i class="fas fa-calendar-alt"></i>
            </button>
        </div>
        <div v-if="showPopup && showCalendarButton" class="datetime-popup">
            <!-- Date View -->
            <div v-if="viewMode === 'date'">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <button class="btn btn-sm btn-outline-success" @click="previousMonth">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h6 class="mb-0">{{ months[currentDate.getMonth()] }} {{ currentDate.getFullYear() }}</h6>
                    <button class="btn btn-sm btn-outline-success" @click="nextMonth">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <div class="calendar-grid">
                    <div class="calendar-cell calendar-header">CN</div>
                    <div class="calendar-cell calendar-header">T2</div>
                    <div class="calendar-cell calendar-header">T3</div>
                    <div class="calendar-cell calendar-header">T4</div>
                    <div class="calendar-cell calendar-header">T5</div>
                    <div class="calendar-cell calendar-header">T6</div>
                    <div class="calendar-cell calendar-header">T7</div>

                    <div v-for="day in calendarDays" :key="day.fullDate.getTime()" class="calendar-cell" :class="{
                        'other-month': !day.isCurrentMonth,
                        'selected': isSelectedDate(day)
                    }" @click="selectDate(day)">
                        {{ day.date }}
                    </div>
                </div>
            </div>

            <!-- Month View -->
            <div v-if="viewMode === 'month'">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <button class="btn btn-sm btn-outline-secondary" @click="previousYear">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h6 class="mb-0">{{ currentDate.getFullYear() }}</h6>
                    <button class="btn btn-sm btn-outline-secondary" @click="nextYear">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <div class="month-year-grid">
                    <div v-for="(month, index) in months" :key="index" class="month-year-cell"
                        :class="{ 'selected': isSelectedMonth(index) }" @click="selectMonth(index)">
                        {{ month }}
                    </div>
                </div>
            </div>

            <!-- Year View -->
            <div v-if="viewMode === 'year'">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <button class="btn btn-sm btn-outline-secondary"
                        @click="currentDate.setFullYear(currentDate.getFullYear() - 20); currentDate = new Date(currentDate)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h6 class="mb-0">{{ years[0] }} - {{ years[years.length - 1] }}</h6>
                    <button class="btn btn-sm btn-outline-secondary"
                        @click="currentDate.setFullYear(currentDate.getFullYear() + 20); currentDate = new Date(currentDate)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <div class="year-grid">
                    <div v-for="year in years" :key="year" class="month-year-cell"
                        :class="{ 'selected': isSelectedYear(year) }" @click="selectYear(year)">
                        {{ year }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
