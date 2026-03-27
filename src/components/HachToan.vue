<template> 
    <!-- Grid hạch toán -->
    <grid
      :id="id"
      :data="dataSource"
      height="500px"
      ref="gridHachToan"
      v-on:on-cell-click="gridHachToanCellClick">
      <columns>
        <column field="tk_no" name="TK Nợ" width="180" editor="select2" :dataSource="dsTaiKhoan"
          filter="text"></column>
        <column field="tk_co" name="TK Có" width="180" editor="select2" :dataSource="dsTaiKhoan"
          filter="text"></column>
        <column field="tke_no" name="Mã thống kê nợ" width="180" editor="select2" :dataSource="dsMaThongKe"
          filter="text"></column>
        <column field="tke_co" name="Mã thống kê có" width="180" editor="select2" :dataSource="dsMaThongKe"
          filter="text"></column>
        <column field="tien" name="Tiền" width="180" filter="text" editor="text" type="money" :dec="0"></column>
        <column field="noi_dung" name="Nội dung" width="250" filter="text" editor="text"></column>
        <column field="Chon" name="..." width="90" :type="typeHachToan"></column>
      </columns>
    </grid> 
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'; 
import columns from '@/components/Columns.vue';
import column from '@/components/Column.vue';
import grid from '@/components/Grid.vue';
import DraggableModal from '@/components/DraggableModal.vue';
import Select2 from '@/components/Select2.vue';
import TextInput from '@/components/TextInput.vue';
import useJwt from '@/core/useJwt';
import { danhMuc } from '@/core/api';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  id: ""
});

const emit = defineEmits(['update:data']);

const gridHachToan = ref(null);
const dsTaiKhoan = ref([]);
const dsMaThongKe = ref([]);
const dsDoiTuong = ref([]);
const dataSource = ref([]);

// State cho modal 
const formData = ref({
  tk_no: '',
  tk_co: '',
  tke_no: '',
  tke_co: '',
  tien: 0,
  noi_dung: ''
});

const typeHachToan = reactive({
  type: "button",
  list: [ 
    { class: "danger", icon: "fa fa-remove", action: "delete" }
  ]
});

watch(
    () => [props.data, props.data?.length],
    ([val, length]) => {
        dataSource.value = Array.isArray(val) ? val : []; 
    },
    { deep: false }
);

onMounted(async () => {
  
});
 

</script>