'use strict';
var fs      = require('fs');
var util    = require('util');
var path    = require('path');
var yeoman  = require('yeoman-generator');
var yosay   = require('yosay');
var chalk   = require('chalk');
var wiredep = require('wiredep');


var RatchetGenerator = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    // setup the test-framework property, gulpfile template will need this
    this.options['test-framework'] = this.options['test-framework'] || 'mocha';

    // resolved to mocha by default (could be switched to jasmine for instance)
    this.hookFor('test-framework', {
      as: 'app',
      options: {
        options: {
          'skip-install': this.options['skip-install-message'],
          'skip-message': this.options['skip-install']
        }
      }
    });

    this.pkg = require('../package.json');
  },

  askFor: function () {
    var done = this.async();

    // welcome message
    if (!this.options['skip-welcome-message']) {
      this.log(yosay());
      this.log(chalk.magenta('Out of the box I include a gulpfile.js to build your app.'));
    }

    var prompts = [
      {
        type: 'confirm',
        name: 'includeSass',
        message: 'Would you like to sass for your css?',
        default: false
      }
    ];

    this.prompt(prompts, function (answers) {
      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      this.includeSass = answers.includeSass;

      done();
    }.bind(this));
  },

  gulpfile: function () {
    this.template('gulpfile.js');
  },

  packageJSON: function () {
    this.template('_package.json', 'package.json');
  },

  git: function () {
    this.copy('gitignore', '.gitignore');
    this.copy('gitattributes', '.gitattributes');
  },

  bower: function () {
    //this.copy('bowerrc', '.bowerrc');
    this.copy('_bower.json', 'bower.json');
  },

  jshint: function() {
    this.copy('jshintrc', '.jshintrc');
  },

  editorconfig: function () {
    this.copy('editorconfig', '.editorconfig');
  },

  h5bp : function () {
    this.copy('favicon.ico', 'app/favicon.ico');
    this.copy('404.html', 'app/404.html');
    this.copy('robots.txt', 'app/robots.txt');
    this.copy('htaccess', 'app/.htaccess');
  },

  mainStylesheet : function () {
    var css = 'main.' + (this.includeSass ? 's' : '') + 'css';
    this.copy(css, 'app/styles/' + css);
  },

  writeIndex : function () {
    this.indexFile = this.readFileAsString(path.join(this.sourceRoot(), 'index.html'));
    this.indexFile = this.engine(this.indexFile, this);

    this.indexFile = this.appendFiles({
      html: this.indexFile,
      fileType: 'js',
      optimizedPath: 'scripts/main.js',
      sourceFileList: ['scripts/main.js']
    });
  },

  app: function () {
    this.mkdir('app');
    this.mkdir('app/scripts');
    this.mkdir('app/styles');
    this.mkdir('app/images');
    this.mkdir('app/fonts');
    this.write('app/index.html', this.indexFile);
    this.write('app/scripts/main.js', 'console.log(\'\\\'Allo \\\'Allo!\');');
  },

  install: function () {
    var howToInstall =
      '\nAfter running `npm install & bower install`, inject your front end dependencies into' +
      '\nyour HTML by running:' +
      '\n' +
      chalk.yellow.bold('\n  gulp wiredep');

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    var done = this.async();
    this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install'],
      callback: function () {
        var bowerJson = JSON.parse(fs.readFileSync('./bower.json'));

        // wire Bower packages to .html
        wiredep({
          bowerJson: bowerJson,
          directory: 'bower_components',
          src: 'app/index.html'
        });

        if (this.includeSass) {
          // wire Bower packages to .scss
          wiredep({
            bowerJson: bowerJson,
            directory: 'bower_components',
            src: 'app/styles/*.scss'
          });
        }
        done();
      }.bind(this)
    });
  }
});
module.exports = RatchetGenerator;