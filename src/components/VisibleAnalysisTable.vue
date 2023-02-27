<template>
  <div>
    <el-button type="primary" @click="showVisibleAnalysis">通视分析</el-button>
    <dialog-drag v-show="isShowVisibleAnalysis" id="dialog-1" class="dialog-3" title="通视分析" pinned="false"
      :options="{ top: 80, left: 1500, width: 400, buttonPin: false }" @close="closeVisibleAnalysis">
      <div class="analysisBox">
        <el-table :data="fengjivillageInfo" height="80vh" :cell-style="tableRowStyle"
          :header-cell-style="tableHeaderColor" class="analysis-result-list" @row-dblclick="highLightLine">
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
      timeBox: []
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
            order: i * villageInfo.length + i + j
          })
        }
      }


      for (let i = 0; i < fengjiInfo.length; i++) {
        for (let j = 0; j < villageInfo.length; j++) {
          let timer = setTimeout(() => {
            this.$emit("startVisibleAnalysis", this.fengjivillageInfo[i * villageInfo.length + i + j])
          }, (i * villageInfo.length + i + j + 1) * 500);
          this.timeBox.push(timer)
        }
      }
      // this.$emit("startVisibleAnalysis")
    },


    closeVisibleAnalysis() {
      this.$emit("clearBarrier")
      this.isShowVisibleAnalysis = false
      this.timeBox.map(k => { clearTimeout(k) })
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
    }

  },
  watch: {
    isBarrier: {
      handler(newValue, oldValue) {
        this.fengjivillageInfo[newValue.order].canViewer = (newValue.barrier.isViewer == true ? "是" : "否")
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
  background-color: transparent;
  color: #eee;
}

/*最外层透明*/
.el-table,
.el-table__expanded-cell {
  background-color: transparent;
}

/* 表格内背景颜色 */
.el-table tr,
.el-table td {
  background-color: #eeeeee60 !important;
}

.el-table__body {
  width: 100% !important;
}
</style>