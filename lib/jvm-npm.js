/**
 *  Copyright 2014 Lance Ball
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
// Since we intend to use the Function constructor.
/* jshint evil: true */

module = (typeof module == 'undefined') ? {} :  module;

(function() {
  var System  = java.lang.System,
      Scanner = java.util.Scanner,
      File    = java.io.File;

  NativeRequire = (typeof NativeRequire === 'undefined') ? {} : NativeRequire;
  if (typeof require === 'function' && !NativeRequire.require) {
    NativeRequire.require = require;
  }

  function Module(id, parent, core) {
    this.id = id;
    this.core = core;
    this.parent = parent;
    this.children = [];
    this.filename = id;
    this.loaded = false;

    Object.defineProperty( this, 'exports', {
      get: function() {
        return this._exports;
      }.bind(this),
      set: function(val) {
        Require.cache[this.filename] = val;
        this._exports = val;
      }.bind(this),
    } );
    this.exports = {};

    if (parent && parent.children) parent.children.push(this);

    this.require = function(id) {
      return Require(id, this);
    }.bind(this);
  }

  Module._load = function _load(file, parent, core, main) {
    var module = new Module(file, parent, core);
    var __FILENAME__ = module.filename;
    var body   = _readFile(module.filename,module.core);
    var dir    = new File(module.filename).getParent();
    var args   = ['exports', 'module', 'require', '__filename', '__dirname'];
    //var func   = new Function(args, body);
	try {
	  eval("var func = function(exports, module, require, __filename, __dirname) {"+body+"}");
	} catch (e) {
	  e.fileName = module.filename;
	  throw e;
	}
    func.apply(module,
        [module.exports, module, module.require, module.filename, dir]);
    module.loaded = true;
    module.main = main;
    return module.exports;
  };

  Module.runMain = function runMain(main) {
    var file = Require.resolve(main);
    Module._load(file, undefined, false, true);
  };

  function Require(id, parent) {
    var core, native_, file = Require.resolve(id, parent);

    if (!file) {
      if (typeof NativeRequire.require === 'function') {
        if (Require.debug) {
          print(['Cannot resolve', id, 'defaulting to native_'].join(' '));
        }
        native_ = NativeRequire.require(id);
        if (native_) return native_;
        print("Cannot find module " + id);
      }
      throw new ModuleError("Cannot find module " + id, "MODULE_NOT_FOUND");
    }

    if (file.core) {
      file = file.path;
      core = true;
    }
    try {
      if (Require.cache[file]) {
        return Require.cache[file];
      } else if (file.endsWith('.js')) {
        return Module._load(file, parent, core);
      } else if (file.endsWith('.json')) {
        return loadJSON(file, core);
      }
    } catch(ex) {
      throw new ModuleError("Cannot load module " + id + 
	    "\n--->\"" + ex.fileName + "\", line " + ex.lineNumber + ": exception thrown: " + ex.message , "LOAD_ERROR", ex);
    }
  }
  
  function fixRootAndId(root, id)
  {
	  if (!root) root="";
	  
	  var rootParts = root.split(/[\\\\/]/);
	  var idParts = id.split(/[\\\\/]/);
	  
	  while (idParts[0]=='..' && rootParts[rootParts.length-1]) {
		idParts = idParts.slice(1);
		rootParts = rootParts.slice(0,-1);
	  }
	  if (idParts[0]=='.') 
	    idParts = idParts.slice(1);
	  
	  root = rootParts.join('/');
	  id = idParts.join('/');
	  
	  return {"root": root, "id": id};
  }

  Require.resolve = function(id, parent) {
    var roots = findRoots(parent);
    for ( var i = 0 ; i < roots.length ; ++i ) {
      var root = roots[i];
      var fixed = fixRootAndId(root, id);
	  root = fixed.root;
	  id = fixed.id;
	  //print("Loading '"+id+"' with root: "+root);
      var result = resolveAsFile(id, root, '.js')   ||
	               resolveAsFile(id, root, '.json') ||
                   resolveAsDirectory(id, root)     ||
                   resolveAsNodeModule(id, root);
      if ( result )
        return result;
    }
    return false;
  };

  Require.root = System.getProperty('user.dir');
  Require.NODE_PATH = undefined;

  function findRoots(parent) {
    var r = [];
    r.push( findRoot( parent ) );
    return r;
    // return r.concat( Require.systemNodePaths() );
  }

  function parsePaths(paths) {
    if ( ! paths ) {
      return [];
    }
    if ( paths === '' ) {
      return [];
    }
    var osName = java.lang.System.getProperty("os.name").toLowerCase();
    var separator;

    if ( osName.indexOf( 'win' ) >= 0 ) {
      separator = ';';
    } else {
      separator = ':';
    }

    return paths.split( separator );
  }

  Require.systemNodePaths = function() {
    var r = [];
    r.push( java.lang.System.getProperty( "user.home" ) + "/.node_modules" );
    r.push( java.lang.System.getProperty( "user.home" ) + "/.node_libraries" );

    if ( Require.NODE_PATH ) {
      r = r.concat( parsePaths( Require.NODE_PATH ) );
    } else {
      var NODE_PATH = java.lang.System.getenv.NODE_PATH;
      if ( NODE_PATH ) {
        r = r.concat( parsePaths( NODE_PATH ) );
      }
    }
    // r.push( $PREFIX + "/node/library" );
    return r;
  };

  function findRoot(parent) {
    if (!parent || !parent.id) { return Require.root; }
    var pathParts = String(parent.id).split(/[\\\\/]/);
    //var pathParts = parent.id.split('[\\\\\\/]');
    //pathParts.pop();
	pathParts = pathParts.slice(0,-1)
    return pathParts.join('/');
  }

  Require.debug = true;
  Require.cache = {};
  Require.extensions = {};
  require = Require;

  module.exports = Module;


  function loadJSON(file, core) {
    var json = JSON.parse(_readFile(file, core));
    Require.cache[file] = json;
    return json;
  }

  function resolveAsNodeModule(id, root) {
    var base = [root, 'node_modules'].join('/');
    return resolveAsFile(id, base) ||
      resolveAsDirectory(id, base) ||
      (root ? resolveAsNodeModule(id, new File(root).getParent()) : false);
  }

  function resolveAsDirectory(id, root) {
    var base = [root, id].filter(function(n) {return n}).join('/'),
        filepath = [base, 'package.json'].join('/');
        file = new File(filepath);
	//print("resolve dir: "+base)
    if (file.exists()) {
	  var body = _readFile(file.getCanonicalPath())
	} else {
	  file = resolveCoreModule(filepath);
	  if (file)
		var body = _readFile(file.path, file.core);
	}
	
    if (body) {
      try {
        var package_  = JSON.parse(body);
        if (package_.main) {
          return (resolveAsFile(package_.main, base)     ||
                  resolveAsDirectory(package_.main, base));
        }
        // if no package_.main exists, look for index.js
        return resolveAsFile('index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
      }
    }
    return resolveAsFile('index.js', base);
  }

  function resolveAsFile(id, root, ext) {
    var file;
    var name = normalizeName(id, ext || '.js');
	//print("resolving file: "+name);
	//if (root) print("resolving file: "+[root, name].join('/'));
    if ( id.indexOf('/') === 0 ) {
	  var result = resolveCoreModule(name);
	  if (result) return result;
	  
      file = new File(name);
      if (!file.exists()) {
        return resolveAsDirectory(id);
      }
    } else {
	  var result = resolveCoreModule(name, root);
	  if (result) return result;
	  
      if (root) name = [root, name].join('/');	  
      file = new File(name);
    }
    if (file.exists()) {
      return file.getCanonicalPath();
    }
  }

  function resolveCoreModule(id, root) {
	var fixed = fixRootAndId(root, id);
	root = fixed.root;
	id = fixed.id;

	var root_id = [root, id].join('/');
	
	if (typeof findResource !== "function") { 
		findResource = function(id) {
			classloader = java.lang.Thread.currentThread().getContextClassLoader();
			return classloader.getResource(id);
		}
	}
    
    if (findResource(id)) {
        return { path: id, core: true };
	} else if (root && findResource(root_id)) {
        return { path: root_id, core: true };	
	}
  }

  function normalizeName(fileName, ext) {
    var extension = ext || '.js';
    if (fileName.endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function _readFile(filename, core) {
    var input;
    try {
      if (core) {
        var classloader = java.lang.Thread.currentThread().getContextClassLoader();
        input = classloader.getResourceAsStream(filename);
      } else {
        input = new File(filename);
      }
      // TODO: I think this is not very efficient
      return new Scanner(input,'utf-8').useDelimiter("\\A").next();
    } catch(e) {
      throw new ModuleError("Cannot read file ["+input+"]: ", "IO_ERROR", e);
    }
  }

  function ModuleError(message, code, cause) {
    this.code = code || "UNDEFINED";
    this.message = message || "Error loading module";
    this.cause = cause;
  }

  // Helper function until ECMAScript 6 is complete
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
      if (!suffix) return false;
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
  }

  ModuleError.prototype = new Error();
  ModuleError.prototype.constructor = ModuleError;

}());
