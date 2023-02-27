const { defineConfig } = require('@vue/cli-service')
module.exports = {
  lintOnSave: false,
  css: {
    loaderOptions: {
      sass: {
        data: `@import "@/styles/main.scss";`
      }
    }
  }
}