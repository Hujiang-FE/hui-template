module.exports = function(grunt) {
	"use strict";

	var template = require('../../src/hui.template.js');
	var beautify = require('js-beautify').js_beautify;

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*!\n' +
				' * hui.widgets.js <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd, HH:MM") %>)\n' +
				' Copyright (C) 2014 Hujiang.com, http://ww.hujiang.com' +
				' */'
		},

		concat: {
			widget: {
				options: {
					banner: '<%= meta.banner %>\n'
				},
				src: './src/**/*.js',
				dest: "dist/hui.widgets.<%= pkg.version %>.js"
			},
			css: {
				options: {
					banner: '<%= meta.banner %>\n'
				},
				src: './src/**/*.js',
				dest: "dist/hui.widgets.<%= pkg.version %>.css"
			}
		},

		qunit: {
			files: ['tests/*.html']
		},

		uglify: {
			eachWidget: {
				files: [{
					expand: true,
					cwd: 'src/scripts',
					src: '**/*.js',
					dest: 'dist/minified'
				}]
			},
			widgets: {
				options: {
					sourceMap: true,
					banner: '<%= meta.banner %>\n'
				},
				src: 'dist/hui.widgets.<%= pkg.version %>.js',
				dest: 'dist/hui.widgets.<%= pkg.version %>.min.js'
			}
		},

		cssmin: {
			compress: {
				files: {
					'dist/hui.widgets.<%= pkg.version %>.min.css': ['dist/hui.widgets.<%= pkg.version %>.css']
				}
			}
		},

		connect: {
			options: {
				port: 8011,
				hostname: "127.0.0.1",
				livereload: 35729,
				onCreateServer: function(server, connect, options) {
					console.log("server created ...");
				}
			},
			server: {
				options: {
					base: {
						path: './',
						options: {
							index: '/',
							maxAge: 300000
						}
					},
					open: true
				}
			}
		},

		prettify: {
			options: {
				// Task-specific options go here. 
			},
			all:{
				src:['./tmpls/loop.tmpl.js'],
				dest: './pretty/loop.tmpl.js'
			}
		},

		jshint: {
			options: {
				curly: false,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				eqnull: true,
				browser: true,
				expr: true,
				globals: {
					head: false,
					module: false,
					console: false,
					unescape: false
				}
			},

			files: []
		},

		watch: {
			options: {
				livereload: true,
			},
			css: {
				files: ['**/*.sass', '**/*.scss'],
				tasks: ['compass']
			}
		},

		compass: {
			dist: {
				options: {
					basePath: 'src',
					sassDir: 'sass',
					//specify: ['src/sass/course.scss', 'src/sass/hui.base.scss'],
					imagesDir: "sass/images",
					generatedImagesPath: 'src/themes/images/',
					relativeAssets: true,
					cssDir: 'themes',
					force: true,
					debugInfo: false,
					outputStyle: 'expanded' //nested, expanded, compact, compressed.
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask("tmpl", "generate template", function() {
		var tmplStr = grunt.file.read('./tmpls/loop.tmpl');
		var fun = template.script(tmplStr);
		console.log(fun = beautify(fun, { indent_size: 2 }));

		grunt.file.write('./tmpls/loop.tmpl.js', fun);
	});

	grunt.registerTask('default', ['concat', 'cssmin', 'uglify']);

	//Sample test server
	grunt.registerTask('demo', [
		'connect:server',
		'watch'
	]);
};