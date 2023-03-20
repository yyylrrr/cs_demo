<template>
  <div>
    <el-button type="primary" class="roadVisibleButton" @click="showVisibleAnalysis">道路通视</el-button>
    <dialog-drag v-show="isShowVisibleAnalysis" id="dialog-1" class="dialog-3" title="通视分析" pinned="false"
      :options="{ top: 80, left: 1500, width: 400, buttonPin: false }" @close="closeVisibleAnalysis">
      <div class="analysisBox">
        <el-input v-model="roadChunkLength" size="medium" class="roadVisibleLength" placeholder="请输入判断距离（千米）"></el-input>
        <el-table :data="fengjiroadInfo" :cell-style="tableRowStyle" :header-cell-style="tableHeaderColor"
          @row-dblclick="roadVisible">
          <el-table-column prop="fengji" label="风机名" align="center">
          </el-table-column>
          <el-table-column prop="road" label="道路名" align="center">
          </el-table-column>
          <el-table-column prop="canViewer" label="是否可视" align="center">
          </el-table-column>
        </el-table>
      </div>
    </dialog-drag>
  </div>
</template>

<script>
import DialogDrag from "vue-dialog-drag";

import fengjijson from "../../public/data/风机.json"
import roadjson from "../../public/data/公路.json"

import * as turf from '@turf/turf'

export default {
  components: {
    DialogDrag,
  },
  props: {
    isRoadBarrier: {
      Object,
      required: true
    },
  },
  data() {
    return {
      isShowVisibleAnalysis: false,
      fengjiroadInfo: [],
      timeBox: [],
      roadChunkLength: ''
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

    getRoadInfo() {
      let roadInfo = []
      for (let i = 0; i < roadjson.features.length; i++) {
        roadInfo.push({
          name: roadjson.features[i].properties.NAME,
          position: []
        });
        // for (let j = 0; j < roadjson.features[i].geometry.coordinates.length; j++) {
        //   // roadInfo[i].position = roadInfo[i].position.concat(roadjson.features[i].geometry.coordinates[j])
        //   let line = turf.lineString(roadjson.features[i].geometry.coordinates[j])
        //   let chunk = turf.lineChunk(line, this.roadChunkLength, { units: 'kilometers' });
        //   for (let k = 0; k < chunk.features.length; k++) {
        //     if (k == 0) {
        //       roadInfo[i].position.push(chunk.features[k].geometry.coordinates[0], chunk.features[k].geometry.coordinates[1])
        //     } else {
        //       roadInfo[i].position.push(chunk.features[k].geometry.coordinates[1])
        //     }
        //   }
        // }
      }
      return roadInfo
    },

    async showVisibleAnalysis() {
      this.isShowVisibleAnalysis = !this.isShowVisibleAnalysis
      this.fengjiroadInfo = []
      let fengjiInfo = await this.getFengjiInfo()
      let roadInfo = await this.getRoadInfo()
      for (let i = 0; i < fengjiInfo.length; i++) {
        for (let j = 0; j < roadInfo.length; j++) {
          this.fengjiroadInfo.push({
            fengji: fengjiInfo[i].name,
            fengjiXYZ: [fengjiInfo[i].lon, fengjiInfo[i].lat],
            road: roadInfo[j].name,
            roadXYZ: roadInfo[j].position,
            canViewer: "待计算",
            order: i * (roadInfo.length - 1) + i + j
          })
        }
      }
    },

    roadVisible(row) {
      row.roadXYZ = []
      if (this.roadChunkLength == '') {
        this.$message({
          message: '请输入判断距离！',
          type: 'warning'
        })
      } else {
        row.canViewer = "计算中..."
        for (let i = 0; i < roadjson.features.length; i++) {
          if (roadjson.features[i].properties.NAME == row.road) {
            for (let j = 0; j < roadjson.features[i].geometry.coordinates.length; j++) {
              // roadInfo[i].position = roadInfo[i].position.concat(roadjson.features[i].geometry.coordinates[j])
              let line = turf.lineString(roadjson.features[i].geometry.coordinates[j])
              let chunk = turf.lineChunk(line, this.roadChunkLength, { units: 'kilometers' });
              for (let k = 0; k < chunk.features.length; k++) {
                if (k == 0) {
                  row.roadXYZ.push(chunk.features[k].geometry.coordinates[0], chunk.features[k].geometry.coordinates[1])
                } else {
                  row.roadXYZ.push(chunk.features[k].geometry.coordinates[1])
                }
              }
            }
          }
        }
        this.$emit("startRoadsVisibleAnalysis", row)
      }
    },

    closeVisibleAnalysis() {
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
  },
  watch: {
    isRoadBarrier: {
      handler(newValue, oldValue) {
        this.fengjiroadInfo[newValue.order].canViewer = (newValue.barrier > 0 ? "是" : "否")
      },
    }
  }
};
</script>

<style src="vue-dialog-drag/dist/vue-dialog-drag.css"></style>
<style src="vue-dialog-drag/dist/dialog-styles.css"></style>

<style scoped>
.roadVisibleButton {
  margin-top: 5px;
}

.dialog-3 {
  background: #1e90ff60;
}

.analysisBox {
  border: 1px solid #eee;
  height: 80vh;
}

.roadVisibleLength {
  margin: 5px 0;
  width: 96%;
  margin-left: 2%;
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

.roadVisibleLength .el-input__inner {
  background: transparent !important;
  color: #000 !important;
  border: 1px solid #eee !important;
}
</style>