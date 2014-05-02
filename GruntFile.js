module.exports = function(grunt) {

    //Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ''
            },
            dist: {
                src: [
                  'src/intro.js',
                  'src/core.js',
                  'src/utils.js',
                  'src/layer.js',

                  'src/canvas.js',
                  'src/interactiveLayer.js',
                  'src/tooltip.js',
                  'src/utils.js',

                  'src/models/axis.js',
                  'src/models/legend.js',

                  'src/chart.js',

                  'src/models/bar/**/*js',
                  'src/models/bullet/**/*js',
                  'src/models/line/**/*js',

                  'src/models/pie/pie*js',
                  'src/models/pie/donut.js',

                  'src/models/scatter/**/*js',
                  'src/models/sparkline/**/*js',
                  'src/models/stackedArea/**/*js',

                  'src/outro.js'
                ],
                dest: 'nv.d3.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */'
            },
            js: {
                files: {
                    'nv.d3.min.js': ['nv.d3.js']
                }
            }
        },
        jshint: {
            foo: {
                src: "src/**/*.js"
            },
            options: {
                jshintrc: '.jshintrc'
            }
        },
        watch: {
            js: {
                files: ["src/**/*.js"],
                tasks: ['concat']
            }
        },
        copy: {
          css: {
            files: [
              { src: 'src/nv.d3.css', dest: 'nv.d3.css' }
            ]
          }
        },
        cssmin: {
          dist: {
            files: {
              'nv.d3.min.css' : ['nv.d3.css']
            }
          }
        },
        mochaTest: {
          nvd3: {
            options: {
              reporter: 'spec'
            },
            src: ['test/runner/loadAll.coffee']
          }
        },
        connect: {
          options: {
            port: 8808
          },
          test: {},
          serve: {
            options: {
              keepalive: true
            }
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-selenium-launcher');

    grunt.registerTask('test', ['connect:test', 'selenium-launch', 'mochaTest:nvd3'])

    grunt.registerTask('default', ['concat', 'copy']);
    grunt.registerTask('production', ['concat', 'uglify', 'copy', 'cssmin']);
    grunt.registerTask('release', ['production']);
    grunt.registerTask('lint', ['jshint']);
};
