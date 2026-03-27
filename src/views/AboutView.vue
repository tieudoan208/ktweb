<template>
  <b-card bg-variant="light" header="Danh mục kho hàng hoá">
    <b-row>
      <div class="col-lg-2 col-md-4 col-sm-4 pl-1 mt-1">
        <label class="font-weight-normal">Tên</label><label style="color:red">*</label>
      </div>
      <div class="col-lg-10 col-md-8 col-sm-12" style="padding-bottom:6px;">
        <TextInput type="date"></TextInput>
      </div>
    </b-row>
    <b-row>
      <b-col cols="12">
        <grid id="gridKho" :data="dataSource" height="600px" ref="gridKho" v-on:on-cell-click="gridKhoCellClick">
          <columns>
            <column field="Ten" name="Tên kho hàng hoá" width="300" filter="select"></column>
            <column field="Chon" name="Thao tác" width="90" :type="typeCustom"></column>
          </columns>
        </grid>
      </b-col>
    </b-row>
  </b-card>
</template>

<script setup>
import { BCard, BRow, BCol, BButton } from 'bootstrap-vue-next';
import TextInput from '@/components/TextInput.vue';
import columns from '@/components/Columns.vue';
import column from '@/components/Column.vue';
import grid from '@/components/Grid.vue'; 
import { ref } from 'vue';

const dataSource = ref([]);

for (var i = 0; i < 100; i++) {
  dataSource.value.push({ Ten: 'Tên ' + i, Chon: '' });
}

</script>
