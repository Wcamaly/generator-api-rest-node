#!/usr/bin/env node

'use strict'
const program = require('commander')
const mkdirp = require('mkdirp')
const os = require('os')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const sortedObject = require('sorted-object')

const _exit = process.exit
const eol = os.EOL
const pkg = require('../package.json')
const MODE_0666 = parseInt('0666', 8)
const MODE_0755 = parseInt('0755', 8)



const version = pkg.version

// Re-assign process.exit because of commander
// TODO: Switch to a different command framework
process.exit = exit

// CLI

before(program, 'outputHelp', function () {
  this.allowUnknownOption()
})

program
  .version(version)
  .usage('[options] [dir]')
  .option('    --git', 'add .gitignore')
  // .option('--login', 'add passport')
  .option('-f, --force', 'force on non-empty directory')
  .parse(process.argv)

if (!exit.exited) {
  main()
}

/**
 * Install a before function AOP.
 */

function before(obj, method, fn) {
  let old = obj[method]

  obj[method] = function () {
    fn.call(this)
    old.apply(this, arguments)
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm(msg, callback) {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, function (input) {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */

function createApplication(app_name, path) {
  let wait = 5

  console.log()
  function complete() {
    if (--wait) return
    let prompt = launchedFromCmd() ? '>' : '$'

    console.log()
    console.log('   install dependencies:')
    console.log('     %s cd %s && npm install', prompt, path)
    console.log()
    console.log('   run the app:')

    if (launchedFromCmd()) {
      console.log('     %s SET DEBUG=%s:* & npm start', prompt, app_name)
    } else {
      console.log('     %s DEBUG=%s:* npm start', prompt, app_name)
    }

    console.log()
  }

  // JavaScript
  let app = loadTemplate('js/app.js')
  let www = loadTemplate('js/www')
  let users = loadTemplate('js/routes/users.js')
  let index = loadTemplate('js/routes/index.js')
  let security = loadTemplate('js/routes/security.js')
  let passportConfig = loadTemplate('js/configs/passport-config.js')
  let middleware = loadTemplate('js/middleware/auth.js')


  mkdir(path, function(){

    mkdir(`${path}/routes`, function(){
      write(`${path}/routes/users.js`, users)
      write(`${path}/routes/index.js`, index)
      write(`${path}/routes/security.js`, security )
      complete()
    })

    // package.json
    let pkg = {
      name: app_name,
      version: '0.0.0',
      private: true,
      scripts: {
        "lint": "standard --fix",
        "start-dev": `DEBUG=:${app_name}* nodemon server.js`,
        "start": "NODE_ENV=production node ./bin/www",
        "test": `DEBUG=${app_name}:* ava tests/ --verbose`
      },
      "devDependencies": {
        "ava": "^0.23.0",
        "nodemon": "^1.12.1",
        "proxyquire": "^1.8.0",
        "sinon": "^4.0.2",
        "standard": "^10.0.3",
        "supertest": "^3.0.0"
      },
      "dependencies": {
        "bluebird": "^3.5.1",
        "chalk": "^2.3.1",
        "debug": "^3.1.0",
        "express": "^4.16.2",
        "express-asyncify": "^1.0.0",
        "express-session": "^1.15.6",
        "morgan": "^1.9.0",
        "passport": "^0.4.0",
        "passport-json": "^1.2.0",
        "request": "^2.83.0",
        "request-promise": "^4.2.2",
      }
    }


    // sort dependencies like npm(1)
    pkg.dependencies = sortedObject(pkg.dependencies)

    // write files
    write(`${path}/package.json`, JSON.stringify(pkg, null, 2))
    write(`${path}/app.js`, app)
    mkdir(`${path}/bin`, function(){
      www = www.replace('{name}', app_name)
      write(path + '/bin/www', www, MODE_0755)
      complete()
    })
    mkdir(`${path}/middleware`, function(){
      write(`${path}/middleware/auth.js`, middleware)
      complete()
    })
    mkdir(`${path}/configs`, function(){
      write(`${path}/configs/passport-config.js`, passportConfig)
      complete()
    })


    if (program.git) {
      write(`${path}/.gitignore`, fs.readFileSync(`${__dirname}/../templates/js/gitignore`, 'utf-8'))
    }

    complete()
  })
}

function copy_template(from, to) {
  from = path.join(__dirname, '..', 'templates', from)
  write(to, fs.readFileSync(from, 'utf-8'))
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err
    fn(!files || !files.length)
  })
}

/**
 * Graceful exit for async STDIO
 */

function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) _exit(code)
  }

  var draining = 0
  var streams = [process.stdout, process.stderr]

  exit.exited = true

  streams.forEach(function(stream){
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })

  done()
}

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd() {
  return process.platform === 'win32'
    && process.env._ === undefined
}

/**
 * Load template file.
 */

function loadTemplate(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf-8')
}

/**
 * Main program.
 */

function main() {
  // Path
  var destinationPath = program.args.shift() || '.'

  // App name
  var appName = path.basename(path.resolve(destinationPath))

  // Template engine
  // program.template = 'jade'
  // if (program.ejs) program.template = 'ejs'
  // if (program.hogan) program.template = 'hjs'
  // if (program.hbs) program.template = 'hbs'

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
    } else {
      confirm('destination is not empty, continue? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          createApplication(appName, destinationPath)
        } else {
          console.error('aborting')
          exit(1)
        }
      })
    }
  })
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write (path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || MODE_0666 })
  console.log('   \x1b[36mcreate\x1b[0m : ' + path)
}


/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir (path, fn) {
  mkdirp(path, MODE_0755, function (err) {
    if (err) throw err
    console.log('   \x1b[36mcreate\x1b[0m : ' + path)
    fn && fn()
  })
}