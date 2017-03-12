module.exports = function(grunt) {
  grunt.initConfig({
    copy: {
      main: {
        files: [
            {
                expand: true,
                cwd: 'scripts/canvg/',
                src: ['**/*.js', '!**/flashcanvas.js'],
                dest: 'build/release/scripts/canvg/',
            }, {
                expand: true,
                cwd: 'scripts/zeploid/src/',
                src: '**/*.js',
                dest: 'build/release/scripts/zeploid/src/'
            }, {
                expand: true,
                cwd: 'scripts/LD33/',
                src: '**/*.js',
                dest: 'build/release/scripts/LD33/'
            }, {
                src: 'assets/*',
                dest: 'build/release/'
            }, {
                src: 'run.html',
                dest: 'build/release/run.html'
            }
        ]
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('build',[
    'copy:main'
  ]);
};
