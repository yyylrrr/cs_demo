<template>
  <div class="container">
    <div id="cesiumContainer">
      <div class="mainBox">
        <VisibleAnalysisTable :isBarrier="isBarrier" @clearBarrier="clearBarrier"
          @startVisibleAnalysis="startVisibleAnalysis" @highLightLine="highLightLine" />
        <OverlapAnalysis @addBufferPolyogn="addBufferPolyogn" @closeResultOverlapAnalysis="closeResultOverlapAnalysis" />
        <RoadVisible :isRoadBarrier="isRoadBarrier" @startRoadsVisibleAnalysis="startRoadsVisibleAnalysis" />
      </div>
    </div>
  </div>
</template>

<script>
import fengjijson from "../../public/data/风机.json"
import villagejson from "../../public/data/村落.json"
import roadjson from "../../public/data/公路.json"

import villageSvg from "../../public/data/村落.svg"

import VisibleAnalysisTable from "./VisibleAnalysisTable.vue"
import OverlapAnalysis from "./OverlapAnalysis.vue"
import RoadVisible from "./RoadVisible.vue"

let viewer;
export default {
  components: {
    VisibleAnalysisTable,
    OverlapAnalysis,
    RoadVisible
  },

  data() {
    return {
      fengjiPosition: [],
      villagePosition: [],
      visibleAnalysisJson: [],
      visibleAnalysisTable: [],
      isBarrier: {},
      isRoadBarrier: {},
      timerBox: '',
      timerRoadBox: ''
    };
  },

  mounted() {
    this.init();
    this.loadData();
  },

  methods: {
    init() {
      viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox: false,
        terrainProvider: new Cesium.CesiumTerrainProvider({
          url: 'http://39.170.82.136:9000/terrain/075b9420665c11eda8a2032743bf0bed',
          requestWaterMask: true,
          requestVertexNormals: true,
          isSct: false
        }),
      });

      viewer.imageryLayers.addImageryProvider(new Cesium.BingMapsImageryProvider({
        url: 'https://dev.virtualearth.net',
        mapStyle: Cesium.BingMapsStyle.AERIAL,
        key: URL_CONFIG.BING_MAP_KEY
      }));

      // 设置初始位置  Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result)
      const boundingSphere = new Cesium.BoundingSphere(
        Cesium.Cartesian3.fromDegrees(108.88, 25.70, 600),
        30000
      );

      // 定位到初始位置
      viewer.camera.flyToBoundingSphere(boundingSphere, {
        // 动画，定位到初始位置的过渡时间，设置成0，就没有动画
        duration: 2,
      });
    },

    loadData() {
      this.addFengjis();
      this.addVillages();
      this.addRoads();
    },

    createFengji(lon, lat, text) {
      viewer.entities.add({
        name: 'data/风电机模型.glb',
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        model: {
          uri: 'data/风电机模型.glb',
          //不管缩放如何，模型的最小最小像素大小。
          minimumPixelSize: 12,
          //模型的最大比例尺大小。 minimumPixelSize的上限。
          maximumScale: 2000,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: text,
          font: '10px sans-serif', // 字体
          style: Cesium.LabelStyle.FILL_AND_OUTLINE, // 样式
          fillColor: Cesium.Color.WHITE, // 填充色
          outlineWidth: 1,  // 字体外圈线宽度（同样也有颜色可设置）
          verticalOrigin: Cesium.VerticalOrigin.TOP, // 垂直位置
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          // pixelOffset: new Cesium.Cartesian2(0, -30),  // 中心位置
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    },

    addFengjis() {
      fengjijson.features.forEach(element => {
        this.createFengji(element.geometry.coordinates[0],
          element.geometry.coordinates[1],
          element.properties.NAME)
      });
    },

    creatVillage(viewer, position, text, img) {
      viewer.entities.add({
        position: position,
        label: {
          text: text,
          // font: parseInt(objEntity.FontSize) * 2.2 + 'px ' + objEntity.FontName,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 6,
          translucencyByDistance: new Cesium.NearFarScalar(
            1.5e2,
            1.0,
            1.5e5,
            0.0
          ),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          // verticalOrigin : LSGlobe.VerticalOrigin.BOTTOM, //垂直方向以底部来计算标签的位置
          pixelOffset: new Cesium.Cartesian2(15, -2), // 偏移量
          disableDepthTestDistance: 1000000000, // 优先级
          scale: 0.5
        },
        billboard: {
          image: img,
          width: 40,
          height: 40,
          disableDepthTestDistance: 1000000000,
          scale: 0.6,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
      });
    },

    addVillages() {
      // foreach循环加载点位
      villagejson.features.forEach((element) => {
        this.creatVillage(
          viewer,
          Cesium.Cartesian3.fromDegrees(
            element.geometry.coordinates[0],
            element.geometry.coordinates[1]
          ),
          element.properties.NAME,
          villageSvg
        );
        viewer.scene.requestRender();
      })
    },

    creatRoads(viewer, position) {
      viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(position),
          width: 1,
          material: Cesium.Color.RED,
          clampToGround: true,
        },
      });
    },

    addRoads() {
      roadjson.features[0].geometry.coordinates.forEach((element) => {
        this.creatRoads(
          viewer,
          element.flat(),
        );
      })
    },

    getHeight(lon, lat) {
      let positions = Cesium.Cartographic.fromDegrees(lon, lat);//经纬度转为世界坐标
      //异步函数
      return new Promise((resolve, reject) => {
        new Cesium.sampleTerrain(viewer.terrainProvider, 13, [positions]).then(function (updatedPositions) {
          if (updatedPositions) {
            return resolve(updatedPositions[0].height);
          }
        })
      })
    },

    async getFengjiPosition() {
      this.fengjiPosition = []
      for (let i = 0; i < fengjijson.features.length; i++) {
        let fengjiheight = await this.getHeight(fengjijson.features[i].geometry.coordinates[0],
          fengjijson.features[i].geometry.coordinates[1])

        this.fengjiPosition.push({
          name: fengjijson.features[i].properties.NAME,
          lon: fengjijson.features[i].geometry.coordinates[0],
          lat: fengjijson.features[i].geometry.coordinates[1],
          hei: fengjiheight
        });
      }
    },

    async getVillagePosition() {
      this.villagePosition = []
      for (let i = 0; i < villagejson.features.length; i++) {
        let villageheight = await this.getHeight(villagejson.features[i].geometry.coordinates[0],
          villagejson.features[i].geometry.coordinates[1])

        this.villagePosition.push({
          name: villagejson.features[i].properties.NAME,
          lon: villagejson.features[i].geometry.coordinates[0],
          lat: villagejson.features[i].geometry.coordinates[1],
          hei: villageheight
        });
      }
    },

    async startVisibleAnalysis(fengjivillageInfo) {
      let fengjiheight = await this.getHeight(fengjivillageInfo.fengjiXYZ[0], fengjivillageInfo.fengjiXYZ[1]) + 120
      let villageheight = await this.getHeight(fengjivillageInfo.villageXYZ[0], fengjivillageInfo.villageXYZ[1])
      let observePoint = { order: fengjivillageInfo.order, lon: fengjivillageInfo.fengjiXYZ[0], lat: fengjivillageInfo.fengjiXYZ[1], hei: fengjiheight }
      let targetPoint = { lon: fengjivillageInfo.villageXYZ[0], lat: fengjivillageInfo.villageXYZ[1], hei: villageheight }
      this.heightSightline(observePoint, targetPoint)
    },

    sortdatalist(propertyName) {
      var datalist = (object1, object2) => {
        var value1 = object1[propertyName]
        var value2 = object2[propertyName]
        if (value1 < value2) {
          return -1
        } else if (value1 > value2) {
          return 1
        } else {
          return 0
        }
      }
      return datalist
    },

    heightSightline(observePoint, targetPoint) {
      clearTimeout(this.timerBox)
      // 需要指定scene
      let sightline = new Cesium.Sightline(viewer.scene);
      let color = new Cesium.Color.fromCssColorString("rgba(80, 90, 60, 0.01)")
      sightline.hiddenColor = color;
      sightline.visibleColor = color;
      sightline.viewPosition = [observePoint.lon, observePoint.lat, observePoint.hei]
      // 执行
      sightline.build();

      // 添加目标点
      sightline.addTargetPoint({
        position: [targetPoint.lon, targetPoint.lat, targetPoint.hei],
        name: "point"
      });
      let that = this
      // 通视分析需要时间 这里获取取消设置延时触发
      this.timerBox = setTimeout(async function () {
        viewer.entities.removeById("test");
        viewer.entities.removeById("test1");
        let barrier = await sightline.getBarrierPoint("point", (e) => {
          if (!e.isViewer) {
            //不可见部分
            viewer.entities.add({
              id: "test",
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights([observePoint.lon, observePoint.lat, observePoint.hei, e.position.longitude * (180 / Math.PI), e.position.latitude * (180 / Math.PI), e.position.height]),
                width: 4.0,
                material: Cesium.Color.GREEN.withAlpha(0.9),
                // 指定线实体被模型遮挡的部分的材质 不设置 则遮挡不显示
                depthFailMaterial: Cesium.Color.GREEN.withAlpha(0.9)
              }
            });
            // 可见部分
            viewer.entities.add({
              id: "test1",
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights([e.position.longitude * (180 / Math.PI), e.position.latitude * (180 / Math.PI), e.position.height, targetPoint.lon, targetPoint.lat, targetPoint.hei]),
                width: 4.0,
                material: Cesium.Color.RED.withAlpha(0.9),
                depthFailMaterial: Cesium.Color.RED.withAlpha(0.9)
              }
            });
          } else {
            // 全部可见
            viewer.entities.add({
              id: "test",
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights([observePoint.lon, observePoint.lat, observePoint.hei, targetPoint.lon, targetPoint.lat, targetPoint.hei]),
                width: 4.0,
                material: Cesium.Color.GREEN.withAlpha(0.9)
              }

            });
          }
        })
        that.isBarrier = { barrier: barrier, order: observePoint.order }
        sightline.removeAllTargetPoint()
      }, 120);
    },

    async highLightLine(fengjivillageInfo) {
      viewer.entities.removeById("test");
      viewer.entities.removeById("test1");
      let fengjiheight = await this.getHeight(fengjivillageInfo.fengjiXYZ[0], fengjivillageInfo.fengjiXYZ[1]) + 120
      let villageheight = await this.getHeight(fengjivillageInfo.villageXYZ[0], fengjivillageInfo.villageXYZ[1])
      let observePoint = { order: fengjivillageInfo.order, lon: fengjivillageInfo.fengjiXYZ[0], lat: fengjivillageInfo.fengjiXYZ[1], hei: fengjiheight }
      let targetPoint = { lon: fengjivillageInfo.villageXYZ[0], lat: fengjivillageInfo.villageXYZ[1], hei: villageheight }
      this.heightSightline(observePoint, targetPoint)
    },

    clearBarrier() {
      viewer.entities.removeById("test");
      viewer.entities.removeById("test1");
    },

    //添加缓冲面
    addBufferPolyogn(positions, pointType) {
      viewer.entities.removeById("overLap");
      viewer.entities.removeById("disOverLap");
      let color
      if (pointType == "overLap") {
        color = new Cesium.Color.fromCssColorString("rgba(255, 0, 0, 0.2)")
      } else if (pointType == "disOverLap") {
        color = new Cesium.Color.fromCssColorString("rgba(0, 255, 0, 0.2)")
      } else {
        color = new Cesium.Color.fromCssColorString("rgba(255, 255, 0, 0.8)")
      }
      viewer.entities.add({
        id: pointType,
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: color,
          classificationType: Cesium.ClassificationType.BOTH
        },
      });
    },

    closeResultOverlapAnalysis() {
      viewer.entities.removeById("overLap");
      viewer.entities.removeById("disOverLap");
    },

    async startRoadsVisibleAnalysis(fengjiroadInfo) {
      let fengjiheight = await this.getHeight(fengjiroadInfo.fengjiXYZ[0], fengjiroadInfo.fengjiXYZ[1]) + 120
      let observePoint = [fengjiroadInfo.fengjiXYZ[0], fengjiroadInfo.fengjiXYZ[1], fengjiheight]
      let roadheight = []
      for (let i = 0; i < fengjiroadInfo.roadXYZ.length; i++) {
        let roadZ = await this.getHeight(fengjiroadInfo.roadXYZ[i][0], fengjiroadInfo.roadXYZ[i][1])
        roadheight.push([fengjiroadInfo.roadXYZ[i][0], fengjiroadInfo.roadXYZ[i][1], roadZ])
      }
      console.log(roadheight);
      let canViewer = 0

      for (let j = 0; j < roadheight.length; j++) {
        // 需要指定scene
        let sightline = new Cesium.Sightline(viewer.scene);
        sightline.viewPosition.length = 0;
        sightline.viewPosition = observePoint
        sightline.build();

        sightline.removeAllTargetPoint();
        sightline.addTargetPoint({
          position: [roadheight[j][0], roadheight[j][1], roadheight[j][2]],
          name: "f" + j.toString()
        });

        let that = this
        setTimeout(() => {
          let barrier = sightline.getBarrierPoint("f" + j.toString(), (e) => { e })
          canViewer += barrier.isViewer
          console.log(canViewer);
          that.isRoadBarrier = { barrier: canViewer, order:fengjiroadInfo.order }
        }, 300);

        setTimeout(() => {
          sightline.removeAllTargetPoint();
        }, 2400);
      }
    }
  }
};
</script>

<style scoped>
#cesiumContainer {
  height: 100vh;
}

.mainBox {
  left: 0px;
  top: 0px;
  position: absolute;
  z-index: 991;
}
</style>