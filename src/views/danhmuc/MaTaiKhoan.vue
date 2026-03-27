<template>
    <b-card bg-variant="light" header="Danh mục mã tài khoản">
        <b-row>
            <div class="col-lg-1 col-md-3 col-sm-12 pl-1 mt-1">
                <label class="font-weight-normal">Bộ mã</label><label style="color:red">*</label>
            </div>
            <div class="col-lg-4 col-md-6 col-sm-12 mt-1">
                <BFormSelect v-model="chonBoMa" :options="dsBoMaTK" size="sm" text-field="Ten" value-field="Id"
                    @change="loadMatk" />
            </div>
            <div class="col-lg-7 col-md-3 col-sm-12 mt-1">
                <BButton variant="success" size="sm" @click="themBoMa">
                    <i class="fas fa-plus"></i>
                    Thêm bộ mã TK
                </BButton>
                <BButton variant="success" size="sm" class="ms-1" @click="themMaTK">
                    <i class="fa-solid fa-people-group"></i>
                    Thêm tài khoản
                </BButton>
                <BButton variant="info" size="sm" class="ms-1" @click="moTatCaNode">
                    <i class="fa fa-angle-down"></i>
                    Mở tất cả
                </BButton>
                <BButton variant="secondary" size="sm" class="ms-1" @click="dongTatCaNode">
                    <i class="fa fa-angle-right"></i>
                    Đóng tất cả
                </BButton>
            </div>
        </b-row>
        <b-row>
            <b-col cols=" 12" class="mt-2">
                <grid id="gridMaTK" :data="dataSource" height="600px" ref="gridMaTK"
                    v-on:on-cell-click="gridMaTKCellClick" :treeView="true" key="Ma"
                     :treeIndentWidth="20">
                    <columns>
                        <column field="Ma" name="Mã tài khoản" width="120" filter="text"></column>
                        <column field="Ten" name="Tên tài khoản" width="300" filter="text"></column>
                        <column field="MaCapTren" name="Mã cấp trên" width="150" filter="select"></column>
                        <column field="TrangThai" name="Trạng thái" width="100" filter="none" :type="typeTrangThai">
                        </column>
                        <column field="Chon" name="Thao tác" width="90" :type="typeTaiKhoan"></column>
                    </columns>
                </grid>
            </b-col>
        </b-row>
    </b-card>
</template>
<script setup>
import { BCard, BRow, BCol, BButton, BModal, BFormSelect, BFormCheckbox } from 'bootstrap-vue-next';
import TextInput from '@/components/TextInput.vue';
import Select2 from '@/components/Select2.vue';
import columns from '@/components/Columns.vue';
import column from '@/components/Column.vue';
import grid from '@/components/Grid.vue';
import { ref, reactive, onMounted } from 'vue';
import { demoDataSource } from '../../core/demo';


const showDialogMaTK = ref(false)
const dataSource = ref([]);
const dsBoMaTK = ref([])
const chonBoMa = ref("")
const showDialog = ref(false);
const duLieuMaTK = ref({})
const dsMaTK = ref({}) 
const gridBoMa = ref(null);
const duLieuBoMa = ref({})
const typeTrangThai = reactive({
  type: "status",
  list: [{
    class: "danger",
    title: "Không sử dụng",
    action: 0
  },
  {
    class: "success",
    title: "Đang sử dụng",
    action: 1
  }]
});
const typeTaiKhoan = reactive({
  type: "button",
  list: [
    {
      class: "primary",
      icon: "fa fa-edit",
      action: "edit"
    },
    {
      class: "danger",
      icon: "fa fa-remove",
      action: "delete"
    }
  ]
});

// Dữ liệu demo bộ mã tài khoản
const demoBoMaTK = [
  { Id: '1', Ten: 'Thông Tư 99' }
]

// Dữ liệu demo mã tài khoản theo cấu trúc cây
 

onMounted(() => {
  // Load dữ liệu demo
  dsBoMaTK.value = demoBoMaTK
  chonBoMa.value = '1'
  loadMatk()
})

const loadMatk = () => {
  // Load dữ liệu mã tài khoản demo
  // Chuyển đổi dữ liệu để phù hợp với tree view
    const treeData = demoDataSource.map(item => ({
      ...item,
      id: item.Ma, // Sử dụng Ma làm id
      parent: item.MaCapTren || null // Sử dụng MaCapTren làm parent, null nếu không có
    }));

    dataSource.value = treeData; 
}

const themBoMa = () => {
  console.log('Thêm bộ mã TK')
  // TODO: Implement thêm bộ mã
}

const themMaTK = () => {
  console.log('Thêm tài khoản')
  // TODO: Implement thêm tài khoản
}

const gridMaTKCellClick = (_e, args) => {
  console.log('Cell clicked:', args)
  if (args.action === 'edit') {
    console.log('Edit row:', args.row)
    // TODO: Implement edit
  } else if (args.action === 'delete') {
    console.log('Delete row:', args.row)
    // TODO: Implement delete
  }
}

const moTatCaNode = () => {
  // Sử dụng phương thức expandAll từ Grid component
  if (gridMaTK.value) {
    gridMaTK.value.expandAll()
  }
}

const dongTatCaNode = () => {
  // Sử dụng phương thức collapseAll từ Grid component
  if (gridMaTK.value) {
    gridMaTK.value.collapseAll()
  }
}

</script>