<template>
  <div>
    <el-button type="primary" class="overlapButton" @click="setOverlapAnalysis">冲突分析</el-button>
    <dialog-drag v-show="isOverlapCondition" id="dialog-1" class="dialog-3 condition" title="冲突分析"
      :options="{ top: 80, left: 80, width: 320, buttonPin: false, pinned: true }" @close="closeOverlapAnalysis">
      <el-select v-model="overlapTestData" class="select1" multiple placeholder="请选择检测数据" value-key="id"
        :popper-append-to-body="false">
        <el-option v-for="item in overlapTestPoint" :key="item.id" :label="item.name" :value="item" />
      </el-select>
      <el-select v-model="overlapOtherData" class="select1" multiple placeholder="请选择被检测数据" value-key="id"
        :popper-append-to-body="false">
        <el-option v-for="item in overlapOtherPoint" :key="item.id" :label="item.name" :value="item" />
      </el-select>
      <el-input size="medium" class="overlapConditionInput" v-model="inputRadius" autosize placeholder="请设置缓冲半径（千米）" />
      <el-row>
        <el-col class="button-group">
          <el-button size="medium" style="background:transparent;color:#fff" @click="startOverlapAnalysis">确认</el-button>
          <el-button size="medium" style="background:transparent;color:#fff" @click="closeOverlapAnalysis">取消</el-button>
        </el-col>
      </el-row>
    </dialog-drag>

    <dialog-drag v-show="isOverlapAnalysis" id="dialog-1" class="dialog-3 result" title="冲突分析" pinned="false"
      :options="{ top: 80, left: 1500, width: 400, buttonPin: false }" @close="closeResultOverlapAnalysis">
      <div class="analysisBox">
        <el-table :summary-method="getSummaries" show-summary :data="overlapAnalysisResult" height="80vh"
          @row-dblclick="zoomBuffer" :cell-style="tableRowStyle" :header-cell-style="tableHeaderColor"
          class="analysis-result-list">
          <el-table-column prop="testPoint" label="检测数据" align="center">
          </el-table-column>
          <el-table-column prop="otherPoint" label="被检测数据" align="center">
          </el-table-column>
          <el-table-column prop="isOverlap" label="是否冲突" align="center">
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

import * as turf from '@turf/turf'

