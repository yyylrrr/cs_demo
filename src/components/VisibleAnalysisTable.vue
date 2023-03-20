<template>
  <div>
    <el-button type="primary" @click="showVisibleAnalysis">通视分析</el-button>
    <el-button type="primary" @click="exportToExcel"> 导出结果 </el-button>
    <dialog-drag v-show="isShowVisibleAnalysis" id="dialog-1" class="dialog-3" title="通视分析" pinned="false"
      :options="{ top: 80, left: 1500, width: 400, buttonPin: false }" @close="closeVisibleAnalysis">
      <div class="analysisBox">
        <el-table :summary-method="getSummaries" show-summary :data="fengjivillageInfo" height="80vh"
          :cell-style="tableRowStyle" :header-cell-style="tableHeaderColor" class="analysis-result-list"
          @row-dblclick="highLightLine">
          <el-table-column prop="fengji" label="风机名" align="center">
          </el-table-column>
          <el-table-column prop="village" label="村落名" align="center">
          </el-table-column>
          <el-table-column prop="canViewer" label="是否通视" align="center">
          </el-table-column>
        </el-table>
      </div>
    </dialog-drag>
  </div>
</template>

<script>
import DialogDrag from "vue-dialog-drag";

import FileSaver from 'file-saver'
import XLSX from 'xlsx'

import fengjijson from "../../public/data/风机.json"
import villagejson from "../../public/data/村落.json"

export default {
  components: {
    DialogDrag,
  },
  props: {
    isBarrier: {
      Object,
      required: true
    },
  },
  data() {
    return {
      fengjivillageInfo: [],
      isShowVisibleAnalysis: false,
      timeBox: [],
      visibleCount: 0,
      inVisibleCount: 0
    };
  },
  methods: {
    getFengjiInfo() {
      let fengjiInfo = []
      for (let i = 0; i < fengjijson.features.length; i++) {
        fengjiInfo.push({
          name: fengjijson.features[i].properties.NAME,
          lon: fengjijson.features[i].geometry.coordinates[0],
          lat: fengjijson.features[i].geometry.coordinates[1],
        });
      }
      return fengjiInfo
    },

    getVillageInfo() {
      let villageInfo = []
      for (let i = 0; i < villagejson.features.length; i++) {
        villageInfo.push({
          name: villagejson.features[i].properties.NAME,
          lon: villagejson.features[i].geometry.coordinates[0],
          lat: villagejson.features[i].geometry.coordinates[1],
        });
      }
      return villageInfo
    },

    async showVisibleAnalysis() {
      this.isShowVisibleAnalysis = !this.isShowVisibleAnalysis
      this.fengjivillageInfo = []
      let fengjiInfo = await this.getFengjiInfo()
      let villageInfo = await this.getVillageInfo()
      for (let i = 0; i < fengjiInfo.length; i++) {
        for (let j = 0; j < villageInfo.length; j++) {
          this.fengjivillageInfo.push({
            fengji: fengjiInfo[i].name,
            fengjiXYZ: [fengjiInfo[i].lon, fengjiInfo[i].lat],
            village: villageInfo[j].name,
            villageXYZ: [villageInfo[j].lon, villageInfo[j].lat],
            canViewer: "待计算",
            order: i * (villageInfo.length - 1) + i + j
          })
        }
      }


      for (let i = 0; i < this.fengjivillageInfo.length; i++) {
        let timer = setTimeout(() => {
          this.$emit("startVisibleAnalysis", this.fengjivillageInfo[i])
        }, (i + 1) * 480);
        this.timeBox.push(timer)
      }
    },

    closeVisibleAnalysis() {
      this.visibleCount = 0;
      this.inVisibleCount = 0;
      this.isShowVisibleAnalysis = false
      this.timeBox.map(k => { clearTimeout(k) })
      this.$emit("clearBarrier")
    },

    // 修改table tr行的背景色
    tableRowStyle({ row, rowIndex }) {
      return "background-color: rgba(255,255,255,0.29); color: #000;font-size: 15px;border: 1px solid #1E90FF60;";
    },
    // 修改table header的背景色
    tableHeaderColor({ row, column, rowIndex, columnIndex }) {
      if (rowIndex === 0) {
        return " background-color:rgba(129,211,248,0.23); color: #000;font-weight: 20px;border: 1px solid #1E90FF60;";
      }
    },
    highLightLine(row) {
      this.timeBox.map(k => { clearTimeout(k) })
      this.$emit("highLightLine", row)
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        } else if (index === 1) {
          sums[index] = '可视：' + this.visibleCount;
          return;
        } else {
          sums[index] = '不可视：' + this.inVisibleCount;
          return;
        }
      });

      return sums;
    },

    // 表格数据写入excel，并导出为Excel文件
    exportToExcel() {
      const XLSX = require('xlsx')
      console.log('XLSX', XLSX, FileSaver)
      // 使用 this.$nextTick 是在dom元素都渲染完成之后再执行
      this.$nextTick(function () {
        // 设置导出的内容是否只做解析，不进行格式转换     false：要解析， true:不解析
        const xlsxParam = { raw: true }
        const wb = XLSX.utils.table_to_book(document.querySelector('.analysis-result-list'), xlsxParam)
        // 导出excel文件名
        let fileName = '通视分析' + new Date().getTime() + '.xlsx'

        const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array' })
        try {
          // 下载保存文件
          FileSaver.saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName)
        } catch (e) {
          if (typeof console !== 'undefined') {
            console.log(e, wbout)
          }
        }
        return wbout
      })
    },

  },
  watch: {
    isBarrier: {
      handler(newValue, oldValue) {
        this.fengjivillageInfo[newValue.order].canViewer = (newValue.barrier.isViewer == true ? "是" : "否")
        newValue.barrier.isViewer == true ? this.visibleCount++ : this.inVisibleCount++
      },
    }
  }
};
</script>

<style src="vue-dialog-drag/dist/vue-dialog-drag.css"></style>
<style src="vue-dialog-drag/dist/dialog-styles.css"></style>

<style scoped>
.dialog-3 {
  background: #1e90ff60;
}

.analysisBox {
  border: 1px solid #eee;
  height: 80vh;
}

.analysis-result-list {
  width: 100%;
  height: 100%;
  background-color: transparent;
  border: 1px solid #1e90ff60;
  font-size: 2px;
}
</style>

<style>
.dialog-3.dialog-drag .dialog-header {
  background-color: transparent !important;
  color: #eee !important;
}

/*最外层透明*/
.el-table,
.el-table__expanded-cell {
  background-color: transparent !important;
}

/* 表格内背景颜色 */
.el-table tr,
.el-table td {
  background-color: #eeeeee60 !important;
}

.el-table__body {
  width: 100% !important;
}

.el-table__footer-wrapper tbody td.el-table__cell,
.el-table__header-wrapper tbody td.el-table__cell {
  color: #000 !important;
  font-size: 16px !important;
}
</style>