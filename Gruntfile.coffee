module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    env:
      dev:
        NODE_ENV: "development"
      prod:
        NODE_ENV: "production"

    clean:
      options:
        force: true
      es5: ["./es5/*"]

    watch:
      src:
        files: ["src/**/*.js"]
        tasks: ["newer:babel", "growl:babel"]

    babel:
      options:
        sourceMap: true
        presets: ["es2015", "react"]
      src:
        expand: true
        cwd: "src/"
        src: ["**/*.js"]
        dest: "es5/"
        ext: ".js"
        extDot: "last"

    growl:
      "babel":
        title: "babel finished"
        message: "Grunt"

  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-babel"
  grunt.loadNpmTasks "grunt-env"
  grunt.loadNpmTasks "grunt-newer"
  grunt.loadNpmTasks "grunt-growl"

  grunt.registerTask "build:release", [
    "clean", "env:prod", "babel"
  ]

  grunt.registerTask "build:dev", [
    "clean", "env:dev", "babel"
  ]

  grunt.registerTask "default", ["build:dev", "watch"]