export default {
  components: {
    DialogDrag,
  },
  data() {
    return {
      isOverlapCondition: false,
      isOverlapAnalysis: false,
      overlapTestPoint: [],
      overlapOtherPoint: [],
      overlapTestData: [],
      overlapOtherData: [],
      overlapAnalysisResult: [],
      inputRadius: '',
      overLapCount: 0,
      disOverLapCount: 0,
    }
  },
  mounted() {
    this.getTestInfo();
    this.getOtherInfo()
  },
  methods: {
    setOverlapAnalysis() {
      this.isOverlapCondition = !this.isOverlapCondition
    },

    closeOverlapAnalysis() {
      this.overlapTestData = ''
      this.overlapOtherData = ''
      this.inputRadius = ''
      this.isOverlapCondition = false
    },

    getTestInfo() {
      let villageInfo = []
      for (let i = 0; i < villagejson.features.length; i++) {
        villageInfo.push({
          id: i,
          name: villagejson.features[i].properties.NAME,
          position: [
            villagejson.features[i].geometry.coordinates[0],
            villagejson.features[i].geometry.coordinates[1]
          ]
        });
      }
      this.overlapTestPoint = villageInfo
    },

    getOtherInfo() {
      let OtherInfo = []
      for (let i = 0; i < fengjijson.features.length; i++) {
        OtherInfo.push({
          id: i,
          name: fengjijson.features[i].properties.NAME,
          position: [
            fengjijson.features[i].geometry.coordinates[0],
            fengjijson.features[i].geometry.coordinates[1]
          ]
        });
      }
      this.overlapOtherPoint = OtherInfo
    },

    startOverlapAnalysis() {
      this.overlapAnalysisResult = []
      this.overLapCount = 0
      this.disOverLapCount = 0
      if (this.overlapTestData != [] && this.overlapOtherData != [] && this.inputRadius != '') {
        this.isOverlapAnalysis = true
        for (let i = 0; i < this.overlapTestData.length; i++) {
          for (let j = 0; j < this.overlapOtherData.length; j++) {
            let result = { testPoint: this.overlapTestData[i].name, otherPoint: this.overlapOtherData[j].name, position: this.overlapTestData[i].position, isOverlap: "待计算" }
            setTimeout(() => {
              let testPolygon = this.createPointBuffer(this.overlapTestData[i].position, this.inputRadius)
              let points = testPolygon[0]
              let degreesArray = this.pointsToDegreesArray(points);

              let testPolygonF = turf.polygon(testPolygon)
              let otherPointF = turf.point(this.overlapOtherData[j].position);
              let intersection = turf.booleanPointInPolygon(otherPointF, testPolygonF)

              this.$emit("addBufferPolyogn", Cesium.Cartesian3.fromDegreesArray(degreesArray), intersection == true ? "overLap" : "disOverLap")

              if (intersection) {
                result.isOverlap = "冲突"
                this.overLapCount++
                this.overlapAnalysisResult.push(result)
              } else {
                result.isOverlap = "不冲突"
                this.disOverLapCount++
                this.overlapAnalysisResult.push(result)
              }
            }, (i * (this.overlapOtherData.length - 1) + i + j) * 800);
          }
        }
      } else {
        this.$message({
          message: '请输入相关条件！',
          type: 'warning'
        })
      }

    },

    createPointBuffer(point, radius) {
      let pointF = turf.point(point);
      let buffered = turf.buffer(pointF, radius, { units: 'kilometers' });
      let coordinates = buffered.geometry.coordinates;

      return coordinates
    },

    //格式转换
    pointsToDegreesArray(points) {
      let degreesArray = [];
      points.map(item => {
        degreesArray.push(item[0]);
        degreesArray.push(item[1]);
      });
      return degreesArray;
    },

    closeResultOverlapAnalysis() {
      this.isOverlapAnalysis = false
      this.$emit("closeResultOverlapAnalysis")
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

    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        } else if (index === 1) {
          sums[index] = '冲突：' + this.overLapCount;
          return;
        } else {
          sums[index] = '不冲突：' + this.disOverLapCount;
          return;
        }
      });

      return sums;
    },

    zoomBuffer(row) {
      let pointF = turf.point(row.position);
      let buffered = turf.buffer(pointF, this.inputRadius, { units: 'kilometers' });
      let coordinates = buffered.geometry.coordinates;
      let points = coordinates[0];
      let degreesArray = this.pointsToDegreesArray(points);
      this.$emit("addBufferPolyogn", Cesium.Cartesian3.fromDegreesArray(degreesArray), row.isOverlap == "冲突" ? "overLap" : "disOverLap")
    },
  },
}
</script>

<style src="vue-dialog-drag/dist/vue-dialog-drag.css"></style>
<style src="vue-dialog-drag/dist/dialog-styles.css"></style>

<style scoped>
.overlapButton {
  margin-top: 5px;
}

.dialog-3.condition {
  background: #333333;
}

.dialog-3.result {
  background: #1e90ff60;
}

.overlapConditionInput {
  margin: 10px 0;
}

.button-group {
  margin-top: 5px;
  display: flex;
  justify-content: center;
}

.select1 {
  width: 100%;
  margin: 10px 0;
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
.overlapConditionInput .el-input__inner {
  background: transparent !important;
  color: #eee !important;
  border: 1px solid #eee !important;
}

.select1 .el-input__inner {
  background: transparent !important;
  color: #eee !important;
  border: 1px solid #eee !important;
}

.el-select .popper__arrow::after {
  border-bottom-color: #333333 !important;
}

.el-select .el-select-dropdown {
  background: #333333 !important;
  width: 100% !important;
  z-index: 9999 !important;
}

.el-select .el-select-dropdown__item {
  color: #efefef !important;
  z-index: 9999 !important;
}

.el-select .el-select-dropdown__item.hover {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: rgba(255, 255, 255, 0.80) !important;
  z-index: 9999 !important;
}

.el-select .el-select-dropdown__item.selected {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: rgba(255, 255, 255, 0.80) !important;
  z-index: 9999 !important;
}
</style>