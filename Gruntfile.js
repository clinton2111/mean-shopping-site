// Gruntfile.js

// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {




    //CSS and JS dependencies for the public and backend
    var frontend_js_dependencies = [];
    var frontend_css_dependencies = [];
    var admin_js_dependencies = [];
    var admin_css_dependencies = [];

    //CoffeeScript Locations
    var frontend_coffee_src = './public/coffee';
    var admin_coffee_src = './admin/coffee';

    //JS Locations
    var frontend_js_src = './public/js';
    var admin_js_src = './admin/js';

    //SASS Locations
    var frontend_sass_src = './public/sass';
    var admin_sass_src = './admin/sass';

    //CSS Locations
    var frontend_css_src = './public/css';
    var admin_css_src = './admin/css';

    //HTML Locations
    var frontend_html_src = './public/html';
    var admin_html_src = './admin/html';


    //Jade Locations
    var frontend_jade_src = './public/jade';
    var admin_jade_src = './admin/jade';

    //Sass Requires
    var sass_require = ['bourbon','susy'];

    var mozjpeg = require('imagemin-mozjpeg');

    //Express Files
    var express_coffee = './app/coffee';
    var express_js = './app/js';

    // Other files to be copied
    var files_to_be_copied=['server.js','package.json','.htaccess'];

    // ===========================================================================
    // CONFIGURE GRUNT ===========================================================
    // ===========================================================================
    grunt.initConfig({

        // get the configuration info from package.json ----------------------------
        // this way we can use things like name and version (pkg.name)
        pkg: grunt.file.readJSON('package.json'),

        // all of our configuration will go here
        watch: {
            coffee_frontend: {
                files: [frontend_coffee_src + '/**/*.coffee'],
                tasks: ['coffee:frontend']
            },
            coffee_admin: {
                files: [admin_coffee_src + '/**/*.coffee'],
                tasks: ['coffee:admin']
            },
            coffee_express: {
                files: [express_coffee + '/**/*.coffee'],
                tasks: ['coffee:express']
            },
            concat: {
                files: [frontend_js_src + '/**/*.js', admin_js_src + '/**/*.js', '!' + frontend_js_src + '/main.js', '!' + admin_js_src + '/main.js'],
                tasks: ['concat:target']
            },
            compass_frontend: {
                files: [frontend_sass_src + '/**/*.scss'],
                tasks: ['compass:frontend']
            },
            compass_admin: {
                files: [admin_sass_src + '/**/*.scss'],
                tasks: ['compass:admin']
            },
            jade_frontend: {
                files: [frontend_jade_src + '/**/*.jade','public/*.jade'],
                tasks: ['jade:frontend']
            },
            jade_admin: {
                files: [admin_jade_src + '/**/*.jade','public/*.jade'],
                tasks: ['jade:admin']
            }
        },
        coffee: {
            frontend: {
                files: [{
                    expand: true,
                    cwd: frontend_coffee_src,
                    src: ["**/*.coffee"],
                    dest: frontend_js_src,
                    ext: ".js"
                }]
            },
            admin: {
                files: [{
                    expand: true,
                    cwd: admin_coffee_src,
                    src: ["**/*.coffee"],
                    dest: admin_js_src,
                    ext: ".js"
                }]
            },
            express:{
                files: [{
                    expand: true,
                    cwd: express_coffee,
                    src: ["**/*.coffee"],
                    dest: express_js,
                    ext: ".js"
                }]
            }
        },
        uglify: {
            options: {
                mangle: true
            },
            build: {
                files: [{
                    expand: true,
                    cwd: frontend_js_src,
                    src: ['main.js'],
                    dest: "./.temp/public/js",
                    ext: '.min.js'
                }, {
                    expand: true,
                    cwd: admin_js_src,
                    src: ['main.js'],
                    dest: "./.temp/admin/js",
                    ext: '.min.js'
                },{
                    expand: true,
                    cwd: express_js,
                    src: ['**/*.js'],
                    dest: "./.temp/app/js",
                    ext: '.js'
                }]
            }
        },
        cssmin: {
            build: {
                files: [{
                    expand: true,
                    cwd: frontend_css_src,
                    src: ['styles.css'],
                    dest: "./.temp/public/css",
                    ext: '.min.css'
                }, {
                    expand: true,
                    cwd: admin_css_src,
                    src: ['styles.css'],
                    dest: "./.temp/admin/css",
                    ext: '.min.css'
                }]
            }
        },
        concat: {
            options: {
                stripBanners: true,
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */'
            },
            target: {
                files: [{
                    src: [frontend_js_src + '/**/*.js', '!' + frontend_js_src + '/main.js'],
                    dest: frontend_js_src + '/main.js'
                }, {
                    src: [admin_js_src + '/**/*.js', '!' + admin_js_src + '/main.js'],
                    dest: admin_js_src + '/main.js'
                }]
            },
            vendor: {
                files: [{
                    src: frontend_js_dependencies,
                    dest: './public/js/vendor.js'
                }, {
                    src: admin_js_dependencies,
                    dest: './admin/js/vendor.js'
                }, {
                    src: frontend_css_dependencies,
                    dest: './public/css/vendor.css'
                }, {
                    src: admin_css_dependencies,
                    dest: './admin/css/vendor.css'
                }]
            }
        },
        htmlmin: {
            build: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                },
                files: [{
                    expand: true,
                    cwd: "./public",
                    src: '**/*.html',
                    dest: "./.temp/public"
                }, {
                    expand: true,
                    cwd: "./admin",
                    src: '**/*.html',
                    dest: "./.temp/admin"
                }]
            }
        },
        compass: {
            frontend: {
                options: {
                    sassDir: frontend_sass_src,
                    cssDir: frontend_css_src,
                    imagesDir: 'assets',
                    environment: 'development',
                    outputStyle: 'expanded',
                    require: sass_require
                }
            },
            admin: {
                options: {
                    sassDir: admin_sass_src,
                    cssDir: admin_css_src,
                    environment: 'development',
                    outputStyle: 'expanded',
                    require: sass_require
                }
            }
        },
        copy: {
            main: {
                files: [

                    // Copy Vendor Files
                    { expand: true , src:['./public/js/vendor.js'],dest:'./.temp/'},
                    { expand: true , src:['./public/css/vendor.css'],dest:'./.temp/'},
                    { expand: true , src:['./admin/js/vendor.js'],dest:'./.temp/'},
                    { expand: true , src:['./public/css/vendor.css'],dest:'./.temp/'},

                    //Copy entier .temp folder
                    { expand: true, cwd:'./.temp/',src: ['**'], dest: '_final/' },

                    // server.js and package.json Files
                    { expand: true, src: files_to_be_copied, dest: '_final/' },


                ]
            }
        },
        imagemin: {
            bulid: {
                options: {
                    optimizationLevel: 4,
                    svgoPlugins: [{ removeViewBox: false }],
                    use: [mozjpeg()]
                },
                files: [{
                    expand: true,
                    cwd: './assets/',
                    src: ['*.{png,jpg,gif,svg}'],
                    dest: './_final/assets/'
                }]
            }
        },
        jade: {
            frontend: {
                options: {
                    client: false,
                    pretty: true,
                    timestamp: "<%= grunt.template.today() %>"
                },
                files: [{
                    cwd: frontend_jade_src,
                    src: "**/*.jade",
                    dest: frontend_html_src,
                    expand: true,
                    ext: ".html"
                },{
                    cwd: "public",
                    src: "[*.jade,!mixins.jade]",
                    dest: "public",
                    expand: true,
                    ext: ".html"
                }]
            },
            admin: {
                options: {
                    client: false,
                    pretty: true,
                    timestamp: "<%= grunt.template.today() %>"
                },
                files: [{
                    cwd: admin_jade_src,
                    src: "**/*.jade",
                    dest: admin_html_src,
                    expand: true,
                    ext: ".html"
                },{
                    cwd: "admin",
                    src: "*.jade",
                    dest: "admin",
                    expand: true,
                    ext: ".html"
                }]
            }
        },
        clean: {
          build: {
            src: ["./.temp"]
          }
        }
    });


    // ===========================================================================
    // LOAD GRUNT PLUGINS ========================================================
    // ===========================================================================
    // we can only load these if they are in our package.json
    // make sure you have run npm install so our app can find these
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-clean');


    grunt.option('force', true);

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build_vendor', ['concat:vendor']);
    grunt.registerTask('wrap_it_up', ['concat:vendor', 'uglify', 'cssmin', 'htmlmin', 'copy', 'imagemin:bulid','clean']);

};
