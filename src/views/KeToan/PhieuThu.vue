<template>
    <b-card bg-variant="light" header="Nhập chứng từ kế toán tổng hợp">
        <b-row>
            <div class="col-lg-1 col-md-2 col-sm-12 mt-1">
                <label class="font-weight-normal">Từ ngày</label>
            </div>
            <div class="col-lg-2 col-md-3 col-sm-12 mt-1">
                <TextInput v-model="ngayD" type="date" placeholder="Từ ngày"></TextInput>
            </div>
            <div class="col-lg-1 col-md-2 col-sm-12 mt-1">
                <label class="font-weight-normal">Đến ngày</label>
            </div>
            <div class="col-lg-2 col-md-3 col-sm-12 mt-1">
                <TextInput v-model="ngayC" type="date" placeholder="Đến ngày"></TextInput>
            </div>
            <div class="col-lg-4 col-md-4 col-sm-12 mt-1">
                <BButton variant="success" size="sm" v-on:click="timKiem">
                    <i class="fas fa-search"></i>
                    Tìm kiếm
                </BButton>
                <BButton variant="success" size="sm" class="ms-2" v-on:click="themChungTu">
                    <i class="fas fa-plus"></i>
                    Thêm chứng từ
                </BButton>
            </div>
        </b-row>
        <b-row>
            <b-col cols="12" class="mt-2">
                <grid id="gridChungTu" :data="dataSource" height="600px" ref="gridChungTu"
                    v-on:on-cell-click="gridChungTuCellClick">
                    <columns>
                        <column field="NgayHT" name="Ngày hạch toán" width="120" filter="text"></column>
                        <column field="SoCT" name="Số chứng từ" width="120" filter="text"></column>
                        <column field="Tien" name="Tiền" width="180" filter="text"></column>
                        <column field="NoiDung" name="Nội dung" width="350" filter="text"></column>
                        <column field="TrangThai" name="Trạng thái" width="120" :type="typeTrangThai"></column>
                        <column field="Chon" name="Thao tác" width="90" :type="typeCustom"></column>
                    </columns>
                </grid>
            </b-col>
        </b-row>
    </b-card>
    <DraggableModal @close="showDialog = false" title="Thông tin chứng từ" :show="showDialog" size="xl">
        <template #body>
            <b-container fluid>
                <BRow>
                    <div class="col-xl-1 col-lg-2 col-md-4 col-sm-12 mt-1">
                        <label class="font-weight-normal">Ngày HT</label>
                    </div>
                    <div class="col-xl-2 col-lg-4 col-md-8 col-sm-12 mt-1">
                        <TextInput v-model="duLieuNhap.NgayHT" type="date"></TextInput>
                    </div>
                    <div class="col-xl-1 col-lg-2 col-md-4 col-sm-12 mt-1">
                        <label class="font-weight-normal">Ngày CT</label>
                    </div>
                    <div class="col-xl-2 col-lg-4 col-md-8 col-sm-12 mt-1">
                        <TextInput v-model="duLieuNhap.NgayCT" type="date"></TextInput>
                    </div>
                    <BCol xl="1" sm="12" md="4" lg="2" class="mt-1">
                        <label class="font-weight-normal">Trạng thái</label>
                    </BCol>
                    <BCol sm="12" md="8" lg="4" xl="2" class="mt-1">
                        <BFormSelect v-model="duLieuNhap.TrangThai" :options="dsTrangThaiCT" size="sm" text-field="Ten"
                            value-field="Id">
                        </BFormSelect>
                    </BCol>
                </BRow>
                <BRow>
                    <BCol xl="1" sm="12" md="4" lg="2" class="mt-1">
                        <label class="font-weight-normal">L.Chứng từ</label>
                    </BCol>
                    <BCol sm="12" md="8" lg="10" xl="5" class="mt-1">
                        <Select2 v-model="duLieuNhap.LoaiChungTu" :data="dsLoaiChungTu" placeholder="Chọn loại CT"
                            text-field="Ten" value-field="Ma"></Select2>
                    </BCol>
                    <BCol xl="1" sm="12" md="4" lg="2" class="mt-1">
                        <label class="font-weight-normal">Số CT</label>
                    </BCol>
                    <BCol sm="12" md="8" lg="4" xl="2" class="mt-1">
                        <TextInput v-model="duLieuNhap.SoChungTu" placeholder="Số chứng từ"></TextInput>
                    </BCol>
                    <BCol xl="1" sm="12" md="4" lg="2" class="mt-1">
                        <label class="font-weight-normal">Số CTGS</label>
                    </BCol>
                    <BCol sm="12" md="8" lg="4" xl="2" class="mt-1">
                        <TextInput v-model="duLieuNhap.SoChungTuGS" placeholder="Số chứng từ ghi sổ"></TextInput>
                    </BCol>
                </BRow>
                <BRow>
                    <BCol xl="1" sm="12" md="4" lg="2" class="mt-1">
                        <label class="font-weight-normal">Nội dung</label>
                    </BCol>
                    <div class="col-lg-10 col-md-9 col-sm-12 col-xl-11 mt-1">
                        <TextInput v-model="duLieuNhap.NoiDung" placeholder="Nội dung chứng từ"></TextInput>
                    </div>
                </BRow>
                <!-- Tabs -->
                <BRow class="mt-3">
                    <BCol cols="12">
                        <BTabs content-class="mt-2">
                            <BTab title="Thông tin hạch toán" active>
                                <HachToan v-model:data="dataSourceHachToan" />
                            </BTab>
                            <BTab title="Thông tin thuế">
                                <p class="p-3">Thông tin thuế sẽ được cập nhật sau...</p>
                            </BTab>
                        </BTabs>
                    </BCol>
                </BRow>
            </b-container>
        </template>
        <template #footer>
            <b-button variant="success" size="sm" class="me-1" v-on:click="luuLaiThongTin">
                <i class="fa fa-save" aria-hidden="true"></i>
                Lưu lại
            </b-button>
        </template>
    </DraggableModal>

