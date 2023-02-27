<template>
  <div>
    <el-button type="primary" @click="showVisibleAnalysis">通视分析</el-button>
    <dialog-drag v-show="isShowVisibleAnalysis" id="dialog-1" class="dialog-3" title="通视分析" pinned="false"
      :options="{ top: 80, left: 1500, width: 400, buttonPin: false }" @close="closeVisibleAnalysis">
      <div class="analysisBox">
        <el-table :data="visibleAnalysisTable" height="80vh" :cell-style="tableRowStyle"
          :header-cell-style="tableHeaderColor" class="analysis-result-list" @row-dblclick="highLightLine"
          element-loading-text="加载中" element-loading-spinner="el-icon-loading" v-loading="loading">
          <el-table-column prop="fengji" label="风机名" align="center">
          </el-table-column>
          <el-table-column prop="village" label="村落名" align="center">
          </el-table-column>
          <el-table-column prop="isViewer" label="是否通视" align="center">
          </el-table-column>
        </el-table>
      </div>
    </dialog-drag>
  </div>
</template>

<script>
import DialogDrag from "vue-dialog-drag";
export default {
  components: {
    DialogDrag,
  },
  props: {
    visibleAnalysisTable: {
      Array,
      required: true
    },
  },
  data() {
    return {
      isShowVisibleAnalysis: false,
      loading: true
    };
  },
  methods: {
    showVisibleAnalysis() {
      this.isShowVisibleAnalysis = !this.isShowVisibleAnalysis
      this.$emit("startVisibleAnalysis")
    },
    closeVisibleAnalysis() {
      this.isShowVisibleAnalysis = false
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
      this.$emit("highLightLine", row.fengjiXYZ, row.villageXYZ)
    }
  },
  watch: {
    visibleAnalysisTable: {
      handler(newValue, oldValue) {
        this.loading = false
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