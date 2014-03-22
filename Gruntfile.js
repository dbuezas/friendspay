/* jshint camelcase: false */
'use strict';

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        config: {
            // Configurable paths
            src: 'src',
            build: 'build',
            webapp: '<%= config.build %>/webapp',
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['<%= config.src %>/{,**/}*.js'],
                tasks: ['jshint', 'newer:copy:dist'],
                options: {
                    livereload: true
                }
            },
            coffee: {
                files: ['<%= config.src %>/{,**/}*.{coffee,litcoffee,coffee.md}'],
                tasks: ['coffee:dist', 'newer:copy:dist'],
                options: {
                    livereload: true
                }
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            less: {
                files: ['<%= config.src %>/{,**/}*.less'],
                tasks: ['newer:less:server']
            },
            // styles: {
            //     files: ['<%= config.src %>/{,**/}*.css'],
            //     tasks: ['newer:copy:styles']
            // },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= config.src %>/{,**/}*.html',
                    '.tmp/{,**/}*.css',
                    '<%= config.src %>/images/{,**/}*.{gif,jpeg,jpg,png,svg,webp}'
                ],
                tasks: ['newer:copy:dist']
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: false,
                    base: [
                        '.tmp',
                        '<%= config.src %>'
                    ]
                }
            },
            dist: {
                options: {
                    open: false,
                    base: '<%= config.build %>',
                    livereload: false
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= config.webapp %>/*',
                        '<%= config.containerapp %>/releases/*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Compiles LESS to CSS and generates necessary files if requested
        less: {
            options: {
                paths: ['<%= config.src %>/bower_components'],
            },
            dist: {
                options: {
                    yuicompress: true,
                    report: 'gzip'
                },
                files: {
                    '.tmp/{,**/}*.css': '<%= config.src %>/{,**/}*.less'
                }
            },
            build: {
                files: [{
                    cwd: '<%= config.src %>',
                    src: ['{,**/}*.less'],
                    dest: '<%= config.webapp %>/',
                    expand: true,
                    ext: '.css'
                }]
            },
            server: {
                options: {
                    sourceMap: true,
                    sourceMapBasepath: '<%= config.src %>/',
                    sourceMapRootpath: '../'
                },
                files: [{
                    cwd: '<%= config.src %>',
                    src: ['{,**/}*.less'],
                    dest: '.tmp/',
                    expand: true,
                    ext: '.css'
                }]
            }
        },

        // Automatically inject Bower components into the HTML file
        'bower-install': {
            app: {
                html: '<%= config.src %>/index.html',
                ignorePath: '<%= config.src %>/'
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.src %>',
                    dest: '<%= config.webapp %>',
                    src: [
                        '*.{ico,png,txt}',
                        'images/{,**/}*.*',
                        '{,**/}*.{html,js,css}',
                        'styles/{,**/}*.css',
                        'package.json',
                        'res/{,**/}*.*'
                    ]
                }]
            },
            styles: {
                expand: true,
                dot: true,
                cwd: '<%= config.src %>',
                dest: '.tmp',
                src: '{,**/}*.css'
            }
        },

        // Compiles CoffeeScript to JavaScript
        coffee: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.src %>',
                    src: '{,**/}*.{coffee,litcoffee,coffee.md}',
                    dest: '.tmp',
                    ext: '.js'
                }]
            },
            build: {
                files: [{
                    expand: true,
                    cwd: '<%= config.src %>',
                    src: '{,**/}*.{coffee,litcoffee,coffee.md}',
                    dest: '<%= config.webapp %>',
                    ext: '.js'
                }]
            }
        },

        // Run some tasks in parallel to speed up build process
        concurrent: {
            server: [
                'less:server',
                'coffee:dist',
                'copy:styles'
            ],
            dist: [
                'coffee',
                'less:dist',
                'copy:styles',
            ],
            build: [
                'less:build',
                'coffee:build'
            ]
        }
    });

    // Available Tasks definition
    grunt.registerTask('serve', function(target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', function(target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run([target ? ('serve:' + target) : 'serve']);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'concurrent:build',
        'copy:dist',
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'build'
    ]);
};