</template>

<script setup>
import { BCard, BRow, BCol, BButton, BModal, BTabs, BTab, BFormSelect } from 'bootstrap-vue-next';
import TextInput from '@/components/TextInput.vue';
import DraggableModal from '../../components/DraggableModal.vue';
import Select2 from '@/components/Select2.vue';
import columns from '@/components/Columns.vue';
import column from '@/components/Column.vue';
import grid from '@/components/Grid.vue';
import HachToan from '@/components/HachToan.vue';
import { ref, reactive, onMounted } from 'vue';
import useJwt from '@/core/useJwt'
import { demoPhieuThu } from '../../core/demo';


// Form filters
const ngayD = ref('01/01/2026')
const ngayC = ref('31/12/2026')
const duLieuNhap = ref({})
const showDialog = ref(false)
// Grid data
const dataSource = ref([])
const dataSourceHachToan = ref([])

// Danh sách loại chứng từ
const dsLoaiChungTu = ref([
    { Ma: 'PT', Ten: 'Phiếu thu' },
    { Ma: 'PC', Ten: 'Phiếu chi' },
    { Ma: 'PK', Ten: 'Phiếu kế toán' }
])

// Danh sách trạng thái chứng từ
const dsTrangThaiCT = ref([
    { Id: 0, Ten: 'Không sử dụng' },
    { Id: 1, Ten: 'Đang sử dụng' }
])

// Trạng thái (hiển thị badge)
const typeTrangThai = reactive({
    type: 'status',
    list: [
        { class: 'danger', title: 'Không sử dụng', action: 0 },
        { class: 'success', title: 'Đang sử dụng', action: 1 }
    ]
})

// Các nút thao tác trên hàng
const typeCustom = reactive({
    type: 'button',
    list: [
        { class: 'primary', icon: 'fa fa-edit', action: 'edit' },
        { class: 'danger', icon: 'fa fa-remove', action: 'delete' }
    ]
})

onMounted(async () => {
    // Load dữ liệu demo ban đầu
    dataSource.value = demoPhieuThu;

})

const timKiem = async () => {
    const from = ngayD.value ? "01/01/2026" : null
    const to = ngayC.value ? "31/01/2026" : null
    dataSource.value = demoPhieuThu
        .filter(r => {
            const d = new Date(r.NgayHT)
            if (from && d < from) return false
            if (to && d > to) return false
            return true
        })
        .map((r, i) => ({ ...r, id: i }))
}

const themChungTu = () => {
    const today = new Date();
    const day = ("0" + today.getDate()).slice(-2);
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const currentDate = day + "/" + month + "/" + today.getFullYear();

    duLieuNhap.value = {
        NgayHT: currentDate,
        NgayCT: currentDate,
        LoaiChungTu: '',
        SoChungTu: '',
        TrangThai: 1,
        NoiDung: ''
    }
    dataSourceHachToan.value = []
    showDialog.value = true;
}

const gridChungTuCellClick = (_e, args) => {
    if (!args) return
    if (args.action === 'edit') {
        // placeholder
        console.log('Edit:', args.row)
    } else if (args.action === 'delete') {
        const idx = dataSource.value.findIndex(x => x.id === args.row.id)
        if (idx >= 0) dataSource.value.splice(idx, 1)
    }
}

const luuLaiThongTin = () => {
    console.log('Lưu thông tin:', duLieuNhap.value)
    console.log('Hạch toán:', dataSourceHachToan.value)
    // TODO: Implement save logic
    showDialog.value = false
}

</script>