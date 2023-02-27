<template>
  <div class="container">
    <div id="cesiumContainer">
      <div class="mainBox">
        <VisibleAnalysisTable :visibleAnalysisTable="visibleAnalysisTable" @startVisibleAnalysis="startVisibleAnalysis"
          @highLightLine="highLightLine" />
      </div>
    </div>
  </div>
</template>

<script>
import fengjijson from "../../public/data/风机.json"
import villagejson from "../../public/data/村落.json"
import villageSvg from "../../public/data/村落.svg"

import VisibleAnalysisTable from "./VisibleAnalysisTable.vue"

let viewer;
export default {
  components: {
    VisibleAnalysisTable
  },
  data() {
    return {
      fengjiPosition: [],
      villagePosition: [],
      visibleAnalysisJson: [],
      visibleAnalysisTable: []
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
    },

    createFengji(lon, lat) {
      const entity = viewer.entities.add({
        name: 'data/风电机模型.glb',
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        model: {
          uri: 'data/风电机模型.glb',
          //不管缩放如何，模型的最小最小像素大小。
          minimumPixelSize: 128,
          //模型的最大比例尺大小。 minimumPixelSize的上限。
          maximumScale: 2000,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
      });
      // viewer.trackedEntity = entity;
      // 获取或设置相机当前正在跟踪的Entity实例。
    },

    addFengjis() {
      fengjijson.features.forEach(element => {
        this.createFengji(element.geometry.coordinates[0],
          element.geometry.coordinates[1])
      });
    },

    creatVillage(viewer, postion, img) {
      viewer.entities.add({
        position: postion,
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
          villageSvg
        );
        viewer.scene.requestRender();
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

    Cartesian3_to_WGS84(point) {
      let longitude = Cesium.Math.toDegrees(point.longitude);
      let latitude = Cesium.Math.toDegrees(point.latitude);
      let height = point.height;
      return { longitude: longitude, latitude: latitude, height: height };
    },

    async startVisibleAnalysis() {
      await this.getFengjiPosition();
      await this.getVillagePosition();
      this.visibleAnalysisJson.length = 0;
      for (let j = 0; j < this.villagePosition.length; j++) {
        for (let i = 0; i < this.fengjiPosition.length; i++) {
          // 需要指定scene
          let sightline = new Cesium.Sightline(viewer.scene);
          let color = new Cesium.Color.fromCssColorString("rgba(80, 90, 60, 0.01)")
          sightline.hiddenColor = color;
          sightline.visibleColor = color;
          sightline.viewPosition.length = 0;
          sightline.viewPosition = [this.fengjiPosition[i].lon, this.fengjiPosition[i].lat, this.fengjiPosition[i].hei]
          sightline.build();

          sightline.removeAllTargetPoint();
          sightline.addTargetPoint({
            position: [this.villagePosition[j].lon, this.villagePosition[j].lat, this.villagePosition[j].hei],
            name: "f" + i.toString() + "v" + j.toString()
          });

          setTimeout(() => {
            let barrier = sightline.getBarrierPoint("f" + i.toString() + "v" + j.toString(), (e) => { e })
            this.visibleAnalysisJson.push({
              fengji: this.fengjiPosition[i].name,
              fengjiXYZ: [this.fengjiPosition[i].lon, this.fengjiPosition[i].lat, this.fengjiPosition[i].hei],
              village: this.villagePosition[j].name,
              villageXYZ: [this.villagePosition[j].lon, this.villagePosition[j].lat, this.villagePosition[j].hei],
              isViewer: barrier.isViewer == true ? "是" : "否"
            })
          }, 300);
          setTimeout(() => {
            sightline.removeAllTargetPoint();
          }, 600);
        }
      }
      setTimeout(() => {
        this.visibleAnalysisTable = this.visibleAnalysisJson.sort(this.sortdatalist('fengji'))
      }, 900);
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
      // 需要指定scene
      let sightline = new Cesium.Sightline(viewer.scene);
      sightline.hiddenColor = Cesium.Color.YELLOW;
      sightline.visibleColor = Cesium.Color.CYAN;
      sightline.viewPosition = [observePoint.lon, observePoint.lat, observePoint.hei]
      // 执行
      sightline.build();

      // 添加目标点
      sightline.addTargetPoint({
        position: [targetPoint.lon, targetPoint.lat, targetPoint.hei],
        name: "point"
      });
      // 通视分析需要时间 这里获取取消设置延时触发
      setTimeout(function () {
        viewer.entities.removeById("test");
        viewer.entities.removeById("test1");
        sightline.getBarrierPoint("point", function (e) {
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

          sightline.removeAllTargetPoint()
        })
      }, 50)
    },
    highLightLine(fengjiPoint, villagePoint) {

      let observePoint = { lon: fengjiPoint[0], lat: fengjiPoint[1], hei: fengjiPoint[2] }
      let targetPoint = { lon: villagePoint[0], lat: villagePoint[1], hei: villagePoint[2] }

      this.heightSightline(observePoint, targetPoint)

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