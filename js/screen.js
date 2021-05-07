function setEventWrapper(t) {
	var tmp = t.addEventListener;
	t.addEventListener = function(on, fn, options) {
		var self = this;
		var fired = false;
		var cb = fn;
		
		if (['DOMContentLoaded', 'load'].indexOf(on) != -1) {
			fn = function(e) {
				if (fired) return;
				cb.call(self, e);
				fired = true;
			}
		}
		
		return tmp.call(self, on, fn, options);
	}
}

setEventWrapper(window);
setEventWrapper(document);

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}
;(function() {
    // helpers
    var regExp = function(name) {
        return new RegExp('(^| )'+ name +'( |$)');
    };
    var forEach = function(list, fn, scope) {
        for (var i = 0; i < list.length; i++) {
            fn.call(scope, list[i]);
        }
    };

    // class list object with basic methods
    function ClassList(element) {
        this.element = element;
    }

    ClassList.prototype = {
        add: function() {
            forEach(arguments, function(name) {
                if (!this.contains(name)) {
                    this.element.className += ' '+ name;
                }
            }, this);
        },
        remove: function() {
            forEach(arguments, function(name) {
                this.element.className =
                    this.element.className.replace(regExp(name), '');
            }, this);
        },
        toggle: function(name, state) {
            return ((state == undefined && this.contains(name)) || state)
                ? (this.remove(name), false) : (this.add(name), true);
        },
        contains: function(name) {
            return regExp(name).test(this.element.className);
        }
        // bonus..
/*
        replace: function(oldName, newName) {
            this.remove(oldName), this.add(newName);
        }
*/
    };

    // IE8/9, Safari
    if (!('classList' in Element.prototype)) {
        Object.defineProperty(Element.prototype, 'classList', {
            get: function() {
                return new ClassList(this);
            }
        });
    }

    // replace() support for others
    if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
        DOMTokenList.prototype.replace = ClassList.prototype.replace;
    }
})();
(function () {
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
            var el = this;

            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }
})();
if (!Object.entries) {
  Object.entries = function( obj ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    
    return resArray;
  };
}
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = name.toString();
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = value.toString();
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    var self = this
    if (headers instanceof Headers) {
      headers.forEach(function(name, values) {
        values.forEach(function(value) {
          self.append(name, value)
        })
      })

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        self.append(name, headers[name])
      })
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  // Instead of iterable for now.
  Headers.prototype.forEach = function(callback) {
    var self = this
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      callback(name, self.map[name])
    })
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return fetch.Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new fetch.Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return fetch.Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return fetch.Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return fetch.Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : fetch.Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(function (text) {
          return JSON.parse(text);
      });
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(url, options) {
    options = options || {}
    this.url = url

    this.credentials = options.credentials || 'omit'
    this.headers = new Headers(options.headers)
    this.method = normalizeMethod(options.method || 'GET')
    this.mode = options.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(options.body)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  function getXhr() {
    // from backbone.js 1.1.2
    // https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L1181
    if (noXhrPatch && !(/^(get|post|head|put|delete|options)$/i.test(this.method))) {
      this.usingActiveXhr = true;
      return new ActiveXObject("Microsoft.XMLHTTP");
    }
    return new XMLHttpRequest();
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.url = null
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    // TODO: Request constructor should accept input, init
    var request
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }

    return new fetch.Promise(function(resolve, reject) {
      var xhr = getXhr();
      if (request.credentials === 'cors') {
        xhr.withCredentials = true;
      }

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      function onload() {
        if (xhr.readyState !== 4) {
          return
        }
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }
      xhr.onreadystatechange = onload;
      if (!self.usingActiveXhr) {
        xhr.onload = onload;
        xhr.onerror = function() {
          reject(new TypeError('Network request failed'))
        }
      }

      xhr.open(request.method, request.url, true)

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(name, values) {
        values.forEach(function(value) {
          xhr.setRequestHeader(name, value)
        })
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  fetch.Promise = self.Promise; // you could change it to your favorite alternative
  self.fetch.polyfill = true
})();
if (!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}
if (!Object.values) {
	Object.values = function values (object) {
	  return Object.keys(object).map(key => object[key]);
	};
}
(function(global){

//
// Check for native Promise and it has correct interface
//

var NativePromise = global['Promise'];
var nativePromiseSupported =
  NativePromise &&
  // Some of these methods are missing from
  // Firefox/Chrome experimental implementations
  'resolve' in NativePromise &&
  'reject' in NativePromise &&
  'all' in NativePromise &&
  'race' in NativePromise &&
  // Older version of the spec had a resolver object
  // as the arg rather than a function
  (function(){
    var resolve;
    new NativePromise(function(r){ resolve = r; });
    return typeof resolve === 'function';
  })();


//
// export if necessary
//

if (typeof exports !== 'undefined' && exports)
{
  // node.js
  exports.Promise = nativePromiseSupported ? NativePromise : Promise;
  exports.Polyfill = Promise;
}
else
{
  // AMD
  if (typeof define == 'function' && define.amd)
  {
    define(function(){
      return nativePromiseSupported ? NativePromise : Promise;
    });
  }
  else
  {
    // in browser add to global
    if (!nativePromiseSupported)
      global['Promise'] = Promise;
  }
}


//
// Polyfill
//

var PENDING = 'pending';
var SEALED = 'sealed';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';
var NOOP = function(){};

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

// async calls
var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
var asyncQueue = [];
var asyncTimer;

function asyncFlush(){
  // run promise callbacks
  for (var i = 0; i < asyncQueue.length; i++)
    asyncQueue[i][0](asyncQueue[i][1]);

  // reset async asyncQueue
  asyncQueue = [];
  asyncTimer = false;
}

function asyncCall(callback, arg){
  asyncQueue.push([callback, arg]);

  if (!asyncTimer)
  {
    asyncTimer = true;
    asyncSetTimer(asyncFlush, 0);
  }
}


function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(subscriber){
  var owner = subscriber.owner;
  var settled = owner.state_;
  var value = owner.data_;  
  var callback = subscriber[settled];
  var promise = subscriber.then;

  if (typeof callback === 'function')
  {
    settled = FULFILLED;
    try {
      value = callback(value);
    } catch(e) {
      reject(promise, e);
    }
  }

  if (!handleThenable(promise, value))
  {
    if (settled === FULFILLED)
      resolve(promise, value);

    if (settled === REJECTED)
      reject(promise, value);
  }
}

function handleThenable(promise, value) {
  var resolved;

  try {
    if (promise === value)
      throw new TypeError('A promises callback cannot return that same promise.');

    if (value && (typeof value === 'function' || typeof value === 'object'))
    {
      var then = value.then;  // then should be retrived only once

      if (typeof then === 'function')
      {
        then.call(value, function(val){
          if (!resolved)
          {
            resolved = true;

            if (value !== val)
              resolve(promise, val);
            else
              fulfill(promise, val);
          }
        }, function(reason){
          if (!resolved)
          {
            resolved = true;

            reject(promise, reason);
          }
        });

        return true;
      }
    }
  } catch (e) {
    if (!resolved)
      reject(promise, e);

    return true;
  }

  return false;
}

function resolve(promise, value){
  if (promise === value || !handleThenable(promise, value))
    fulfill(promise, value);
}

function fulfill(promise, value){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = value;

    asyncCall(publishFulfillment, promise);
  }
}

function reject(promise, reason){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = reason;

    asyncCall(publishRejection, promise);
  }
}

function publish(promise) {
  var callbacks = promise.then_;
  promise.then_ = undefined;

  for (var i = 0; i < callbacks.length; i++) {
    invokeCallback(callbacks[i]);
  }
}

function publishFulfillment(promise){
  promise.state_ = FULFILLED;
  publish(promise);
}

function publishRejection(promise){
  promise.state_ = REJECTED;
  publish(promise);
}

/**
* @class
*/
function Promise(resolver){
  if (typeof resolver !== 'function')
    throw new TypeError('Promise constructor takes a function argument');

  if (this instanceof Promise === false)
    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');

  this.then_ = [];

  invokeResolver(resolver, this);
}

Promise.prototype = {
  constructor: Promise,

  state_: PENDING,
  then_: null,
  data_: undefined,

  then: function(onFulfillment, onRejection){
    var subscriber = {
      owner: this,
      then: new this.constructor(NOOP),
      fulfilled: onFulfillment,
      rejected: onRejection
    };

    if (this.state_ === FULFILLED || this.state_ === REJECTED)
    {
      // already resolved, call callback async
      asyncCall(invokeCallback, subscriber);
    }
    else
    {
      // subscribe
      this.then_.push(subscriber);
    }

    return subscriber.then;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.all().');

  return new Class(function(resolve, reject){
    var results = [];
    var remaining = 0;

    function resolver(index){
      remaining++;
      return function(value){
        results[index] = value;
        if (!--remaining)
          resolve(results);
      };
    }

    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolver(i), reject);
      else
        results[i] = promise;
    }

    if (!remaining)
      resolve(results);
  });
};

Promise.race = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.race().');

  return new Class(function(resolve, reject) {
    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolve, reject);
      else
        resolve(promise);
    }
  });
};

Promise.resolve = function(value){
  var Class = this;

  if (value && typeof value === 'object' && value.constructor === Class)
    return value;

  return new Class(function(resolve){
    resolve(value);
  });
};

Promise.reject = function(reason){
  var Class = this;

  return new Class(function(resolve, reject){
    reject(reason);
  });
};

})(typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : typeof self != 'undefined' ? self : this);
(function() { 'use strict';
	
Object.filter = (obj, predicate) => 
Object.keys(obj)
      .filter( key => predicate(obj[key]) )
      .reduce( (res, key) => Object.assign(res, { [key]: obj[key] }), {} );
      
      

let _ = {
	_checkIteratee(iteratee) {
		if (typeof iteratee != 'function') {
			let k = iteratee;
			iteratee = function(o) { return o[k]; }
		}
		
		return iteratee;
	},
	
	debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	},
	
	map(list, iteratee) {
		iteratee = this._checkIteratee(iteratee);
		
		let tmp = [];
		for(var i in list) if (list.hasOwnProperty(i)) tmp.push(iteratee(list[i], i));
		return tmp;
	},
	
	each(list, cb) {
		for(var i in list) if (list.hasOwnProperty(i)) cb(list[i], i);
	},
	
	size(list) {
		return Object.keys(list).length;
	},
	
	isNumber(n) {
		return this.isFloat(n) || this.isInteger(n);
	},

	isFloat(n) {
		return (n != null && n != undefined) && (parseFloat(n).toString() == n.toString());
	},

	isInteger(n) {
		return (n != null && n != undefined) && (parseInt(n).toString() == n.toString());
	},

	isObject(n) {
		return (n && typeof n === 'object' && !Array.isArray(n));
	},
	
	isArray(n) {
		return Array.isArray(n);
	},
	
	camelCase(value) {
		return value.replace( /-([a-z])/g, ( all, letter ) => {
			return letter.toUpperCase();
		});
	},
	
	isPlainObject(n) {
		let funcToString = Function.prototype.toString;
		var objectCtorString = funcToString.call(Object);
		
		let proto = Object.getPrototypeOf(n);
		if (proto === null) return true;
		let Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
		return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
	},
	
	flatten(array, deep = false) {
      let result = [];
      this.each(array, v => {
	      if (Array.isArray(v)) {
		      result = this.concat(result, deep?this.flatten(v, deep):v);
	      } else {
		      result.push(v);
	      }
      })
      
      return result;
    },	
	
	has(o, key) {
		return o != null && hasOwnProperty.call(o, key);
	},
	
	clone(o) {
// 		return Object.assign({}, o);
		return JSON.parse(JSON.stringify(o));
	},
	
	uniq(o) {
		return o.filter((v, i, a) => a.indexOf(v) === i); 
	},
	
	concat() {
		if (!arguments.length) return undefined;
		
		let r = arguments[0];
		for (let i = 1; i < arguments.length; i++) r = r.concat(arguments[i]);
		return r;
	},
	
	intersect(a, b) {
		return Object.keys(a).filter(x => b.hasOwnProperty(x));
// 		return a.filter(x => b.includes(x));
	},
	
	intersection(a, b) {
		return Object.values(a).filter(x => b.indexOf(x));
	},
	
	compact(list) {
		var index = -1,
			length = list == null ? 0 : list.length,
			resIndex = 0,
			result = [];
		
		while (++index < length) {
			var value = list[index];
			if (value) result[resIndex++] = value;
		}
		return result;
	},
	
	pick(object, paths) {
		return this.pickBy(object, (v, k) => {
        	return paths.indexOf(k) != -1;
      	});
	},
	
	pickBy(object, predicate) {
		if (object == null) return {};
		let result = {};
		
		this.each(object, (v, k) => {
			if (predicate(v, k)) result[k] = v;
		});
		
		return result;
	},
	
	identity(value) {
		return value;
	},
	
	keys(o) {
		return Object.keys(o);
	},
	
	//target, ...source, deep = true
	merge() {
		let target = arguments[0];
		if (target == null) target = {};
// 		let output = this.clone(target); // Такой делать нельзя, так как если мы merge классов, то теряется prototype
		let output = Object.assign({}, target);
		let deep = false;
		
		if (typeof arguments[arguments.length - 1] == 'boolean') {
			deep = true;
			[].pop.apply(arguments);
		}
		
		for (let i = 1; i < arguments.length; i++) {
			let source = arguments[i];
			if (typeof target === 'object' && typeof source === 'object') {
// 			if (this.isObject(target) && this.isObject(source)) {
				_.each(source, (v, key) => { 
				//Object.keys(source).forEach(key => {
// 					if ((typeof v/* source[key] */ === 'object') && deep) {
					if (this.isObject(v) && deep) {
						if (!(key in output)) Object.assign(output, { [key]: v/* source[key] */ });
						else
							output[key] = this.merge(output[key], v/* source[key] */, deep);
					} else {
						Object.assign(output, { [key]: v/* source[key] */ });
					}
				});
			}
		}
		
		return output;
	},
	
	diff(a, b) {
		return Object.keys(a).filter(x => !b.hasOwnProperty(x));
//		return a.filter(x => !b.includes(x));
	},
	
	difference(a, b) {
		return a.filter(x => !b.includes(x));
	},
	
/*
	diff(a,b) {
	    let r = {};
	    _.each(a, (v, k) => {
	        if(b && b[k] != undefined && b[k] == v) return;
	        // but what if it returns an empty object? still attach?
	        r[k] = _.isObject(v) ? this.diff(v, b[k]) : v;

	        if (r[k] != undefined && _.isObject(r[k]) && _.size(r[k]) == 0) delete r[k];
        });
	    return r;
	},
*/	
	
	differenceWith(a, b, comparator) {
		if (comparator == undefined) comparator = this.isEqual;
		
		if (this.isObject(a)) {
		    let r = {};
		    _.each(a, (v,k) => {
		        if ((b[k] != undefined) && comparator(b[k], v)) return;
		        r[k] = (_.isObject(v) && b[k] != undefined) ? this.differenceWith(v, b[k], comparator) : v;
				
				if (r[k] != undefined && (_.isObject(r[k]) || _.isArray(r[k])) && _.size(r[k]) == 0) delete r[k];
	        });
	        
		    return r;
		} else {
			return a.filter(x => {
				for (let i in b) if (b.hasOwnProperty(i) && comparator(x, b[i])) return false;
				return true;
			});
		}
	},
	
	includes(collection, value, fromIndex) {
		collection = (typeof collection == 'object')?Object.values(collection):collection;
		fromIndex = fromIndex?fromIndex:0;
		
		return fromIndex <= collection.length && collection.indexOf(value, fromIndex) > -1;
	},
	
	symDiff(a, b) {
		return a.filter(x => !b.includes(x)).concat(b.filter(x => !a.includes(x)));
	},
	
	maxBy(array, iteratee) {
		iteratee = this._checkIteratee(iteratee);
		
		if (!array || !array.length) return undefined;
		
		let result = array[0];
		let key = iteratee(result);
		let tmp = null;
		for (let i = 1; i < array.length; i++) {
			if (key < (tmp = iteratee(array[i]))) {
				result = array[i];
				key = tmp;
			}
		}
		
		return result;
	},
	
	isEqual(a, b) {
        if ((typeof a == 'object') || (typeof a == 'array')) {
			return JSON.stringify(_.sort(a)) === JSON.stringify(_.sort(b));
		} else {
			return a === b;
		}
	},
	
	some(a, predicate) {
		if (typeof predicate == 'object') {
			let r = true;
			_.each(predicate, (v, k) => { r = r && (a[k] == v); })
			return r;
		} else {
			return (typeof predicate == 'function')?predicate(a):( (predicate == undefined)?a:(a == predicate) )
		}
	},
	
	filter(list, predicate) {
		let tmp = [];
		for (var i in list) if (list.hasOwnProperty(i) && this.some(list[i], predicate)) {
			tmp.push(list[i]);
		}
		
		return tmp;
	},
	
	find(list, predicate) {
		for (var i in list) if (list.hasOwnProperty(i) && this.some(list[i], predicate)) return list[i];
		return null;
	},
	
	findIndex(list, predicate) {
		for (var i in list) if (list.hasOwnProperty(i) && this.some(list[i], predicate)) return i;
		return -1;
	},
	
	sort(o) {
        let result = {};

        if (typeof o !== "object" || o === null) {
            if (parseInt(o) == o) return parseInt(o);
            return o;
        }

        Object.keys(o).sort().forEach((key) => {
            result[key] = this.sort(o[key]);
        });

        return result;
    },
	
	sortBy(list, key) {
		var keys = Object.keys(list);
		
		keys.sort(function(a, b) {
			let options = (typeof list[a][key] == typeof list[b][key] && typeof list[b][key] == 'number')?{'numeric': true}:undefined;
		    return list[a][key].toString().localeCompare(list[b][key].toString(), undefined, options);
		});
		
		let tmp = [];
		
		keys.forEach(function(k) {
		   tmp.push(list[k]);
		});
		
		return tmp;
	},
	
	sumBy(list, cb) {
		let tmp = 0;
		for(var i in list) if (list.hasOwnProperty(i)) tmp += cb(list[i], i);
		return tmp;
	},
	
	reduce(list, iteratee, accumulator) {
		for (var i in list) if (list.hasOwnProperty(i)) {
			accumulator = (accumulator == undefined)?list[i]:iteratee(accumulator, list[i]);
		}
		return accumulator;
	},
	
	sum(list, key = null) {
		return this.sumBy(list, (v, i) => { return key?v[key]:v; })
	},
	
	isEmpty(c) {
		return (c == null) || (c == '') || (Object.keys(c).length == 0);
	},
	
	values(obj) {
		var res = [];
	    for (var i in obj) {
	        if (obj.hasOwnProperty(i)) {
	            res.push(obj[i]);
	        }
	    }
		return res;
	}
}

window._ = _;

})();
(function( w, d ) { 'use strict';

let $mx = function(selector, context) {
	if (selector instanceof $mx) return selector;
	return new $mx.fn.init( selector, context );
}

let readyList = new Promise((resolve, reject) => {
	function completed() {
		d.removeEventListener( "DOMContentLoaded", completed );
		w.removeEventListener( "load", completed );
		resolve($mx);
		
		readyList = null;
	}
	
	d.addEventListener( "DOMContentLoaded", completed );
	w.addEventListener( "load", completed );
});

readyList.then(() => {
	$mx(document).trigger('ready');
});

let cssProps = { 
	float: "cssFloat" 
}

function checkSelector(selector) {
	selector = selector.replace(/\:(first|last)([\x20\t\r\n\f])?/ig, ':$1-child$2');
	selector = selector.replace(/\:(checkbox|password|radio|reset|submit|text)([\x20\t\r\n\f])?/ig, '[type=$1]$2');
	return selector;
}	

$mx.fn = $mx.prototype  = {
	length: 0,
	constructor: $mx,
	
	init: function(selector, context) {
		// Handle $(""), $(null), or $(undefined)
		if ( !selector ) return this;
		
		if (context instanceof $mx) context = context[0];
		if (selector instanceof $mx) return this.constructor(context).find(selector)

		if (typeof context == 'string') context = d.querySelector(checkSelector(context));

		// Handle $(DOMElement)
		let isWin = $mx.isWindow(selector);
		if ( selector.nodeType || isWin ) {
			if (selector.nodeType == 1 || selector.nodeType == 9 || isWin) {
				this[0] = selector;
				this.length = 1;
			}

			return this;
		}
		
		if (Array.isArray(selector) || (selector instanceof HTMLCollection)) {
			this.length = 0;
			for (let i = 0; i < selector.length; i++) {
				if (selector[i].nodeType == 1) {
					this[this.length] = selector[i];
					this.length++;
				}
			}
			return this;
		}
		
		if (typeof selector == 'function') {
			readyList?readyList.then(selector):selector($mx);
			return this;
		}		
		
		if (typeof selector == 'string') {
			
			let quickExpr = /^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/;
			let match = quickExpr.exec( selector );
						
			
			if (match && match[1]) {
				// HANDLE: $(html) -> $(array)
				let template = d.createElement('template');
				let html = selector.trim();
				template.innerHTML = html;
				this.length = 1;
				this[0] = template.content.firstChild;
			} else {
				if (!context || (context.nodeType != undefined)) {
					// HANDLE: $("#id")
// 						whitespace = "[\\x20\\t\\r\\n\\f]";
					let elem = (context || d).querySelectorAll(checkSelector(selector));
					
					if (elem && elem.length) {
						this.length = elem.length;
						for (let i = 0; i < elem.length; i++) this[i] = elem[i];
					}
				}
			}
			
			return this;
		}
		
		if (typeof selector == 'object') {
			this[this.length] = selector;
			this.length++;
			return this;
		}
	},
	
	children: function() {
		if (!this.length) return this;
		let childrens = [];
		
		this.each((elem) => {
			childrens = _.concat(childrens, Array.prototype.slice.call(elem.children));
		});		
		
		return $mx(childrens);
	},
	
	parent: function(selector) {
		if (!this.length) return this;
	    let parents = [];
		
		this.each((elem) => {
			if (selector) {
				while (elem = elem.parentNode) {
					if ((typeof elem.matches == 'function')?elem.matches(selector):elem.matchesSelector(selector)) break;
				}
			} else {
				elem = elem.parentNode;
			}
			
			parents.push(elem);
		})

		return $mx(parents);
	},
		
	parents: function() {
	    let parents = [];
		
		this.each((o) => {
		    let p = this[0].parentNode;
		    while (p !== document) {
		        var o = p;
		        parents.push(o);
		        p = o.parentNode;
		    }
		})

	    parents.push(document);
	    return $mx(_.uniq(parents));
	},
	
	find: function(selector) {
		return this.length?$mx(selector, this[0]):this;
	},
	
	closest: function(selector) {
		return $mx(this.length?this[0].closest(selector):null);
	},
	
	attr: function(name, value) {
		if (value) {
			this.each(o => o.setAttribute(name, value));
			return this;
		} else {
			return this.length?this[0].getAttribute(name):null;
		}
	},
	
	removeAttr: function(name) {
		this.each(o => o.removeAttribute(name));
		return this;
	},
	
	hasAttr: function(a) {
		return typeof(this.attr(a)) != 'undefined';
	},
	
	get: function(idx) {
		return (this.length > idx)?$mx(this[idx]):null;
	},
	
	first: function() {
		return this.get(0);
	},
	
	each: function(cb) {
		for (let i = 0; i < this.length; i++) cb.apply(this[i], [this[i]]);
	},

	addClass: function(value, timeout) {
		_.each((value || "").split(/\s+/), (s) => {
			this.each(elem => elem.classList.add(s));
		});
		
		if (timeout != undefined) setTimeout(() => this.removeClass(value), timeout);
		return this;
	},
	
	removeClass: function(value) {
		if (!Array.isArray(value)) value = [value];
		
		_.each(value, v => {
			_.each((v || "").split(/\s+/), (s) => {
				this.each(elem => elem.classList.remove(s));
			})
		});
		
		return this;
	},
	
	hasClass: function(selector) {
		return this.length && this[0].classList.contains(selector);
	},
	
	toggleClass: function(value, state) {
		_.each((value || "").split(/\s+/), (s) => {
			this.each(elem => elem.classList.toggle(s, state));
		})

		return this;
	},
	
	remove() {
		this.each((elem) => { elem.remove(); });
		return this;
	},
		
	append: function(obj) {
		if (this.length) $mx(obj).each(o => this[0].appendChild(o))
		return this;
	},
	
	prepend: function(obj) {
		if (this.length) $mx(obj).each(o => this[0].insertBefore(o, this[0].children[0]))
		return this;
	},
	
	insertBefore: function(obj) {
		let element = $mx(obj)[0];
		return this.insertBeforeAfter(element, element)
	},
	
	insertAfter: function(obj) {
		let element = $mx(obj)[0];
		return this.insertBeforeAfter(element, element.nextSibling)
	},
	
	insertBeforeAfter: function(element, reference) {
		this.each((o) => {
			element.parentNode.insertBefore(o, reference);
		});
		
		return this;
	},
	
	appendTo: function(obj) {
		// obj = $mx(obj);
		// 
		// this.each((o) => {
		// 	obj.append(o);
		// });
		
		$mx(obj).append(this);
		
		return this;
	},
	
	prependTo: function(obj) {
		// obj = $mx(obj);
		// 
		// this.each((o) => {
		// 	obj.prepend(o);
		// });
		
		$mx(obj).prepend(this);
		return this;
	},
	
	data: function(name, values) {
		if (values != undefined || typeof name == 'object') {
			values = (typeof name == 'object')?name:{[name]: values}

			_.each(values, (v, i) => {
				i = _.camelCase(i);
				this.each(o => o.dataset[i] = v);
			});
			
			return this;
		} else {
			if (this.length) {
				function checkType(v) {
					if (_.isInteger(v)) return parseInt(v);
					if (_.isFloat(v)) return parseFloat(v);
					return v;
				}
				
				if (name) {
					return checkType(this[0].dataset[_.camelCase(name)]);
				} else {
					let r = {};
					_.each(this[0].dataset, (v, i) => { r[i] = checkType(v); })
					return r;
				}
			} else {
				return [];
			}
			return this.length?(name?this[0].dataset[name]:this[0].dataset):[];
		}
	},
	
	index: function(elem) {
		if (!this.length) return -1;
		let nodes = null;
		
		if (elem) {
			nodes = elem.childNodes;
		} else {
			nodes = this[0].parentNode?this[0].parentNode.childNodes:[this[0]];
		}

		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i] == this[0]) return i;
		}
		
		return -1;
	},
	
	triggerHandler: function(eventName, detail) {
		return this.trigger(eventName, detail, true)
	},
	
	trigger: function(eventName, detail, onlyHandler) {
		eventName = eventName.split('.')[0];
		this.each((o) => {
			let event;
			if (window.CustomEvent) {
				event = new CustomEvent(eventName, {detail: detail});
			} else {
				event = document.createEvent('CustomEvent');
				event.initCustomEvent(eventName, true, true, detail);
			}
			
			Object.defineProperty(event, 'target', {writable: false, value: o});		

			if (o.dispatchEvent != undefined && !onlyHandler) {
				o.dispatchEvent(event);
			} else {
				// Не DOM события
				if (o.$tinyquery != undefined && o.$tinyquery[eventName] != undefined) {
					_.each(o.$tinyquery[eventName], (o) => {
						if (!Array.isArray(detail)) detail = [detail];
						detail.unshift(event);
						o.cb.apply(this, detail);
					});
				}
			}
			
			// Для selector event
			document.body.dispatchEvent(event);
		});
		
		return this;
	},
	
	_triggerEvent: function(e) {
		let obj = this;

		_.each(obj.$tinyquery[e.type], (o) => {
			let result = true;
			let target = e.target;
			
			if (o.selector) {
				do {
					if (target.nodeType == 1) {
						let matches = (typeof target.matches == 'function')?target.matches(o.selector):target.matchesSelector(o.selector);
						if (matches) result = o.cb.apply(target, [e]);
					}
				} while ((target = target.parentNode) && (target.nodeType != 9))
			} else {
				result = o.cb.apply(obj, [e]);
			}
			
			if (result === false) {
				e.preventDefault();
				e.stopPropagation();
			}
		})
	},
	
	on: function(types, selector, cb) {
		if (typeof selector == 'function') {
			cb = selector;
			selector = null;
		}

		if (cb == null || cb == undefined) return;
		
		let self = this;

		_.each(types.replace(/[ ]+/, ' ').split(' '), name => {
			name = name.split('.')[0];
			this.each((o) => {
				if (o.$tinyquery == undefined) o.$tinyquery = {};
				if (o.$tinyquery[name] == undefined) o.$tinyquery[name] = [];
				
				if (selector) {
					selector = checkSelector(selector);
					_.each(selector.replace(/[ ]+/, ' ').split(','), (s) => o.$tinyquery[name].push({selector: s, cb: cb}));
				} else {
					o.$tinyquery[name].push({cb: cb})
				}

				if (o.addEventListener != undefined) {
					o.addEventListener(name, self._triggerEvent);
				}
			});
		});

		return this;
	},
	
	one: function(types, selector, cb) {
		if (typeof selector == 'function') {
			cb = selector;
			selector = null;
		}

		let self = this;
		
		let cb2 = (e) => {
			cb.apply(this, [e]);
			self.off(types, selector, cb2);
		}
		
		return this.on(types, selector, cb2);
	},
	
	off: function(types, selector, cb) {
		if (typeof selector == 'function') {
			cb = selector;
			selector = null;
		}
		
		let self = this;

		_.each(types.replace(/[ ]+/, ' ').split(' '), name => {
			name = name.split('.')[0];
			this.each((o) => {
				// нет selector и нет cb, тость убираем все
				if (!selector && !cb) {
					o.removeEventListener(name, self._triggerEvent);
					if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined) delete o.$tinyquery[name];
				} else {
					if (selector) {
						_.each(selector.replace(/[ ]+/, ' ').split(','), (s) => {
							if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined) {
								for (let i = 0; i < o.$tinyquery[name].length; i++) {
									let event = o.$tinyquery[name][i];
									if ((event.selector == s) && ((event.cb == cb) || !cb)) {
										o.$tinyquery[name].splice(i, 1);
										break;
									}
								}
							}
						});
					} else {
						if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined) {
							for (let i = 0; i < o.$tinyquery[name].length; i++) {
								let event = o.$tinyquery[name][i];
								if ((event.cb == cb) || !cb) {
									o.$tinyquery[name].splice(i, 1);
									break;
								}
							}
						}
					}
					
					if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined && !o.$tinyquery[name].length) {
						o.removeEventListener(name, self._triggerEvent);
						delete o.$tinyquery[name];
					}
				}
			});
		});

		return this;
	},
	
	delegate: function (selector, types, fn) {
		return this.on(types, selector, fn);
	},
	
	undelegate: function (selector, types, fn) {
		return this.off(types, selector, fn);	
	},
	
	val: function(v) {
		if (v == undefined) {
			return (this.length && ['INPUT', 'TEXTAREA'].indexOf(this[0].tagName) != -1)?this[0].value:null;
		} else {
			this.each((o) => {
				if (['INPUT', 'TEXTAREA'].indexOf(o.tagName) != -1) o.value = v;
			})
			
			return this;
		}
	},
	
	is: function(selector) {
		if (!this.length) return false;
		return (typeof this[0].matches == 'function')?this[0].matches(selector):((typeof this[0].matchesSelector == 'function')?this[0].matchesSelector(selector):false);
	},
	
	has: function(target) {
		return this.filter((i, elem) => {
			let targets = $mx(target, elem);
			for (let i = 0; i < targets.length; i++) {
				if (elem.contains(targets[i])) return elem; 
			}

			return false;
		});
	},
	
	filter: function(cb) {
		if (typeof cb != 'function') return this.has(cb);
		
		let result = [];
		for (let i = 0; i < this.length; i++) {
			if (cb.apply(this[i], [i, this[i]])) result.push(this[i]);
		}

		return $mx(result);
	},
		
	html: function(v) {
		if (v != undefined) {
			if (v instanceof $mx) v = v.length?v[0].outerHTML:'';
			if (v.outerHTML != undefined) v = v.outerHTML;

			this.each((o) => {
				o.innerHTML = v;
			});
			
			return this;
		} else {
			return this.length?this[0].innerHTML:null;
		}
	},
	
	text: function(v) {
		if (v != undefined) {
			this.each((o) => {
				o.innerText = v;
			});
			
			return this;
		} else {
			return this.length?((typeof this[0].textContent == 'string')?this[0].textContent:this[0].innerText):'';
		}
	},
	
	clone() {
		return $mx(this.map(o => o.cloneNode(true)));
	},
	
	empty: function() {
		return this.html('');
	},
	
	hide() {
		return this.toggle(false);
	},
	
	show() {
		return this.toggle(true);
	},
	
	toggle(state) {
		this.each((o) => {
			o.style.display = (state == undefined)?((o.style.display == 'none')?'block':'none'):(state?'block':'none');
		});
		
		return this;
	},
	
	focus() {
		this.length && this[0].focus();
//		return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
	},
	
	viewportOffset: function() {
		if (this.length) {
			return this[0].getBoundingClientRect();
		} else {
			return {x: null, y: null, width: null, height: null, left: null, top: null, right: null, bottom: null};
		}
	},

	offset: function() {
		if (this.length) {
			var left = 0, top = 0;
			
			let elem = this[0];
			while (elem) {
				left += elem.offsetLeft;
				top += elem.offsetTop;
				elem = elem.offsetParent;
			}

			return {left: left, top: top}
		} else {
			return {left: null, top: null}
		}
		
	},
		
	position: function() {
		return this.length?{left: this[0].offsetLeft, top: this[0].offsetTop}:{left: null, top: null}
	},
	
	_scrollValue: function(method) {
		let props = { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }
		let elem = this[0];
		let win = $mx.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
		return  win?win[props[method]]:elem[method];
	},
	
	scrollTop: function() {
		return this._scrollValue('scrollTop');
	},

	scrollLeft: function() {
		return this._scrollValue('scrollLeft');
	},
	
	next: function() {
		return this.length?$mx(this[0].nextElementSibling || this[0].nextSibling):this;
	},
	
	prev: function() {
		return this.length?$mx(this[0].previousElementSibling || this[0].previousSibling):this;
	},
	
	eq: function(idx) {
		return $mx((this.length > idx)?this[idx]:null);
	},
	
	css: function(name, value) {
		let normalValue = (n, v) => {
			if (['width', 'height', 'left', 'top', 'right', 'bottom'].indexOf(n) != -1 && _.isNumber(v)) {
				v += 'px';
			}
			
			return v;
		}
		
		let normalName = (n) => {
			return (cssProps[n] != undefined)?cssProps[n]:_.camelCase(n);
		}
		
		if (_.isObject(name)) {
			for (let i in name) {
				let cc = normalName(i);
				let vv = normalValue(cc, name[i]);
				this.each((o) => o.style[cc] = vv);
			}
			return this;
		} else {
			name = normalName(name);
			
			if (value !== undefined) {
				value = normalValue(name, value);
				this.each((o) => {
					o.style[name] = value;
				})
				return this;
			} else {
				var view = this[0].ownerDocument.defaultView;

				if (!view || !view.opener) view = window;
				return this[0].style[name] || view.getComputedStyle(this[0]).getPropertyValue(name) || null;
			}
		}
	},
			
	map: function(cb) {
		return _.map($mx.makeArray(this), p => cb.apply(p, [p]));
	},
	
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},
	
	outerHeight: function() {
		let styles = window.getComputedStyle(this[0]);
		let margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);
		return this[0].offsetHeight + margin;
	},
	
	outerWidth: function() {
		let styles = window.getComputedStyle(this[0]);
		let margin = parseFloat(styles['marginLeft']) + parseFloat(styles['marginRight']);
		return this[0].offsetWidth + margin;
	},
	
	submit: function() {
		this.length && this[0].submit();
		return this;
	}
}

_.each(['click', 'resize', 'scroll', 'keypress', 'keydown', 'keyup', 'change', 'mouseenter', 'mouseleave', 'ready', 'load'], (name) => {
	$mx.fn[name] = function(selector, cb) {
		if (selector == undefined && cb == undefined) {
			return this.trigger(name);
		} else {
			return this.on(name, selector, cb);
		}
	}
});


_.each(['height', 'width'], (name) => {
	//_.each(['inner', 'outer', ''], (prefix) => {
		let func = name;//prefix?(prefix+name.substr(0, 1).toUpperCase() + name.substr(1)):name;
		$mx.fn[func] = function() { 
			if (this.length == 0) return null;

			let elem = this[0];
			
			let type = name.substr(0, 1).toUpperCase() + name.substr(1);
			
			if ($mx.isWindow(elem)) {
				// const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
				return elem['innerHeight'];
			} else if (elem.nodeType == 9) {
				let doc = elem.documentElement;
				return Math.max(
					elem.body["scroll" + type], doc["scroll" + type],
					elem.body["offset" + type], doc["offset" + type],
					doc["client" + type]
				);			
			} else {
				let style = w.getComputedStyle(this[0], null);
				return parseInt(style.getPropertyValue(func));
			}
		}
	//});
});

$mx.contains = function (context, elem) {
	context.contains(elem);
}

$mx.isWindow = function(obj) {
	return obj != null && obj === obj.window;
}

$mx.isFunction = function (obj) {
	return typeof obj === "function" && typeof obj.nodeType !== "number";
}

$mx.isset = function (a) {
	return typeof(a) != 'undefined' && a != null;
}

$mx.nvl = function(a,b) {
	return (typeof(a) == 'undefined' || a == null)?b:a;
}

$mx.param = function(obj, prefix) {
	var str = [];
	for (let p in obj) {
	    if (obj.hasOwnProperty(p)) {	
		    if (obj[p] == undefined) obj[p] = '';
		    if (typeof obj[p] == 'boolean') obj[p] = obj[p]?1:0;
		    let k = prefix ? prefix + "[" + p + "]" : p,
	        v = obj[p];
			str.push((v !== null && typeof v === "object") ?
	        $mx.param(v, k) :
	        encodeURIComponent(k) + "=" + ((v !== null)?encodeURIComponent(v):''));
	    }
  	}

  	return str.join("&");
}

$mx.getScript = function(url) {
	var a = document.createElement('script');
	a.type = 'text/javascript';
	a.src = url;
	document.head.appendChild(a);
}

$mx.extend = $mx.fn.extend = function() {
	let deep = false;
	let i = 0;
	let length = arguments.length;
	let extended = this;

	if (typeof arguments[0] == 'boolean') {
		deep = arguments[0];
		i++;
	}
	
	if (length > i+1) {
		extended = arguments[i];
		i++;
	}
	
	return _.merge(extended, arguments[i], deep);
};

$mx.each = function(list, cb) {
	for(let i in list) if (list.hasOwnProperty(i)) cb(i, list[i]);
}

$mx.makeArray = function(o) {
	let r = [];
	for (let i = 0; i < o.length; i++) r.push(o[i]);
	return r;
}

$mx.proxy = function(fn, context) {
	let args = Array.prototype.slice.call(arguments, 2);
	return function() {
		return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
	}
}

$mx.fn.init.prototype = $mx.fn;
w.$mx = $mx;

})(window, document);
(function( w, d ) {
/*
	url
	method
	data
	headers
	onUploadProgress
*/
$mx.request = function(options)	{
	return new Promise((resolve, reject) => {
		let data = {
			headers: Object.assign($mx.nvl(options.headers, {}), {'X-Requested-With': 'XMLHttpRequest'}),
			method: options.method || 'get',
			mode: options.mode || 'cors', // 'same-origin'
			credentials: options.credentials || 'include' //'same-origin'
		}
		
// 		let func = null;

		let url = options.url;

		switch (data.method) {
			case 'get':
				options.data = options.data || options.json;
				url = options.url + (_.isEmpty(options.data)?'':('?'+$mx.param(options.data)));
				break;
			case 'post':
				if (options.json != undefined) {
					data.body = JSON.stringify(options.json);
					data.headers['Content-Type'] = 'application/json';
				} else {
					if (options.data instanceof FormData) {
						data.body = options.data;
					} else if (typeof options.data == 'object') {
						data.body = $mx.param(options.data);
						data.headers['Content-Type'] = 'application/x-www-form-urlencoded';
					} else {
						data.body = options.data;
					}
					
					if (options.headers != undefined) data.headers = Object.assign(data.headers, options.headers);
				}
				break;
		}
		
		fetch(url, data).then((r) => {
			let contentType = r.headers.get('Content-Type');
			let cb = (data) => {
				resolve({data: data, headers: r.headers, status: r.status})
			}
			
			if (r.status == 429) {
				setTimeout(() => {
					this.request(options).then(resolve).catch(reject);
				}, 1000);
			} else {
				if (r.status >= 400) {
					reject();
				} else {
					if (contentType.split(';')[0] == 'application/json') {
						r.json().then(cb).catch(reject);
					} else {
						r.text().then(cb).catch(reject);
					}
				}
			}
		}).catch(reject);
	})
}

$mx.get = function(url, data) {
	return $mx.request({url: url, method: 'get', data: data});
}
	
$mx.post = function(url, data) {
	return $mx.request({url: url, method: 'post', data: data});
}

})(window, document);

+function (w) { "use strict";
	
$mx.lazyScripts = [];
$mx.lazyScriptsLoading = [];
$mx.lazyScriptsPrefix = null;

$mx(function() {
	let ld = $mx('meta[name="lazy-scripts-prefix"]');
	$mx.lazyScriptsPrefix = ld.length?ld.attr('content'):'/s';
	
	$mx.lazyScripts = _.filter(_.flatten([].concat(
		$mx.makeArray($mx('script[src]').map(function() { 
			if (this.src.indexOf('//cdn.jsdelivr.net/combine/') != -1) {
				let m = this.src.match(/\/js\/[^\/\?\,]+/g); 
				if (m) {
					return _.map(m, s => s.substr(4));
				}
				return null;
			} else {
				let m = this.src.match(/([^\/\?]+)(\?[0-9\.]+)?$/); 
				return m?m[1]:null; 
			}
		})),
		
		$mx.makeArray($mx('link[rel=stylesheet]').map(function() { var m = this.href.match(/([^\/\?]+)(\?[0-9\.]+)?$/); return m?m[1]:null; }))
	)));
});


$mx.lazy = function(scripts, styles, delegate, attributes) {
	if (typeof styles == "function") {
		delegate = styles;
		styles = null;
	}
	
	if (styles == null || styles == undefined) {
		styles = [];
	}
	
	let lazyAmount = 0;
	let m = document.querySelector("link[type='text/css']").href.match(/\?([0-9\.]+)/);
	let scriptsVersion = m?m[0]:'';
	
	let onCompleteLazy = () => {
		lazyAmount--;
	
		if ((lazyAmount == 0) && (typeof delegate == "function")) {
			delegate();
		}
	}	

	let onloadedLazy = (filename) => {
		for (let y in $mx.lazyScriptsLoading[filename]) {
			$mx.lazyScriptsLoading[filename][y].apply();
		}
		
		$mx.lazyScripts.push(filename);
		delete $mx.lazyScriptsLoading[filename];
	}
	
	let loadScript = (filename) => {
		if ($mx.lazyScripts.indexOf(filename) != -1) {
			onCompleteLazy();
		} else {
			if ($mx.lazyScriptsLoading[filename] == undefined) $mx.lazyScriptsLoading[filename] = [];
			$mx.lazyScriptsLoading[filename].push(onCompleteLazy);
	
			var a = document.createElement('script');
// 			a.async = true;
			a.type = 'text/javascript';
			if (filename.indexOf('//') != -1) {
				a.src = filename;
			} else {
				a.src = $mx.lazyScriptsPrefix+'/js/'+filename+scriptsVersion;
			}
			
			if (attributes != undefined) {
				_.each(attributes, (v, k) => {
					a.setAttribute(k, v);
				});
			}
			
			a.onload = () => { onloadedLazy(filename) };
			document.head.appendChild(a);
		}
	}

	let loadStyle = (filename) => {
		if ($mx.lazyScripts.indexOf(filename) != -1) {
			onCompleteLazy();
		} else {
			if ($mx.lazyScriptsLoading[filename] == undefined) $mx.lazyScriptsLoading[filename] = [];
			$mx.lazyScriptsLoading[filename].push(onCompleteLazy);

			var c = document.createElement('link');
			c.setAttribute("rel", "stylesheet");
			c.setAttribute("type", "text/css");
			if (filename.substring(0, 2) == '//') {
				c.setAttribute("href", filename);
			} else {
				c.setAttribute("href", $mx.lazyScriptsPrefix+'/css/'+filename+scriptsVersion);
			}
			c.onload = () => { onloadedLazy(filename) };
			document.head.appendChild(c);
		}
	}
	
	if (typeof scripts == 'string') scripts = [scripts];
	if (typeof styles == 'string') styles = [styles];
	
	lazyAmount = scripts.length + styles.length;
	
	if (lazyAmount) {
		for (i = 0; i < scripts.length; i++) loadScript(scripts[i]);
		for (i = 0; i < styles.length; i++) loadStyle(styles[i]);
	} else {
		delegate();
	}
}

}(window);
+function (d, w) { "use strict";
	
	var observer_list_add = [];
	var observer_list_remove = [];
	
	$mx.observe = function(selector, onAdd, onRemove) {
		$mx(function() {
			if (onAdd) {
				$mx(selector).each(function() { onAdd.call(this, $mx(this)); });
				observer_list_add.push([selector, onAdd]);
			}
			
			if (onRemove) {
				observer_list_remove.push([selector, onRemove]);
			}
		});
	}
		
	$mx(function() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

		if (!$mx.isset(MutationObserver)) {
			MutationObserver = function(callback) {
				this.onAdded = function(e) {
					callback([{ addedNodes: [e.target], removedNodes: [] }])
				}
				this.onRemoved = function(e) {
					callback([{ addedNodes: [], removedNodes: [e.target] }])
				}
			}
			
			MutationObserver.prototype.observe = function(target) {
				target.addEventListener('DOMNodeInserted', this.onAdded)
				target.addEventListener('DOMNodeRemoved', this.onRemoved)
			}
		
		}

		function matches(el, selector) {
			var fn = el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector
			return fn ? fn.call(el, selector) : false
		}
		
		function apply(nodes, list) {
			for (let i=0; i < list.length; i++) {
				let selector = list[i][0];
				let result = [];
			
				for (var j=0; j < nodes.length; j++) {
					let node = nodes[j];
					
					if (node.nodeType !== 1) continue;
					
					if (matches(node, selector)) {
						result.push(node);
					}
					
					let childs = node.querySelectorAll(selector);
					for (let c=0; c < childs.length; c++) result.push(childs[c]);
				}
				
				if (!result.length) continue;
				
				result.filter(function(node, id, self) {
					// Убираем дубли
					return self.indexOf(node) === id
				}).forEach(function(node) {
					list[i][1].call(node, $mx(node));
				})
			}
		}		
		
		var observer = new MutationObserver(function(mutations) {
			
			var addedNodes   = []
			var removedNodes = []
			
			mutations.forEach(function(mutation) {
				addedNodes.push.apply(addedNodes, mutation.addedNodes)
				removedNodes.push.apply(removedNodes, mutation.removedNodes)
			})		
			
			// filter moved elements (removed and re-added)
			for (var i = 0, len = removedNodes.length; i < len; ++i) {
				var index = addedNodes.indexOf(removedNodes[i])
				if (index > -1) {
					addedNodes.splice(index, 1)
					removedNodes.splice(i--, 1)
				}
			}		
			
			apply(addedNodes, observer_list_add);
			apply(removedNodes, observer_list_remove);
			
			addedNodes.length   = 0
			removedNodes.length = 0					
		})

		observer.observe(d.body, { childList: true, subtree: true });
	});
		
}(document, window);
function scrollIt(destination, direction = 'y', o = null, duration = 300, easing = 'linear', callback) {
	if (o == null) o = window;
	
	function getGlobalOffset(el) {
	    var x = 0, y = 0
	    while (el) {
	        x += el.offsetLeft
	        y += el.offsetTop
	        el = el.offsetParent
	    }
	    return { x: x, y: y }
	}

  const easings = {
    linear(t) {
      return t;
    },
/*
    easeInQuad(t) {
      return t * t;
    },
    easeOutQuad(t) {
      return t * (2 - t);
    },
    easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic(t) {
      return t * t * t;
    },
    easeOutCubic(t) {
      return (--t) * t * t + 1;
    },
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    easeInQuart(t) {
      return t * t * t * t;
    },
    easeOutQuart(t) {
      return 1 - (--t) * t * t * t;
    },
    easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    easeInQuint(t) {
      return t * t * t * t * t;
    },
    easeOutQuint(t) {
      return 1 + (--t) * t * t * t * t;
    },
    easeInOutQuint(t) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
*/
  };
  
  
  function getPosition() {
	  return (direction == 'y')?((o != window)?o.scrollTop:o.pageYOffset):((o != window)?o.scrollLeft:o.pageXOffset);
  }

  const start = getPosition();
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

  //const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
  //const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;

  const destinationOffset = Math.max(0, Math.floor( typeof destination === 'number' ? destination : getGlobalOffset(typeof destination == 'string' ? document.querySelector(destination) : destination)[direction] ));
  //const destinationOffsetToScroll = Math.round(destinationOffset - start);
 
  //const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);
  
  if (('requestAnimationFrame' in window === false) || !duration) {
  	if (direction == 'y') {
	    o.scroll(0, destinationOffset);
    } else {
	    o.scroll(destinationOffset, 0);
    }

    if (callback) {
      callback();
    }
    return;
  }

  function scroll() {
    const now = 'now' in window.performance ? performance.now() : new Date().getTime();
    const time = Math.min(1, ((now - startTime) / duration));
    const timeFunction = easings[easing](time);
    let v = (timeFunction * (destinationOffset - start)) + start;

    if (direction == 'y') {
	    o.scroll(0, v);
    } else {
	    o.scroll(v, 0);
    }
    
    if (Math.ceil(Math.floor(v - destinationOffset)) == 0) {
      if (callback) {
        callback();
      }
      return;
    }

    requestAnimationFrame(scroll);
  }

  scroll();
}

$mx.scrollIt = scrollIt;

$mx.fn.scrollIt = function(duration = 300, direction = 'y', container = null, easing = 'linear', callback) {
	scrollIt(this[0], direction, container, duration, easing, callback);
	return this;
}
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());


document.addEventListener("DOMContentLoaded", function() {
	/*
		Статистика кликов
	*/
	$events.on('tap', function(e, o) {
		if (window.account.tariff_current != 'basic') {
			if (o.stat) {
				if (navigator.sendBeacon != undefined) {
					navigator.sendBeacon('/api/stat/'+o.stat+'/ping.json');
				} else {
					$mx.get('/api/stat/'+o.stat+'/ping.json');
				}
			}
			
			if (o.pixels != undefined) {
				_.each(o.pixels, p => {
// 					console.log(p);
					switch (p.name) {
						case 'fb':
							if (window.fbq != undefined) window.fbq('trackCustom', p.event, p.param?{custom_param:p.param}:undefined);
							break;
					}
				});
			}
		}
	});
		
	let eventStack = {
		list: {},
		binds: {},
		
		push(part, name) {
			if (this.list[part] == undefined) this.list[part] = [];
			
			if (this.binds[part] != undefined) {
				_.each(this.binds[part], (cb) => {
					cb(name);
				})
			}
			
			this.list[part].push(name);
		},
		
		bind(part, cb) {
			if (this.binds[part] == undefined) this.binds[part] = [];
			
			if (this.list[part] != undefined) {
				_.each(this.list[part], (v) => {
					cb(v);
				});
			}
			
			this.binds[part].push(cb);
		}
	}
	
	window.eventStack = eventStack;
	
	var ecommerceEvent = null;
	
	// Отправляет данные в Facebook Pixel о продаже
	var m = document.location.hash.match(/#paid:([a-zA-Z0-9\+\/\\\=]+)/);
	
	if (m) {
		var s = decodeURIComponent(escape(window.atob(m[1]))).split(':');
		var products = [];
		if (s[3] != undefined) products.push({id: s[3], name: (s[4] == undefined)?s[3]:s[4]})
		ecommerceEvent = {type: 'purchase', id: s[0], budget: parseFloat(s[1]), currency: s[2], contents: products, content_type: 'product'};
		document.location.hash = document.location.hash.replace(/#paid:([a-zA-Z0-9]+)/, '');

		// Если затирать #paid меняется hash и форма закрывается
		// Какая форма?
		// document.location.hash = document.location.hash.replace(/#paid:([a-zA-Z0-9]+)/, '');
	}
/*
	 else {
		$mx('[data-ecommerce-event]').each(function() {
			let tariffs = _.map($mx(this).data('ecommerce-event').split(','), (o) => { return {id: o, name: o} });
			ecommerceEvent = {type: 'detail', products: tariffs};
		});
	}
*/
	
	var google_index = 64;
	var google_codes = [];

	var googleTagsLoadedUrl = null;

	$mx.observe('.googletags', (g) => {
		g.removeClass('googletags');

		var d = g.data();
		
		if (!googleTagsLoadedUrl) googleTagsLoadedUrl = '//googletagmanager.com/gtag/js?id='+d.id;

		$mx.lazy(googleTagsLoadedUrl, function() {
		   	console.log('Init googletag:', d.id);
			
			var is_customer = g.is('.googleanalytics-customer');
			gtag('config', d.id, is_customer?{}:{user_id: d.uid});
			
			$events.on('navigate', (e, to) => {
				gtag('config', d.id, {'page_path': to.path});
				gtag('event', 'page_view', {send_to: d.id});
			});
		    
		    if (is_customer) { 
				$events.on('tap', (e, o) => {
					if (o.addons && o.addons['googleanalytics-goal'] != undefined) {
						var ev = JSON.parse(o.addons['googleanalytics-goal']);
						
						gtag('event', ev.a, {
						  event_category: ev.c,
						  send_to: d.id
						});
					}
				});
			}
			
			var paidHandler = function(e, p) {
				let data = {
					transaction_id: p.id,
					affiliation: 'Taplink',
					value: p.budget,
					currency: p.currency,
					send_to: d.id
				};
				
				let domain = document.location.host.split('.');
				domain = domain[domain.length - 2]+'.'+domain[domain.length - 1];

// 				$mx.request({method: 'post', url: '/api/system/log.json', json: {data: data, domain: document.location.host, is_customer: is_customer}});
				
				let isTaplink = ['taplink.ru', 'taplink.at'].indexOf(domain) != -1;
				
				// Отправляем по API
/*
				if (isTaplink && !is_customer) {
					gtag('event', 'purchase', data);
				}
*/
				
				if (!isTaplink && is_customer) {
					gtag('event', 'purchase', data);
				}
			}
			
			$mx(document).on('paid', paidHandler);
			if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
			
			
			eventStack.bind('google', (name) => { gtag('event', name); });
		});
	});

	$mx.observe('.googleanalytics', (g) => {
		g.removeClass('googleanalytics');

		$mx.lazy('//www.google-analytics.com/analytics.js', function() {
				if (window.ga == undefined) return;
			
				google_index++;
				var name = String.fromCharCode(google_index);
				var d = g.data();
				
				if (google_codes.indexOf(d.id) != -1) return;
				google_codes.push(d.id);
			   	console.log('Init google: ', d.id);
				
				var is_customer = g.is('.googleanalytics-customer');
				
				ga('create', d.id, 'auto', name, is_customer?undefined:d.uid);

				if (d.require != undefined) {
					require = d.require.split(',');
					for (i = 0; i < require.length; i++) {
						ga(name+'.require', require[i]);
					}
				}

				ga(name+'.send', 'pageview');
				
				var hit = function(e, to) {
					ga(name+'.set', 'page', to.path);
					ga(name+'.send', 'pageview');
				}
				
			    $events.on('navigate', hit);
			    
				if (is_customer) { 
					$events.on('tap', (e, o) => {
						if (o.addons && o.addons['googleanalytics-goal'] != undefined) {
							var ev = JSON.parse(o.addons['googleanalytics-goal']);
							ga(name+'.send', 'event', ev.c, ev.a);
						}
					});
				}
				
				eventStack.bind('google', (n) => { ga(name+'.send', 'event', n); });
				
				var paidHandler = function(e, p) {
					ga(name+'.require', 'ecommerce');
					ga(name+'.ecommerce:addTransaction', {
						id: p.id,
						affiliation: 'Taplink',
						revenue: p.budget,
						currency: p.currency
					});
					
					ga(name+'.ecommerce:send');
				}
				
				$mx(document).on('paid', paidHandler);
				if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
		});
	});
	
	var metrika_index = 64;
	var metrika_codes = [];
	$mx.observe('.yandexmetrika', (m) => {
		m.removeClass('yandexmetrika');
	    let d = m.data();
	   	console.log('Init metrika: ', d.id);
	    
	    if (d.simple) {
			let hit = function(e, to) {
				// без ?блабла
				let img = $mx('<img class="stat" src="https://mc.yandex.ru/watch/'+d.id+'?page-ref='+encodeURIComponent(document.referrer)+'&page-url='+encodeURIComponent(document.location.origin+document.location.pathname)+'&rn='+Math.random()+'">').load(() => img.remove());
				img.appendTo(document.body);
		    }
		    				    
		    $events.on('navigate', hit);
		    hit();

	    } else {
			(function (doc, w, c, m) {
		    (w[c] = w[c] || []).push(function() {
		       try {
			       if (metrika_codes.indexOf(d.id) != -1) return;
				       metrika_codes.push(d.id);
				        metrika_index++;
				        d.ecommerce = 'dataLayer_'+String.fromCharCode(metrika_index);
				        window[d.ecommerce] = window[d.ecommerce] || [];
				        
				        var counter = new Ya.Metrika2(d);
				        w['yaCounter'+d.id] = counter;
				        
				        let hit = function(e, to) {
					        counter.hit(to.path);
					    }
					    				    
					    $events.on('navigate', hit);
					    
					    if (m.is('.yandexmetrika-customer')) { 
						    window.$events.on('tap', (e, o) => {
								if (o.addons && o.addons['yandexmetrika-goal']) {
									counter.reachGoal(o.addons['yandexmetrika-goal']);
								}
							});
						    
	/*
							$mx(document.body).on('click', '[data-addons-yandexmetrika-goal]', function() {
								counter.reachGoal($mx(this).data('addons-yandexmetrika-goal'));
							});
	*/
						} else {
							$mx(doc).on('click', '[data-track-event="payment"]', function() {
								counter.reachGoal('payment');
							});
							
							let setUser = () => {
								if (window.account != undefined && window.account.profile_id) {
// 									console.log('metrika: set user_id:', window.account.profile_id);
									counter.setUserID(window.account.profile_id);
								}
							}
							
							window.$events.on('account:refresh', () => {
								setUser();
							});

							setUser();
						}
						
						var paidHandler = function(e, p) {
							var obj = {ecommerce: {}}
							
							if (p.currency != undefined) obj.ecommerce.currencyCode = p.currency;
							
							obj.ecommerce[p.type] = {
								products: p.products
							}
							
							if (p.type == 'purchase') obj['ecommerce'][p.type]['actionField'] = {
								id: p.id,
								revenue: p.budget
							}						
							
							window[d.ecommerce].push(obj);
						}
						
						eventStack.bind('metrika', (name) => { counter.reachGoal(name); })
						
						$mx(doc).on('paid', paidHandler);
						if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
						
						
	// 					$mx(document).on('startup', () => { counter.reachGoal('startup'); });
		       } catch(e) { }
		    });
		
			$mx.lazy("https://cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js");
			
			})(document, window, "yandex_metrika_callbacks2", m);
		}
	});	
	
	$mx.observe('.facebookpixel', (p) => {
		p.removeClass('facebookpixel');
		
		!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
		n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
		n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
		t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
		document,'script','https://connect.facebook.net/en_US/fbevents.js');
				
		p.each(function() { fbq('init', p.data('id')); });
		fbq('track', 'PageView');
		
		$mx(document).on('click', '[data-track-event="payment"]', function() {
			fbq('track', 'InitiateCheckout');
		});
		
		var hit = function(e, to) {
			fbq('track', 'PageView', {url: to.path});
		}
		
		var paidHandler = function(e, p) {
			if (window.fbq != undefined) {
				fbq('track', 'Purchase', {content_type: 'product', value: p.budget, currency: p.currency});
			}
		}

		if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
		
		var leadHandler = function(e, p) {
			if (window.fbq != undefined) {
				fbq('track', 'Lead');
			}
		}
		
		$events.on('viewProduct', function(e, p) {
			fbq('track', 'ViewContent', p);
		}, true);
		
		$events.on('lead', leadHandler);
		
		$events.on('navigate', hit);
	});

}, {once: true});

/*
$.nvl = function(a,b) {
	return (typeof(a) == 'undefined' || a == null)?b:a;
}

$.isset = function (a) {
	return typeof(a) != 'undefined';
}

$.fn.hasAttr = function(a) {
	return typeof($(this).attr(a)) != 'undefined';
}
*/

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

/*
$.app = {
	body: 'body',
	isApplication: false,
	domain: '',
	init: function () {	}
}
*/

//  navigator.sendBeacon('/analytics', data); <- стату отправлять так

/*

$.go = function(d, is_native, is_replace) {
	$('.modal.in').modal('hide');
// 	$($.app.body).removeClass('open-menu')

	if (typeof(d) == 'undefined') d = document.location.href;
	i = d.indexOf("#");
	if (i != -1) d = d.substr(0, i);
	if (is_native) {
		document.location = d;
	} else {
		$mx.router.open(d, 'replace', null, null, null, is_replace);
	}
}
*/



function go(d) {
	if (typeof(d) == 'undefined') d = document.location.href;
	i = d.indexOf("#");
	if (i != -1) d = d.substr(0, i);
	document.location = d;
}

$mx(function() {
	$mx(document.body).on('click', 'a[href="#"]', function(e) {
      e.preventDefault();
    });	

	if (document.location.hash.indexOf('#event=') != -1) {
		var p = document.location.hash.split('=');
		$mx('[href="#'+p[1]+'"]').click();
		
	} 
	
	$mx(document.body).on('keydown', '.skip-enter', function(e) {
		if (e.keyCode == 13) {
			e.preventDefault();
			return false;
		}
	});	
});

/*
function updateBlock(classname) {
	$('.'+classname).each(function() {
		var url = $(this).data('update-url');
		if (url) $(this).load(url);
	});
}
*/
/*

$.application = {
	name : null,
	topOffset: 0
}

$.layout = {
	current_path: '',

	isAuthorized: function() {
		return $('body').hasClass('authorized');
	},
	
	lang: function() {
		return $(document.body).data('lang');	
	},
	
	setCurrentPath: function(path) {
		if (path == undefined) path = document.location.pathname+document.location.search;
		$.layout.current_path = path;
	},
	
	hash: {
		current: '',
		inited: false,
		cb: null, 
		
		push: function(hash) {
			if (!$.layout.hash.inited) return;
			
			var h = document.location.hash;
			if (document.location.hash) h += ':';
			h += ((hash == undefined)?'none':hash);
			$.layout.hash.current = document.location.hash = h;
		},
		
		replace: function(hash) {
			var h = document.location.hash.split(':');
			h[h.length-1] = hash;
			
			$.layout.hash.current = document.location.hash = h.join(':');
		}	
	},
	
	isIOS: navigator.userAgent.match(/iphone|ipod|ipad/gi) != null,
	isTouch: 'ontouchstart' in window || 'onmsgesturechange' in window
};
*/



/*
$.window = {
	bindScroll: function(handler) {
		$($.window).bind('scroll', handler);
	},

	unbindScroll: function(handler) {
		$($.window).unbind('scroll', handler);
	},

	defaultHandler: function() {
		$($.window).triggerHandler('scroll', {scrollTop: this.pageYOffset, windowHeight:$(window).height()});
	},

	init: function() {
		$(window).bind('scroll resize', $.window.defaultHandler);
	}
}
*/


// Trick for mobile height: 100vh
// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/

function checkHeightCSS() {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', checkHeightCSS);
window.addEventListener('touchmove', checkHeightCSS);
window.addEventListener('load', checkHeightCSS);

checkHeightCSS();
$mx(checkHeightCSS);
var BlocksFactory = {
	defaults: {
		1: {text:"",text_size:"md",text_align:"left",color:"",font:""},
		2: {title:"",subtitle:"",type:"link",link_type:"link",link:"",phone:"",sms:"",email:"",link_page_id:null,product:"",collection:"",style:"one",animation:""},
		3: {items:[],messenger_style:"block"},
		4: {url:"", is_autoplay:false,is_autohide:false,poster:null},
		5: {break_size:30,icon:0,fullwidth:false,fading:false},
		6: {socials_style:"block",items:[]},
		7: {html:""},
		8: {avatar_size:65},
		9: {list:[],picture_size:100,carousel_ride:false,carousel_interval:5,is_desktop_fullwidth:false,options:{text:0,link:0}},
		10: {fields:[],fields_idx:1,form_text:"Спасибо за вашу заявку",form_btn:"Отправить",order_budget:0,order_purpose:"",payment_object_id:1,"is_order":0,"form_type":"text","paid_status_id":3,"paid_change_status":true},
		11: {"link_page_id":null,"title":""},
		12: {bounds:[],markers:[],show_buttons:true,is_fixed:true,show_types:false,show_zoom:false,show_street:false},
		13: {type:"1",timer:{"1":{date:"",time:""},"2":{days:"",hours:"",minutes:"",expires:""},"3":{time:""}}},
		14: {fields:[{title:"",text:""}]},
		15: {link: {title:"", type:"link",link:"",link_page_id:null,product:"",collection:""},p:null,is_link:false,is_scale:false,width:""}
	},
	
	checkFields(fields) {
		_.each(fields, s => {
			_.each(s.items, f => {
				f.options = _.merge(this.getDefaults(f.block_type_id), f.options, true);
				
				switch (f.block_type_id) {
					case 9:
						f.options.list = _.map(f.options.list, f => _.merge({p: null, s:"",t:"",link: {title:"", type:"link",url:"",link:"",link_page_id:null,product:"",collection:""}}, f, true));
						break;
				}
			})
		})
/*
		for (let i = 0; i < fields.length; i++) 
		for (let j = 0; j < fields[i].items.length; j++) {
			fields[i].items[j].options = _.merge(this.getDefaults(fields[i].items[j].block_type_id), fields[i].items[j].options, true);
			if (fields[i].items[j].block_type_id == 9) {
				console.log(fields[i].items[j].block_type_id, ':', this.getDefaults(fields[i].items[j].block_type_id));
			}
		}
*/
		return fields;
	},
	
	/*
		Если функция вызывается для подготовки данных для редактирования, то необходимо передать account, 
		если для сохранения, то account не передаем
	*/
	getDefaults(type_id/* , account, is_edit */) {
		let defaults = this.defaults[type_id] || {};
/*
		
		if (account) {
			if (is_edit) {
				if (type_id == 10) defaults.fields = [];
			} else {
				if (type_id == 1 && account.locale.text_direction == 'rtl') defaults.text_align = 'right';
			}
		}
*/
		
		
		return Object.assign(defaults, {design:{on:false}});
		
		/*
			switch ($this->values['block_type_id'])
						{
							case 1: //text
								if (SessionService::$raw['text_direction'] == 'rtl') $defaults_options['text_align'] = 'right';
								break;
						}
		*/
	}
}
/*! js-cookie v3.0.0-rc.1 | MIT */
;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, (function () {
    var current = global.Cookies;
    var exports = global.Cookies = factory();
    exports.noConflict = function () { global.Cookies = current; return exports; };
  }()));
}(this, (function () { 'use strict';

  function assign (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        target[key] = source[key];
      }
    }
    return target
  }

  var defaultConverter = {
    read: function (value) {
      return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    },
    write: function (value) {
      return encodeURIComponent(value).replace(
        /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
        decodeURIComponent
      )
    }
  };

  function init (converter, defaultAttributes) {
    function set (key, value, attributes) {
      if (typeof document === 'undefined') {
        return
      }

      attributes = assign({}, defaultAttributes, attributes);

      if (typeof attributes.expires === 'number') {
        attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
      }
      if (attributes.expires) {
        attributes.expires = attributes.expires.toUTCString();
      }

      key = encodeURIComponent(key)
        .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
        .replace(/[()]/g, escape);

      value = converter.write(value, key);
      
      var stringifiedAttributes = '';
      for (var attributeName in attributes) {
        if (!attributes[attributeName]) {
          continue
        }

        stringifiedAttributes += '; ' + attributeName;

        if (attributes[attributeName] === true) {
          continue
        }

        // Considers RFC 6265 section 5.2:
        // ...
        // 3.  If the remaining unparsed-attributes contains a %x3B (";")
        //     character:
        // Consume the characters of the unparsed-attributes up to,
        // not including, the first %x3B (";") character.
        // ...
        
        stringifiedAttributes += '=' + attributes[attributeName].toString().split(';')[0];
      }
      
      return (document.cookie = key + '=' + value + stringifiedAttributes)
    }

    function get (key) {
      if (typeof document === 'undefined' || (arguments.length && !key)) {
        return
      }

      // To prevent the for loop in the first place assign an empty array
      // in case there are no cookies at all.
      var cookies = document.cookie ? document.cookie.split('; ') : [];
      var jar = {};
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split('=');
        var value = parts.slice(1).join('=');

        if (value[0] === '"') {
          value = value.slice(1, -1);
        }

        try {
          var foundKey = defaultConverter.read(parts[0]);
          jar[foundKey] = converter.read(value, foundKey);

          if (key === foundKey) {
            break
          }
        } catch (e) {}
      }

      return key ? jar[key] : jar
    }

    return Object.create(
      {
        set: set,
        get: get,
        remove: function (key, attributes) {
          set(
            key,
            '',
            assign({}, attributes, {
              expires: -1
            })
          );
        },
        withAttributes: function (attributes) {
          return init(this.converter, assign({}, this.attributes, attributes))
        },
        withConverter: function (converter) {
          return init(assign({}, this.converter, converter), this.attributes)
        }
      },
      {
        attributes: { value: Object.freeze(defaultAttributes) },
        converter: { value: Object.freeze(converter) }
      }
    )
  }

  var api = init(defaultConverter, { path: '/', sameSite: 'lax' });

  return api;

})));
+function (d, w) { 'use strict';
	w.Firewall = {
		checkHTML: function(s) {
			s = s.replace(/data:text\/javascript;base64,(.*)?(['"])/g, 'data:text/javascript,void(null)$2');
			s = s.replace(/(document|window)\.location\.assign/g, 'void');
			s = s.replace(/(document|window)\.location\.replace/g, 'void');
			s = s.replace(/(document|window)\.location\.href\s*=/g, 'var href =');
			s = s.replace(/(document|window)\.location\s*=/g, 'var href =');
			s = s.replace(/http\-equiv=[\"\']?refresh[\"\']?/g, '');
			s = s.replace(/(<base)/g, '<div-base');
			

			if ($mx('html').is('.is-app')) {
				s = s.replace(/(<script)/g, '<div-script');
			}
			
			return s;		
		}
	};
	
	var base_atob = window.atob
	
	window.atob = function(s) {
		return w.Firewall.checkHTML(base_atob(s).replace(/(<script)/g, '<div-script'));
	};
	
	// Для хороших сайтов разрешаем eval, другим - нет
	if (w.account == undefined || w.account.status_id == undefined || w.account.status_id != 3) {
		window.eval = function(s) { }
	}
	
}(document, window);
var m = document.querySelector("link[type='text/css']").href.match(/\?([0-9\.]+)/);
var scriptsVersion = m?m[0]:'';

window.$events = {
	events: {},
	waits: {},
	
	on(name, cb, fireOld = false) {
		if (this.events[name] == undefined) this.events[name] = [];
		this.events[name].push(cb);
		
		// Если данные ушли раньше чем был .on, то выполняем их, но только первый .on заберет все данные
		if (fireOld && (this.waits[name] != undefined)) {
			_.each(this.waits[name], (v) => {
				cb(null, v);
			});
			
			delete this.waits[name];
		}
	},
	
	one(name, cb) {
		let cb2 = () => {
			cb();
			this.off(name, cb2);
		}

		this.on(name, cb2);
	},
	
	off(name, cb) {
		if (cb) {
			if (this.events[name] != undefined) {
				for (let i=this.events[name].length-1; i >= 0; i--) {
					if (this.events[name][i] === cb) {
						this.events[name].splice(i, 1);
						break;
					}
				}
			}
		} else {
			delete this.events[name];
		}
	},
	
	fire(name, o) {
		
		if (this.events[name] != undefined) {
			let tmp = _.map(this.events[name], v => v); // Чтобы off не удалял из списка и события не пропадали
			for (let i=0; i<tmp.length; i++) {
				tmp[i](null, o)
			}
		} else {
			if (this.waits[name] == undefined) this.waits[name] = [];
			this.waits[name].push(o)
		}
	}
}

$mx.observe('.map-view-init', function(o) {
	$mx.lazy('map.js', 'map.css', function() {
		var d = o.data();
		var options = JSON.parse(o.find('script[type="text/data"]').text());
		var markers = JSON.parse(o.find('script[type="text/markers"]').text());
		
		if (d.showZoom) o.addClass('map-view-with-zoom-control');
	
		var map = L.map(o[0], {
			dragging: !d.isFixed,
			doubleClickZoom: !d.isFixed,
			boxZoom: !d.isFixed,
			touchZoom: !d.isFixed,
			scrollWheelZoom: !d.isFixed,
			doubleClickZoom: !d.isFixed,
			zoomControl: true,
			attributionControl: false,
		}).setView([parseFloat(options.center.lat), parseFloat(options.center.lng)], options.zoom);
		
		if (options.bounds) map.fitBounds(options.bounds);
		
		L.control.attribution({prefix: ''}).addTo(map);

		//'https://maps.tilehosting.com/styles/basic/{z}/{x}/{y}.png?key=nN7lJ1jrAkjwLR6mBnns'
		L.tileLayer('/maps/{z}/{x}/{y}.png', {
	        attribution: '<a href="https://taplink.cc" target="_blank">Taplink</a> <span style="color:#ccc">|</span> <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
	        crossOrigin: true
		}).addTo(map);
		
		var icon = L.icon({
		    iconUrl: '/s/i/marker.png',
		    iconSize: [28, 37],
// 		    iconAnchor: [22, 94],
		    popupAnchor: [0, -10],
		    shadowUrl: '/s/i/marker-shadow.png',
		    shadowSize: [40, 50],
		    shadowAnchor: [12, 31]
		});
		
		let b = map.getBounds();
		
		//b = JSON.parse('{"_southWest":{"lat":58.00382307136166,"lng":56.2247657775879},"_northEast":{"lat":58.03418980610332,"lng":56.326904296875}}');
		//b = [[58.00382307136166, 56.2247657775879],[58.03418980610332,56.326904296875]];
		//map.fitBounds(b);
		
/*
		let resize = (e) => {
			let width = o.parent().width();
			console.log(width);
			console.log(width/548	);

			let sc = (548/width);
			let w = (sc*100);
			console.log(((1-sc)*100));
			
			map.fitBounds(b);
// 			o.css((sc < 1)?{transform:'scale(1)', width: '100%', left: '0'}:{transform:'scale('+sc+')', width: w+'%', left: '-'+((100-w)/2)+'%'});
//			map.setZoom(options.zoom+(e.newSize.x/548));
		}
*/
		
// 		map.on('resize', resize);
// 		resize({newSize: {x: o.width()}});
		
		for (var i = 0; i < markers.length; i++) {
			var v = markers[i];
			var marker = L.marker([parseFloat(v.lat), parseFloat(v.lng)], {icon: icon}).addTo(map);
			marker.bindPopup("<b>"+v.title+"</b>"+(v.text?('<div>'+v.text.replace(/\n/g, '<br>')+'</div>'):''));//.openPopup();
		}
	});
});  
$mx.observe('[type="tel"]', function(o) {
	if ((o.is('.skip-init') || !o.closest('.form-field').length) && !o.is('.need-init')) return;
	
	o.addClass('skip-init');
	
	let iti = null;
	let val = o.val();
	
	$mx.lazy('phone.js', () => {
		let country = o.data('country');
		
		iti = intlTelInput(o[0], {
			initialCountry: country?country:"auto",
			defaultCountry: country?country:"auto",
			preferredCountries: [country],//_.uniq([country, 'ru', 'ua', 'by', 'kz']),
			separateDialCode: true,
			autoHideDialCode: false,
			nationalMode: true,
		});
		
		o[0].iti = iti;
		
		o.on("open:countrydropdown", function() {
			let list = $mx('.iti--container').addClass('in');
			$mx('html').addClass('is-clipped');
			if (!$mx('.iti__country-list .iti__header').length) $mx('.iti__country-list').prepend($mx('<div class="iti__header"><div>'+o.data('title')+'</div><button type="button" class="modal-close is-small"></button></div>'));
		});

		o.on("close:countrydropdown", function() {
			$mx('.iti--container').removeClass('in');
			$mx('html').removeClass('is-clipped');
		});
		
		o.attr('mx-input-type', 'phone').addClass('mx-validate').on('change keyup keydown keypress countrychange', (e) => {
//			var val = iti.getNumber().toString().trim().replace(/[^0-9\+]/g, '');
			var val = e.target.value.trim().replace(/[^0-9\+]/g, '');
			val = val?val:'';
						
			
// 			var c = intlTelInput("getSelectedCountryData");
			var c = iti.getSelectedCountryData();
	
			// Если начинаетсяс кода — убираем код
//			if (c.dialCode != undefined && (val.substr(0, (c.dialCode.toString().length+1)*2) == '+'+c.dialCode+'+'+c.dialCode)) {

			if (c.dialCode != undefined && (val.substr(0, (c.dialCode.toString().length+1)) == '+'+c.dialCode)) {
				val = val.substr(c.dialCode.toString().length+1);
				iti.setNumber(val);
			}
/*
			else {
				iti.setNumber(val);
			}
*/

			
			// Если только код - зануляем, чтобы было пусто
			if (c.dialCode != undefined && ('+'+c.dialCode == val)) val = '';
			
			
	
//			var isValid = o.intlTelInput("isValidNumber") || (val == '');
			var isValid = iti.isValidNumber() || (val == '');

			var phone = o.closest('.iti').parent().find('.tel-phone');
			phone.val(val?(c.dialCode+val):val)

			
			var code = o.closest('.iti').parent().find('.tel-code');
			val = iti.getNumber().toString().trim().replace(/[^0-9\+]/g, '');
			
			code.val(val).trigger('change', {value: iti.getNumber().toString().trim().replace(/[^0-9\+]/g, '')});
			
			var valid = o.closest('.iti').parent().find('.tel-valid');
			valid.val(isValid?1:0).trigger('change');
		}).on('blur', (e) => {
			var val = e.target.value.trim().replace(/[^0-9\+]/g, '');
			iti.setNumber(val);
		}).trigger('countrychange');
	});
}, function(o) {
	if ((o[0].iti != undefined) && o[0].iti) o[0].iti.destroy();
});
$mx(function() {
	var body = $mx(document.body);
	var panZoomObject = null;
	
/*
	body.on('click', '.slider-arrow-right, .slider-arrow-left', function() {
		var p = $mx(this).parent();
		var idx = p.find('.slider-dot.active').index() + ($mx(this).is('.slider-arrow-right')?1:-1);
 		var dots = p.find('.slider-dot').removeClass('active');
 		if (idx >= dots.length) idx = 0;
 		if (idx < 0) idx = dots.length - 1
 		dots.eq(idx).addClass('active');
		p.find('.slider-slide').css({'transform': 'translateX(-'+idx*100+'%)'});
	});
*/
	function isMobile() {
		return window.matchMedia("(max-width: 767px)").matches?true:false;
	}

	function isDesktop(o) {
		return (window.matchMedia("(min-width: 1200px)").matches?true:false) && (o.closest('.is-allow-fullwidth').length > 0);
		//(o.closest('.main-block, .modal, [data-allow-zoom]').length == 0);
	}
	
/*
	function isTouch() {
		return ('ontouchstart' in window)?true:false;
	}
*/
	
	function checkPictureSrc(picture, is_second = false) {
		if (picture.attr('data-picture')) {
			if (picture.data('picture')) picture.css('background-image', 'url('+picture.data('picture')+')');
			picture.attr('data-picture', null);
		}
		
		// Если это не телефон, то картинку справа видно сразу и ее мы загружаем
		if (!is_second && (isMobile() || isDesktop(picture))) {
			checkPictureSrc(picture.closest('.slider-slide').next().find('.picture-container'), true);
			checkPictureSrc(picture.closest('.slider-slide').prev().find('.picture-container'), true);
		}
	}
	
	function moveSlide(o, user) {
		var idx = o.index();
		
		var p = o.closest('.slider');
		var slides = p.find('.slider-slide').removeClass('active');
		var dots = p.find('.slider-dot').removeClass('active');
		var picture = p.find('.picture-container').eq(idx);

		if (user) {
			var sp = o.closest('.slider-pictures[data-interval]');
			if (sp.length) {
				clearInterval(sp.attr('data-time'));
			}
		}

		var slider = picture.closest('.slider');
		
		if (!slider.length) return;
		
		var sc = $mx(document).scrollTop();
		var wn = $mx(window).height();
		
		var os = $mx(slider[0]).offset().top;//slider[0].offsetTop;
		var oh = slider[0].offsetHeight;
		
		if (os < sc+wn && (os+oh > sc)) {
			checkPictureSrc(picture);
		}
		
		dots.eq(idx).addClass('active');
		slides.eq(idx).addClass('active');
		
		slides.css({'transform': 'translateX(-'+idx*100+'%)'+(isDesktop(o)?' scale(.94)':'')});
		slides.eq(idx).css({'transform': 'translateX(-'+idx*100+'%)'+(isDesktop(o)?' scale(1)':'')});
		
		p.triggerHandler('change', [idx]);
		p.triggerHandler('changeindex', [idx]);
	}
	
	function setSliderInterval(o) {
		var dots = o.find('.slider-dot');
		
		var timeID = o.attr('data-time');
		if (timeID) {
			clearInterval(timeID);
		}
		
		var timeID = setInterval(function() {
			if (!o.data('is-sliding')) {
				var active = o.find('.slider-dot.active').index();
				moveSlide(dots.eq((active < dots.length-1)?(active+1):0), false);
			}
		}, Math.max(o.data('interval'), 1)*1000);
		
		o.attr('data-time', timeID);
	}

	body.on('click', '.slider-dot', function() {
		var o = $mx(this);
		//var p = o.closest('.slider-pictures[data-interval]');
		//if (p.length) setSliderInterval(p);
		moveSlide(o, true);
	}).on('click', '.slider-slide:not(.active)', function() {
		var o = $mx(this);
		if (isDesktop(o)) moveSlide(o, true);
	}).on('touchstart', '.slider', function(o) {
		var t = $mx(o.target);
		
		var p = t.closest('.slider');
		var sp = t.closest('.slider-pictures');
		var width = t.width(); 
		var height = t.height(); 
		var startX = o./* originalEvent. */touches[0].pageX;
		var startY = o./* originalEvent. */touches[0].pageY;
		var slides = p.find('.slider-slide');
		var dots = p.find('.slider-dot');
		var idx = p.find('.slider-dot.active').index();
		var amount = dots.length;
		var deltaX = 0;
		var deltaY = 0;
		var startTime = 0;
		var x = 0;
		var y = 0;
		
		var startZoomDeltaX = 0;
		var startZoomDeltaY = 0;
		var startZoomX = 0;
		var startZoomY = 0;
		
		var isAllowZoom = p.data('allow-zoom');
		
		var startDirection = null;
		
		sp.data('is-sliding', 1);
		
		slides.addClass('stop-transition');
		
// 		if (slides.length < 2) return;
		
		t.on('touchmove', function(e) {
			t = e./* originalEvent. */touches;
			x = t[0].pageX;
			y = t[0].pageY;
			
			deltaX = Math.ceil((x - startX) / width * 100);
			deltaY = Math.ceil((y - startY) / height * 100);
			
			if (t.length > 1 && !startDirection && isAllowZoom) {
				let b = e.target.getBoundingClientRect();

				if ($mx('.pan-zooming-background').length == 0) {
					$mx('<div class="pan-zooming-background"></div>').appendTo(body);
					$mx('html').addClass('is-clipped');
					panZoomObject = $mx(e.target).clone();
					panZoomObject.appendTo(body);
					panZoomObject.addClass('is-pan-zooming').css(b);
					
					startZoomX = t[1].pageX;
					startZoomY = t[1].pageY;
					startZoomDeltaX = Math.abs(x - startZoomX);
					startZoomDeltaY = Math.abs(y - startZoomY);
				}
				

				let scaleX = 1 + ((Math.abs(x - t[1].pageX) - startZoomDeltaX) / width);
				let scaleY = 1 + ((Math.abs(y - t[1].pageY) - startZoomDeltaY) / height);
				let scale = Math.max(scaleX, scaleY, 1);
				
				//let deltaZoomX = 
				// Тут сделано круто но с хамером https://codepen.io/bakho/pen/GBzvbB
				
				// translateX('+deltaX+'px) translateY('+deltaY+'px) translateZ(0px) 
				// translateX('+((x - startX) /* + (t[1].pageX - startZoomX) */)+'px) translateY('+((y - startY)/*  + (t[1].pageY - startZoomY) */)+'px) translateZ(0px)  
					
				panZoomObject.css('transform', 'translateX(0px) translateY(0px) translateZ(0px) scale('+scale+', '+scale+')');
			} else {
				startTime = e.timeStamp;
	
				if (Math.abs(deltaY) > Math.abs(deltaX) && (startDirection != 'x')) {
					startDirection = 'y';
					return true;
				} else {
					if (startDirection != 'y') {
						if (idx == 0 && deltaX > 0) deltaX = 0;
						if (idx == amount -1 && deltaX < 0) deltaX = 0;
						slides.css('transform', 'translateX('+(deltaX - (idx * 100))+'%)');
						startDirection = 'x';
					}
				}
			}			

			if (e.cancelable) {
				e.preventDefault();
				e.stopPropagation();
			}
		}).one('touchend touchcancel', function(e) {
			$mx(this).off('touchmove');
			slides.removeClass('stop-transition');
			sp.data('is-sliding', null);
			
			if ($mx('.pan-zooming-background').length) {
				$mx('.pan-zooming-background').remove();
				$mx('html').removeClass('is-clipped');
				panZoomObject.remove();
				panZoomObject = null;
			}
			
			if (startDirection != 'y') {
				var time = e.timeStamp - startTime;
				var velocityX = Math.abs(x - startX) / time;
				var direction = (Math.abs(x - startX) > Math.abs(y - startY))?'x':'y';
				var v = 0;
	
				if (velocityX > 0.4 && deltaX != 0 && direction == 'x') {
					deltaX = (deltaX > 0)?55:-55;
				}	
					
				if (deltaX < -50) moveSlide(dots.eq(idx+1), true);
				if (deltaX >  50) moveSlide(dots.eq(idx-1), true);
				if (deltaX < 50 && deltaX > -50) moveSlide(dots.eq(idx), false);
			}
		});
	});
	
	var scrollHandler = function() {
		$mx('.slider-pictures').each(function() {
			var os = $mx(this).offset().top;
			var oh = this.offsetHeight;
			
			var sc = $mx(document).scrollTop();
			var wn = $mx(window).height();

			if ((os - 200 < sc+wn) && (os+oh > sc)) {
				var picture = $mx(this).find('.slider-slide.active .picture-container');
				
				checkPictureSrc(picture);
			}
		});
	}
	
	$mx(document).on('scroll', scrollHandler);
// 	scrollHandler();
	
	$mx.observe('.slider-pictures', function() {
		scrollHandler();
	});
	
	$mx.observe('.slider-pictures[data-interval]', setSliderInterval, function(o) {
		clearInterval(o.attr('data-time'));
	});
});
Storage = {
	get(key, default_value) {
		let result = undefined;
		
		try {
			if (this.hasStorage()) {
				result = localStorage.getItem(key);
				
				if (result) {
					result = JSON.parse(result);
					
					if (result.expired_at && (result.expired_at < Date.now() / 1000 | 0)) {
						localStorage.removeItem(key);
						return undefined;
					}
					
					result = result.content;
				}
			} 
			
		} catch (e) {
	        result = undefined;
	    }
	    
		if (result == undefined) {
			result = Cookies.get(key);
		}
		
		return (result != undefined)?result:default_value;
	},
	
	set(key, value, expires, path) {
		try {
			if (this.hasStorage()) {
				let obj = { content: value }
				if (expires != undefined) obj.expired_at = (Date.now() / 1000 | 0) + expires; 
				localStorage.setItem(key, JSON.stringify(obj));
			} else {
				Cookies.set(key, value, { expires: expires, path: path?path:'/' });
			}
		} catch (e) { }
	},
	
	hasStorage() {
		return ("localStorage" in window && window.localStorage);
	}
}
/*
	screen 
		- bg
		- gradient
		- picture
		- bg_image
		- color
		- brightness
	avatar
		- color
	link
		- bg
		- color
		- border
		- radius
	bg
		- size: [width, cover, tile]
		- fixed
		- brightness
		- main_color
		
		
	mode:
		page, 
		design, 
		thumb, 
		view		Просмотр страницы в дизайнере (без редактирования)
*/

var globalFontsBase = {
	'Roboto': {f: 'sans-serif', w: '100,400,700'},
	'Lobster': {f:'cursive', w: '400,400,700'},
	'Pacifico': {f:'cursive', w: '400,400,700'},
	'Caveat': {f:'cursive', w: '400,400,700'},
	'Montserrat Alternates': {f:'sans-serif', heading_uppercase1: true},
	'Kelly Slab': {f:'cursive', w: '400,400,700'},
	'Pangolin': {f:'cursive', w: '400,400,700'},
	'Oswald': {f:'sans-serif', heading_uppercase1: true},
	'Open Sans Condensed': {f:'sans-serif', w: '300,300,700'},
	'Amatic SC': {f:'cursive', w: '400,400,700', heading_uppercase1: true},
	'Merriweather': {f:'serif', w: '300,400,700'},
	'Comfortaa': {f:'cursive', w: '300,500,700'},
	'PT Mono': {f:'monospace', w: '400,400,700'},
	'Open Sans': {f:'sans-serif', w: '300,400,700'},
	'Alice': {f: 'cursive', w: '400,400,700', heading_uppercase1: true},
	'IBM Plex Sans': {f:'sans-serif', heading_uppercase1: true},
	'Raleway': {f:'sans-serif', heading_uppercase1: true},

	'PT Sans': {f:'sans-serif', w: '400,400,700'},
	'PT Serif': {f:'serif', w: '400,400,700'},
	'Lato': {f:'sans-serif', w: '300,400,700'},
	'Open Sans': {f:'sans-serif', w: '300,400,700'},
	'Roboto Slab': {f:'serif', w: '200,400,700'},
	'Playfair Display': {f:'serif', w: '400,600,900'},
	'Cormorant Garamond': {f:'serif', w: '300,500,700'},
	'Russo One': {f:'sans-serif', w: '400,400,400', heading_uppercase1: true},
	'Source Sans Pro': {f:'sans-serif', w: '200,400,700'},
	'Montserrat': {f:'sans-serif', w: '200,400,700' },


	'Tajawal': {f:'sans-serif', w: '200,400,700' },
};

var globalFonts = Object.keys(globalFontsBase);
var globalFontsFallback = [];
for (i in globalFontsBase) {
	globalFontsFallback.push("'"+i+"', "+globalFontsBase[i].f);
	if (globalFontsBase[i].w == undefined) globalFontsBase[i].w = '200,400,700';
	globalFontsBase[i].ww = globalFontsBase[i].w.split(',');
	globalFontsBase[i].w = _.uniq(globalFontsBase[i].ww).join(',');
}

var FontsFactory = {
	used: {_:0},
	
	getFont(idx) {
		if (this.used[idx] == undefined) this.used[idx] = 1;
		return globalFontsFallback[idx];
	},
	
	getWeight(i, w) {
		return globalFontsBase[globalFonts[i]].ww[w];
	},
	
	getTransform(v) {
		let values = {
			n: 'none',
			u: 'uppercase'
		}
		
		return values[v];
	},
	
	isUpperCaseHeading(idx) {
		let f = globalFontsBase[globalFonts[idx]];
		return (f.heading_uppercase != undefined);
	},
	
	loadAll() {
		_.each(globalFonts, (v, i) => { if (this.used[i] == undefined) this.used[i] = 1; });
		this.check();
	},
	
	getTextSize(i) {
		let text_sizes = {sm: '1.03', md: '1.26', lg: '1.48', h3: '1.71', h2: '2.2', h1: '3.5'};
		return (text_sizes[i] || 1.26) + 'rem';
	},
	
	getLineHeight(i) {
		let lineHeights = {h2: 1.25, h1: 1.15};
		return (lineHeights[i] || 1.4);
	},
	
	check() {
		let need = [];
		_.each(this.used, (v, i) => {
			if ((i == '_') || !this.used[i] || i == undefined) return;
			need.push(globalFonts[i]+':'+globalFontsBase[globalFonts[i]].w);
			this.used[i] = 0;
		})
		
		if (need.length) {
			let link = '//fonts.googleapis.com/css?family='+_.map(need, v => { return v; }).join('|')+'&display=swap&subset=cyrillic,cyrillic-ext,latin-ext';
			$mx.lazy([], link);
		}
	}
}

var StylesFactory = {
	getBaseStyles() {
		return {
			heading: {font: 0, color: "#000000", transform: 'n', weight: 1},
			screen: {font:0, color: "#000000"},
			avatar: {color: "#777777"},
			link: {bg: "#7795f8", color: "#ffffff", transform: 'n', weight: 1, font: 0, subtitle: {color: "#ffffff", font: 0}, shadow: {x: 0, y: 0, b: 0, s: 0, color: '#000000', o: 20}, border: {width: 2}, radius: 3, align: "center", thumb: "left", hover: 1, transparent:0},
			bg: {position:"0% 0%",repeat: "repeat", opacity: 0, size: "tile", cover: false, fixed: 0, type: "solid", color1: "#eff2f7", color2: "", picture: null},
			block: {
				radius: 5,
// 				padding: 1,
				pictures: {title: '#000000', text: '#000000', button_text: '#0383de', bg: '#ffffff', nav: '#53a3e0'}
			},
			sections: {_: 0},
			extended: {items: [], base: {css: ''}}
		}
	},

	getDefaultSection(theme) {
		return _.clone({
			text: {color: theme.screen.color, font: theme.screen.font}, 
			heading: {color: theme.heading.color, font: theme.heading.font, weight: theme.heading.weight, transform: theme.heading.transform}, 
			link: {color: theme.link.color, bg: theme.link.bg, shadow: theme.link.shadow, weight: theme.link.weight, subtitle: {color: (theme.link.subtitle || theme.link).color}, transparent: theme.link.transparent, border: {width: theme.link.border.width}}, 
			bg: {type: 'solid', color1: theme.bg.color1, color2: '', picture: null, size: 'tile', repeat: 'repeat', position: '0% 0%'}, 
			indent: {on: false, radius: 20},
			padding: {top: 1, bottom: 1},
		});
	},
	
	checkStyles(theme) {
// 		if (theme.screen.font == undefined) theme.screen.font = 0; // Проверить чтолбы такого не было в БД	
		
/*
		console.log(this.getBaseStyles());
		console.log(theme);
		console.log(_.merge(this.getBaseStyles(), {link: {font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0}, heading: {font: (theme.screen != undefined && theme.screen != undefined)?theme.screen.font:0, color: (theme.screen != undefined && theme.screen.color != undefined)?theme.screen.color:'#000000'}}, theme, true));
*/

/*
		if ((theme.screen != undefined) && (theme.screen.font != undefined || theme.screen.color != undefined) && theme.heading == undefined) {
			theme.heading = {};
			if (theme.screen.font != undefined) theme.heading.font = theme.screen.font;
			if (theme.screen.color != undefined) theme.heading.color = theme.screen.color;
		}
*/
		
		if ((theme.link != undefined) && (theme.screen != undefined) && (theme.screen.font != undefined) && (theme.link.font == undefined)) {
			theme.link.font = theme.screen.font;
		}
		
		if ((theme.link != undefined) && (theme.link.transparent != undefined) && ((theme.link.transparent === true) || (theme.link.transparent === 1))) {
			theme.link.transparent = 100;
		}

/*
		if ((theme.link != undefined) && (theme.link.color != undefined || theme.link.font != undefined) && theme.link.subtitle == undefined) {
			theme.link.subtitle = {};
			if (theme.link.font != undefined) theme.link.subtitle.font = theme.link.font;
			if (theme.link.color != undefined) theme.link.subtitle.color = theme.link.color;
		}
*/
			
				
		theme = _.merge(this.getBaseStyles(), /*
{
			link:  {
				font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0, 
				subtitle: {font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0, color: (theme.link != undefined && theme.link.color != undefined)?theme.link.color:'#ffffff'}}, 
			heading: {
				font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0, 
				color: (theme.screen != undefined && theme.screen.color != undefined)?theme.screen.color:'#000000'}
		},
		*/ theme, true);
		
		if (theme.link.border == null || theme.link.border === "") theme.link.border = {width: 2};
		if (theme.link.radius == null || theme.link.radius === "") theme.link.radius = 3;
		
		if (typeof theme.link.radius == 'string') theme.link.radius = parseInt(theme.link.radius.replace('px', ''));
		if (typeof theme.link.border != 'object') theme.link.border = {width: parseInt(theme.link.border.replace('px', ''))};
		
		
		if (theme.html != undefined) {
			theme.extended.items.push({title: {en: ''}, html: theme.html, css: theme.css});
			delete theme.html;
			delete theme.css;
		}
		
		if (theme.animations != undefined) {
			theme.extended = theme.animations;
			delete theme.animations;
		}
		
		
		
/*
		_.each(theme.sections, (v, k) => {
			if (k == '_') return;
			if (!_.isObject(v.padding)) v.padding = {top: v.padding, bottom: 0};
		})
*/
		
		return theme;
	},
	
	getPageClasses(theme, account) {
		let r = [];
		
		if (theme && theme.bg != undefined) {
			
			let main_color = hexToRgb(theme.bg.color1, 'hash');
			main_color = _.sort(main_color);
			
			let main_color_values = Object.values(main_color);
			main_color = (main_color_values[0] > main_color_values[1]*1.2)?Object.keys(main_color)[0]:null;
			
			r = ['is-'+lightOrDark(theme.bg.color1), main_color?('is-bg-main-'+main_color):null];
		}
		
/*
		if (account != undefined && account.options != undefined) {
			if (account.options.max_width != undefined) r.push('max-page-container-'+account.options.max_width);
			if (account.options.valign != undefined) r.push('page-valign-'+account.options.valign);
		}
*/
		
		return r;
	},
	
	getShadow(v) {
		return (!(v.x + v.y + v.b + v.s) || !v.o)?'none':(v.x + 'px ' + v.y + 'px ' + v.b + 'px '+ v.s + 'px ' + transparentColor(100 - v.o, v.color));
	},
	
	properyChanged(base, section, name, revert = false, o) {
		if (!base || !section) return null;
		
		let props = {
			text: ['font', 'color'],
			heading: ['font', 'color', 'weight', 'transform'],
			link: ['color'],
			'link.subtitle': ['color'],
			'link.transparent': ['transparent'],
			'link.bg': ['bg'],
			'link.shadow': ['x', 'y', 's', 'b', 'o', 'color'],
			'link.border': ['width'],
			
			'bg.type': ['type'],
			'bg.color': ['color1', 'color2'],
			'bg.picture': ['picture'/* , 'link' */],
			'bg.size': ['size'],
			'bg.position': ['position'],
			'bg.repeat': ['repeat'],
			'bg.height': ['height'],
			'bg.opacity': ['opacity'],
			'indent': ['on'],
			'indent.radius': ['radius'],
			
			'padding.top': ['top'],
			'padding.bottom': ['bottom']
		}
		
		let r = false;
		
		_.each(props[name], v => { r |= !_.isEqual(base[v], section[v]); });
		
		if (revert) {
			if (r) {
				o.$confirm(o.$gettext('Вернуть по умолчанию?'), 'is-warning').then(() => {
					_.each(props[name], v => section[v] = base[v]);
				})
			}
		} else {
			return {'is-propery-changed': r}
		}
	},
	
	updateCSSBlock(css, parent) {
		if (typeof css != 'string') css = _.map(css, (o) => { return _.values(o).join("\n"); }).join("\n");
		
		const style = document.createElement('style');
	    const txtNode = document.createTextNode(css);
	    
	
	    style.appendChild(txtNode);
	    parent.innerHTML = '';
	    parent.appendChild(style);
	    
	    FontsFactory.check();
	},
	
	addStyle(styles, id, names, css, context) {
		if (styles['b:'+id] == undefined) styles['b:'+id] = [];
		styles['b:'+id].push(_.map(names?names:[''], (v) => { return context+'.b-'+id+' '+v}).join(',')+'{'+css.join(';')+'}');
	},
	
	prepareSectionStyles(section, idx, theme, styles, context, mode = 'page') {
		if (!_.size(section)) return;
		
		context = (context == undefined)?'':(context + ' ');
		let name = 's:'+idx;
		delete styles[name];
		
		//todo: убрать
		if (section.link.subtitle == undefined) section.link.subtitle = {color: section.link.color};
		
		let ss = [
			context+'.blocks-section.s-'+idx+(section.indent.on?' .section-main':'')+'{' + buildStylesBackground(section, 'html') + '}',
			context+'.blocks-section.s-'+idx+(section.indent.on?' .section-main':'')+' > div {' + buildStylesBackground(section, 'body') + '}',
// 			context+'.s-'+idx+'{ font-family: '+FontsFactory.getFont(section.text.font)+'}',

			context+'.blocks-section.s-'+idx+' .section-main > div {padding-top: '+(section.padding.top)+'rem;padding-bottom: '+(section.padding.bottom)+'rem;font-family: '+FontsFactory.getFont(section.text.font)+'}',

			context+'.s-'+idx+' .btn-link, '+context+'.s-'+idx+' .block-item .btn-link:hover, '+context+'.s-'+idx+' .block-item .btn-link:link, '+context+'.s-'+idx+' .block-item .btn-link:active, '+context+'.s-'+idx+' .block-item .btn-link:visited, .btn-socials-globe {--color-text:'+section.link.color+';background:'+transparentColor(section.link.transparent, section.link.bg)+
			
// 			(section.link.transparent?'':';border-width: 0')+
			(section.link.transparent?(';border-width:'+section.link.border.width+'px'):';border-width: 0')+
			
			((section.link.shadow == undefined)?'':(';box-shadow: ' + StylesFactory.getShadow(section.link.shadow)))+';color:'+section.link.color+';border-color:'+(section.link.bg)+'}',
			context+'.s-'+idx+' .btn-link-subtitle { color: '+section.link.subtitle.color+'}'
		];
		
/*
		if (section.bg.size == 'adaptive') {
			ss.push(context+'.blocks-section.s-'+idx+' { min-height: '+section.bg.height+'px }');
		}
*/
		
		if (section.indent.on) {
			ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px}");
			ss.push(context+".s-"+idx+" .section-main > div {padding-left: 1rem;padding-right: 1rem;border-radius: "+section.indent.radius+"px}");

			switch (mode) {
				case 'view':
					// — это убрали, так как design режим мы знаем,стили не повторятся, зато во время редактирования работает
// 					ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px;margin-left: 1rem;margin-right: 1rem}");
// 					ss.push(context+".s-"+idx+" .section-main > div {border-radius: "+section.indent.radius+"px}");
					break;
				case 'design':
// 					ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px;margin-left: 1rem;margin-right: 1rem}");
// 					ss.push(context+".s-"+idx+" .section-main > div {border-radius: "+section.indent.radius+"px}");
					ss.push(context+".s-"+idx+" .block-handle {margin-left: -1rem}");
	// 				ss.push(context+".s-"+idx+" .block-handle-link {margin-right: -1rem}");
			
					ss.push("@media (max-width: 767px) { "+context+".s-"+idx+" .section-main:not(.handles-hidden) {margin-left: 3rem} }");
					ss.push("@media (max-width: 767px) { "+context+".s-"+idx+" .block-handle {margin-left: -4rem} }");
					ss.push("@media (max-width: 767px) { "+context+".s-"+idx+" .block-item:not(.is-readonly) > div, "+context+".s-"+idx+" .block-item:not(.is-readonly) > div { padding-left: 0 } }");
					break;
// 				default:
// 					ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px}");
// 					ss.push(context+".s-"+idx+" .section-main > div {padding-left: 1rem;padding-right: 1rem;border-radius: "+section.indent.radius+"px}");
			}
			
			if (section.indent.radius) {
				switch (mode) {
					case 'view':
					case 'design':
						ss.push(context+".blocks-section.is-empty:first-child + .s-"+idx+" {margin-top: 1rem}");
						break;
					default:
						ss.push(context+".s-"+idx+":first-child {margin-top: 1rem}");
						ss.push(context+".s-"+idx+":last-child {margin-bottom: 1rem}");
						break;
				}
// 				ss.push(context+".s-"+idx+":first-child .section-main > div {margin-top: 1rem}");
			}
			
		}
		
		

		//if (section.heading != undefined && section.heading.font != undefined && section.heading.weight != undefined) 
		ss.push(context+".s-"+idx+" .is-heading {font-family: "+FontsFactory.getFont(section.heading.font)+";color:"+section.heading.color+";font-weight:"+FontsFactory.getWeight(section.heading.font, section.heading.weight)+";text-transform: "+FontsFactory.getTransform(section.heading.transform)+"}");
		styles[name] = ss.concat(buildTextColorStyles(section.text.color, '.s-'+idx));
	},
	
	prepareStyles(block_id, name, options, styles, context) {
		context = (context == undefined)?'':(context + ' ');
		delete styles[block_id];

		if (options.design != undefined && options.design.on) {
			let d = options.design;
			
			switch (name) {
				case 'collapse':
					if (d.color) {
						StylesFactory.addStyle(styles, block_id, ['.collapse-item', '.collapse-item > .a'], ['color:'+d.color+' !important'], context);
						StylesFactory.addStyle(styles, block_id, ['.collapse-icon:before', '.collapse-icon:after'], ['background:'+d.color+' !important'], context);
					}
					
					if (d.font) StylesFactory.addStyle(styles, block_id, null, ['font-family: '+FontsFactory.getFont(d.font)], context);
					break;
				case 'break':
					if (d.color) {
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner'], ['color:'+d.color+' !important'], context);
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner span:before', '.block-break-inner span:after'], ['background-color: '+d.color], context);
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner.has-fading span:before'], ['background: linear-gradient(to left, '+d.color+' 0%, rgba(255,255,255,0) 100%)', 'background: -webkit-linear-gradient(right, '+d.color+' 0%,rgba(255,255,255,0) 100%)'], context);
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner.has-fading span:after'], ['background: linear-gradient(to right, '+d.color+' 0%, rgba(255,255,255,0) 100%)', 'background: -webkit-linear-gradient(left, '+d.color+' 0%,rgba(255,255,255,0) 100%)'], context);
					}
					break;
				case 'pictures':
					StylesFactory.addStyle(styles, block_id, ['.slider-dot'], ['background-color:'+d.nav], context);
					StylesFactory.addStyle(styles, block_id, ['.slider-slide-title'], ['background-color:'+d.bg, 'color: '+d.title], context);
					StylesFactory.addStyle(styles, block_id, ['.slider-slide-text'], ['background-color:'+d.bg, 'color: '+d.text], context);
					StylesFactory.addStyle(styles, block_id, ['.slider-slide-link'], ['background-color:'+d.bg+' !important', 'color: '+d.button_text+' !important'], context);
					break;
			}
		}
	}
}

function hexToRgb(hex, return_type = 'string') {
	let result = [255,255,255];
	if (hex) {
		hex = hex.toString().trim().toLowerCase().replace('#', '');
		if (hex.length == 3) hex = hex+hex;
	    result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
	    result = result?[
	    	parseInt(result[1], 16), 
	    	parseInt(result[2], 16),
	    	parseInt(result[3], 16)]:[255,255,255];
    }
    
    switch (return_type) {
	    case 'hash':
	    	return {r: result[0], g: result[1], b: result[2]};
		case 'array':
			return result;
		default:
			return result.join(',');
    }
}

function lightOrDark(color) {
	if (typeof color != 'string') return 'light';
    var r, g, b, hsp;
    
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

    r = color >> 16;
    g = color >> 8 & 255;
    b = color & 255;
    
    hsp = Math.sqrt(
	    0.299 * (r * r) +
	    0.587 * (g * g) +
	    0.114 * (b * b)
    );

	return (hsp > 200)?'light':'dark';
}

function transparentColor(transparent, color) {
	if (transparent === 0) return color;
	if (transparent === 100) return 'transparent';

	if (color[0] == '#') color = color.substring(1);
	if (color.length == 3) color = color+color;
	return 'rgba('+hexToRgb(color)+','+(100-transparent)/100+')';
}


function isLightColor(color, lighterThan = 130) {
	color = hexToRgb(color, 'array');
    return color?(( color[0]*299 + color[0]*587 + color[0]*114 )/1000 > lighterThan):'is-light';
}


function buildStylesBackground(theme, part, mode) {
	bg = {};
	let b = theme.bg;
	let type = b.type;
	if (type == 'gradient' && (!b.color2 || (b.color1 == b.color2))) type = 'solid';
	
	if (b.picture != undefined && b.picture.link == undefined && b.picture.filename != undefined) {
		b.picture.link = '//'+Vue.prototype.$account.storage_domain+'/p/'+b.picture.filename+'?'+b.picture.version;
	} 
	
	switch (part) {
		case 'html':
			if (b.picture && b.picture.link) {
				bg = {p:'background-position:'+b.position, r:'background-repeat: '+b.repeat+'!important', i:'background-image:url('+b.picture.link+')'};
				
				bg.c = 'background-color: '+b.color1+' !important';
// 				if (b.opacity == 0) {
					switch (type) {
/*
						case 'solid':
							bg.c = 'background-color: '+b.color1+' !important';
							break;
*/
						case 'gradient':
							bg.i += ', linear-gradient('+b.color1+', '+(b.color2?b.color2:b.color1)+')';
							break;
					}
// 				}
				
				switch (b.size) {
					case 'width':
						bg.s = 'background-size: 100% auto !important';
						break;
					case 'cover':
						bg.s = 'background-size: cover !important';
						break;
					case 'adaptive':
						Object.assign(bg, {p:'background-position: 50% 0%', r: 'background-repeat:no-repeat', s: 'background-size: auto '+theme.bg.height+'px !important'})
						break;
					default:
						if (mode == 'thumb') bg.s = 'background-size: 100% !important';
						break;
				}
				
// 				if (b.fixed && (['design', 'thumb'].indexOf(mode) == -1)) bg.a = 'background-attachment: fixed';
			} else {
				if (b.opacity == 0) {
					switch (type) {
						case 'solid':
							bg.c = 'background-color: '+b.color1+' !important'; //background-image: unset;
							break;
						case 'gradient':
							bg.i = 'background-image: linear-gradient('+b.color1+', '+b.color2+')';
							break;
					}
				}
			}
			
			break;
		case 'body':
			if (b.opacity != 0) {
				if (type == 'gradient') {
					bg.i = 'background-image:linear-gradient('+((b.picture && b.picture.link)?('rgba('+hexToRgb(b.color1)+', '+(b.opacity/100)+'), rgba('+hexToRgb(b.color2)+', '+(b.opacity/100)+')'):(b.color1+', '+b.color2))+')';
				} else {
					bg.c = 'background-color: '+((b.picture && b.picture.link)?('rgba('+hexToRgb(b.color1)+', '+(b.opacity/100)+')'):b.color1);
				}
			}/*
 else {
				bg.c = 'background-color: unset;background-image: unset;';
			}
*/
			break;
	}
	
	if (((part == 'blocks'/*  && mode == 'design' */) /* || (part == 'body' && mode != 'design') */)) {
		if ((theme.screen != undefined) && (theme.screen.font != undefined)) {
			//let font = globalFonts[theme.screen.font];
			bg.f = "font-family: "+FontsFactory.getFont(theme.screen.font);
		}
// 		bg.c = 'color:'+theme.screen.color+' !important';

// 		body, button, input, select, textarea
	}
	
/*
	if (part == 'section') {
		bg.t = 'color: '+theme.text.color;
	}
*/
	
				
	return _.values(bg).join(';');
}


/*
function parseRule(css) {
	let tokenizer = /\s*([a-z\-]+)\s*:\s*((?:[^;]*url\(.*?\)[^;]*|[^;]*)*)\s*(?:;|$)/gi,
		obj = {},
		token;
	while ( (token=tokenizer.exec(css)) ) {
		obj[token[1].toLowerCase()] = token[2];
	}
	return obj;
}
*/

function applyCssContext(text, context) {
	context = context.trim();
	let mediaTokenizer = /(@media[^{]+)\{([\s\S]+?})\s*}/g;
	let keyframesTokenizer = /(@keyframes[^{]+)\{([\s\S]+?})\s*}/g;
	let tokenizer = /([\s\S]+?)\{([\s\S]*?)\}/gi;
	let media = [];
	let keyframes = [];
	let rules = [];
  
	text = text.replace(keyframesTokenizer, (m) => {
		keyframes.push(m);
		return '@@frame-'+keyframes.length+'{}';
    });
    
	text = text.replace(mediaTokenizer, (match, p1, p2) => {
		media.push(p1+'{'+applyCssContext(p2, context)+'}');
		return '@@'+media.length+'{}';
    });

	text = text.replace(/\/\*[\s\S]*?\*\//g, '');
	while ((token = tokenizer.exec(text))) {
		let rule = {
			selectorText : token[1].trim().split(/\s*\,\s*/g),
			style : token[2].trim()
		};
		rules.push(rule);
	}
	
	let s = _.map(rules, (rule) => { 
		let selector = _.map(rule.selectorText, s => {
    	s = s.trim();
		if (s.substr(0, 2) == '@@') return s; 
// 		return context + ' ' + s;
		return (s.indexOf('.device') == 0)?(context + s):(context + ' ' + s);
    });
		return selector + ' {' + rule.style + '}'  
	}).join("\n");
	
	for (let i = 1; i <= media.length; i++) s = s.replace('@@'+i+' {}', media[i-1]);
	for (let i = 1; i <= keyframes.length; i++) s = s.replace('@@frame-'+i+' {}', keyframes[i-1]);
	return s;
}


function buildTextColorStyles(color, context) {
	return [
		context+', '+context+' a, '+context+' a:hover, '+context+' span[href], '+context+' label, '+context+' .checkbox:hover, '+context+' .radio:hover, '+context+' .collapse-item .a, '+context+'.is-light .collection-bar .button, '+context+'.is-dark .collection-bar .button, '+context+'.is-light .collection-bar .button:hover, '+context+'.is-dark .collection-bar .button:hover {color:'+color+'}',
		context+' .block-break span:before, '+context+' .block-break span:after {background-color:'+color+'}',
		context+' .block-break-inner.has-fading span:before {background: linear-gradient(to left, '+color+' 0%, rgba(255,255,255,0) 100%); background: -webkit-linear-gradient(right, '+color+' 0%,rgba(255,255,255,0) 100%);}',
		context+' .block-break-inner.has-fading span:after {background: linear-gradient(to right, '+color+' 0%, rgba(255,255,255,0) 100%); background: -webkit-linear-gradient(left, '+color+' 0%,rgba(255,255,255,0) 100%);}',
		context+' .block-break:before {border-color: '+color+'}',
		context+' .collapse-icon::after, '+context+' .collapse-icon::before {background:'+color+'}',
		context+' .footer-link svg {fill: '+color+' !important}'
	];
}

function buildStyles(theme, mode, context) {
	context = (context == undefined)?'':(context + ' ');
	let container = (mode == 'design')?(context+'.screen'):'html';
	
	//todo: unpack темы
// 	theme = _.merge({block: {radius: 5, pictures: {title: '#000000', text: '#000000', button_text: '#0383de', bg: '#ffffff', nav: '#53a3e0'}}}, theme, true);
	
	let s =  [
// 		(theme.block != undefined && theme.block.radius != undefined && theme.block.radius)?(container+' { --block-radius: '+theme.block.radius+' }'):'',
		(context?context:container)+' { --block-radius: '+theme.block.radius+'px }',
// 		'.block-item a, .page a:hover, .block-item a:link, .block-item a:visited, .block-item a:active, .block-item span[href], .block-item label {color:'+theme.screen.color+'}',
		//transparentColor(theme.link.transparent?'transparent':theme.link.bg)
		context+'.block-item .btn-link, '+context+'.block-item .btn-link:hover, '+context+'.block-item .btn-link:link, '+context+'.block-item .btn-link:active, '+context+'.block-item .btn-link:visited, .btn-socials-globe {'+'background:'+transparentColor(theme.link.transparent, theme.link.bg)+';box-shadow: ' + StylesFactory.getShadow(theme.link.shadow)+';color:'+theme.link.color+';--color-text:'+theme.link.color+';'+
		'font-family: '+FontsFactory.getFont(theme.link.font)+';'+
		'font-weight:'+FontsFactory.getWeight(theme.link.font, theme.link.weight)+';'+
		'border-color:'+(theme.link.bg)+';border-radius:'+theme.link.radius+'px'+(((theme.link.border != undefined) && (theme.link.border.width != undefined) && (theme.link.border.width !== '') && (!(theme.link.transparent == false || theme.link.transparent == 0)))?(';border-width:'+theme.link.border.width+'px'):'')+'}',

		context+'.block-item .btn-link > .thumb > div.is-picture {border-radius:'+theme.link.radius+'px}',
		context+'.block-item .btn-link-title {text-transform: '+FontsFactory.getTransform(theme.link.transform)+';}',
		
		context+'.block-item .btn-link > div, '+context+'.btn-socials span {flex-grow: '+((theme.link.thumb == 'center')?0:1)+'}',
		
		context+'.slider-slide-text { background: '+theme.block.pictures.bg+'; color: '+theme.block.pictures.text+' }',
		context+'.slider-slide-title { color:  '+theme.block.pictures.title+' }',
		context+'.slider-slide-link { background: '+theme.block.pictures.bg+' !important;' +
			'font-family: '+FontsFactory.getFont(theme.link.font)+';'+
			'font-weight:'+FontsFactory.getWeight(theme.link.font, theme.link.weight)+';'+
			'text-transform: '+FontsFactory.getTransform(theme.link.transform)+';'+
			' color: '+theme.block.pictures.button_text+' !important}',
		
		context+'.slider-dot { background-color: '+theme.block.pictures.nav+'}',
		
		((theme.link.subtitle != undefined)?(context+'.btn-link-subtitle {color: '+theme.link.subtitle.color+';font-weight: normal;font-family: '+FontsFactory.getFont(theme.link.subtitle.font)+'}'):'')
		
	].concat(buildTextColorStyles(theme.screen.color, context.trim()?context:'.page'));
	
	if (mode != 'design') {
		switch (parseInt(theme.link.hover)) {
			case 1:
				s.push(context+'.btn-link:hover {opacity: 0.9}');
				break;
			case 2:
				s.push(context+'.btn-link {transition: transform .5s cubic-bezier(.2, 2, .2, 1)}');
				s.push(context+'.btn-link:hover {transform: scale(1.02)}');
				break;
		}
	}
	
	s.push(container + ' .theme-main:before, '+container+' .theme-main:after { background: none; }');
	
	if ((mode == 'page' || mode == 'design') && (theme.extended != undefined)) {
		if ((theme.extended.base != undefined) && theme.extended.base.css) {
			if (context) {
				s.push(applyCssContext(theme.extended.base.css, context));
			} else {
				s.push(theme.extended.base.css);
			}
		}

		if ((theme.extended.items != undefined) && _.size(theme.extended.items)) {
			_.each(theme.extended.items, a => {
				if (context) {
					s.push(applyCssContext(a.css, context));
				} else {
					s.push(a.css);
				}
			});
		}
	}
	
	if (theme.link.radius) {
		s.push(context+'.btn-link-style-two, '+context+'.btn-link-style-arr {;padding-left: 2rem !important;padding-right: 3rem !important; }');
		s.push(context+'.btn-link-style-two:before, '+context+'.btn-link-style-arr:before { right: 1.5rem }');
	}
	
	if ((mode == 'page') && theme.bg.fixed) {
		container = 'html:before';
		s.push(container+' { content:"";position:'+(theme.bg.fixed?'fixed':'absolute')+';top:0;left:0;width:100%;height:100%;z-index: -2 }');
	}
	
	
	s.push(container + '{' + buildStylesBackground(theme, 'html', mode) + ' }');
	
	if (mode == 'design') {
		s.push(context+'.page:before { content:""; }');
		s.push(context+' {' + buildStylesBackground(theme, 'blocks', mode) + ' }'); //.page-blocks
	}
		
	container = (mode == 'design')?(context+'.page:before'):'body';
	
	if ((mode == 'page') && theme.bg.fixed) {
		container = 'html:after';
		s.push('html:after { content:"";position:fixed;top:0;left:0;width:100%;height:100%;z-index: -1 }');
	}
	
	s.push(container + '{' + buildStylesBackground(theme, 'body', mode) + ' }');
	
	if (mode == 'page') {
		if ((theme.screen != undefined) && (theme.screen.font != undefined)) {
			let font = globalFonts[theme.screen.font];
			s.push("body, body button, body input, body select, body textarea, .iti__country {font-family: "+FontsFactory.getFont(theme.screen.font)+"}");
		}
	}
	
// 	s.push('.page, .block-text a, .block-form .form-field, .block-html a, .collapse-item a, .collapse-item .a, .footer-link, .footer-link:hover, .footer-link:link, .footer-link:visited, .footer-link:active, .product-container-text, .page .label, .flip-clock-label, .page .checkbox:hover, .page  .radio:hover, .collection-bar .button, .page .is-text {color:'+theme.screen.color+' !important}');
// 	s.push('.flip-clock-dot {background: '+theme.screen.color+'}');
	s.push(context+'.block-text {font-size:2.2em}');
	if (theme.heading != undefined && theme.heading.font != undefined) {
		s.push(context+".is-heading {font-family: "+FontsFactory.getFont(theme.heading.font)+";color:"+theme.heading.color+";font-weight:"+FontsFactory.getWeight(theme.heading.font, theme.heading.weight)+";text-transform: "+FontsFactory.getTransform(theme.heading.transform)+"}");
	}
	

	s.push(context+'.text-avatar {color:'+theme.avatar.color+' !important}');

	s.push(context+'.block-item .checkbox input:before, '+context+'.block-item .radio input:before {background:#fff;border-color:#d9d9d9;}');

	let border_checkbox_color = /* theme.link.border?theme.link.border: */theme.link.bg;
	if (theme.link.bg && (border_checkbox_color.toLowerCase() != '#ffffff')) {
		s.push(context+'.block-item .checkbox input:checked:before, '+context+'.block-item .radio input:checked:before {background:'+(theme.link.transparent?'transparent':theme.link.bg)+';border-color:'+border_checkbox_color+';}');
		s.push(context+'.block-item .checkbox input:after, '+context+'.block-item .radio input:after {border-color: '+theme.link.color+'}');
	} else {
		s.push(context+'.block-item .checkbox input:after, '+context+'.block-item .radio input:after {border-color: #333}');
	}


	s.push(context+'.basket-breadcrumbs {border-color:'+(/* theme.link.border?theme.link.border: */theme.link.bg)+'}');
	s.push(context+'.basket-breadcrumbs .button, '+context+'.basket-breadcrumbs label:after {background:transparent;border-color: '+(theme.link.bg)+' !important;color:'+theme.screen.color+'}');
	
	s.push(context+'.basket-breadcrumbs .active, '+context+'.basket-breadcrumbs label.active:after {background:'+(theme.link.transparent?'transparent':theme.link.bg)+';color:'+(theme.link.bg?theme.link.color:theme.screen.color)+' !important}');

	let border_color_focus = /* (theme.link.border && theme.link.border)?theme.link.border: */theme.link.bg;
	if (typeof border_color_focus == 'string' && border_color_focus.toLowerCase() != '#ffffff') s.push(context+'.block-form input[type="text"]:focus, '+context+'.block-form input[type="tel"]:focus, '+context+'.block-form input[type="email"]:focus, '+context+'.block-form input[type="number"]:focus, '+context+'.block-form textarea:focus, '+context+'.block-form .select select:focus, '+context+'.form-field .pagination-previous:focus, '+context+'.form-field .pagination-next:focus, '+context+'.form-field .pagination-link:focus {border-color: '+border_color_focus+' !important;box-shadow: 0 0px 0 1px '+border_color_focus+' !important;}');

	s.push(context+'.select-tap .button {' + (theme.link.bg?('border-color:'+theme.link.bg+' !important'):'') + '}');
	
	s.push(context+'.select-tap .button.in {border-color: '+(/* theme.link.border?theme.link.border: */theme.link.bg)+'!important;background:'+(theme.link.transparent?'transparent':theme.link.bg)+';color:'+theme.link.color+'}');
	 
	s.push(context+'.block-form .datepicker .datepicker-table .datepicker-body .datepicker-row .datepicker-cell.is-selected {background-color: '+(/* theme.link.border?theme.link.border: */theme.link.bg)+'}');
	s.push(context+'.block-form .datepicker .datepicker-table .datepicker-body .datepicker-row .datepicker-cell.is-today {background: whitesmoke;border-color: whitesmoke}');

	if (theme.link.align == 'left') {
		let offset = Math.max(16, Math.ceil(theme.link.radius / 2));
		s.push(context+'.btn-link-styled:before {right: '+offset+'px;content: "\\f054";}');
		s.push(context+'.btn-link-styled {text-align: left;padding-right: '+((offset*2)+16)+'px !important;justify-content: start;flex-direction: row !important;}');
		s.push(context+'.btn-link-styled.without-thumb {padding-left: '+offset+'px !important}');
	} else {
// 		s.push(context+'.btn-link .thumb {margin-right: -48px}');
// 		s.push(context+'.btn-link .thumb, '+context+'.btn-link .thumb > figure {width:unset !important}');
// 		s.push(context+'.btn-link .thumb > img {max-width:unset !important}');
	}
	
		
	return s.join("\n");
}
var VideoHelper = {
	matchers: [
		{r: /\.(mp4|m3u8|webm)/, p: 'file'},
		{r: /youtube\.com\/watch\?.*?v=([a-zA-Z0-9\-\_]+)/, p: 'youtube'},
		{r: /youtu\.be\/([a-zA-Z0-9\-\_]+)/, p: 'youtube'},
		{r: /youtube\.com\/embed\/([a-zA-Z0-9\-\_]+)/, p: 'youtube'},
		{r: /vimeo\.com\/(video\/)?([a-zA-Z0-9\-\_]+)/, p: 'vimeo'}
	],
	
	getProviderName: function(src) {
		for (i = 0; i < this.matchers.length; i++) {
			if (m = src.match(this.matchers[i].r)) {
				return this.matchers[i].p;
			}
		}
		
		return null;
	},
	
	getProvider: function(options, isAllowAutoplay) {
		let provider = null;
			
		let providers = {
// 				youtube: {s: '//cdn.jsdelivr.net/npm/videojs-youtube@2.6.1/dist/Youtube.min.js', t: 'video/youtube', techOrder:  ["youtube"]},
			youtube: {embeded: (m) => {
				let params = ['showinfo=0&rel=0&playsinline=0'];
				if (options.is_autoplay && isAllowAutoplay) params.push('autoplay=1&autohide=1');
				if (options.is_autohide) params.push('controls=0&disablekb=1');
				return 'https://www.youtube.com/embed/'+m[1]+'?'+params.join('&');
			}},
			vimeo: {embeded: (m) => {
				let params = [];
				if (options.is_autoplay && isAllowAutoplay) params.push('autoplay=1');
				if (options.is_autohide) params.push('title=0&byline=0&portrait=0');
				return 'https://player.vimeo.com/video/'+m[2]+'?'+params.join('&');
			}},
			file: {s: null, t: (filename) => {
				let formats = {
					'mp4': 'video/mp4',
					'm3u8': 'application/x-mpegURL',
					'webm': 'video/webm'
				}
			}}
		}

		for (i = 0; i < this.matchers.length; i++) {
			if (m = options.url.match(this.matchers[i].r)) {
				provider = providers[this.matchers[i].p];
				provider.match = m;
				break;
			}
		}
		
		return provider;
	}
};
+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options        = options
    this.$body          = $(document.body)
    this.$element       = $(element)
    this.$backdrop      =
    this.isShown        = null
    this.scrollbarWidth = 0

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $mx.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    //var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

   this.$element.trigger('show.bs.modal', { relatedTarget: _relatedTarget })

//    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.$body.addClass('modal-open')

    this.setScrollbar()
    this.escape()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.backdrop(function () {
      var transition = false;//$.support.transition && that.$element.hasClass('fade')
      
      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }
      
      
      that.$element
        .addClass('in')
        .attr('aria-hidden', false)

      that.enforceFocus()

     // var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

/*
      transition ?
        that.$element.find('.modal-dialog') // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          }):
          //.emulateTransitionEnd(300) :
*/
        that.$element.trigger('focus').trigger('shown.bs.modal', { relatedTarget: _relatedTarget })
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

//    e = $.Event('hide.bs.modal')

    this.$element.trigger('hide.bs.modal')

   // if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.$body.removeClass('modal-open')

    this.resetScrollbar()
    this.escape()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .attr('aria-hidden', true)
      .off('click.dismiss.bs.modal');
/*

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(300) :
*/
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keyup.dismiss.bs.modal', $mx.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keyup.dismiss.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = false;//$.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $mx.proxy(function (e) {
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus.call(this.$element[0])
          : this.hide.call(this)
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(150) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback();
      }
/*
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(150) :
*/
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  Modal.prototype.checkScrollbar = function () {
    if (document.body.clientWidth >= window.innerWidth) return
    this.scrollbarWidth = this.scrollbarWidth || this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    if (this.scrollbarWidth) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', '')
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $mx.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string' && data[option] != undefined) data[option](_relatedTarget)
      else if (options.show && typeof data.show == 'function') data.show(_relatedTarget)
    })
  }

  var old = $mx.fn.modal

  $mx.fn.modal             = Plugin
  $mx.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $mx.fn.modal.noConflict = function () {
    $mx.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $mx.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
	      alert(1);
        $this.is(':visible') && $this.trigger('focus')
        $target.data('bs.modal', null);
      })
    })
    Plugin.call($target, option, this)
  })

}($mx);

function initVars() {
	$mx.touch = {
		isXS: screen.width < 768 || $mx(window).width() < 768,
		isSM: (screen.width >= 768) && (screen.width < 992),
		isApplication: $mx.isset(window.navigator.standalone) && window.navigator.standalone,
		isDevice: false,
		isTouch: 'ontouchstart' in window,
		initScroll: function() {},
		isIOS: navigator.userAgent.match(/iphone|ipod|ipad/gi) != null
	}
}

initVars();
$mx(window).on('resize', initVars);
/*
$mx.fn.caret = function() { return null; }
$mx.keyPreventEnter = function(e) {
	return (e.keyCode != 13);
}
*/

function getSearchParams() {
	let query = window.location.search.substring(1);
    let vars = query.split('&');
    let params = [];
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
		
	return params;    	
}

			
$mx(function() {
	var $body = $mx(document.body);
	
	function priceRound(v, d) {
		if (d.round == 'floor') v = Math.floor(v);
		if (d.round == 'ceil') v = Math.ceil(v);
		
		if (!isNaN(d.round)) {
			let p = Math.pow(10, d.round)
			v = Math.round(v*p) / p;
		}
		
		return v;
	}
	

/*
	$body.on('click', '.btn-group-tariffs a', function() {
		var o = $mx(this);
		var d = o.data();
		var n = o.closest('nav');
		var dp = n.data();
		$mx('.price-column[data-tariff]').each(function() {
			var column = $mx(this);
			
			var o = column.find('.priceMonthly');
			var t = column.find('.priceTotal');
			
			var base = o.data('price');
			var op = {minimumFractionDigits: dp.decimal, maximumFractionDigits: dp.decimal};
			
			var price = base - (base/100*d.discount);
			if (dp.promotion) {
				old_price = price;
				price = price - (price/100*dp.promotion);
			} else {
				old_price = '';
			}
			
			var price = priceRound(price, dp);
			
			o.find('.new-price span').html(price.toLocaleString(dp.locale, op))
			o.find('.old-price').css('display', (base == price)?'none':'inline');
			
			var prepaid = t.data('prepaid');
			
			t.find('.new-price').html(dp.currencyFormat.replace('%p', '<span style="font-size:2.5rem">'+((price*d.long) - (prepaid?prepaid:0)).toLocaleString(dp.locale, op)+'</span>').replace('%c', dp.currency));
			t.find('.new-price').attr('data-promotion-title', old_price?dp.currencyFormat.replace('%p', (old_price*d.long).toLocaleString(dp.locale, op)).replace('%c', dp.currency):'');

			column.find('.price-total-period').html(d.longText);
			if (prepaid) t.find('.old-price').html('<span>'+((price*d.long)).toLocaleString(dp.locale, op)+'</span>');

			column.find('.linkPromo').attr('href', '/tariffs/promo.html?period='+d.long+'&tariff='+column.data('tariff'));
		});
		
		n.find('li').removeClass('is-active');
		o.parent().addClass('is-active');

		$mx('#inputPeriod').val(d.long);
	}).on('click', '.btn-group-links-statistics .button', function() {
		var d = $mx(this).data();
		var o = $mx('#linksStatisticsData');
		o.load(o.data('url')+'&period='+d.period);
	}).on('click', '.btn-group-statistics .button', function() {
		var d = $mx(this).data();
		var o = $mx('#pageStatisticsData');
		o.load(o.data('url')+'?layout-refresh=1&period='+d.period);
	});
	
	

	$mx('.btn-group-tariffs a[data-long="12"]').click();
*/

	
/*
	$mx.observe('[data-tips-title]', function(o) {
		var d = o.data();
		
		o.attr('title', d.tipsTitle);
		o.removeAttr('data-tips-bit');
		
		var backdrop = $mx('<div class="modal-backdrop fade" />').appendTo(document.body);
		backdrop.addClass('in');
		
		var instance = tippy(o[0], {
			theme: 'light',
			animateFill: false,
		    trigger: 'manual',
		    hideOnClick: false,
		    interactive: false,
		    arrow: tippy.roundArrow,
		});
		
		var popper = instance.getPopperElement(o[0]);
		instance.show(popper);
		
		backdrop.one('click', function() {
			backdrop.removeClass('in');

			if (d.tipsBit) {
				$mx.get('/api/account/updatetipsbits.json?bit='+d.tipsBit);
			}
			
			instance.hide(popper);
			o.removeAttr('title');
			
			setTimeout(() => { backdrop.remove(); }, 150);
		});
	});
*/
	
	window.initStartup = function(d, cb) {
		//if (window.fbq != undefined) window.fbq('track', 'CompleteRegistration');
		$mx(document).trigger('startup');
		
		$mx.get('/api/account/updatetipsbits.json?bit=2');
		
		var page_holder = $mx('<div class="startup-helper-holder"></div>').appendTo(document.body);
		
		var tips = [
			{selector: '.is-new-block', title: d.langNewblock, placement: $mx.touch.isXS?'top':'right'},
			{selector: '.block-avatar img', title: d.langEditblock, placement: 'top'},
			{selector: '.block-handle', title: d.langSort, placement: $mx.touch.isXS?'right':'left'}
// 			{selector: '.form-control-link', title: d.langLink, placement: $.touch.isXS?'bottom':'top'},
		];
		
		var backdrop = $mx('<div class="modal-backdrop fade" />').appendTo(document.body);
		backdrop.addClass('in');
		
		var tips_objects = [];
		var tips_objects_holders = [];
		var tips_instances = [];
		
		function showTip(t) {
			var o = $mx(t.selector).first();//.attr('title', t.title);
			if (o && o.length) {
				var offset = o.offset();
				var w = o.outerWidth();
				var h = o.outerHeight();
				var p = $mx('<div></div>').insertAfter(o);//.css({width: w, height: h, 'background': 'red', });
				_.each(['width', 'height', 'margin', 'padding', 'position'], (v) => {
					p.css(v, o.css(v));
				});
				
	// 			$mx('.nobounce').scrollTo(o);
				
				o.css({position: 'absolute', 'z-index': 1050, width: w, height: h, left: offset.left, top: offset.top, 'opacity': 1}).appendTo(page_holder);
				
				tips_objects.push(o);
				tips_objects_holders.push(p);
				

				var instance = tippy(o[0], {
					theme: 'light',
// 					animateFill: false,
// 					boundary: 'viewport',
					placement: t.placement,
					appendTo: document.body,
				    trigger: 'manual',
				    hideOnClick: false,
				    interactive: false,
				    arrow: tippy.roundArrow,
				    showOnCreate: true,
				    allowHTML: true,
				    content: t.title,
/*
				    popperOptions: {
					    modifiers: {
					      preventOverflow: {
								boundariesElement: 'viewport',
								enabled: true
					      },
					    },
					  }
*/
/*
				    popperOptions: {
					    modifiers: [
						    {
							    name: 'preventOverflow',
								options: {
									boundariesElement: 'viewport',
									enabled: true
								}
						    }
						]
				    }
*/
				});
				
// 				var popper = instance.getPopperElement(o[0]);
// 				instance.show(popper);
	
				tips_instances.push({i: instance, o:o[0]});

				return true;
			} else {
				return false;
			}
		}	
		
		function closeTip(o, h, t) {
			o.removeAttr('title').css({position: '', top: '', left: '', opacity: '', width: "", height: "", 'z-index': ""}).insertBefore(h);

			t.i.hide();
// 			var popper = t.i.getPopperElement(t.o);
// 			t.i.hide(popper);

			h.remove();
		}
		
		function closeTips() {
			backdrop.removeClass('in');
			
			setTimeout(() => {
				backdrop.remove();
				if (cb != undefined) cb();
			}, 150);
			
/*
			backdrop.one('bsTransitionEnd', function () {
				backdrop.remove();
				if (cb != undefined) cb();
			});//.emulateTransitionEnd(150);
*/
			
			for (var i = 0; i < tips_objects.length; i++) {
				closeTip(tips_objects[i], tips_objects_holders[i], tips_instances[i]);
			}
			
			tips_objects = tips_objects_holders = tips_instances = [];
			page_holder.remove();
		}	
	        
		if ($mx.touch.isXS) {
			var i = 0;
			
			function showNextTips() {
				if (tips_objects.length) closeTip(tips_objects[0], tips_objects_holders[0], tips_instances[0]);
				tips_objects = [];
				tips_objects_holders = [];
				tips_instances = [];
				
				if (i == tips.length) {
					closeTips()
				} else {
					if (showTip(tips[i])) {
						backdrop.one('click', showNextTips);
						i++;
					} else {
						i++;
						showNextTips();
					}
				}
			}
			
			showNextTips();
		} else {
			for (var i = 0; i < tips.length; i++) {
				showTip(tips[i]);
			}
		
			backdrop.one('click', closeTips);
		}
	}
	
/*
	$mx(function() {
		$mx.observe('.trial-init', function(o) {
			o.removeClass('modal-hide').addClass($.touch.isXS?'downup':'zoom').modal('show').one('hidden.bs.modal', function() {
				o.addClass('modal-hide');
			});
		});
	});
*/

	/*
$body.on('click', '.projects-menu', function(e) {
		if ($mx(e.target).closest('ul').length) return;
		$mx(this).toggleClass('in');
		e.preventDefault();
		e.stopPropagation();
	}).on('click', function() {
		if (!$mx(this).closest('.projects-menu').length) $mx('.projects-menu:not(.lock)').removeClass('in');
	}).on('click', 'form[data-filter-place] input[name="id[]"]', function() {
		var form = $mx(this).closest('form');
		$mx(form.data('filter-place')).toggleClass('disabled', !form.find('input[name="id[]"]:checked').length);
	})
*/
	
});

$mx.observe('video', function(o) {
	o.removeAttr('controls');
});


$mx.observe('[data-blink]', function(o) {
	let cb = () => {
		o.addClass('active');
		setTimeout(() => {
			let s = o.text();
			let b = o.data('blink');
			o.text(b);
			o.data('blink', s);
			o.removeClass('active');
		}, 300);
	}
	
	let interval = setInterval(cb, 4000);
	o.attr('interval', interval);
}, function(o) {
	clearInterval(o.attr('interval'));
});


/*
function authCheck(r) {
	if (r && r.result == 'success') document.location = '/login/auth.html?uid='+r.uid+'&session='+r.session+'&redirect='+encodeURIComponent(document.location.href);
}
*/

function changeLocaleApp(e) {
	e.preventDefault();
	let o = $mx(e.target);
	let d = o.data();
	
	if (d.currentLocale == d.lang) return;
	
	let href = document.location.href;
	let is_dev = href.indexOf('dev.') != -1;
	
	href = href.substr(document.location.origin.length);
	
	if (window.base_path_prefix) {
		href = href.substr(window.base_path_prefix.length);
	}
	
	var c = Cookies.get();
	
	var url = '//'+(is_dev?'dev.':'')+'taplink.'+d.zone+(d.multilanguage?('/'+d.lang):'')+'/system/changelanguage.html?lang='+d.lang+'&redirect='+encodeURIComponent((d.multilanguage?('/'+d.lang):'')+href);

	if (c.uid) url += '&uid='+c.uid;
	if (c.session) url += '&session='+c.session;
	document.location.href = url;
}

function changeLocale(e, o, zone, lang, multilanguage, prefix) {
	e.preventDefault();
	
	var c = Cookies.get();
	
	var url = '//'+prefix+'taplink.'+zone+(multilanguage?('/'+lang):'')+'/system/changelanguage.html?lang='+lang+'&redirect='+encodeURIComponent(o.href);

	if (c.uid) url += '&uid='+c.uid;
	if (c.session) url += '&session='+c.session;
	document.location.href = url;
}

function hideLocaleMessage(o, lang) {
	$mx.get('/system/setlanguagecookie.html', {lang: lang});
	o.closest('.message').remove();
}

/*
function showAcademy() {
	$mx.lazy('//taplink.cc/id:2216046/widget/?button=0', () => {
		window.taplink.open()
	});
}
*/

$mx(function() {
	$mx(document.body).on('click', '.cookie-banner button', function(e) {
		let o = $mx(this);
		o.closest('.cookie-banner').addClass('is-closed');
		Cookies.set('cookie_privacy', 1);
		setTimeout(function() {
			o.remove();
		}, 1000);
	});

	$mx.observe('.cookie-banner', function() {
		var oldScrolled = window.pageYOffset || document.documentElement.scrollTop;
		
		var eventScroll = function() {
			var scrolled = window.pageYOffset || document.documentElement.scrollTop;
			if (Math.abs(scrolled - oldScrolled) > 1024) {
				$mx('.cookie-banner button').click();
				$mx(window).off('scroll', eventScroll);
			}
		}
		
		$mx(window).on('scroll', eventScroll);
	})

	
	window.addEventListener("touchmove", function(event) {
		if (event.scale != undefined && event.scale !== 1) event.preventDefault();
	}, { passive: false });
});

$mx.observe('.highlightjs', function(block) {
	$mx.lazy('//cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js', '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/atelier-seaside-light.min.css', () => {
		hljs.highlightBlock(block[0]);
	})
});
(function (global, factory) {
/*
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
*/
  (global = global || self, factory(global.Popper = {}));
}(this, (function (exports) { 'use strict';

  function getBoundingClientRect(element) {
    var rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      x: rect.left,
      y: rect.top
    };
  }

  /*:: import type { Window } from '../types'; */

  /*:: declare function getWindow(node: Node | Window): Window; */
  function getWindow(node) {
    if (node.toString() !== '[object Window]') {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView : window;
    }

    return node;
  }

  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft: scrollLeft,
      scrollTop: scrollTop
    };
  }

  /*:: declare function isElement(node: mixed): boolean %checks(node instanceof
    Element); */

  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  /*:: declare function isHTMLElement(node: mixed): boolean %checks(node instanceof
    HTMLElement); */


  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }

  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }

  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }

  function getNodeName(element) {
    return element ? (element.nodeName || '').toLowerCase() : null;
  }

  function getDocumentElement(element) {
    // $FlowFixMe: assume body is always available
    return (isElement(element) ? element.ownerDocument : element.document).documentElement;
  }

  function getWindowScrollBarX(element) {
    // If <html> has a CSS width greater than the viewport, then this will be
    // incorrect for RTL.
    // Popper 1 is broken in this case and never had a bug report so let's assume
    // it's not an issue. I don't think anyone ever specifies width on <html>
    // anyway.
    // Browsers where the left scrollbar doesn't cause an issue report `0` for
    // this (e.g. Edge 2019, IE11, Safari)
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }

  function getComputedStyle(element) {
    return getWindow(element).getComputedStyle(element);
  }

  function isScrollParent(element) {
    // Firefox wants us to check `-x` and `-y` variations as well
    var _getComputedStyle = getComputedStyle(element),
        overflow = _getComputedStyle.overflow,
        overflowX = _getComputedStyle.overflowX,
        overflowY = _getComputedStyle.overflowY;

    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }

  // Composite means it takes into account transforms as well as layout.

  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }

    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement);
    var scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };

    if (!isFixed) {
      if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }

      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }

    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  // Returns the layout rect of an element relative to its offsetParent. Layout
  // means it doesn't take into account transforms.
  function getLayoutRect(element) {
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }

  function getParentNode(element) {
    if (getNodeName(element) === 'html') {
      return element;
    }

    return (// $FlowFixMe: this is a quicker (but less type safe) way to save quite some bytes from the bundle
      element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
      element.parentNode || // DOM Element detected
      // $FlowFixMe: need a better way to handle this...
      element.host || // ShadowRoot detected
      // $FlowFixMe: HTMLElement is a Node
      getDocumentElement(element) // fallback

    );
  }

  function getScrollParent(node) {
    if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
      // $FlowFixMe: assume body is always available
      return node.ownerDocument.body;
    }

    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }

    return getScrollParent(getParentNode(node));
  }

  function listScrollParents(element, list) {
    if (list === void 0) {
      list = [];
    }

    var scrollParent = getScrollParent(element);
    var isBody = getNodeName(scrollParent) === 'body';
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : // $FlowFixMe: isBody tells us target will be an HTMLElement here
    updatedList.concat(listScrollParents(getParentNode(target)));
  }

  function isTableElement(element) {
    return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
  }

  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle(element).position === 'fixed') {
      return null;
    }

    return element.offsetParent;
  }

  function getOffsetParent(element) {
    var window = getWindow(element);
    var offsetParent = getTrueOffsetParent(element); // Find the nearest non-table offsetParent

    while (offsetParent && isTableElement(offsetParent)) {
      offsetParent = getTrueOffsetParent(offsetParent);
    }

    if (offsetParent && getNodeName(offsetParent) === 'body' && getComputedStyle(offsetParent).position === 'static') {
      return window;
    }

    return offsetParent || window;
  }

  var top = 'top';
  var bottom = 'bottom';
  var right = 'right';
  var left = 'left';
  var auto = 'auto';
  var basePlacements = [top, bottom, right, left];
  var start = 'start';
  var end = 'end';
  var clippingParents = 'clippingParents';
  var viewport = 'viewport';
  var popper = 'popper';
  var reference = 'reference';
  var variationPlacements = /*#__PURE__*/basePlacements.reduce(function (acc, placement) {
    return acc.concat([placement + "-" + start, placement + "-" + end]);
  }, []);
  var placements = /*#__PURE__*/[].concat(basePlacements, [auto]).reduce(function (acc, placement) {
    return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
  }, []); // modifiers that need to read the DOM

  var beforeRead = 'beforeRead';
  var read = 'read';
  var afterRead = 'afterRead'; // pure-logic modifiers

  var beforeMain = 'beforeMain';
  var main = 'main';
  var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

  var beforeWrite = 'beforeWrite';
  var write = 'write';
  var afterWrite = 'afterWrite';
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

  function order(modifiers) {
    var map = new Map();
    var visited = new Set();
    var result = [];
    modifiers.forEach(function (modifier) {
      map.set(modifier.name, modifier);
    }); // On visiting object, check for its dependencies and visit them recursively

    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function (dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);

          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }

    modifiers.forEach(function (modifier) {
      if (!visited.has(modifier.name)) {
        // check for visited object
        sort(modifier);
      }
    });
    return result;
  }

  function orderModifiers(modifiers) {
    // order based on dependencies
    var orderedModifiers = order(modifiers); // order based on phase

    return modifierPhases.reduce(function (acc, phase) {
      return acc.concat(orderedModifiers.filter(function (modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }

  function debounce(fn) {
    var pending;
    return function () {
      if (!pending) {
        pending = new Promise(function (resolve) {
          Promise.resolve().then(function () {
            pending = undefined;
            resolve(fn());
          });
        });
      }

      return pending;
    };
  }

  function format(str) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return [].concat(args).reduce(function (p, c) {
      return p.replace(/%s/, c);
    }, str);
  }

  var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
  var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
  var VALID_PROPERTIES = ['name', 'enabled', 'phase', 'fn', 'effect', 'requires', 'options'];
  function validateModifiers(modifiers) {
    modifiers.forEach(function (modifier) {
      Object.keys(modifier).forEach(function (key) {
        switch (key) {
          case 'name':
            if (typeof modifier.name !== 'string') {
              console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', "\"" + String(modifier.name) + "\""));
            }

            break;

          case 'enabled':
            if (typeof modifier.enabled !== 'boolean') {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', "\"" + String(modifier.enabled) + "\""));
            }

          case 'phase':
            if (modifierPhases.indexOf(modifier.phase) < 0) {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(', '), "\"" + String(modifier.phase) + "\""));
            }

            break;

          case 'fn':
            if (typeof modifier.fn !== 'function') {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', "\"" + String(modifier.fn) + "\""));
            }

            break;

          case 'effect':
            if (typeof modifier.effect !== 'function') {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', "\"" + String(modifier.fn) + "\""));
            }

            break;

          case 'requires':
            if (!Array.isArray(modifier.requires)) {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', "\"" + String(modifier.requires) + "\""));
            }

            break;

          case 'requiresIfExists':
            if (!Array.isArray(modifier.requiresIfExists)) {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', "\"" + String(modifier.requiresIfExists) + "\""));
            }

            break;

          case 'options':
          case 'data':
            break;

          default:
            console.error("PopperJS: an invalid property has been provided to the \"" + modifier.name + "\" modifier, valid properties are " + VALID_PROPERTIES.map(function (s) {
              return "\"" + s + "\"";
            }).join(', ') + "; but \"" + key + "\" was provided.");
        }

        modifier.requires && modifier.requires.forEach(function (requirement) {
          if (modifiers.find(function (mod) {
            return mod.name === requirement;
          }) == null) {
            console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
          }
        });
      });
    });
  }

  function uniqueBy(arr, fn) {
    var identifiers = new Set();
    return arr.filter(function (item) {
      var identifier = fn(item);

      if (!identifiers.has(identifier)) {
        identifiers.add(identifier);
        return true;
      }
    });
  }

  function getBasePlacement(placement) {
    return placement.split('-')[0];
  }

  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function (merged, current) {
      var existing = merged[current.name];
      merged[current.name] = existing ? Object.assign({}, existing, {}, current, {
        options: Object.assign({}, existing.options, {}, current.options),
        data: Object.assign({}, existing.data, {}, current.data)
      }) : current;
      return merged;
    }, {}); // IE11 does not support Object.values

    return Object.keys(merged).map(function (key) {
      return merged[key];
    });
  }

  var INVALID_ELEMENT_ERROR = 'Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.';
  var INFINITE_LOOP_ERROR = 'Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.';
  var DEFAULT_OPTIONS = {
    placement: 'bottom',
    modifiers: [],
    strategy: 'absolute'
  };

  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return !args.some(function (element) {
      return !(element && typeof element.getBoundingClientRect === 'function');
    });
  }

  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }

    var _generatorOptions = generatorOptions,
        _generatorOptions$def = _generatorOptions.defaultModifiers,
        defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
        _generatorOptions$def2 = _generatorOptions.defaultOptions,
        defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper(reference, popper, options) {
      if (options === void 0) {
        options = defaultOptions;
      }

      var state = {
        placement: 'bottom',
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, {}, defaultOptions),
        modifiersData: {},
        elements: {
          reference: reference,
          popper: popper
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state: state,
        setOptions: function setOptions(options) {
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions, {}, state.options, {}, options);
          state.scrollParents = {
            reference: isElement(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
            popper: listScrollParents(popper)
          }; // Orders the modifiers based on their dependencies and `phase`
          // properties

          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

          state.orderedModifiers = orderedModifiers.filter(function (m) {
            return m.enabled;
          }); // Validate the provided modifiers so that the consumer will get warned
          // if one of the modifiers is invalid for any reason

          {
            var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function (_ref) {
              var name = _ref.name;
              return name;
            });
            validateModifiers(modifiers);

            if (getBasePlacement(state.options.placement) === auto) {
              var flipModifier = state.orderedModifiers.find(function (_ref2) {
                var name = _ref2.name;
                return name === 'flip';
              });

              if (!flipModifier) {
                console.error(['Popper: "auto" placements require the "flip" modifier be', 'present and enabled to work.'].join(' '));
              }
            }

            var _getComputedStyle = getComputedStyle(popper),
                marginTop = _getComputedStyle.marginTop,
                marginRight = _getComputedStyle.marginRight,
                marginBottom = _getComputedStyle.marginBottom,
                marginLeft = _getComputedStyle.marginLeft; // We no longer take into account `margins` on the popper, and it can
            // cause bugs with positioning, so we'll warn the consumer


            if ([marginTop, marginRight, marginBottom, marginLeft].some(function (margin) {
              return parseFloat(margin);
            })) {
              console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', 'between the popper and its reference element or boundary.', 'To replicate margin, use the `offset` modifier, as well as', 'the `padding` option in the `preventOverflow` and `flip`', 'modifiers.'].join(' '));
            }
          }

          runModifierEffects();
          return instance.update();
        },
        // Sync update – it will always be executed, even if not necessary. This
        // is useful for low frequency updates where sync behavior simplifies the
        // logic.
        // For high frequency updates (e.g. `resize` and `scroll` events), always
        // prefer the async Popper#update method
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }

          var _state$elements = state.elements,
              reference = _state$elements.reference,
              popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
          // anymore

          if (!areValidElements(reference, popper)) {
            {
              console.error(INVALID_ELEMENT_ERROR);
            }

            return;
          } // Store the reference and popper rects to be read by modifiers


          state.rects = {
            reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
            popper: getLayoutRect(popper)
          }; // Modifiers have the ability to reset the current update cycle. The
          // most common use case for this is the `flip` modifier changing the
          // placement, which then needs to re-run all the modifiers, because the
          // logic was previously ran for the previous placement and is therefore
          // stale/incorrect

          state.reset = false;
          state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
          // is filled with the initial data specified by the modifier. This means
          // it doesn't persist and is fresh on each update.
          // To ensure persistent data, use `${name}#persistent`

          state.orderedModifiers.forEach(function (modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });
          var __debug_loops__ = 0;

          for (var index = 0; index < state.orderedModifiers.length; index++) {
            {
              __debug_loops__ += 1;

              if (__debug_loops__ > 100) {
                console.error(INFINITE_LOOP_ERROR);
                break;
              }
            }

            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }

            var _state$orderedModifie = state.orderedModifiers[index],
                fn = _state$orderedModifie.fn,
                _state$orderedModifie2 = _state$orderedModifie.options,
                _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
                name = _state$orderedModifie.name;

            if (typeof fn === 'function') {
              state = fn({
                state: state,
                options: _options,
                name: name,
                instance: instance
              }) || state;
            }
          }
        },
        // Async and optimistically optimized update – it will not be executed if
        // not necessary (debounced to run at most once-per-tick)
        update: debounce(function () {
          return new Promise(function (resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };

      if (!areValidElements(reference, popper)) {
        {
          console.error(INVALID_ELEMENT_ERROR);
        }

        return instance;
      }

      instance.setOptions(options).then(function (state) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state);
        }
      }); // Modifiers have the ability to execute arbitrary code before the first
      // update cycle runs. They will be executed in the same order as the update
      // cycle. This is useful when a modifier adds some persistent data that
      // other modifiers need to use, but the modifier is run after the dependent
      // one.

      function runModifierEffects() {
        state.orderedModifiers.forEach(function (_ref3) {
          var name = _ref3.name,
              _ref3$options = _ref3.options,
              options = _ref3$options === void 0 ? {} : _ref3$options,
              effect = _ref3.effect;

          if (typeof effect === 'function') {
            var cleanupFn = effect({
              state: state,
              name: name,
              instance: instance,
              options: options
            });

            var noopFn = function noopFn() {};

            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }

      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function (fn) {
          return fn();
        });
        effectCleanupFns = [];
      }

      return instance;
    };
  }

  var passive = {
    passive: true
  };

  function effect(_ref) {
    var state = _ref.state,
        instance = _ref.instance,
        options = _ref.options;
    var _options$scroll = options.scroll,
        scroll = _options$scroll === void 0 ? true : _options$scroll,
        _options$resize = options.resize,
        resize = _options$resize === void 0 ? true : _options$resize;
    var window = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

    if (scroll) {
      scrollParents.forEach(function (scrollParent) {
        scrollParent.addEventListener('scroll', instance.update, passive);
      });
    }

    if (resize) {
      window.addEventListener('resize', instance.update, passive);
    }

    return function () {
      if (scroll) {
        scrollParents.forEach(function (scrollParent) {
          scrollParent.removeEventListener('scroll', instance.update, passive);
        });
      }

      if (resize) {
        window.removeEventListener('resize', instance.update, passive);
      }
    };
  } // eslint-disable-next-line import/no-unused-modules


  var eventListeners = {
    name: 'eventListeners',
    enabled: true,
    phase: 'write',
    fn: function fn() {},
    effect: effect,
    data: {}
  };

  function getVariation(placement) {
    return placement.split('-')[1];
  }

  function getMainAxisFromPlacement(placement) {
    return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
  }

  function computeOffsets(_ref) {
    var reference = _ref.reference,
        element = _ref.element,
        placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference.x + reference.width / 2 - element.width / 2;
    var commonY = reference.y + reference.height / 2 - element.height / 2;
    var offsets;

    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference.y - element.height
        };
        break;

      case bottom:
        offsets = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;

      case right:
        offsets = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;

      case left:
        offsets = {
          x: reference.x - element.width,
          y: commonY
        };
        break;

      default:
        offsets = {
          x: reference.x,
          y: reference.y
        };
    }

    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

    if (mainAxis != null) {
      var len = mainAxis === 'y' ? 'height' : 'width';

      switch (variation) {
        case start:
          offsets[mainAxis] = Math.floor(offsets[mainAxis]) - Math.floor(reference[len] / 2 - element[len] / 2);
          break;

        case end:
          offsets[mainAxis] = Math.floor(offsets[mainAxis]) + Math.ceil(reference[len] / 2 - element[len] / 2);
          break;
      }
    }

    return offsets;
  }

  function popperOffsets(_ref) {
    var state = _ref.state,
        name = _ref.name;
    // Offsets are the actual position the popper needs to have to be
    // properly positioned near its reference element
    // This is the most basic placement, and will be adjusted by
    // the modifiers in the next step
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: 'absolute',
      placement: state.placement
    });
  } // eslint-disable-next-line import/no-unused-modules


  var popperOffsets$1 = {
    name: 'popperOffsets',
    enabled: true,
    phase: 'read',
    fn: popperOffsets,
    data: {}
  };

  var unsetSides = {
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto'
  }; // Round the offsets to the nearest suitable subpixel based on the DPR.
  // Zooming can change the DPR, but it seems to report a value that will
  // cleanly divide the values into the appropriate subpixels.

  function roundOffsets(_ref) {
    var x = _ref.x,
        y = _ref.y;
    var win = window;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: Math.round(x * dpr) / dpr || 0,
      y: Math.round(y * dpr) / dpr || 0
    };
  }

  function mapToStyles(_ref2) {
    var _Object$assign2;

    var popper = _ref2.popper,
        popperRect = _ref2.popperRect,
        placement = _ref2.placement,
        offsets = _ref2.offsets,
        position = _ref2.position,
        gpuAcceleration = _ref2.gpuAcceleration,
        adaptive = _ref2.adaptive;

    var _roundOffsets = roundOffsets(offsets),
        x = _roundOffsets.x,
        y = _roundOffsets.y;

    var hasX = offsets.hasOwnProperty('x');
    var hasY = offsets.hasOwnProperty('y');
    var sideX = left;
    var sideY = top;
    var win = window;

    if (adaptive) {
      var offsetParent = getOffsetParent(popper);

      if (offsetParent === getWindow(popper)) {
        offsetParent = getDocumentElement(popper);
      } // $FlowFixMe: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it

      /*:: offsetParent = (offsetParent: Element); */


      if (placement === top) {
        sideY = bottom;
        y -= offsetParent.clientHeight - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }

      if (placement === left) {
        sideX = right;
        x -= offsetParent.clientWidth - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }

    var commonStyles = Object.assign({
      position: position
    }, adaptive && unsetSides);

    if (gpuAcceleration) {
      var _Object$assign;

      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) < 2 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
    }

    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
  }

  function computeStyles(_ref3) {
    var state = _ref3.state,
        options = _ref3.options;
    var _options$gpuAccelerat = options.gpuAcceleration,
        gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
        _options$adaptive = options.adaptive,
        adaptive = _options$adaptive === void 0 ? true : _options$adaptive;

    {
      var transitionProperty = getComputedStyle(state.elements.popper).transitionProperty || '';

      if (adaptive && ['transform', 'top', 'right', 'bottom', 'left'].some(function (property) {
        return transitionProperty.indexOf(property) >= 0;
      })) {
//        console.warn(['Popper: Detected CSS transitions on at least one of the following', 'CSS properties: "transform", "top", "right", "bottom", "left".', '\n\n', 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', 'for smooth transitions, or remove these properties from the CSS', 'transition declaration on the popper element if only transitioning', 'opacity or background-color for example.', '\n\n', 'We recommend using the popper element as a wrapper around an inner', 'element that can have any CSS property transitioned for animations.'].join(' '));
      }
    }

    var commonStyles = {
      placement: getBasePlacement(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration: gpuAcceleration
    };

    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, {}, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive: adaptive
      })));
    }

    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, {}, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: 'absolute',
        adaptive: false
      })));
    }

    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      'data-popper-placement': state.placement
    });
  } // eslint-disable-next-line import/no-unused-modules


  var computeStyles$1 = {
    name: 'computeStyles',
    enabled: true,
    phase: 'beforeWrite',
    fn: computeStyles,
    data: {}
  };

  // and applies them to the HTMLElements such as popper and arrow

  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function (name) {
      var style = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name]; // arrow is optional + virtual elements

      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      } // Flow doesn't support to extend this property, but it's the most
      // effective way to apply styles to an HTMLElement
      // $FlowFixMe


      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function (name) {
        var value = attributes[name];

        if (value === false) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, value === true ? '' : value);
        }
      });
    });
  }

  function effect$1(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: '0',
        top: '0',
        margin: '0'
      },
      arrow: {
        position: 'absolute'
      },
      reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);

    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }

    return function () {
      Object.keys(state.elements).forEach(function (name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

        var style = styleProperties.reduce(function (style, property) {
          style[property] = '';
          return style;
        }, {}); // arrow is optional + virtual elements

        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        } // Flow doesn't support to extend this property, but it's the most
        // effective way to apply styles to an HTMLElement
        // $FlowFixMe


        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function (attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  } // eslint-disable-next-line import/no-unused-modules


  var applyStyles$1 = {
    name: 'applyStyles',
    enabled: true,
    phase: 'write',
    fn: applyStyles,
    effect: effect$1,
    requires: ['computeStyles']
  };

  function distanceAndSkiddingToXY(placement, rects, offset) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

    var _ref = typeof offset === 'function' ? offset(Object.assign({}, rects, {
      placement: placement
    })) : offset,
        skidding = _ref[0],
        distance = _ref[1];

    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }

  function offset(_ref2) {
    var state = _ref2.state,
        options = _ref2.options,
        name = _ref2.name;
    var _options$offset = options.offset,
        offset = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function (acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement],
        x = _data$state$placement.x,
        y = _data$state$placement.y;

    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y;
    }

    state.modifiersData[name] = data;
  } // eslint-disable-next-line import/no-unused-modules


  var offset$1 = {
    name: 'offset',
    enabled: true,
    phase: 'main',
    requires: ['popperOffsets'],
    fn: offset
  };

  var hash = {
    left: 'right',
    right: 'left',
    bottom: 'top',
    top: 'bottom'
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function (matched) {
      return hash[matched];
    });
  }

  var hash$1 = {
    start: 'end',
    end: 'start'
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function (matched) {
      return hash$1[matched];
    });
  }

  function getViewportRect(element) {
    var win = getWindow(element);
    var visualViewport = win.visualViewport;
    var width = win.innerWidth;
    var height = win.innerHeight; // We don't know which browsers have buggy or odd implementations of this, so
    // for now we're only applying it to iOS to fix the keyboard issue.
    // Investigation required

    if (visualViewport && /iPhone|iPod|iPad/.test(navigator.platform)) {
      width = visualViewport.width;
      height = visualViewport.height;
    }

    return {
      width: width,
      height: height,
      x: 0,
      y: 0
    };
  }

  function getDocumentRect(element) {
    var win = getWindow(element);
    var winScroll = getWindowScroll(element);
    var documentRect = getCompositeRect(getDocumentElement(element), win);
    documentRect.height = Math.max(documentRect.height, win.innerHeight);
    documentRect.width = Math.max(documentRect.width, win.innerWidth);
    documentRect.x = -winScroll.scrollLeft;
    documentRect.y = -winScroll.scrollTop;
    return documentRect;
  }

  function toNumber(cssValue) {
    return parseFloat(cssValue) || 0;
  }

  function getBorders(element) {
    var computedStyle = isHTMLElement(element) ? getComputedStyle(element) : {};
    return {
      top: toNumber(computedStyle.borderTopWidth),
      right: toNumber(computedStyle.borderRightWidth),
      bottom: toNumber(computedStyle.borderBottomWidth),
      left: toNumber(computedStyle.borderLeftWidth)
    };
  }

  function getDecorations(element) {
    var win = getWindow(element);
    var borders = getBorders(element);
    var isHTML = getNodeName(element) === 'html';
    var winScrollBarX = getWindowScrollBarX(element);
    var x = element.clientWidth + borders.right;
    var y = element.clientHeight + borders.bottom; // HACK:
    // document.documentElement.clientHeight on iOS reports the height of the
    // viewport including the bottom bar, even if the bottom bar isn't visible.
    // If the difference between window innerHeight and html clientHeight is more
    // than 50, we assume it's a mobile bottom bar and ignore scrollbars.
    // * A 50px thick scrollbar is likely non-existent (macOS is 15px and Windows
    //   is about 17px)
    // * The mobile bar is 114px tall

    if (isHTML && win.innerHeight - element.clientHeight > 50) {
      y = win.innerHeight - borders.bottom;
    }

    return {
      top: isHTML ? 0 : element.clientTop,
      right: // RTL scrollbar (scrolling containers only)
      element.clientLeft > borders.left ? borders.right : // LTR scrollbar
      isHTML ? win.innerWidth - x - winScrollBarX : element.offsetWidth - x,
      bottom: isHTML ? win.innerHeight - y : element.offsetHeight - y,
      left: isHTML ? winScrollBarX : element.clientLeft
    };
  }

  function contains(parent, child) {
    // $FlowFixMe: hasOwnProperty doesn't seem to work in tests
    var isShadow = Boolean(child.getRootNode && child.getRootNode().host); // First, attempt with faster native method

    if (parent.contains(child)) {
      return true;
    } // then fallback to custom implementation with Shadow DOM support
    else if (isShadow) {
        var next = child;

        do {
          if (next && parent.isSameNode(next)) {
            return true;
          } // $FlowFixMe: need a better way to handle this...


          next = next.parentNode || next.host;
        } while (next);
      } // Give up, the result is false


    return false;
  }

  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }

  function getClientRectFromMixedType(element, clippingParent) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isHTMLElement(clippingParent) ? getBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  } // A "clipping parent" is an overflowable container with the characteristic of
  // clipping (or hiding) overflowing elements with a position different from
  // `initial`


  function getClippingParents(element) {
    var clippingParents = listScrollParents(element);
    var canEscapeClipping = ['absolute', 'fixed'].indexOf(getComputedStyle(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;

    if (!isElement(clipperElement)) {
      return [];
    } // $FlowFixMe: https://github.com/facebook/flow/issues/1414


    return clippingParents.filter(function (clippingParent) {
      return isElement(clippingParent) && contains(clippingParent, clipperElement);
    });
  } // Gets the maximum area that the element is visible in due to any number of
  // clipping parents


  function getClippingRect(element, boundary, rootBoundary) {
    var mainClippingParents = boundary === 'clippingParents' ? getClippingParents(element) : [].concat(boundary);
    var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents[0];
    var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent);
      var decorations = getDecorations(isHTMLElement(clippingParent) ? clippingParent : getDocumentElement(element));
      accRect.top = Math.max(rect.top + decorations.top, accRect.top);
      accRect.right = Math.min(rect.right - decorations.right, accRect.right);
      accRect.bottom = Math.min(rect.bottom - decorations.bottom, accRect.bottom);
      accRect.left = Math.max(rect.left + decorations.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }

  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), {}, paddingObject);
  }

  function expandToHashMap(value, keys) {
    return keys.reduce(function (hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }

  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        _options$placement = _options.placement,
        placement = _options$placement === void 0 ? state.placement : _options$placement,
        _options$boundary = _options.boundary,
        boundary = _options$boundary === void 0 ? clippingParents : _options$boundary,
        _options$rootBoundary = _options.rootBoundary,
        rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
        _options$elementConte = _options.elementContext,
        elementContext = _options$elementConte === void 0 ? popper : _options$elementConte,
        _options$altBoundary = _options.altBoundary,
        altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary,
        _options$padding = _options.padding,
        padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var referenceElement = state.elements.reference;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
    var referenceClientRect = getBoundingClientRect(referenceElement);
    var popperOffsets = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: 'absolute',
      placement: placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, {}, popperOffsets));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
    // 0 or negative = within the clipping rect

    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

    if (elementContext === popper && offsetData) {
      var offset = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function (key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? 'y' : 'x';
        overflowOffsets[key] += offset[axis] * multiply;
      });
    }

    return overflowOffsets;
  }

  /*:: type OverflowsMap = { [ComputedPlacement]: number }; */

  /*;; type OverflowsMap = { [key in ComputedPlacement]: number }; */
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        placement = _options.placement,
        boundary = _options.boundary,
        rootBoundary = _options.rootBoundary,
        padding = _options.padding,
        flipVariations = _options.flipVariations,
        _options$allowedAutoP = _options.allowedAutoPlacements,
        allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements$1 = (variation ? flipVariations ? variationPlacements : variationPlacements.filter(function (placement) {
      return getVariation(placement) === variation;
    }) : basePlacements).filter(function (placement) {
      return allowedAutoPlacements.indexOf(placement) >= 0;
    }); // $FlowFixMe: Flow seems to have problems with two array unions...

    var overflows = placements$1.reduce(function (acc, placement) {
      acc[placement] = detectOverflow(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding
      })[getBasePlacement(placement)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function (a, b) {
      return overflows[a] - overflows[b];
    });
  }

  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }

    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }

  function flip(_ref) {
    var state = _ref.state,
        options = _ref.options,
        name = _ref.name;

    if (state.modifiersData[name]._skip) {
      return;
    }

    var _options$mainAxis = options.mainAxis,
        checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
        _options$altAxis = options.altAxis,
        checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
        specifiedFallbackPlacements = options.fallbackPlacements,
        padding = options.padding,
        boundary = options.boundary,
        rootBoundary = options.rootBoundary,
        altBoundary = options.altBoundary,
        _options$flipVariatio = options.flipVariations,
        flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio,
        allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function (acc, placement) {
      return acc.concat(getBasePlacement(placement) === auto ? computeAutoPlacement(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding,
        flipVariations: flipVariations,
        allowedAutoPlacements: allowedAutoPlacements
      }) : placement);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements[0];

    for (var i = 0; i < placements.length; i++) {
      var placement = placements[i];

      var _basePlacement = getBasePlacement(placement);

      var isStartVariation = getVariation(placement) === start;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? 'width' : 'height';
      var overflow = detectOverflow(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        altBoundary: altBoundary,
        padding: padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;

      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }

      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];

      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }

      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }

      if (checks.every(function (check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }

      checksMap.set(placement, checks);
    }

    if (makeFallbackChecks) {
      // `2` may be desired in some cases – research later
      var numberOfChecks = flipVariations ? 3 : 1;

      var _loop = function _loop(_i) {
        var fittingPlacement = placements.find(function (placement) {
          var checks = checksMap.get(placement);

          if (checks) {
            return checks.slice(0, _i).every(function (check) {
              return check;
            });
          }
        });

        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };

      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);

        if (_ret === "break") break;
      }
    }

    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  } // eslint-disable-next-line import/no-unused-modules


  var flip$1 = {
    name: 'flip',
    enabled: true,
    phase: 'main',
    fn: flip,
    requiresIfExists: ['offset'],
    data: {
      _skip: false
    }
  };

  function getAltAxis(axis) {
    return axis === 'x' ? 'y' : 'x';
  }

  function within(min, value, max) {
    return Math.max(min, Math.min(value, max));
  }

  function preventOverflow(_ref) {
    var state = _ref.state,
        options = _ref.options,
        name = _ref.name;
    var _options$mainAxis = options.mainAxis,
        checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
        _options$altAxis = options.altAxis,
        checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
        boundary = options.boundary,
        rootBoundary = options.rootBoundary,
        altBoundary = options.altBoundary,
        padding = options.padding,
        _options$tether = options.tether,
        tether = _options$tether === void 0 ? true : _options$tether,
        _options$tetherOffset = options.tetherOffset,
        tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding,
      altBoundary: altBoundary
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === 'function' ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var data = {
      x: 0,
      y: 0
    };

    if (!popperOffsets) {
      return;
    }

    if (checkMainAxis) {
      var mainSide = mainAxis === 'y' ? top : left;
      var altSide = mainAxis === 'y' ? bottom : right;
      var len = mainAxis === 'y' ? 'height' : 'width';
      var offset = popperOffsets[mainAxis];
      var min = popperOffsets[mainAxis] + overflow[mainSide];
      var max = popperOffsets[mainAxis] - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
      // outside the reference bounds

      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData['arrow#persistent'] ? state.modifiersData['arrow#persistent'].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
      // to include its full size in the calculation. If the reference is small
      // and near the edge of a boundary, the popper can overflow even if the
      // reference is not overflowing as well (e.g. virtual elements with no
      // width or height)

      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - tetherOffsetValue : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + tetherOffsetValue : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === 'y' ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = state.modifiersData.offset ? state.modifiersData.offset[state.placement][mainAxis] : 0;
      var tetherMin = popperOffsets[mainAxis] + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = popperOffsets[mainAxis] + maxOffset - offsetModifierValue;
      var preventedOffset = within(tether ? Math.min(min, tetherMin) : min, offset, tether ? Math.max(max, tetherMax) : max);
      popperOffsets[mainAxis] = preventedOffset;
      data[mainAxis] = preventedOffset - offset;
    }

    if (checkAltAxis) {
      var _mainSide = mainAxis === 'x' ? top : left;

      var _altSide = mainAxis === 'x' ? bottom : right;

      var _offset = popperOffsets[altAxis];

      var _min = _offset + overflow[_mainSide];

      var _max = _offset - overflow[_altSide];

      var _preventedOffset = within(_min, _offset, _max);

      popperOffsets[altAxis] = _preventedOffset;
      data[altAxis] = _preventedOffset - _offset;
    }

    state.modifiersData[name] = data;
  } // eslint-disable-next-line import/no-unused-modules


  var preventOverflow$1 = {
    name: 'preventOverflow',
    enabled: true,
    phase: 'main',
    fn: preventOverflow,
    requiresIfExists: ['offset']
  };

  function arrow(_ref) {
    var _state$modifiersData$;

    var state = _ref.state,
        name = _ref.name;
    var arrowElement = state.elements.arrow;
    var popperOffsets = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? 'height' : 'width';

    if (!arrowElement || !popperOffsets) {
      return;
    }

    var paddingObject = state.modifiersData[name + "#persistent"].padding;
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === 'y' ? top : left;
    var maxProp = axis === 'y' ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
    var startDiff = popperOffsets[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === 'y' ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
    // outside of the popper bounds

    var min = paddingObject[minProp];
    var max = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset = within(min, center, max); // Prevents breaking syntax highlighting...

    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
  }

  function effect$2(_ref2) {
    var state = _ref2.state,
        options = _ref2.options,
        name = _ref2.name;
    var _options$element = options.element,
        arrowElement = _options$element === void 0 ? '[data-popper-arrow]' : _options$element,
        _options$padding = options.padding,
        padding = _options$padding === void 0 ? 0 : _options$padding;

    if (arrowElement == null) {
      return;
    } // CSS selector


    if (typeof arrowElement === 'string') {
      arrowElement = state.elements.popper.querySelector(arrowElement);

      if (!arrowElement) {
        return;
      }
    }

    {
      if (!isHTMLElement(arrowElement)) {
        console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', 'To use an SVG arrow, wrap it in an HTMLElement that will be used as', 'the arrow.'].join(' '));
      }
    }

    if (!contains(state.elements.popper, arrowElement)) {
      {
        console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', 'element.'].join(' '));
      }

      return;
    }

    state.elements.arrow = arrowElement;
    state.modifiersData[name + "#persistent"] = {
      padding: mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements))
    };
  } // eslint-disable-next-line import/no-unused-modules


  var arrow$1 = {
    name: 'arrow',
    enabled: true,
    phase: 'main',
    fn: arrow,
    effect: effect$2,
    requires: ['popperOffsets'],
    requiresIfExists: ['preventOverflow']
  };

  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }

    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }

  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function (side) {
      return overflow[side] >= 0;
    });
  }

  function hide(_ref) {
    var state = _ref.state,
        name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: 'reference'
    });
    var popperAltOverflow = detectOverflow(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets: referenceClippingOffsets,
      popperEscapeOffsets: popperEscapeOffsets,
      isReferenceHidden: isReferenceHidden,
      hasPopperEscaped: hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      'data-popper-reference-hidden': isReferenceHidden,
      'data-popper-escaped': hasPopperEscaped
    });
  } // eslint-disable-next-line import/no-unused-modules


  var hide$1 = {
    name: 'hide',
    enabled: true,
    phase: 'main',
    requiresIfExists: ['preventOverflow'],
    fn: hide
  };

  var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
  var createPopper = /*#__PURE__*/popperGenerator({
    defaultModifiers: defaultModifiers
  }); // eslint-disable-next-line import/no-unused-modules

  exports.createPopper = createPopper;
  exports.defaultModifiers = defaultModifiers;
  exports.detectOverflow = detectOverflow;
  exports.popperGenerator = popperGenerator;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
/**!
* tippy.js v6.2.3
* (c) 2017-2020 atomiks
* MIT License
*/
(function (global, factory) {
/*
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@popperjs/core')) :
  typeof define === 'function' && define.amd ? define(['@popperjs/core'], factory) :
*/
  (global = global || self, global.tippy = factory(global.Popper));
}(this, (function (core) { 'use strict';

  var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  var ua = isBrowser ? navigator.userAgent : '';
  var isIE = /MSIE |Trident\//.test(ua);

  var ROUND_ARROW = '<svg width="16" height="6" xmlns="http://www.w3.org/2000/svg"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg>';
  var BOX_CLASS = "tippy-box";
  var CONTENT_CLASS = "tippy-content";
  var BACKDROP_CLASS = "tippy-backdrop";
  var ARROW_CLASS = "tippy-arrow";
  var SVG_ARROW_CLASS = "tippy-svg-arrow";
  var TOUCH_OPTIONS = {
    passive: true,
    capture: true
  };

  function hasOwnProperty(obj, key) {
    return {}.hasOwnProperty.call(obj, key);
  }
  function getValueAtIndexOrReturn(value, index, defaultValue) {
    if (Array.isArray(value)) {
      var v = value[index];
      return v == null ? Array.isArray(defaultValue) ? defaultValue[index] : defaultValue : v;
    }

    return value;
  }
  function isType(value, type) {
    var str = {}.toString.call(value);
    return str.indexOf('[object') === 0 && str.indexOf(type + "]") > -1;
  }
  function invokeWithArgsOrReturn(value, args) {
    return typeof value === 'function' ? value.apply(void 0, args) : value;
  }
  function debounce(fn, ms) {
    // Avoid wrapping in `setTimeout` if ms is 0 anyway
    if (ms === 0) {
      return fn;
    }

    var timeout;
    return function (arg) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn(arg);
      }, ms);
    };
  }
  function removeProperties(obj, keys) {
    var clone = Object.assign({}, obj);
    keys.forEach(function (key) {
      delete clone[key];
    });
    return clone;
  }
  function splitBySpaces(value) {
    return value.split(/\s+/).filter(Boolean);
  }
  function normalizeToArray(value) {
    return [].concat(value);
  }
  function pushIfUnique(arr, value) {
    if (arr.indexOf(value) === -1) {
      arr.push(value);
    }
  }
  function unique(arr) {
    return arr.filter(function (item, index) {
      return arr.indexOf(item) === index;
    });
  }
  function getBasePlacement(placement) {
    return placement.split('-')[0];
  }
  function arrayFrom(value) {
    return [].slice.call(value);
  }

  function div() {
    return document.createElement('div');
  }
  function isElement(value) {
    return ['Element', 'Fragment'].some(function (type) {
      return isType(value, type);
    });
  }
  function isNodeList(value) {
    return isType(value, 'NodeList');
  }
  function isMouseEvent(value) {
    return isType(value, 'MouseEvent');
  }
  function isReferenceElement(value) {
    return !!(value && value._tippy && value._tippy.reference === value);
  }
  function getArrayOfElements(value) {
    if (isElement(value)) {
      return [value];
    }

    if (isNodeList(value)) {
      return arrayFrom(value);
    }

    if (Array.isArray(value)) {
      return value;
    }

    return arrayFrom(document.querySelectorAll(value));
  }
  function setTransitionDuration(els, value) {
    els.forEach(function (el) {
      if (el) {
        el.style.transitionDuration = value + "ms";
      }
    });
  }
  function setVisibilityState(els, state) {
    els.forEach(function (el) {
      if (el) {
        el.setAttribute('data-state', state);
      }
    });
  }
  function getOwnerDocument(elementOrElements) {
    var _normalizeToArray = normalizeToArray(elementOrElements),
        element = _normalizeToArray[0];

    return element ? element.ownerDocument || document : document;
  }
  function isCursorOutsideInteractiveBorder(popperTreeData, event) {
    var clientX = event.clientX,
        clientY = event.clientY;
    return popperTreeData.every(function (_ref) {
      var popperRect = _ref.popperRect,
          popperState = _ref.popperState,
          props = _ref.props;
      var interactiveBorder = props.interactiveBorder;
      var basePlacement = getBasePlacement(popperState.placement);
      var offsetData = popperState.modifiersData.offset;

      if (!offsetData) {
        return true;
      }

      var topDistance = basePlacement === 'bottom' ? offsetData.top.y : 0;
      var bottomDistance = basePlacement === 'top' ? offsetData.bottom.y : 0;
      var leftDistance = basePlacement === 'right' ? offsetData.left.x : 0;
      var rightDistance = basePlacement === 'left' ? offsetData.right.x : 0;
      var exceedsTop = popperRect.top - clientY + topDistance > interactiveBorder;
      var exceedsBottom = clientY - popperRect.bottom - bottomDistance > interactiveBorder;
      var exceedsLeft = popperRect.left - clientX + leftDistance > interactiveBorder;
      var exceedsRight = clientX - popperRect.right - rightDistance > interactiveBorder;
      return exceedsTop || exceedsBottom || exceedsLeft || exceedsRight;
    });
  }
  function updateTransitionEndListener(box, action, listener) {
    var method = action + "EventListener"; // some browsers apparently support `transition` (unprefixed) but only fire
    // `webkitTransitionEnd`...

    ['transitionend', 'webkitTransitionEnd'].forEach(function (event) {
      box[method](event, listener);
    });
  }

  var currentInput = {
    isTouch: false
  };
  var lastMouseMoveTime = 0;
  /**
   * When a `touchstart` event is fired, it's assumed the user is using touch
   * input. We'll bind a `mousemove` event listener to listen for mouse input in
   * the future. This way, the `isTouch` property is fully dynamic and will handle
   * hybrid devices that use a mix of touch + mouse input.
   */

  function onDocumentTouchStart() {
    if (currentInput.isTouch) {
      return;
    }

    currentInput.isTouch = true;

    if (window.performance) {
      document.addEventListener('mousemove', onDocumentMouseMove);
    }
  }
  /**
   * When two `mousemove` event are fired consecutively within 20ms, it's assumed
   * the user is using mouse input again. `mousemove` can fire on touch devices as
   * well, but very rarely that quickly.
   */

  function onDocumentMouseMove() {
    var now = performance.now();

    if (now - lastMouseMoveTime < 20) {
      currentInput.isTouch = false;
      document.removeEventListener('mousemove', onDocumentMouseMove);
    }

    lastMouseMoveTime = now;
  }
  /**
   * When an element is in focus and has a tippy, leaving the tab/window and
   * returning causes it to show again. For mouse users this is unexpected, but
   * for keyboard use it makes sense.
   * TODO: find a better technique to solve this problem
   */

  function onWindowBlur() {
    var activeElement = document.activeElement;

    if (isReferenceElement(activeElement)) {
      var instance = activeElement._tippy;

      if (activeElement.blur && !instance.state.isVisible) {
        activeElement.blur();
      }
    }
  }
  function bindGlobalEventListeners() {
    document.addEventListener('touchstart', onDocumentTouchStart, TOUCH_OPTIONS);
    window.addEventListener('blur', onWindowBlur);
  }

  function createMemoryLeakWarning(method) {
    var txt = method === 'destroy' ? 'n already-' : ' ';
    return [method + "() was called on a" + txt + "destroyed instance. This is a no-op but", 'indicates a potential memory leak.'].join(' ');
  }
  function clean(value) {
    var spacesAndTabs = /[ \t]{2,}/g;
    var lineStartWithSpaces = /^[ \t]*/gm;
    return value.replace(spacesAndTabs, ' ').replace(lineStartWithSpaces, '').trim();
  }

  function getDevMessage(message) {
    return clean("\n  %ctippy.js\n\n  %c" + clean(message) + "\n\n  %c\uD83D\uDC77\u200D This is a development-only message. It will be removed in production.\n  ");
  }

  function getFormattedMessage(message) {
    return [getDevMessage(message), // title
    'color: #00C584; font-size: 1.3em; font-weight: bold;', // message
    'line-height: 1.5', // footer
    'color: #a6a095;'];
  } // Assume warnings and errors never have the same message

  var visitedMessages;

  {
    resetVisitedMessages();
  }

  function resetVisitedMessages() {
    visitedMessages = new Set();
  }
  function warnWhen(condition, message) {
    if (condition && !visitedMessages.has(message)) {
      var _console;

      visitedMessages.add(message);

      (_console = console).warn.apply(_console, getFormattedMessage(message));
    }
  }
  function errorWhen(condition, message) {
    if (condition && !visitedMessages.has(message)) {
      var _console2;

      visitedMessages.add(message);

      (_console2 = console).error.apply(_console2, getFormattedMessage(message));
    }
  }
  function validateTargets(targets) {
    var didPassFalsyValue = !targets;
    var didPassPlainObject = Object.prototype.toString.call(targets) === '[object Object]' && !targets.addEventListener;
    errorWhen(didPassFalsyValue, ['tippy() was passed', '`' + String(targets) + '`', 'as its targets (first) argument. Valid types are: String, Element,', 'Element[], or NodeList.'].join(' '));
    errorWhen(didPassPlainObject, ['tippy() was passed a plain object which is not supported as an argument', 'for virtual positioning. Use props.getReferenceClientRect instead.'].join(' '));
  }

  var pluginProps = {
    animateFill: false,
    followCursor: false,
    inlinePositioning: false,
    sticky: false
  };
  var renderProps = {
    allowHTML: false,
    animation: 'fade',
    arrow: true,
    content: '',
    inertia: false,
    maxWidth: 350,
    role: 'tooltip',
    theme: '',
    zIndex: 9999
  };
  var defaultProps = Object.assign({
    appendTo: function appendTo() {
      return document.body;
    },
    aria: {
      content: 'auto',
      expanded: 'auto'
    },
    delay: 0,
    duration: [300, 250],
    getReferenceClientRect: null,
    hideOnClick: true,
    ignoreAttributes: false,
    interactive: false,
    interactiveBorder: 2,
    interactiveDebounce: 0,
    moveTransition: '',
    offset: [0, 10],
    onAfterUpdate: function onAfterUpdate() {},
    onBeforeUpdate: function onBeforeUpdate() {},
    onCreate: function onCreate() {},
    onDestroy: function onDestroy() {},
    onHidden: function onHidden() {},
    onHide: function onHide() {},
    onMount: function onMount() {},
    onShow: function onShow() {},
    onShown: function onShown() {},
    onTrigger: function onTrigger() {},
    onUntrigger: function onUntrigger() {},
    onClickOutside: function onClickOutside() {},
    placement: 'top',
    plugins: [],
    popperOptions: {},
    render: null,
    showOnCreate: false,
    touch: true,
    trigger: 'mouseenter focus',
    triggerTarget: null
  }, pluginProps, {}, renderProps);
  var defaultKeys = Object.keys(defaultProps);
  var setDefaultProps = function setDefaultProps(partialProps) {
    /* istanbul ignore else */
    {
      validateProps(partialProps, []);
    }

    var keys = Object.keys(partialProps);
    keys.forEach(function (key) {
      defaultProps[key] = partialProps[key];
    });
  };
  function getExtendedPassedProps(passedProps) {
    var plugins = passedProps.plugins || [];
    var pluginProps = plugins.reduce(function (acc, plugin) {
      var name = plugin.name,
          defaultValue = plugin.defaultValue;

      if (name) {
        acc[name] = passedProps[name] !== undefined ? passedProps[name] : defaultValue;
      }

      return acc;
    }, {});
    return Object.assign({}, passedProps, {}, pluginProps);
  }
  function getDataAttributeProps(reference, plugins) {
    var propKeys = plugins ? Object.keys(getExtendedPassedProps(Object.assign({}, defaultProps, {
      plugins: plugins
    }))) : defaultKeys;
    var props = propKeys.reduce(function (acc, key) {
      var valueAsString = (reference.getAttribute("data-tippy-" + key) || '').trim();

      if (!valueAsString) {
        return acc;
      }

      if (key === 'content') {
        acc[key] = valueAsString;
      } else {
        try {
          acc[key] = JSON.parse(valueAsString);
        } catch (e) {
          acc[key] = valueAsString;
        }
      }

      return acc;
    }, {});
    return props;
  }
  function evaluateProps(reference, props) {
    var out = Object.assign({}, props, {
      content: invokeWithArgsOrReturn(props.content, [reference])
    }, props.ignoreAttributes ? {} : getDataAttributeProps(reference, props.plugins));
    out.aria = Object.assign({}, defaultProps.aria, {}, out.aria);
    out.aria = {
      expanded: out.aria.expanded === 'auto' ? props.interactive : out.aria.expanded,
      content: out.aria.content === 'auto' ? props.interactive ? null : 'describedby' : out.aria.content
    };
    return out;
  }
  function validateProps(partialProps, plugins) {
    if (partialProps === void 0) {
      partialProps = {};
    }

    if (plugins === void 0) {
      plugins = [];
    }

    var keys = Object.keys(partialProps);
    keys.forEach(function (prop) {
      var nonPluginProps = removeProperties(defaultProps, Object.keys(pluginProps));
      var didPassUnknownProp = !hasOwnProperty(nonPluginProps, prop); // Check if the prop exists in `plugins`

      if (didPassUnknownProp) {
        didPassUnknownProp = plugins.filter(function (plugin) {
          return plugin.name === prop;
        }).length === 0;
      }

      warnWhen(didPassUnknownProp, ["`" + prop + "`", "is not a valid prop. You may have spelled it incorrectly, or if it's", 'a plugin, forgot to pass it in an array as props.plugins.', '\n\n', 'All props: https://atomiks.github.io/tippyjs/v6/all-props/\n', 'Plugins: https://atomiks.github.io/tippyjs/v6/plugins/'].join(' '));
    });
  }

  var innerHTML = function innerHTML() {
    return 'innerHTML';
  };

  function dangerouslySetInnerHTML(element, html) {
    element[innerHTML()] = html;
  }

  function createArrowElement(value) {
    var arrow = div();

    if (value === true) {
      arrow.className = ARROW_CLASS;
    } else {
      arrow.className = SVG_ARROW_CLASS;

      if (isElement(value)) {
        arrow.appendChild(value);
      } else {
        dangerouslySetInnerHTML(arrow, value);
      }
    }

    return arrow;
  }

  function setContent(content, props) {
    if (isElement(props.content)) {
      dangerouslySetInnerHTML(content, '');
      content.appendChild(props.content);
    } else if (typeof props.content !== 'function') {
      if (props.allowHTML) {
        dangerouslySetInnerHTML(content, props.content);
      } else {
        content.textContent = props.content;
      }
    }
  }
  function getChildren(popper) {
    var box = popper.firstElementChild;
    var boxChildren = arrayFrom(box.children);
    return {
      box: box,
      content: boxChildren.find(function (node) {
        return node.classList.contains(CONTENT_CLASS);
      }),
      arrow: boxChildren.find(function (node) {
        return node.classList.contains(ARROW_CLASS) || node.classList.contains(SVG_ARROW_CLASS);
      }),
      backdrop: boxChildren.find(function (node) {
        return node.classList.contains(BACKDROP_CLASS);
      })
    };
  }
  function render(instance) {
    var popper = div();
    var box = div();
    box.className = BOX_CLASS;
    box.setAttribute('data-state', 'hidden');
    box.setAttribute('tabindex', '-1');
    var content = div();
    content.className = CONTENT_CLASS;
    content.setAttribute('data-state', 'hidden');
    setContent(content, instance.props);
    popper.appendChild(box);
    box.appendChild(content);
    onUpdate(instance.props, instance.props);

    function onUpdate(prevProps, nextProps) {
      var _getChildren = getChildren(popper),
          box = _getChildren.box,
          content = _getChildren.content,
          arrow = _getChildren.arrow;

      if (nextProps.theme) {
        box.setAttribute('data-theme', nextProps.theme);
      } else {
        box.removeAttribute('data-theme');
      }

      if (typeof nextProps.animation === 'string') {
        box.setAttribute('data-animation', nextProps.animation);
      } else {
        box.removeAttribute('data-animation');
      }

      if (nextProps.inertia) {
        box.setAttribute('data-inertia', '');
      } else {
        box.removeAttribute('data-inertia');
      }

      box.style.maxWidth = typeof nextProps.maxWidth === 'number' ? nextProps.maxWidth + "px" : nextProps.maxWidth;

      if (nextProps.role) {
        box.setAttribute('role', nextProps.role);
      } else {
        box.removeAttribute('role');
      }

      if (prevProps.content !== nextProps.content || prevProps.allowHTML !== nextProps.allowHTML) {
        setContent(content, instance.props);
      }

      if (nextProps.arrow) {
        if (!arrow) {
          box.appendChild(createArrowElement(nextProps.arrow));
        } else if (prevProps.arrow !== nextProps.arrow) {
          box.removeChild(arrow);
          box.appendChild(createArrowElement(nextProps.arrow));
        }
      } else if (arrow) {
        box.removeChild(arrow);
      }
    }

    return {
      popper: popper,
      onUpdate: onUpdate
    };
  } // Runtime check to identify if the render function is the default one; this
  // way we can apply default CSS transitions logic and it can be tree-shaken away

  render.$$tippy = true;

  var idCounter = 1;
  var mouseMoveListeners = []; // Used by `hideAll()`

  var mountedInstances = [];
  function createTippy(reference, passedProps) {
    var props = evaluateProps(reference, Object.assign({}, defaultProps, {}, getExtendedPassedProps(passedProps))); // ===========================================================================
    // 🔒 Private members
    // ===========================================================================

    var showTimeout;
    var hideTimeout;
    var scheduleHideAnimationFrame;
    var isVisibleFromClick = false;
    var didHideDueToDocumentMouseDown = false;
    var didTouchMove = false;
    var ignoreOnFirstUpdate = false;
    var lastTriggerEvent;
    var currentTransitionEndListener;
    var onFirstUpdate;
    var listeners = [];
    var debouncedOnMouseMove = debounce(onMouseMove, props.interactiveDebounce);
    var currentTarget;
    var doc = getOwnerDocument(props.triggerTarget || reference); // ===========================================================================
    // 🔑 Public members
    // ===========================================================================

    var id = idCounter++;
    var popperInstance = null;
    var plugins = unique(props.plugins);
    var state = {
      // Is the instance currently enabled?
      isEnabled: true,
      // Is the tippy currently showing and not transitioning out?
      isVisible: false,
      // Has the instance been destroyed?
      isDestroyed: false,
      // Is the tippy currently mounted to the DOM?
      isMounted: false,
      // Has the tippy finished transitioning in?
      isShown: false
    };
    var instance = {
      // properties
      id: id,
      reference: reference,
      popper: div(),
      popperInstance: popperInstance,
      props: props,
      state: state,
      plugins: plugins,
      // methods
      clearDelayTimeouts: clearDelayTimeouts,
      setProps: setProps,
      setContent: setContent,
      show: show,
      hide: hide,
      hideWithInteractivity: hideWithInteractivity,
      enable: enable,
      disable: disable,
      unmount: unmount,
      destroy: destroy
    }; // TODO: Investigate why this early return causes a TDZ error in the tests —
    // it doesn't seem to happen in the browser

    /* istanbul ignore if */

    if (!props.render) {
      {
        errorWhen(true, 'render() function has not been supplied.');
      }

      return instance;
    } // ===========================================================================
    // Initial mutations
    // ===========================================================================


    var _props$render = props.render(instance),
        popper = _props$render.popper,
        onUpdate = _props$render.onUpdate;

    popper.setAttribute('data-tippy-root', '');
    popper.id = "tippy-" + instance.id;
    instance.popper = popper;
    reference._tippy = instance;
    popper._tippy = instance;
    var pluginsHooks = plugins.map(function (plugin) {
      return plugin.fn(instance);
    });
    var hasAriaExpanded = reference.hasAttribute('aria-expanded');
    addListeners();
    handleAriaExpandedAttribute();
    handleStyles();
    invokeHook('onCreate', [instance]);

    if (props.showOnCreate) {
      scheduleShow();
    } // Prevent a tippy with a delay from hiding if the cursor left then returned
    // before it started hiding


    popper.addEventListener('mouseenter', function () {
      if (instance.props.interactive && instance.state.isVisible) {
        instance.clearDelayTimeouts();
      }
    });
    popper.addEventListener('mouseleave', function (event) {
      if (instance.props.interactive && instance.props.trigger.indexOf('mouseenter') >= 0) {
        doc.addEventListener('mousemove', debouncedOnMouseMove);
        debouncedOnMouseMove(event);
      }
    });
    return instance; // ===========================================================================
    // 🔒 Private methods
    // ===========================================================================

    function getNormalizedTouchSettings() {
      var touch = instance.props.touch;
      return Array.isArray(touch) ? touch : [touch, 0];
    }

    function getIsCustomTouchBehavior() {
      return getNormalizedTouchSettings()[0] === 'hold';
    }

    function getIsDefaultRenderFn() {
      var _instance$props$rende;

      // @ts-ignore
      return !!((_instance$props$rende = instance.props.render) == null ? void 0 : _instance$props$rende.$$tippy);
    }

    function getCurrentTarget() {
      return currentTarget || reference;
    }

    function getDefaultTemplateChildren() {
      return getChildren(popper);
    }

    function getDelay(isShow) {
      // For touch or keyboard input, force `0` delay for UX reasons
      // Also if the instance is mounted but not visible (transitioning out),
      // ignore delay
      if (instance.state.isMounted && !instance.state.isVisible || currentInput.isTouch || lastTriggerEvent && lastTriggerEvent.type === 'focus') {
        return 0;
      }

      return getValueAtIndexOrReturn(instance.props.delay, isShow ? 0 : 1, defaultProps.delay);
    }

    function handleStyles() {
      popper.style.pointerEvents = instance.props.interactive && instance.state.isVisible ? '' : 'none';
      popper.style.zIndex = "" + instance.props.zIndex;
    }

    function invokeHook(hook, args, shouldInvokePropsHook) {
      if (shouldInvokePropsHook === void 0) {
        shouldInvokePropsHook = true;
      }

      pluginsHooks.forEach(function (pluginHooks) {
        if (pluginHooks[hook]) {
          pluginHooks[hook].apply(void 0, args);
        }
      });

      if (shouldInvokePropsHook) {
        var _instance$props;

        (_instance$props = instance.props)[hook].apply(_instance$props, args);
      }
    }

    function handleAriaContentAttribute() {
      var aria = instance.props.aria;

      if (!aria.content) {
        return;
      }

      var attr = "aria-" + aria.content;
      var id = popper.id;
      var nodes = normalizeToArray(instance.props.triggerTarget || reference);
      nodes.forEach(function (node) {
        var currentValue = node.getAttribute(attr);

        if (instance.state.isVisible) {
          node.setAttribute(attr, currentValue ? currentValue + " " + id : id);
        } else {
          var nextValue = currentValue && currentValue.replace(id, '').trim();

          if (nextValue) {
            node.setAttribute(attr, nextValue);
          } else {
            node.removeAttribute(attr);
          }
        }
      });
    }

    function handleAriaExpandedAttribute() {
      if (hasAriaExpanded || !instance.props.aria.expanded) {
        return;
      }

      var nodes = normalizeToArray(instance.props.triggerTarget || reference);
      nodes.forEach(function (node) {
        if (instance.props.interactive) {
          node.setAttribute('aria-expanded', instance.state.isVisible && node === getCurrentTarget() ? 'true' : 'false');
        } else {
          node.removeAttribute('aria-expanded');
        }
      });
    }

    function cleanupInteractiveMouseListeners() {
      doc.body.removeEventListener('mouseleave', scheduleHide);
      doc.removeEventListener('mousemove', debouncedOnMouseMove);
      mouseMoveListeners = mouseMoveListeners.filter(function (listener) {
        return listener !== debouncedOnMouseMove;
      });
    }

    function onDocumentPress(event) {
      // Moved finger to scroll instead of an intentional tap outside
      if (currentInput.isTouch) {
        if (didTouchMove || event.type === 'mousedown') {
          return;
        }
      } // Clicked on interactive popper


      if (instance.props.interactive && popper.contains(event.target)) {
        return;
      } // Clicked on the event listeners target


      if (getCurrentTarget().contains(event.target)) {
        if (currentInput.isTouch) {
          return;
        }

        if (instance.state.isVisible && instance.props.trigger.indexOf('click') >= 0) {
          return;
        }
      } else {
        invokeHook('onClickOutside', [instance, event]);
      }

      if (instance.props.hideOnClick === true) {
        isVisibleFromClick = false;
        instance.clearDelayTimeouts();
        instance.hide(); // `mousedown` event is fired right before `focus` if pressing the
        // currentTarget. This lets a tippy with `focus` trigger know that it
        // should not show

        didHideDueToDocumentMouseDown = true;
        setTimeout(function () {
          didHideDueToDocumentMouseDown = false;
        }); // The listener gets added in `scheduleShow()`, but this may be hiding it
        // before it shows, and hide()'s early bail-out behavior can prevent it
        // from being cleaned up

        if (!instance.state.isMounted) {
          removeDocumentPress();
        }
      }
    }

    function onTouchMove() {
      didTouchMove = true;
    }

    function onTouchStart() {
      didTouchMove = false;
    }

    function addDocumentPress() {
      doc.addEventListener('mousedown', onDocumentPress, true);
      doc.addEventListener('touchend', onDocumentPress, TOUCH_OPTIONS);
      doc.addEventListener('touchstart', onTouchStart, TOUCH_OPTIONS);
      doc.addEventListener('touchmove', onTouchMove, TOUCH_OPTIONS);
    }

    function removeDocumentPress() {
      doc.removeEventListener('mousedown', onDocumentPress, true);
      doc.removeEventListener('touchend', onDocumentPress, TOUCH_OPTIONS);
      doc.removeEventListener('touchstart', onTouchStart, TOUCH_OPTIONS);
      doc.removeEventListener('touchmove', onTouchMove, TOUCH_OPTIONS);
    }

    function onTransitionedOut(duration, callback) {
      onTransitionEnd(duration, function () {
        if (!instance.state.isVisible && popper.parentNode && popper.parentNode.contains(popper)) {
          callback();
        }
      });
    }

    function onTransitionedIn(duration, callback) {
      onTransitionEnd(duration, callback);
    }

    function onTransitionEnd(duration, callback) {
      var box = getDefaultTemplateChildren().box;

      function listener(event) {
        if (event.target === box) {
          updateTransitionEndListener(box, 'remove', listener);
          callback();
        }
      } // Make callback synchronous if duration is 0
      // `transitionend` won't fire otherwise


      if (duration === 0) {
        return callback();
      }

      updateTransitionEndListener(box, 'remove', currentTransitionEndListener);
      updateTransitionEndListener(box, 'add', listener);
      currentTransitionEndListener = listener;
    }

    function on(eventType, handler, options) {
      if (options === void 0) {
        options = false;
      }

      var nodes = normalizeToArray(instance.props.triggerTarget || reference);
      nodes.forEach(function (node) {
        node.addEventListener(eventType, handler, options);
        listeners.push({
          node: node,
          eventType: eventType,
          handler: handler,
          options: options
        });
      });
    }

    function addListeners() {
      if (getIsCustomTouchBehavior()) {
        on('touchstart', onTrigger, {
          passive: true
        });
        on('touchend', onMouseLeave, {
          passive: true
        });
      }

      splitBySpaces(instance.props.trigger).forEach(function (eventType) {
        if (eventType === 'manual') {
          return;
        }

        on(eventType, onTrigger);

        switch (eventType) {
          case 'mouseenter':
            on('mouseleave', onMouseLeave);
            break;

          case 'focus':
            on(isIE ? 'focusout' : 'blur', onBlurOrFocusOut);
            break;

          case 'focusin':
            on('focusout', onBlurOrFocusOut);
            break;
        }
      });
    }

    function removeListeners() {
      listeners.forEach(function (_ref) {
        var node = _ref.node,
            eventType = _ref.eventType,
            handler = _ref.handler,
            options = _ref.options;
        node.removeEventListener(eventType, handler, options);
      });
      listeners = [];
    }

    function onTrigger(event) {
      var _lastTriggerEvent;

      var shouldScheduleClickHide = false;

      if (!instance.state.isEnabled || isEventListenerStopped(event) || didHideDueToDocumentMouseDown) {
        return;
      }

      var wasFocused = ((_lastTriggerEvent = lastTriggerEvent) == null ? void 0 : _lastTriggerEvent.type) === 'focus';
      lastTriggerEvent = event;
      currentTarget = event.currentTarget;
      handleAriaExpandedAttribute();

      if (!instance.state.isVisible && isMouseEvent(event)) {
        // If scrolling, `mouseenter` events can be fired if the cursor lands
        // over a new target, but `mousemove` events don't get fired. This
        // causes interactive tooltips to get stuck open until the cursor is
        // moved
        mouseMoveListeners.forEach(function (listener) {
          return listener(event);
        });
      } // Toggle show/hide when clicking click-triggered tooltips


      if (event.type === 'click' && (instance.props.trigger.indexOf('mouseenter') < 0 || isVisibleFromClick) && instance.props.hideOnClick !== false && instance.state.isVisible) {
        shouldScheduleClickHide = true;
      } else {
        scheduleShow(event);
      }

      if (event.type === 'click') {
        isVisibleFromClick = !shouldScheduleClickHide;
      }

      if (shouldScheduleClickHide && !wasFocused) {
        scheduleHide(event);
      }
    }

    function onMouseMove(event) {
      var target = event.target;
      var isCursorOverReferenceOrPopper = reference.contains(target) || popper.contains(target);

      if (event.type === 'mousemove' && isCursorOverReferenceOrPopper) {
        return;
      }

      var popperTreeData = getNestedPopperTree().concat(popper).map(function (popper) {
        var _instance$popperInsta;

        var instance = popper._tippy;
        var state = (_instance$popperInsta = instance.popperInstance) == null ? void 0 : _instance$popperInsta.state;

        if (state) {
          return {
            popperRect: popper.getBoundingClientRect(),
            popperState: state,
            props: props
          };
        }

        return null;
      }).filter(Boolean);

      if (isCursorOutsideInteractiveBorder(popperTreeData, event)) {
        cleanupInteractiveMouseListeners();
        scheduleHide(event);
      }
    }

    function onMouseLeave(event) {
      var shouldBail = isEventListenerStopped(event) || instance.props.trigger.indexOf('click') >= 0 && isVisibleFromClick;

      if (shouldBail) {
        return;
      }

      if (instance.props.interactive) {
        instance.hideWithInteractivity(event);
        return;
      }

      scheduleHide(event);
    }

    function onBlurOrFocusOut(event) {
      if (instance.props.trigger.indexOf('focusin') < 0 && event.target !== getCurrentTarget()) {
        return;
      } // If focus was moved to within the popper


      if (instance.props.interactive && event.relatedTarget && popper.contains(event.relatedTarget)) {
        return;
      }

      scheduleHide(event);
    }

    function isEventListenerStopped(event) {
      return currentInput.isTouch ? getIsCustomTouchBehavior() !== event.type.indexOf('touch') >= 0 : false;
    }

    function createPopperInstance() {
      destroyPopperInstance();
      var _instance$props2 = instance.props,
          popperOptions = _instance$props2.popperOptions,
          placement = _instance$props2.placement,
          offset = _instance$props2.offset,
          getReferenceClientRect = _instance$props2.getReferenceClientRect,
          moveTransition = _instance$props2.moveTransition;
      var arrow = getIsDefaultRenderFn() ? getChildren(popper).arrow : null;
      var computedReference = getReferenceClientRect ? {
        getBoundingClientRect: getReferenceClientRect,
        contextElement: getReferenceClientRect.contextElement || getCurrentTarget()
      } : reference;
      var tippyModifier = {
        name: '$$tippy',
        enabled: true,
        phase: 'beforeWrite',
        requires: ['computeStyles'],
        fn: function fn(_ref2) {
          var state = _ref2.state;

          if (getIsDefaultRenderFn()) {
            var _getDefaultTemplateCh = getDefaultTemplateChildren(),
                box = _getDefaultTemplateCh.box;

            ['placement', 'reference-hidden', 'escaped'].forEach(function (attr) {
              if (attr === 'placement') {
                box.setAttribute('data-placement', state.placement);
              } else {
                if (state.attributes.popper["data-popper-" + attr]) {
                  box.setAttribute("data-" + attr, '');
                } else {
                  box.removeAttribute("data-" + attr);
                }
              }
            });
            state.attributes.popper = {};
          }
        }
      };
      var modifiers = [{
        name: 'offset',
        options: {
          offset: offset
        }
      }, {
        name: 'preventOverflow',
        options: {
          padding: {
            top: 2,
            bottom: 2,
            left: 5,
            right: 5
          }
        }
      }, {
        name: 'flip',
        options: {
          padding: 5
        }
      }, {
        name: 'computeStyles',
        options: {
          adaptive: !moveTransition
        }
      }, tippyModifier];

      if (getIsDefaultRenderFn() && arrow) {
        modifiers.push({
          name: 'arrow',
          options: {
            element: arrow,
            padding: 3
          }
        });
      }

      modifiers.push.apply(modifiers, (popperOptions == null ? void 0 : popperOptions.modifiers) || []);
      instance.popperInstance = core.createPopper(computedReference, popper, Object.assign({}, popperOptions, {
        placement: placement,
        onFirstUpdate: onFirstUpdate,
        modifiers: modifiers
      }));
    }

    function destroyPopperInstance() {
      if (instance.popperInstance) {
        instance.popperInstance.destroy();
        instance.popperInstance = null;
      }
    }

    function mount() {
      var appendTo = instance.props.appendTo;
      var parentNode; // By default, we'll append the popper to the triggerTargets's parentNode so
      // it's directly after the reference element so the elements inside the
      // tippy can be tabbed to
      // If there are clipping issues, the user can specify a different appendTo
      // and ensure focus management is handled correctly manually

      var node = getCurrentTarget();

      if (instance.props.interactive && appendTo === defaultProps.appendTo || appendTo === 'parent') {
        parentNode = node.parentNode;
      } else {
        parentNode = invokeWithArgsOrReturn(appendTo, [node]);
      } // The popper element needs to exist on the DOM before its position can be
      // updated as Popper needs to read its dimensions


      if (!parentNode.contains(popper)) {
        parentNode.appendChild(popper);
      }

      createPopperInstance();
      /* istanbul ignore else */

      {
        // Accessibility check
        warnWhen(instance.props.interactive && appendTo === defaultProps.appendTo && node.nextElementSibling !== popper, ['Interactive tippy element may not be accessible via keyboard', 'navigation because it is not directly after the reference element', 'in the DOM source order.', '\n\n', 'Using a wrapper <div> or <span> tag around the reference element', 'solves this by creating a new parentNode context.', '\n\n', 'Specifying `appendTo: document.body` silences this warning, but it', 'assumes you are using a focus management solution to handle', 'keyboard navigation.', '\n\n', 'See: https://atomiks.github.io/tippyjs/v6/accessibility/#interactivity'].join(' '));
      }
    }

    function getNestedPopperTree() {
      return arrayFrom(popper.querySelectorAll('[data-tippy-root]'));
    }

    function scheduleShow(event) {
      instance.clearDelayTimeouts();

      if (event) {
        invokeHook('onTrigger', [instance, event]);
      }

      addDocumentPress();
      var delay = getDelay(true);

      var _getNormalizedTouchSe = getNormalizedTouchSettings(),
          touchValue = _getNormalizedTouchSe[0],
          touchDelay = _getNormalizedTouchSe[1];

      if (currentInput.isTouch && touchValue === 'hold' && touchDelay) {
        delay = touchDelay;
      }

      if (delay) {
        showTimeout = setTimeout(function () {
          instance.show();
        }, delay);
      } else {
        instance.show();
      }
    }

    function scheduleHide(event) {
      instance.clearDelayTimeouts();
      invokeHook('onUntrigger', [instance, event]);

      if (!instance.state.isVisible) {
        removeDocumentPress();
        return;
      } // For interactive tippies, scheduleHide is added to a document.body handler
      // from onMouseLeave so must intercept scheduled hides from mousemove/leave
      // events when trigger contains mouseenter and click, and the tip is
      // currently shown as a result of a click.


      if (instance.props.trigger.indexOf('mouseenter') >= 0 && instance.props.trigger.indexOf('click') >= 0 && ['mouseleave', 'mousemove'].indexOf(event.type) >= 0 && isVisibleFromClick) {
        return;
      }

      var delay = getDelay(false);

      if (delay) {
        hideTimeout = setTimeout(function () {
          if (instance.state.isVisible) {
            instance.hide();
          }
        }, delay);
      } else {
        // Fixes a `transitionend` problem when it fires 1 frame too
        // late sometimes, we don't want hide() to be called.
        scheduleHideAnimationFrame = requestAnimationFrame(function () {
          instance.hide();
        });
      }
    } // ===========================================================================
    // 🔑 Public methods
    // ===========================================================================


    function enable() {
      instance.state.isEnabled = true;
    }

    function disable() {
      // Disabling the instance should also hide it
      // https://github.com/atomiks/tippy.js-react/issues/106
      instance.hide();
      instance.state.isEnabled = false;
    }

    function clearDelayTimeouts() {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      cancelAnimationFrame(scheduleHideAnimationFrame);
    }

    function setProps(partialProps) {
      /* istanbul ignore else */
      {
        warnWhen(instance.state.isDestroyed, createMemoryLeakWarning('setProps'));
      }

      if (instance.state.isDestroyed) {
        return;
      }

      invokeHook('onBeforeUpdate', [instance, partialProps]);
      removeListeners();
      var prevProps = instance.props;
      var nextProps = evaluateProps(reference, Object.assign({}, instance.props, {}, partialProps, {
        ignoreAttributes: true
      }));
      instance.props = nextProps;
      addListeners();

      if (prevProps.interactiveDebounce !== nextProps.interactiveDebounce) {
        cleanupInteractiveMouseListeners();
        debouncedOnMouseMove = debounce(onMouseMove, nextProps.interactiveDebounce);
      } // Ensure stale aria-expanded attributes are removed


      if (prevProps.triggerTarget && !nextProps.triggerTarget) {
        normalizeToArray(prevProps.triggerTarget).forEach(function (node) {
          node.removeAttribute('aria-expanded');
        });
      } else if (nextProps.triggerTarget) {
        reference.removeAttribute('aria-expanded');
      }

      handleAriaExpandedAttribute();
      handleStyles();

      if (onUpdate) {
        onUpdate(prevProps, nextProps);
      }

      if (instance.popperInstance) {
        createPopperInstance(); // Fixes an issue with nested tippies if they are all getting re-rendered,
        // and the nested ones get re-rendered first.
        // https://github.com/atomiks/tippyjs-react/issues/177
        // TODO: find a cleaner / more efficient solution(!)

        getNestedPopperTree().forEach(function (nestedPopper) {
          // React (and other UI libs likely) requires a rAF wrapper as it flushes
          // its work in one
          requestAnimationFrame(nestedPopper._tippy.popperInstance.forceUpdate);
        });
      }

      invokeHook('onAfterUpdate', [instance, partialProps]);
    }

    function setContent(content) {
      instance.setProps({
        content: content
      });
    }

    function show() {
      /* istanbul ignore else */
      {
        warnWhen(instance.state.isDestroyed, createMemoryLeakWarning('show'));
      } // Early bail-out


      var isAlreadyVisible = instance.state.isVisible;
      var isDestroyed = instance.state.isDestroyed;
      var isDisabled = !instance.state.isEnabled;
      var isTouchAndTouchDisabled = currentInput.isTouch && !instance.props.touch;
      var duration = getValueAtIndexOrReturn(instance.props.duration, 0, defaultProps.duration);

      if (isAlreadyVisible || isDestroyed || isDisabled || isTouchAndTouchDisabled) {
        return;
      } // Normalize `disabled` behavior across browsers.
      // Firefox allows events on disabled elements, but Chrome doesn't.
      // Using a wrapper element (i.e. <span>) is recommended.


      if (getCurrentTarget().hasAttribute('disabled')) {
        return;
      }

      invokeHook('onShow', [instance], false);

      if (instance.props.onShow(instance) === false) {
        return;
      }

      instance.state.isVisible = true;

      if (getIsDefaultRenderFn()) {
        popper.style.visibility = 'visible';
      }

      handleStyles();
      addDocumentPress();

      if (!instance.state.isMounted) {
        popper.style.transition = 'none';
      } // If flipping to the opposite side after hiding at least once, the
      // animation will use the wrong placement without resetting the duration


      if (getIsDefaultRenderFn()) {
        var _getDefaultTemplateCh2 = getDefaultTemplateChildren(),
            box = _getDefaultTemplateCh2.box,
            content = _getDefaultTemplateCh2.content;

        setTransitionDuration([box, content], 0);
      }

      onFirstUpdate = function onFirstUpdate() {
        if (!instance.state.isVisible || ignoreOnFirstUpdate) {
          return;
        }

        ignoreOnFirstUpdate = true; // reflow

        void popper.offsetHeight;
        popper.style.transition = instance.props.moveTransition;

        if (getIsDefaultRenderFn() && instance.props.animation) {
          var _getDefaultTemplateCh3 = getDefaultTemplateChildren(),
              _box = _getDefaultTemplateCh3.box,
              _content = _getDefaultTemplateCh3.content;

          setTransitionDuration([_box, _content], duration);
          setVisibilityState([_box, _content], 'visible');
        }

        handleAriaContentAttribute();
        handleAriaExpandedAttribute();
        pushIfUnique(mountedInstances, instance);
        instance.state.isMounted = true;
        invokeHook('onMount', [instance]);

        if (instance.props.animation && getIsDefaultRenderFn()) {
          onTransitionedIn(duration, function () {
            instance.state.isShown = true;
            invokeHook('onShown', [instance]);
          });
        }
      };

      mount();
    }

    function hide() {
      /* istanbul ignore else */
      {
        warnWhen(instance.state.isDestroyed, createMemoryLeakWarning('hide'));
      } // Early bail-out


      var isAlreadyHidden = !instance.state.isVisible;
      var isDestroyed = instance.state.isDestroyed;
      var isDisabled = !instance.state.isEnabled;
      var duration = getValueAtIndexOrReturn(instance.props.duration, 1, defaultProps.duration);

      if (isAlreadyHidden || isDestroyed || isDisabled) {
        return;
      }

      invokeHook('onHide', [instance], false);

      if (instance.props.onHide(instance) === false) {
        return;
      }

      instance.state.isVisible = false;
      instance.state.isShown = false;
      ignoreOnFirstUpdate = false;

      if (getIsDefaultRenderFn()) {
        popper.style.visibility = 'hidden';
      }

      cleanupInteractiveMouseListeners();
      removeDocumentPress();
      handleStyles();

      if (getIsDefaultRenderFn()) {
        var _getDefaultTemplateCh4 = getDefaultTemplateChildren(),
            box = _getDefaultTemplateCh4.box,
            content = _getDefaultTemplateCh4.content;

        if (instance.props.animation) {
          setTransitionDuration([box, content], duration);
          setVisibilityState([box, content], 'hidden');
        }
      }

      handleAriaContentAttribute();
      handleAriaExpandedAttribute();

      if (instance.props.animation) {
        if (getIsDefaultRenderFn()) {
          onTransitionedOut(duration, instance.unmount);
        }
      } else {
        instance.unmount();
      }
    }

    function hideWithInteractivity(event) {
      /* istanbul ignore else */
      {
        warnWhen(instance.state.isDestroyed, createMemoryLeakWarning('hideWithInteractivity'));
      }

      doc.body.addEventListener('mouseleave', scheduleHide);
      doc.addEventListener('mousemove', debouncedOnMouseMove);
      pushIfUnique(mouseMoveListeners, debouncedOnMouseMove);
      debouncedOnMouseMove(event);
    }

    function unmount() {
      /* istanbul ignore else */
      {
        warnWhen(instance.state.isDestroyed, createMemoryLeakWarning('unmount'));
      }

      if (instance.state.isVisible) {
        instance.hide();
      }

      if (!instance.state.isMounted) {
        return;
      }

      destroyPopperInstance(); // If a popper is not interactive, it will be appended outside the popper
      // tree by default. This seems mainly for interactive tippies, but we should
      // find a workaround if possible

      getNestedPopperTree().forEach(function (nestedPopper) {
        nestedPopper._tippy.unmount();
      });

      if (popper.parentNode) {
        popper.parentNode.removeChild(popper);
      }

      mountedInstances = mountedInstances.filter(function (i) {
        return i !== instance;
      });
      instance.state.isMounted = false;
      invokeHook('onHidden', [instance]);
    }

    function destroy() {
      /* istanbul ignore else */
      {
        warnWhen(instance.state.isDestroyed, createMemoryLeakWarning('destroy'));
      }

      if (instance.state.isDestroyed) {
        return;
      }

      instance.clearDelayTimeouts();
      instance.unmount();
      removeListeners();
      delete reference._tippy;
      instance.state.isDestroyed = true;
      invokeHook('onDestroy', [instance]);
    }
  }

  function tippy(targets, optionalProps) {
    if (optionalProps === void 0) {
      optionalProps = {};
    }

    var plugins = defaultProps.plugins.concat(optionalProps.plugins || []);
    /* istanbul ignore else */

    {
      validateTargets(targets);
      validateProps(optionalProps, plugins);
    }

    bindGlobalEventListeners();
    var passedProps = Object.assign({}, optionalProps, {
      plugins: plugins
    });
    var elements = getArrayOfElements(targets);
    /* istanbul ignore else */

    {
      var isSingleContentElement = isElement(passedProps.content);
      var isMoreThanOneReferenceElement = elements.length > 1;
      warnWhen(isSingleContentElement && isMoreThanOneReferenceElement, ['tippy() was passed an Element as the `content` prop, but more than', 'one tippy instance was created by this invocation. This means the', 'content element will only be appended to the last tippy instance.', '\n\n', 'Instead, pass the .innerHTML of the element, or use a function that', 'returns a cloned version of the element instead.', '\n\n', '1) content: element.innerHTML\n', '2) content: () => element.cloneNode(true)'].join(' '));
    }

    var instances = elements.reduce(function (acc, reference) {
      var instance = reference && createTippy(reference, passedProps);

      if (instance) {
        acc.push(instance);
      }

      return acc;
    }, []);
    return isElement(targets) ? instances[0] : instances;
  }

  tippy.defaultProps = defaultProps;
  tippy.setDefaultProps = setDefaultProps;
  tippy.currentInput = currentInput;
  var hideAll = function hideAll(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        excludedReferenceOrInstance = _ref.exclude,
        duration = _ref.duration;

    mountedInstances.forEach(function (instance) {
      var isExcluded = false;

      if (excludedReferenceOrInstance) {
        isExcluded = isReferenceElement(excludedReferenceOrInstance) ? instance.reference === excludedReferenceOrInstance : instance.popper === excludedReferenceOrInstance.popper;
      }

      if (!isExcluded) {
        var originalDuration = instance.props.duration;
        instance.setProps({
          duration: duration
        });
        instance.hide();

        if (!instance.state.isDestroyed) {
          instance.setProps({
            duration: originalDuration
          });
        }
      }
    });
  };

  var createSingleton = function createSingleton(tippyInstances, optionalProps) {
    if (optionalProps === void 0) {
      optionalProps = {};
    }

    /* istanbul ignore else */
    {
      errorWhen(!Array.isArray(tippyInstances), ['The first argument passed to createSingleton() must be an array of', 'tippy instances. The passed value was', String(tippyInstances)].join(' '));
    }

    var mutTippyInstances = tippyInstances;
    var references = [];
    var currentTarget;
    var overrides = optionalProps.overrides;

    function setReferences() {
      references = mutTippyInstances.map(function (instance) {
        return instance.reference;
      });
    }

    function enableInstances(isEnabled) {
      mutTippyInstances.forEach(function (instance) {
        if (isEnabled) {
          instance.enable();
        } else {
          instance.disable();
        }
      });
    }

    enableInstances(false);
    setReferences();
    var singleton = {
      fn: function fn() {
        return {
          onDestroy: function onDestroy() {
            enableInstances(true);
          },
          onTrigger: function onTrigger(instance, event) {
            var target = event.currentTarget;
            var index = references.indexOf(target); // bail-out

            if (target === currentTarget) {
              return;
            }

            currentTarget = target;
            var overrideProps = (overrides || []).concat('content').reduce(function (acc, prop) {
              acc[prop] = mutTippyInstances[index].props[prop];
              return acc;
            }, {});
            instance.setProps(Object.assign({}, overrideProps, {
              getReferenceClientRect: function getReferenceClientRect() {
                return target.getBoundingClientRect();
              }
            }));
          }
        };
      }
    };
    var instance = tippy(div(), Object.assign({}, removeProperties(optionalProps, ['overrides']), {
      plugins: [singleton].concat(optionalProps.plugins || []),
      triggerTarget: references
    }));
    var originalSetProps = instance.setProps;

    instance.setProps = function (props) {
      overrides = props.overrides || overrides;
      originalSetProps(props);
    };

    instance.setInstances = function (nextInstances) {
      enableInstances(true);
      mutTippyInstances = nextInstances;
      enableInstances(false);
      setReferences();
      instance.setProps({
        triggerTarget: references
      });
    };

    return instance;
  };

  var BUBBLING_EVENTS_MAP = {
    mouseover: 'mouseenter',
    focusin: 'focus',
    click: 'click'
  };
  /**
   * Creates a delegate instance that controls the creation of tippy instances
   * for child elements (`target` CSS selector).
   */

  function delegate(targets, props) {
    /* istanbul ignore else */
    {
      errorWhen(!(props && props.target), ['You must specity a `target` prop indicating a CSS selector string matching', 'the target elements that should receive a tippy.'].join(' '));
    }

    var listeners = [];
    var childTippyInstances = [];
    var target = props.target;
    var nativeProps = removeProperties(props, ['target']);
    var parentProps = Object.assign({}, nativeProps, {
      trigger: 'manual',
      touch: false
    });
    var childProps = Object.assign({}, nativeProps, {
      showOnCreate: true
    });
    var returnValue = tippy(targets, parentProps);
    var normalizedReturnValue = normalizeToArray(returnValue);

    function onTrigger(event) {
      if (!event.target) {
        return;
      }

      var targetNode = event.target.closest(target);

      if (!targetNode) {
        return;
      } // Get relevant trigger with fallbacks:
      // 1. Check `data-tippy-trigger` attribute on target node
      // 2. Fallback to `trigger` passed to `delegate()`
      // 3. Fallback to `defaultProps.trigger`


      var trigger = targetNode.getAttribute('data-tippy-trigger') || props.trigger || defaultProps.trigger; // @ts-ignore

      if (targetNode._tippy) {
        return;
      }

      if (event.type === 'touchstart' && typeof childProps.touch === 'boolean') {
        return;
      }

      if (event.type !== 'touchstart' && trigger.indexOf(BUBBLING_EVENTS_MAP[event.type])) {
        return;
      }

      var instance = tippy(targetNode, childProps);

      if (instance) {
        childTippyInstances = childTippyInstances.concat(instance);
      }
    }

    function on(node, eventType, handler, options) {
      if (options === void 0) {
        options = false;
      }

      node.addEventListener(eventType, handler, options);
      listeners.push({
        node: node,
        eventType: eventType,
        handler: handler,
        options: options
      });
    }

    function addEventListeners(instance) {
      var reference = instance.reference;
      on(reference, 'touchstart', onTrigger);
      on(reference, 'mouseover', onTrigger);
      on(reference, 'focusin', onTrigger);
      on(reference, 'click', onTrigger);
    }

    function removeEventListeners() {
      listeners.forEach(function (_ref) {
        var node = _ref.node,
            eventType = _ref.eventType,
            handler = _ref.handler,
            options = _ref.options;
        node.removeEventListener(eventType, handler, options);
      });
      listeners = [];
    }

    function applyMutations(instance) {
      var originalDestroy = instance.destroy;

      instance.destroy = function (shouldDestroyChildInstances) {
        if (shouldDestroyChildInstances === void 0) {
          shouldDestroyChildInstances = true;
        }

        if (shouldDestroyChildInstances) {
          childTippyInstances.forEach(function (instance) {
            instance.destroy();
          });
        }

        childTippyInstances = [];
        removeEventListeners();
        originalDestroy();
      };

      addEventListeners(instance);
    }

    normalizedReturnValue.forEach(applyMutations);
    return returnValue;
  }

/*
  var animateFill = {
    name: 'animateFill',
    defaultValue: false,
    fn: function fn(instance) {
      var _instance$props$rende;

      // @ts-ignore
      if (!((_instance$props$rende = instance.props.render) == null ? void 0 : _instance$props$rende.$$tippy)) {
        {
          errorWhen(instance.props.animateFill, 'The `animateFill` plugin requires the default render function.');
        }

        return {};
      }

      var _getChildren = getChildren(instance.popper),
          box = _getChildren.box,
          content = _getChildren.content;

      var backdrop = instance.props.animateFill ? createBackdropElement() : null;
      return {
        onCreate: function onCreate() {
          if (backdrop) {
            box.insertBefore(backdrop, box.firstElementChild);
            box.setAttribute('data-animatefill', '');
            box.style.overflow = 'hidden';
            instance.setProps({
              arrow: false,
              animation: 'shift-away'
            });
          }
        },
        onMount: function onMount() {
          if (backdrop) {
            var transitionDuration = box.style.transitionDuration;
            var duration = Number(transitionDuration.replace('ms', '')); // The content should fade in after the backdrop has mostly filled the
            // tooltip element. `clip-path` is the other alternative but is not
            // well-supported and is buggy on some devices.

            content.style.transitionDelay = Math.round(duration / 10) + "ms";
            backdrop.style.transitionDuration = transitionDuration;
            setVisibilityState([backdrop], 'visible');
          }
        },
        onShow: function onShow() {
          if (backdrop) {
            backdrop.style.transitionDuration = '0ms';
          }
        },
        onHide: function onHide() {
          if (backdrop) {
            setVisibilityState([backdrop], 'hidden');
          }
        }
      };
    }
  };
*/

  function createBackdropElement() {
    var backdrop = div();
    backdrop.className = BACKDROP_CLASS;
    setVisibilityState([backdrop], 'hidden');
    return backdrop;
  }

/*
  var followCursor = {
    name: 'followCursor',
    defaultValue: false,
    fn: function fn(instance) {
      var reference = instance.reference;
      var doc = getOwnerDocument(instance.props.triggerTarget || reference);
      var initialMouseCoords = null;

      function getIsManual() {
        return instance.props.trigger.trim() === 'manual';
      }

      function getIsEnabled() {
        // #597
        var isValidMouseEvent = getIsManual() ? true : // Check if a keyboard "click"
        initialMouseCoords !== null && !(initialMouseCoords.clientX === 0 && initialMouseCoords.clientY === 0);
        return instance.props.followCursor && isValidMouseEvent;
      }

      function getIsInitialBehavior() {
        return currentInput.isTouch || instance.props.followCursor === 'initial' && instance.state.isVisible;
      }

      function unsetReferenceClientRect(shouldUnset) {
        if (shouldUnset) {
          instance.setProps({
            getReferenceClientRect: null
          });
        }
      }

      function handleMouseMoveListener() {
        if (getIsEnabled()) {
          addListener();
        } else {
          unsetReferenceClientRect(instance.props.followCursor);
        }
      }

      function triggerLastMouseMove() {
        if (getIsEnabled()) {
          onMouseMove(initialMouseCoords);
        }
      }

      function addListener() {
        doc.addEventListener('mousemove', onMouseMove);
      }

      function removeListener() {
        doc.removeEventListener('mousemove', onMouseMove);
      }

      function onMouseMove(event) {
        initialMouseCoords = {
          clientX: event.clientX,
          clientY: event.clientY
        }; // If the instance is interactive, avoid updating the position unless it's
        // over the reference element

        var isCursorOverReference = event.target ? reference.contains(event.target) : true;
        var followCursor = instance.props.followCursor;
        var clientX = event.clientX,
            clientY = event.clientY;
        var rect = reference.getBoundingClientRect();
        var relativeX = clientX - rect.left;
        var relativeY = clientY - rect.top;

        if (isCursorOverReference || !instance.props.interactive) {
          instance.setProps({
            getReferenceClientRect: function getReferenceClientRect() {
              var rect = reference.getBoundingClientRect();
              var x = clientX;
              var y = clientY;

              if (followCursor === 'initial') {
                x = rect.left + relativeX;
                y = rect.top + relativeY;
              }

              var top = followCursor === 'horizontal' ? rect.top : y;
              var right = followCursor === 'vertical' ? rect.right : x;
              var bottom = followCursor === 'horizontal' ? rect.bottom : y;
              var left = followCursor === 'vertical' ? rect.left : x;
              return {
                width: right - left,
                height: bottom - top,
                top: top,
                right: right,
                bottom: bottom,
                left: left
              };
            }
          });
        }

        if (getIsInitialBehavior()) {
          removeListener();
        }
      }

      return {
        onAfterUpdate: function onAfterUpdate(_, _ref) {
          var followCursor = _ref.followCursor;

          if (followCursor !== undefined && !followCursor) {
            unsetReferenceClientRect(true);
          }
        },
        onMount: function onMount() {
          triggerLastMouseMove();
        },
        onShow: function onShow() {
          if (getIsManual()) {
            // Since there's no trigger event to use, we have to use these as
            // baseline coords
            initialMouseCoords = {
              clientX: 0,
              clientY: 0
            };
            handleMouseMoveListener();
          }
        },
        onTrigger: function onTrigger(_, event) {
          // Tapping on touch devices can trigger `mouseenter` then `focus`
          if (initialMouseCoords) {
            return;
          }

          if (isMouseEvent(event)) {
            initialMouseCoords = {
              clientX: event.clientX,
              clientY: event.clientY
            };
          }

          handleMouseMoveListener();
        },
        onUntrigger: function onUntrigger() {
          // If untriggered before showing (`onHidden` will never be invoked)
          if (!instance.state.isVisible) {
            removeListener();
            initialMouseCoords = null;
          }
        },
        onHidden: function onHidden() {
          removeListener();
          initialMouseCoords = null;
        }
      };
    }
  };
*/

  function getProps(props, modifier) {
    var _props$popperOptions;

    return {
      popperOptions: Object.assign({}, props.popperOptions, {
        modifiers: [].concat((((_props$popperOptions = props.popperOptions) == null ? void 0 : _props$popperOptions.modifiers) || []).filter(function (_ref) {
          var name = _ref.name;
          return name !== modifier.name;
        }), [modifier])
      })
    };
  }

/*
  var inlinePositioning = {
    name: 'inlinePositioning',
    defaultValue: false,
    fn: function fn(instance) {
      var reference = instance.reference;

      function isEnabled() {
        return !!instance.props.inlinePositioning;
      }

      var placement;
      var cursorRectIndex = -1;
      var isInternalUpdate = false;
      var modifier = {
        name: 'tippyInlinePositioning',
        enabled: true,
        phase: 'afterWrite',
        fn: function fn(_ref2) {
          var state = _ref2.state;

          if (isEnabled()) {
            if (placement !== state.placement) {
              instance.setProps({
                getReferenceClientRect: function getReferenceClientRect() {
                  return _getReferenceClientRect(state.placement);
                }
              });
            }

            placement = state.placement;
          }
        }
      };

      function _getReferenceClientRect(placement) {
        return getInlineBoundingClientRect(getBasePlacement(placement), reference.getBoundingClientRect(), arrayFrom(reference.getClientRects()), cursorRectIndex);
      }

      function setInternalProps(partialProps) {
        isInternalUpdate = true;
        instance.setProps(partialProps);
        isInternalUpdate = false;
      }

      function addModifier() {
        if (!isInternalUpdate) {
          setInternalProps(getProps(instance.props, modifier));
        }
      }

      return {
        onCreate: addModifier,
        onAfterUpdate: addModifier,
        onTrigger: function onTrigger(_, event) {
          if (isMouseEvent(event)) {
            var rects = arrayFrom(instance.reference.getClientRects());
            var cursorRect = rects.find(function (rect) {
              return rect.left - 2 <= event.clientX && rect.right + 2 >= event.clientX && rect.top - 2 <= event.clientY && rect.bottom + 2 >= event.clientY;
            });
            cursorRectIndex = rects.indexOf(cursorRect);
          }
        },
        onUntrigger: function onUntrigger() {
          cursorRectIndex = -1;
        }
      };
    }
  };
*/
  
  function getInlineBoundingClientRect(currentBasePlacement, boundingRect, clientRects, cursorRectIndex) {
    // Not an inline element, or placement is not yet known
    if (clientRects.length < 2 || currentBasePlacement === null) {
      return boundingRect;
    } // There are two rects and they are disjoined


    if (clientRects.length === 2 && cursorRectIndex >= 0 && clientRects[0].left > clientRects[1].right) {
      return clientRects[cursorRectIndex] || boundingRect;
    }

    switch (currentBasePlacement) {
      case 'top':
      case 'bottom':
        {
          var firstRect = clientRects[0];
          var lastRect = clientRects[clientRects.length - 1];
          var isTop = currentBasePlacement === 'top';
          var top = firstRect.top;
          var bottom = lastRect.bottom;
          var left = isTop ? firstRect.left : lastRect.left;
          var right = isTop ? firstRect.right : lastRect.right;
          var width = right - left;
          var height = bottom - top;
          return {
            top: top,
            bottom: bottom,
            left: left,
            right: right,
            width: width,
            height: height
          };
        }

      case 'left':
      case 'right':
        {
          var minLeft = Math.min.apply(Math, clientRects.map(function (rects) {
            return rects.left;
          }));
          var maxRight = Math.max.apply(Math, clientRects.map(function (rects) {
            return rects.right;
          }));
          var measureRects = clientRects.filter(function (rect) {
            return currentBasePlacement === 'left' ? rect.left === minLeft : rect.right === maxRight;
          });
          var _top = measureRects[0].top;
          var _bottom = measureRects[measureRects.length - 1].bottom;
          var _left = minLeft;
          var _right = maxRight;

          var _width = _right - _left;

          var _height = _bottom - _top;

          return {
            top: _top,
            bottom: _bottom,
            left: _left,
            right: _right,
            width: _width,
            height: _height
          };
        }

      default:
        {
          return boundingRect;
        }
    }
  }

  var sticky = {
    name: 'sticky',
    defaultValue: false,
    fn: function fn(instance) {
      var reference = instance.reference,
          popper = instance.popper;

      function getReference() {
        return instance.popperInstance ? instance.popperInstance.state.elements.reference : reference;
      }

      function shouldCheck(value) {
        return instance.props.sticky === true || instance.props.sticky === value;
      }

      var prevRefRect = null;
      var prevPopRect = null;

      function updatePosition() {
        var currentRefRect = shouldCheck('reference') ? getReference().getBoundingClientRect() : null;
        var currentPopRect = shouldCheck('popper') ? popper.getBoundingClientRect() : null;

        if (currentRefRect && areRectsDifferent(prevRefRect, currentRefRect) || currentPopRect && areRectsDifferent(prevPopRect, currentPopRect)) {
          if (instance.popperInstance) {
            instance.popperInstance.update();
          }
        }

        prevRefRect = currentRefRect;
        prevPopRect = currentPopRect;

        if (instance.state.isMounted) {
          requestAnimationFrame(updatePosition);
        }
      }

      return {
        onMount: function onMount() {
          if (instance.props.sticky) {
            updatePosition();
          }
        }
      };
    }
  };

  function areRectsDifferent(rectA, rectB) {
    if (rectA && rectB) {
      return rectA.top !== rectB.top || rectA.right !== rectB.right || rectA.bottom !== rectB.bottom || rectA.left !== rectB.left;
    }

    return true;
  }

  tippy.setDefaultProps({
    plugins: [/* animateFill,  followCursor, inlinePositioning,*/ sticky],
    render: render
  });
  tippy.createSingleton = createSingleton;
  tippy.delegate = delegate;
  tippy.hideAll = hideAll;
  tippy.roundArrow = ROUND_ARROW;

  return tippy;

})));
$mx(function() {
	$mx.observe('[data-toggle="tooltip"]', function(o) {
		var d = o.data();
		//o.attr('title', d.originalTitle);
		
		
		let params = {
		    placement: d.placement,
		    arrow: tippy.roundArrow,
// 		    interactive: true,
// 		    arrowType: 'round',
// 			sticky: true,
			animation: 'shift-away',
		    trigger: (d.trigger != undefined)?((d.trigger == 'show')?'manual':d.trigger):'mouseenter focus',
		    onShow: function(o) {
			    if (d.html != undefined) $mx(o.props.content).removeClass('is-hidden');
		    },
		    onHidden: function(o) {
			    if (d.html != undefined) $mx(o.props.content).addClass('is-hidden');
		    },
		    appendTo: document.body,
// 		    target: 'span',
// 		    hideOnClick: false,
		    popperOptions: {
			    modifiers: [
				    {
					    name: 'preventOverflow',
						options: {
							boundariesElement: (d.boundariesElement == undefined)?'viewport':d.boundariesElement,
							enabled: true
						}
				    }
				]
		    },
		    
		    zIndex: 99999
		}
		
		if (d.theme != undefined) params.theme = d.theme;
		if (d.interactive != undefined) params.interactive = d.interactive;
		
		
		if (d.html != undefined) {
			params.content = $mx(d.html)[0];
			params.interactive = true;
		} else if (d.originalTitle != undefined) {
			params.content = d.originalTitle;
		}
		
		var instance = tippy(o[0], params);
		
		if (d.trigger == 'show') {	
			var popper = instance.getPopperElement(o[0]);
			instance.show(popper);
		}
		
		o.data('popper', instance);
	});

/*
	$mx(document.body).on('modal.hide modal.show', function() {
		$('[data-toggle="tooltip"]').each(function(o) {
			var instance = this._tippy;
			
			if (instance && instance.state.visible) {
				instance.popperInstance.disableEventListeners()
				instance.hide()
			}
		});
	
	});
*/
});
$mx(document).ready(function() {
	// TODO: remove при перегрузки страницы
	$mx('body').append('<div style="position:absolute;top:-1000px"><div id="autoResizeTextareaCopy" style="white-space:pre-wrap;box-sizing: border-box; -moz-box-sizing: border-box;  -ms-box-sizing: border-box; -webkit-box-sizing: border-box; visibility: hidden;"></div></div>');
	var $copy = $mx('#autoResizeTextareaCopy');
	
	function autoSize($textarea, options) { 
		// The copy must have the same padding, the same dimentions and the same police than the original.
		$copy.css({
			fontFamily:     $textarea.css('fontFamily'),
			fontSize:       $textarea.css('fontSize'),
			lineHeight:     $textarea.css('lineHeight'),
			padding:        $textarea.css('padding'),
			paddingLeft:    $textarea.css('paddingLeft'),
			paddingRight:   $textarea.css('paddingRight'),
			paddingTop:     $textarea.css('paddingTop'), 
			paddingBottom:  $textarea.css('paddingBottom'), 
			width:          $textarea.css('width')
		});
		$textarea.css('overflow', 'hidden');
		$textarea.parents('.media').find('.pull-left.hide').removeClass('is-hidden');
		
		// Copy textarea contents; browser will calculate correct height of copy.
		var text = $textarea.val().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
		$copy.html(text + '<br />');
		
		// Then, we get the height of the copy and we apply it to the textarea.
		var newHeight = $copy.outerHeight();
		//$copy.html(''); // We do this because otherwise, a large void appears in the page if the textarea has a high height.
		if(parseInt(newHeight) != 0) {
			if((options.maxHeight != null && parseInt(newHeight) < parseInt(options.maxHeight)) || options.maxHeight == null) {
				$textarea.css('height', Math.max(options.minHeight, newHeight));
				$textarea.css('overflow-y', 'hidden');
			}
			else {
				$textarea.css('overflow-y', 'scroll');
			}
		}
	}
	
	$mx.fn.autoResize = function(options) { 
		var $this = $mx(this),
		    defaultOptions = {
				maxHeight:  null,
				minHeight:	($this.attr('rows') == undefined || $this.attr('rows') == 1)?40:$this.height()
			};
		
		options = (options == undefined) ? {} : options;
		options = $mx.extend(true, defaultOptions, options);
		$this.on('keyup keydown keypress change paste input cut paste focus', function() { autoSize($this, options); } );

		autoSize($this, options);
	};
});


$mx.observe("textarea.autoresize-init", function(o) {
	o.autoResize();
});

$mx.observe('.accordion', (o) => {
	o.find('.accordion-item').click(function (e) {
		let item = $mx(this);
		if (!item.is('.in')) o.find('.accordion-item').removeClass('in');
		item.toggleClass('in');
	})
});
/*!
  hey, [be]Lazy.js - v1.8.2 - 2016.10.25
  A fast, small and dependency free lazy load script (https://github.com/dinbror/blazy)
  (c) Bjoern Klinggaard - @bklinggaard - http://dinbror.dk/blazy
*/
;
(function(root, blazy) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register bLazy as an anonymous module
        define(blazy);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = blazy();
    } else {
        // Browser globals. Register bLazy on window
        root.Blazy = blazy();
    }
})(this, function() {
    'use strict';

    //private vars
    var _source, _viewport, _isRetina, _supportClosest, _attrSrc = 'src', _attrSrcset = 'srcset';

    // constructor
    return function Blazy(options) {
        //IE7- fallback for missing querySelectorAll support
        if (!document.querySelectorAll) {
            var s = document.createStyleSheet();
            document.querySelectorAll = function(r, c, i, j, a) {
                a = document.all, c = [], r = r.replace(/\[for\b/gi, '[htmlFor').split(',');
                for (i = r.length; i--;) {
                    s.addRule(r[i], 'k:v');
                    for (j = a.length; j--;) a[j].currentStyle.k && c.push(a[j]);
                    s.removeRule(0);
                }
                return c;
            };
        }

        //options and helper vars
        var scope = this;
        var util = scope._util = {};
        util.elements = [];
        util.destroyed = true;
        scope.options = options || {};
        scope.options.error = scope.options.error || false;
        scope.options.offset = scope.options.offset || 100;
        scope.options.root = scope.options.root || document;
        scope.options.success = scope.options.success || false;
        scope.options.selector = scope.options.selector || '.b-lazy';
        scope.options.separator = scope.options.separator || '|';
        scope.options.containerClass = scope.options.container;
        scope.options.container = scope.options.containerClass ? document.querySelectorAll(scope.options.containerClass) : false;
        scope.options.errorClass = scope.options.errorClass || 'b-error';
        scope.options.breakpoints = scope.options.breakpoints || false;
        scope.options.loadInvisible = scope.options.loadInvisible || false;
        scope.options.successClass = scope.options.successClass || 'b-loaded';
        scope.options.validateDelay = scope.options.validateDelay || 25;
        scope.options.saveViewportOffsetDelay = scope.options.saveViewportOffsetDelay || 50;
        scope.options.srcset = scope.options.srcset || 'data-srcset';
        scope.options.src = _source = scope.options.src || 'data-src';
        _supportClosest = Element.prototype.closest;
        _isRetina = window.devicePixelRatio > 1;
        _viewport = {};
        _viewport.top = 0 - scope.options.offset;
        _viewport.left = 0 - scope.options.offset;


        /* public functions
         ************************************/
        scope.revalidate = function() {
            initialize(scope);
        };
        scope.load = function(elements, force) {
            var opt = this.options;
            if (elements && elements.length === undefined) {
                loadElement(elements, force, opt);
            } else {
                each(elements, function(element) {
                    loadElement(element, force, opt);
                });
            }
        };
        scope.destroy = function() {            
            var util = scope._util;
            if (scope.options.container) {
                each(scope.options.container, function(object) {
                    unbindEvent(object, 'scroll', util.validateT);
                });
            }
            unbindEvent(window, 'scroll', util.validateT);
            unbindEvent(window, 'resize', util.validateT);
            unbindEvent(window, 'resize', util.saveViewportOffsetT);
            util.count = 0;
            util.elements.length = 0;
            util.destroyed = true;
        };

        //throttle, ensures that we don't call the functions too often
        util.validateT = throttle(function() {
            validate(scope);
        }, scope.options.validateDelay, scope);
        util.saveViewportOffsetT = throttle(function() {
            saveViewportOffset(scope.options.offset);
        }, scope.options.saveViewportOffsetDelay, scope);
        saveViewportOffset(scope.options.offset);

        //handle multi-served image src (obsolete)
        each(scope.options.breakpoints, function(object) {
            if (object.width >= window.screen.width) {
                _source = object.src;
                return false;
            }
        });

        // start lazy load
        setTimeout(function() {
            initialize(scope);
        }); // "dom ready" fix

    };


    /* Private helper functions
     ************************************/
    function initialize(self) {
        var util = self._util;
        // First we create an array of elements to lazy load
        util.elements = toArray(self.options);
        util.count = util.elements.length;
        // Then we bind resize and scroll events if not already binded
        if (util.destroyed) {
            util.destroyed = false;
            if (self.options.container) {
                each(self.options.container, function(object) {
                    bindEvent(object, 'scroll', util.validateT);
                });
            }
            bindEvent(window, 'resize', util.saveViewportOffsetT);
            bindEvent(window, 'resize', util.validateT);
            bindEvent(window, 'scroll', util.validateT);
        }
        // And finally, we start to lazy load.
        validate(self);
    }

    function validate(self) {
        var util = self._util;
        for (var i = 0; i < util.count; i++) {
            var element = util.elements[i];
            if (elementInView(element, self.options) || hasClass(element, self.options.successClass)) {
                self.load(element);
                util.elements.splice(i, 1);
                util.count--;
                i--;
            }
        }
        if (util.count === 0) {
            self.destroy();
        }
    }

    function elementInView(ele, options) {
        var rect = ele.getBoundingClientRect();

        if(options.container && _supportClosest){
            // Is element inside a container?
            var elementContainer = ele.closest(options.containerClass);
            if(elementContainer){
                var containerRect = elementContainer.getBoundingClientRect();
                // Is container in view?
                if(inView(containerRect, _viewport)){
                    var top = containerRect.top - options.offset;
                    var right = containerRect.right + options.offset;
                    var bottom = containerRect.bottom + options.offset;
                    var left = containerRect.left - options.offset;
                    var containerRectWithOffset = {
                        top: top > _viewport.top ? top : _viewport.top,
                        right: right < _viewport.right ? right : _viewport.right,
                        bottom: bottom < _viewport.bottom ? bottom : _viewport.bottom,
                        left: left > _viewport.left ? left : _viewport.left
                    };
                    // Is element in view of container?
                    return inView(rect, containerRectWithOffset);
                } else {
                    return false;
                }
            }
        }      
        return inView(rect, _viewport);
    }

    function inView(rect, viewport){
        // Intersection
        return rect.right >= viewport.left &&
               rect.bottom >= viewport.top && 
               rect.left <= viewport.right && 
               rect.top <= viewport.bottom;
    }

    function loadElement(ele, force, options) {
        // if element is visible, not loaded or forced
        if (!hasClass(ele, options.successClass) && (force || options.loadInvisible || (ele.offsetWidth > 0 && ele.offsetHeight > 0))) {
            var dataSrc = getAttr(ele, _source) || getAttr(ele, options.src); // fallback to default 'data-src'
            if (dataSrc) {
                var dataSrcSplitted = dataSrc.split(options.separator);
                var src = dataSrcSplitted[_isRetina && dataSrcSplitted.length > 1 ? 1 : 0];
                var srcset = getAttr(ele, options.srcset);
                var isImage = equal(ele, 'img');
                var parent = ele.parentNode;
                var isPicture = parent && equal(parent, 'picture');
                // Image or background image
                if (isImage || ele.src === undefined) {
                    var img = new Image();
                    // using EventListener instead of onerror and onload
                    // due to bug introduced in chrome v50 
                    // (https://productforums.google.com/forum/#!topic/chrome/p51Lk7vnP2o)
                    var onErrorHandler = function() {
                        if (options.error) options.error(ele, "invalid");
                        addClass(ele, options.errorClass);
                        unbindEvent(img, 'error', onErrorHandler);
                        unbindEvent(img, 'load', onLoadHandler);
                    };
                    var onLoadHandler = function() {
                        // Is element an image
                        if (isImage) {
                            if(!isPicture) {
                                handleSources(ele, src, srcset);
                            }
                        // or background-image
                        } else {
                            ele.style.backgroundImage = 'url("' + src + '")';
                        }
                        itemLoaded(ele, options);
                        unbindEvent(img, 'load', onLoadHandler);
                        unbindEvent(img, 'error', onErrorHandler);
                    };
                    
                    // Picture element
                    if (isPicture) {
                        img = ele; // Image tag inside picture element wont get preloaded
                        each(parent.getElementsByTagName('source'), function(source) {
                            handleSource(source, _attrSrcset, options.srcset);
                        });
                    }
                    bindEvent(img, 'error', onErrorHandler);
                    bindEvent(img, 'load', onLoadHandler);
                    handleSources(img, src, srcset); // Preload

                } else { // An item with src like iframe, unity games, simpel video etc
                    ele.src = src;
                    itemLoaded(ele, options);
                }
            } else {
                // video with child source
                if (equal(ele, 'video')) {
                    each(ele.getElementsByTagName('source'), function(source) {
                        handleSource(source, _attrSrc, options.src);
                    });
                    ele.load();
                    itemLoaded(ele, options);
                } else {
                    if (options.error) options.error(ele, "missing");
                    addClass(ele, options.errorClass);
                }
            }
        }
    }

    function itemLoaded(ele, options) {
        addClass(ele, options.successClass);
        if (options.success) options.success(ele);
        // cleanup markup, remove data source attributes
        removeAttr(ele, options.src);
        removeAttr(ele, options.srcset);
        each(options.breakpoints, function(object) {
            removeAttr(ele, object.src);
        });
    }

    function handleSource(ele, attr, dataAttr) {
        var dataSrc = getAttr(ele, dataAttr);
        if (dataSrc) {
            setAttr(ele, attr, dataSrc);
            removeAttr(ele, dataAttr);
        }
    }

    function handleSources(ele, src, srcset){
        if(srcset) {
            setAttr(ele, _attrSrcset, srcset); //srcset
        }
        ele.src = src; //src 
    }

    function setAttr(ele, attr, value){
        ele.setAttribute(attr, value);
    }

    function getAttr(ele, attr) {
        return ele.getAttribute(attr);
    }

    function removeAttr(ele, attr){
        ele.removeAttribute(attr); 
    }

    function equal(ele, str) {
        return ele.nodeName.toLowerCase() === str;
    }

    function hasClass(ele, className) {
        return (' ' + ele.className + ' ').indexOf(' ' + className + ' ') !== -1;
    }

    function addClass(ele, className) {
        if (!hasClass(ele, className)) {
            ele.className += ' ' + className;
        }
    }

    function toArray(options) {
        var array = [];
        var nodelist = (options.root).querySelectorAll(options.selector);
        for (var i = nodelist.length; i--; array.unshift(nodelist[i])) {}
        return array;
    }

    function saveViewportOffset(offset) {
        _viewport.bottom = (window.innerHeight || document.documentElement.clientHeight) + offset;
        _viewport.right = (window.innerWidth || document.documentElement.clientWidth) + offset;
    }

    function bindEvent(ele, type, fn) {
        if (ele.attachEvent) {
            ele.attachEvent && ele.attachEvent('on' + type, fn);
        } else {
            ele.addEventListener(type, fn, { capture: false, passive: true });
        }
    }

    function unbindEvent(ele, type, fn) {
        if (ele.detachEvent) {
            ele.detachEvent && ele.detachEvent('on' + type, fn);
        } else {
            ele.removeEventListener(type, fn, { capture: false, passive: true });
        }
    }

    function each(object, fn) {
        if (object && fn) {
            var l = object.length;
            for (var i = 0; i < l && fn(object[i], i) !== false; i++) {}
        }
    }

    function throttle(fn, minDelay, scope) {
        var lastCall = 0;
        return function() {
            var now = +new Date();
            if (now - lastCall < minDelay) {
                return;
            }
            lastCall = now;
            fn.apply(scope, arguments);
        };
    }
});
$mx(function() {
    var bLazy = new Blazy({loadInvisible: false, selector: '.lazy', 'src': 'data-lazy-src'});
});
/*! Pickr 1.4.7 MIT | https://github.com/Simonwep/pickr */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Pickr=e():t.Pickr=e()}(window,(function(){return function(t){var e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)r.d(n,o,function(e){return t[e]}.bind(null,o));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=134)}([function(t,e,r){var n=r(3),o=r(17).f,i=r(8),a=r(15),c=r(39),u=r(66),s=r(71);t.exports=function(t,e){var r,l,f,p,v,h=t.target,d=t.global,g=t.stat;if(r=d?n:g?n[h]||c(h,{}):(n[h]||{}).prototype)for(l in e){if(p=e[l],f=t.noTargetGet?(v=o(r,l))&&v.value:r[l],!s(d?l:h+(g?".":"#")+l,t.forced)&&void 0!==f){if(typeof p==typeof f)continue;u(p,f)}(t.sham||f&&f.sham)&&i(p,"sham",!0),a(r,l,p,t)}}},function(t,e,r){var n=r(3),o=r(20),i=r(40),a=r(72),c=n.Symbol,u=o("wks");t.exports=function(t){return u[t]||(u[t]=a&&c[t]||(a?c:i)("Symbol."+t))}},function(t,e){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,e,r){(function(e){var r=function(t){return t&&t.Math==Math&&t};t.exports=r("object"==typeof globalThis&&globalThis)||r("object"==typeof window&&window)||r("object"==typeof self&&self)||r("object"==typeof e&&e)||Function("return this")()}).call(this,r(98))},function(t,e,r){var n=r(5);t.exports=function(t){if(!n(t))throw TypeError(String(t)+" is not an object");return t}},function(t,e){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,e){var r={}.hasOwnProperty;t.exports=function(t,e){return r.call(t,e)}},function(t,e,r){var n=r(2);t.exports=!n((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a}))},function(t,e,r){var n=r(7),o=r(12),i=r(18);t.exports=n?function(t,e,r){return o.f(t,e,i(1,r))}:function(t,e,r){return t[e]=r,t}},function(t,e,r){var n=r(16),o=Math.min;t.exports=function(t){return t>0?o(n(t),9007199254740991):0}},function(t,e,r){var n=r(26),o=r(11);t.exports=function(t){return n(o(t))}},function(t,e){t.exports=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t}},function(t,e,r){var n=r(7),o=r(63),i=r(4),a=r(19),c=Object.defineProperty;e.f=n?c:function(t,e,r){if(i(t),e=a(e,!0),i(r),o)try{return c(t,e,r)}catch(t){}if("get"in r||"set"in r)throw TypeError("Accessors not supported");return"value"in r&&(t[e]=r.value),t}},function(t,e,r){var n=r(11);t.exports=function(t){return Object(n(t))}},function(t,e){var r={}.toString;t.exports=function(t){return r.call(t).slice(8,-1)}},function(t,e,r){var n=r(3),o=r(20),i=r(8),a=r(6),c=r(39),u=r(65),s=r(28),l=s.get,f=s.enforce,p=String(u).split("toString");o("inspectSource",(function(t){return u.call(t)})),(t.exports=function(t,e,r,o){var u=!!o&&!!o.unsafe,s=!!o&&!!o.enumerable,l=!!o&&!!o.noTargetGet;"function"==typeof r&&("string"!=typeof e||a(r,"name")||i(r,"name",e),f(r).source=p.join("string"==typeof e?e:"")),t!==n?(u?!l&&t[e]&&(s=!0):delete t[e],s?t[e]=r:i(t,e,r)):s?t[e]=r:c(e,r)})(Function.prototype,"toString",(function(){return"function"==typeof this&&l(this).source||u.call(this)}))},function(t,e){var r=Math.ceil,n=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?n:r)(t)}},function(t,e,r){var n=r(7),o=r(38),i=r(18),a=r(10),c=r(19),u=r(6),s=r(63),l=Object.getOwnPropertyDescriptor;e.f=n?l:function(t,e){if(t=a(t),e=c(e,!0),s)try{return l(t,e)}catch(t){}if(u(t,e))return i(!o.f.call(t,e),t[e])}},function(t,e){t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},function(t,e,r){var n=r(5);t.exports=function(t,e){if(!n(t))return t;var r,o;if(e&&"function"==typeof(r=t.toString)&&!n(o=r.call(t)))return o;if("function"==typeof(r=t.valueOf)&&!n(o=r.call(t)))return o;if(!e&&"function"==typeof(r=t.toString)&&!n(o=r.call(t)))return o;throw TypeError("Can't convert object to primitive value")}},function(t,e,r){var n=r(27),o=r(99);(t.exports=function(t,e){return o[t]||(o[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.3.6",mode:n?"pure":"global",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"})},function(t,e,r){var n=r(75),o=r(26),i=r(13),a=r(9),c=r(46),u=[].push,s=function(t){var e=1==t,r=2==t,s=3==t,l=4==t,f=6==t,p=5==t||f;return function(v,h,d,g){for(var y,b,m=i(v),x=o(m),w=n(h,d,3),S=a(x.length),_=0,A=g||c,O=e?A(v,S):r?A(v,0):void 0;S>_;_++)if((p||_ in x)&&(b=w(y=x[_],_,m),t))if(e)O[_]=b;else if(b)switch(t){case 3:return!0;case 5:return y;case 6:return _;case 2:u.call(O,y)}else if(l)return!1;return f?-1:s||l?l:O}};t.exports={forEach:s(0),map:s(1),filter:s(2),some:s(3),every:s(4),find:s(5),findIndex:s(6)}},function(t,e,r){"use strict";var n=r(19),o=r(12),i=r(18);t.exports=function(t,e,r){var a=n(e);a in t?o.f(t,a,i(0,r)):t[a]=r}},function(t,e,r){var n=r(2),o=r(1),i=r(77),a=o("species");t.exports=function(t){return i>=51||!n((function(){var e=[];return(e.constructor={})[a]=function(){return{foo:1}},1!==e[t](Boolean).foo}))}},function(t,e){t.exports={}},function(t,e,r){var n=r(15),o=r(111),i=Object.prototype;o!==i.toString&&n(i,"toString",o,{unsafe:!0})},function(t,e,r){var n=r(2),o=r(14),i="".split;t.exports=n((function(){return!Object("z").propertyIsEnumerable(0)}))?function(t){return"String"==o(t)?i.call(t,""):Object(t)}:Object},function(t,e){t.exports=!1},function(t,e,r){var n,o,i,a=r(100),c=r(3),u=r(5),s=r(8),l=r(6),f=r(29),p=r(30),v=c.WeakMap;if(a){var h=new v,d=h.get,g=h.has,y=h.set;n=function(t,e){return y.call(h,t,e),e},o=function(t){return d.call(h,t)||{}},i=function(t){return g.call(h,t)}}else{var b=f("state");p[b]=!0,n=function(t,e){return s(t,b,e),e},o=function(t){return l(t,b)?t[b]:{}},i=function(t){return l(t,b)}}t.exports={set:n,get:o,has:i,enforce:function(t){return i(t)?o(t):n(t,{})},getterFor:function(t){return function(e){var r;if(!u(e)||(r=o(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return r}}}},function(t,e,r){var n=r(20),o=r(40),i=n("keys");t.exports=function(t){return i[t]||(i[t]=o(t))}},function(t,e){t.exports={}},function(t,e,r){var n=r(69),o=r(43).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return n(t,o)}},function(t,e,r){var n=r(14);t.exports=Array.isArray||function(t){return"Array"==n(t)}},function(t,e,r){var n=r(4),o=r(101),i=r(43),a=r(30),c=r(102),u=r(64),s=r(29)("IE_PROTO"),l=function(){},f=function(){var t,e=u("iframe"),r=i.length;for(e.style.display="none",c.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write("<script>document.F=Object<\/script>"),t.close(),f=t.F;r--;)delete f.prototype[i[r]];return f()};t.exports=Object.create||function(t,e){var r;return null!==t?(l.prototype=n(t),r=new l,l.prototype=null,r[s]=t):r=f(),void 0===e?r:o(r,e)},a[s]=!0},function(t,e,r){var n=r(69),o=r(43);t.exports=Object.keys||function(t){return n(t,o)}},function(t,e,r){"use strict";var n=r(10),o=r(50),i=r(24),a=r(28),c=r(80),u=a.set,s=a.getterFor("Array Iterator");t.exports=c(Array,"Array",(function(t,e){u(this,{type:"Array Iterator",target:n(t),index:0,kind:e})}),(function(){var t=s(this),e=t.target,r=t.kind,n=t.index++;return!e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==r?{value:n,done:!1}:"values"==r?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values"),i.Arguments=i.Array,o("keys"),o("values"),o("entries")},function(t,e,r){"use strict";var n=r(7),o=r(3),i=r(71),a=r(15),c=r(6),u=r(14),s=r(109),l=r(19),f=r(2),p=r(33),v=r(31).f,h=r(17).f,d=r(12).f,g=r(84).trim,y=o.Number,b=y.prototype,m="Number"==u(p(b)),x=function(t){var e,r,n,o,i,a,c,u,s=l(t,!1);if("string"==typeof s&&s.length>2)if(43===(e=(s=g(s)).charCodeAt(0))||45===e){if(88===(r=s.charCodeAt(2))||120===r)return NaN}else if(48===e){switch(s.charCodeAt(1)){case 66:case 98:n=2,o=49;break;case 79:case 111:n=8,o=55;break;default:return+s}for(a=(i=s.slice(2)).length,c=0;c<a;c++)if((u=i.charCodeAt(c))<48||u>o)return NaN;return parseInt(i,n)}return+s};if(i("Number",!y(" 0o1")||!y("0b1")||y("+0x1"))){for(var w,S=function(t){var e=arguments.length<1?0:t,r=this;return r instanceof S&&(m?f((function(){b.valueOf.call(r)})):"Number"!=u(r))?s(new y(x(e)),r,S):x(e)},_=n?v(y):"MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger".split(","),A=0;_.length>A;A++)c(y,w=_[A])&&!c(S,w)&&d(S,w,h(y,w));S.prototype=b,b.constructor=S,a(o,"Number",S)}},function(t,e,r){"use strict";var n=r(0),o=r(3),i=r(27),a=r(7),c=r(72),u=r(2),s=r(6),l=r(32),f=r(5),p=r(4),v=r(13),h=r(10),d=r(19),g=r(18),y=r(33),b=r(34),m=r(31),x=r(103),w=r(44),S=r(17),_=r(12),A=r(38),O=r(8),j=r(15),k=r(20),E=r(29),C=r(30),P=r(40),L=r(1),I=r(73),R=r(74),T=r(45),N=r(28),M=r(21).forEach,F=E("hidden"),D=L("toPrimitive"),B=N.set,H=N.getterFor("Symbol"),V=Object.prototype,G=o.Symbol,$=o.JSON,W=$&&$.stringify,z=S.f,U=_.f,Y=x.f,X=A.f,q=k("symbols"),K=k("op-symbols"),J=k("string-to-symbol-registry"),Q=k("symbol-to-string-registry"),Z=k("wks"),tt=o.QObject,et=!tt||!tt.prototype||!tt.prototype.findChild,rt=a&&u((function(){return 7!=y(U({},"a",{get:function(){return U(this,"a",{value:7}).a}})).a}))?function(t,e,r){var n=z(V,e);n&&delete V[e],U(t,e,r),n&&t!==V&&U(V,e,n)}:U,nt=function(t,e){var r=q[t]=y(G.prototype);return B(r,{type:"Symbol",tag:t,description:e}),a||(r.description=e),r},ot=c&&"symbol"==typeof G.iterator?function(t){return"symbol"==typeof t}:function(t){return Object(t)instanceof G},it=function(t,e,r){t===V&&it(K,e,r),p(t);var n=d(e,!0);return p(r),s(q,n)?(r.enumerable?(s(t,F)&&t[F][n]&&(t[F][n]=!1),r=y(r,{enumerable:g(0,!1)})):(s(t,F)||U(t,F,g(1,{})),t[F][n]=!0),rt(t,n,r)):U(t,n,r)},at=function(t,e){p(t);var r=h(e),n=b(r).concat(lt(r));return M(n,(function(e){a&&!ct.call(r,e)||it(t,e,r[e])})),t},ct=function(t){var e=d(t,!0),r=X.call(this,e);return!(this===V&&s(q,e)&&!s(K,e))&&(!(r||!s(this,e)||!s(q,e)||s(this,F)&&this[F][e])||r)},ut=function(t,e){var r=h(t),n=d(e,!0);if(r!==V||!s(q,n)||s(K,n)){var o=z(r,n);return!o||!s(q,n)||s(r,F)&&r[F][n]||(o.enumerable=!0),o}},st=function(t){var e=Y(h(t)),r=[];return M(e,(function(t){s(q,t)||s(C,t)||r.push(t)})),r},lt=function(t){var e=t===V,r=Y(e?K:h(t)),n=[];return M(r,(function(t){!s(q,t)||e&&!s(V,t)||n.push(q[t])})),n};c||(j((G=function(){if(this instanceof G)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=P(t),r=function(t){this===V&&r.call(K,t),s(this,F)&&s(this[F],e)&&(this[F][e]=!1),rt(this,e,g(1,t))};return a&&et&&rt(V,e,{configurable:!0,set:r}),nt(e,t)}).prototype,"toString",(function(){return H(this).tag})),A.f=ct,_.f=it,S.f=ut,m.f=x.f=st,w.f=lt,a&&(U(G.prototype,"description",{configurable:!0,get:function(){return H(this).description}}),i||j(V,"propertyIsEnumerable",ct,{unsafe:!0})),I.f=function(t){return nt(L(t),t)}),n({global:!0,wrap:!0,forced:!c,sham:!c},{Symbol:G}),M(b(Z),(function(t){R(t)})),n({target:"Symbol",stat:!0,forced:!c},{for:function(t){var e=String(t);if(s(J,e))return J[e];var r=G(e);return J[e]=r,Q[r]=e,r},keyFor:function(t){if(!ot(t))throw TypeError(t+" is not a symbol");if(s(Q,t))return Q[t]},useSetter:function(){et=!0},useSimple:function(){et=!1}}),n({target:"Object",stat:!0,forced:!c,sham:!a},{create:function(t,e){return void 0===e?y(t):at(y(t),e)},defineProperty:it,defineProperties:at,getOwnPropertyDescriptor:ut}),n({target:"Object",stat:!0,forced:!c},{getOwnPropertyNames:st,getOwnPropertySymbols:lt}),n({target:"Object",stat:!0,forced:u((function(){w.f(1)}))},{getOwnPropertySymbols:function(t){return w.f(v(t))}}),$&&n({target:"JSON",stat:!0,forced:!c||u((function(){var t=G();return"[null]"!=W([t])||"{}"!=W({a:t})||"{}"!=W(Object(t))}))},{stringify:function(t){for(var e,r,n=[t],o=1;arguments.length>o;)n.push(arguments[o++]);if(r=e=n[1],(f(e)||void 0!==t)&&!ot(t))return l(e)||(e=function(t,e){if("function"==typeof r&&(e=r.call(this,t,e)),!ot(e))return e}),n[1]=e,W.apply($,n)}}),G.prototype[D]||O(G.prototype,D,G.prototype.valueOf),T(G,"Symbol"),C[F]=!0},function(t,e,r){"use strict";var n={}.propertyIsEnumerable,o=Object.getOwnPropertyDescriptor,i=o&&!n.call({1:2},1);e.f=i?function(t){var e=o(this,t);return!!e&&e.enumerable}:n},function(t,e,r){var n=r(3),o=r(8);t.exports=function(t,e){try{o(n,t,e)}catch(r){n[t]=e}return e}},function(t,e){var r=0,n=Math.random();t.exports=function(t){return"Symbol("+String(void 0===t?"":t)+")_"+(++r+n).toString(36)}},function(t,e,r){var n=r(68),o=r(3),i=function(t){return"function"==typeof t?t:void 0};t.exports=function(t,e){return arguments.length<2?i(n[t])||i(o[t]):n[t]&&n[t][e]||o[t]&&o[t][e]}},function(t,e,r){var n=r(16),o=Math.max,i=Math.min;t.exports=function(t,e){var r=n(t);return r<0?o(r+e,0):i(r,e)}},function(t,e){t.exports=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"]},function(t,e){e.f=Object.getOwnPropertySymbols},function(t,e,r){var n=r(12).f,o=r(6),i=r(1)("toStringTag");t.exports=function(t,e,r){t&&!o(t=r?t:t.prototype,i)&&n(t,i,{configurable:!0,value:e})}},function(t,e,r){var n=r(5),o=r(32),i=r(1)("species");t.exports=function(t,e){var r;return o(t)&&("function"!=typeof(r=t.constructor)||r!==Array&&!o(r.prototype)?n(r)&&null===(r=r[i])&&(r=void 0):r=void 0),new(void 0===r?Array:r)(0===e?0:e)}},function(t,e,r){"use strict";var n=r(0),o=r(7),i=r(3),a=r(6),c=r(5),u=r(12).f,s=r(66),l=i.Symbol;if(o&&"function"==typeof l&&(!("description"in l.prototype)||void 0!==l().description)){var f={},p=function(){var t=arguments.length<1||void 0===arguments[0]?void 0:String(arguments[0]),e=this instanceof p?new l(t):void 0===t?l():l(t);return""===t&&(f[e]=!0),e};s(p,l);var v=p.prototype=l.prototype;v.constructor=p;var h=v.toString,d="Symbol(test)"==String(l("test")),g=/^Symbol\((.*)\)[^)]+$/;u(v,"description",{configurable:!0,get:function(){var t=c(this)?this.valueOf():this,e=h.call(t);if(a(f,t))return"";var r=d?e.slice(7,-1):e.replace(g,"$1");return""===r?void 0:r}}),n({global:!0,forced:!0},{Symbol:p})}},function(t,e,r){r(74)("iterator")},function(t,e,r){"use strict";var n=r(0),o=r(2),i=r(32),a=r(5),c=r(13),u=r(9),s=r(22),l=r(46),f=r(23),p=r(1),v=r(77),h=p("isConcatSpreadable"),d=v>=51||!o((function(){var t=[];return t[h]=!1,t.concat()[0]!==t})),g=f("concat"),y=function(t){if(!a(t))return!1;var e=t[h];return void 0!==e?!!e:i(t)};n({target:"Array",proto:!0,forced:!d||!g},{concat:function(t){var e,r,n,o,i,a=c(this),f=l(a,0),p=0;for(e=-1,n=arguments.length;e<n;e++)if(i=-1===e?a:arguments[e],y(i)){if(p+(o=u(i.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(r=0;r<o;r++,p++)r in i&&s(f,p,i[r])}else{if(p>=9007199254740991)throw TypeError("Maximum allowed index exceeded");s(f,p++,i)}return f.length=p,f}})},function(t,e,r){var n=r(1),o=r(33),i=r(8),a=n("unscopables"),c=Array.prototype;null==c[a]&&i(c,a,o(null)),t.exports=function(t){c[a][t]=!0}},function(t,e,r){var n=r(0),o=r(110);n({target:"Object",stat:!0,forced:Object.assign!==o},{assign:o})},function(t,e,r){var n=r(0),o=r(13),i=r(34);n({target:"Object",stat:!0,forced:r(2)((function(){i(1)}))},{keys:function(t){return i(o(t))}})},function(t,e,r){"use strict";var n=r(15),o=r(4),i=r(2),a=r(87),c=RegExp.prototype,u=c.toString,s=i((function(){return"/a/b"!=u.call({source:"a",flags:"b"})})),l="toString"!=u.name;(s||l)&&n(RegExp.prototype,"toString",(function(){var t=o(this),e=String(t.source),r=t.flags;return"/"+e+"/"+String(void 0===r&&t instanceof RegExp&&!("flags"in c)?a.call(t):r)}),{unsafe:!0})},function(t,e,r){"use strict";var n=r(88).charAt,o=r(28),i=r(80),a=o.set,c=o.getterFor("String Iterator");i(String,"String",(function(t){a(this,{type:"String Iterator",string:String(t),index:0})}),(function(){var t,e=c(this),r=e.string,o=e.index;return o>=r.length?{value:void 0,done:!0}:(t=n(r,o),e.index+=t.length,{value:t,done:!1})}))},function(t,e,r){"use strict";var n=r(8),o=r(15),i=r(2),a=r(1),c=r(56),u=a("species"),s=!i((function(){var t=/./;return t.exec=function(){var t=[];return t.groups={a:"7"},t},"7"!=="".replace(t,"$<a>")})),l=!i((function(){var t=/(?:)/,e=t.exec;t.exec=function(){return e.apply(this,arguments)};var r="ab".split(t);return 2!==r.length||"a"!==r[0]||"b"!==r[1]}));t.exports=function(t,e,r,f){var p=a(t),v=!i((function(){var e={};return e[p]=function(){return 7},7!=""[t](e)})),h=v&&!i((function(){var e=!1,r=/a/;return"split"===t&&((r={}).constructor={},r.constructor[u]=function(){return r},r.flags="",r[p]=/./[p]),r.exec=function(){return e=!0,null},r[p](""),!e}));if(!v||!h||"replace"===t&&!s||"split"===t&&!l){var d=/./[p],g=r(p,""[t],(function(t,e,r,n,o){return e.exec===c?v&&!o?{done:!0,value:d.call(e,r,n)}:{done:!0,value:t.call(r,e,n)}:{done:!1}})),y=g[0],b=g[1];o(String.prototype,t,y),o(RegExp.prototype,p,2==e?function(t,e){return b.call(t,this,e)}:function(t){return b.call(t,this)}),f&&n(RegExp.prototype[p],"sham",!0)}}},function(t,e,r){"use strict";var n,o,i=r(87),a=RegExp.prototype.exec,c=String.prototype.replace,u=a,s=(n=/a/,o=/b*/g,a.call(n,"a"),a.call(o,"a"),0!==n.lastIndex||0!==o.lastIndex),l=void 0!==/()??/.exec("")[1];(s||l)&&(u=function(t){var e,r,n,o,u=this;return l&&(r=new RegExp("^"+u.source+"$(?!\\s)",i.call(u))),s&&(e=u.lastIndex),n=a.call(u,t),s&&n&&(u.lastIndex=u.global?n.index+n[0].length:e),l&&n&&n.length>1&&c.call(n[0],r,(function(){for(o=1;o<arguments.length-2;o++)void 0===arguments[o]&&(n[o]=void 0)})),n}),t.exports=u},function(t,e,r){"use strict";var n=r(88).charAt;t.exports=function(t,e,r){return e+(r?n(t,e).length:1)}},function(t,e,r){var n=r(14),o=r(56);t.exports=function(t,e){var r=t.exec;if("function"==typeof r){var i=r.call(t,e);if("object"!=typeof i)throw TypeError("RegExp exec method returned something other than an Object or null");return i}if("RegExp"!==n(t))throw TypeError("RegExp#exec called on incompatible receiver");return o.call(t,e)}},function(t,e,r){"use strict";var n=r(16),o=r(11);t.exports="".repeat||function(t){var e=String(o(this)),r="",i=n(t);if(i<0||i==1/0)throw RangeError("Wrong number of repetitions");for(;i>0;(i>>>=1)&&(e+=e))1&i&&(r+=e);return r}},function(t,e,r){var n=r(3),o=r(92),i=r(115),a=r(8);for(var c in o){var u=n[c],s=u&&u.prototype;if(s&&s.forEach!==i)try{a(s,"forEach",i)}catch(t){s.forEach=i}}},function(t,e,r){var n=r(3),o=r(92),i=r(35),a=r(8),c=r(1),u=c("iterator"),s=c("toStringTag"),l=i.values;for(var f in o){var p=n[f],v=p&&p.prototype;if(v){if(v[u]!==l)try{a(v,u,l)}catch(t){v[u]=l}if(v[s]||a(v,s,f),o[f])for(var h in i)if(v[h]!==i[h])try{a(v,h,i[h])}catch(t){v[h]=i[h]}}}},function(t,e,r){"use strict";var n=r(55),o=r(91),i=r(4),a=r(11),c=r(127),u=r(57),s=r(9),l=r(58),f=r(56),p=r(2),v=[].push,h=Math.min,d=!p((function(){return!RegExp(4294967295,"y")}));n("split",2,(function(t,e,r){var n;return n="c"=="abbc".split(/(b)*/)[1]||4!="test".split(/(?:)/,-1).length||2!="ab".split(/(?:ab)*/).length||4!=".".split(/(.?)(.?)/).length||".".split(/()()/).length>1||"".split(/.?/).length?function(t,r){var n=String(a(this)),i=void 0===r?4294967295:r>>>0;if(0===i)return[];if(void 0===t)return[n];if(!o(t))return e.call(n,t,i);for(var c,u,s,l=[],p=(t.ignoreCase?"i":"")+(t.multiline?"m":"")+(t.unicode?"u":"")+(t.sticky?"y":""),h=0,d=new RegExp(t.source,p+"g");(c=f.call(d,n))&&!((u=d.lastIndex)>h&&(l.push(n.slice(h,c.index)),c.length>1&&c.index<n.length&&v.apply(l,c.slice(1)),s=c[0].length,h=u,l.length>=i));)d.lastIndex===c.index&&d.lastIndex++;return h===n.length?!s&&d.test("")||l.push(""):l.push(n.slice(h)),l.length>i?l.slice(0,i):l}:"0".split(void 0,0).length?function(t,r){return void 0===t&&0===r?[]:e.call(this,t,r)}:e,[function(e,r){var o=a(this),i=null==e?void 0:e[t];return void 0!==i?i.call(e,o,r):n.call(String(o),e,r)},function(t,o){var a=r(n,t,this,o,n!==e);if(a.done)return a.value;var f=i(t),p=String(this),v=c(f,RegExp),g=f.unicode,y=(f.ignoreCase?"i":"")+(f.multiline?"m":"")+(f.unicode?"u":"")+(d?"y":"g"),b=new v(d?f:"^(?:"+f.source+")",y),m=void 0===o?4294967295:o>>>0;if(0===m)return[];if(0===p.length)return null===l(b,p)?[p]:[];for(var x=0,w=0,S=[];w<p.length;){b.lastIndex=d?w:0;var _,A=l(b,d?p:p.slice(w));if(null===A||(_=h(s(b.lastIndex+(d?0:w)),p.length))===x)w=u(p,w,g);else{if(S.push(p.slice(x,w)),S.length===m)return S;for(var O=1;O<=A.length-1;O++)if(S.push(A[O]),S.length===m)return S;w=x=_}}return S.push(p.slice(x)),S}]}),!d)},function(t,e,r){var n=r(7),o=r(2),i=r(64);t.exports=!n&&!o((function(){return 7!=Object.defineProperty(i("div"),"a",{get:function(){return 7}}).a}))},function(t,e,r){var n=r(3),o=r(5),i=n.document,a=o(i)&&o(i.createElement);t.exports=function(t){return a?i.createElement(t):{}}},function(t,e,r){var n=r(20);t.exports=n("native-function-to-string",Function.toString)},function(t,e,r){var n=r(6),o=r(67),i=r(17),a=r(12);t.exports=function(t,e){for(var r=o(e),c=a.f,u=i.f,s=0;s<r.length;s++){var l=r[s];n(t,l)||c(t,l,u(e,l))}}},function(t,e,r){var n=r(41),o=r(31),i=r(44),a=r(4);t.exports=n("Reflect","ownKeys")||function(t){var e=o.f(a(t)),r=i.f;return r?e.concat(r(t)):e}},function(t,e,r){t.exports=r(3)},function(t,e,r){var n=r(6),o=r(10),i=r(70).indexOf,a=r(30);t.exports=function(t,e){var r,c=o(t),u=0,s=[];for(r in c)!n(a,r)&&n(c,r)&&s.push(r);for(;e.length>u;)n(c,r=e[u++])&&(~i(s,r)||s.push(r));return s}},function(t,e,r){var n=r(10),o=r(9),i=r(42),a=function(t){return function(e,r,a){var c,u=n(e),s=o(u.length),l=i(a,s);if(t&&r!=r){for(;s>l;)if((c=u[l++])!=c)return!0}else for(;s>l;l++)if((t||l in u)&&u[l]===r)return t||l||0;return!t&&-1}};t.exports={includes:a(!0),indexOf:a(!1)}},function(t,e,r){var n=r(2),o=/#|\.prototype\./,i=function(t,e){var r=c[a(t)];return r==s||r!=u&&("function"==typeof e?n(e):!!e)},a=i.normalize=function(t){return String(t).replace(o,".").toLowerCase()},c=i.data={},u=i.NATIVE="N",s=i.POLYFILL="P";t.exports=i},function(t,e,r){var n=r(2);t.exports=!!Object.getOwnPropertySymbols&&!n((function(){return!String(Symbol())}))},function(t,e,r){e.f=r(1)},function(t,e,r){var n=r(68),o=r(6),i=r(73),a=r(12).f;t.exports=function(t){var e=n.Symbol||(n.Symbol={});o(e,t)||a(e,t,{value:i.f(t)})}},function(t,e,r){var n=r(76);t.exports=function(t,e,r){if(n(t),void 0===e)return t;switch(r){case 0:return function(){return t.call(e)};case 1:return function(r){return t.call(e,r)};case 2:return function(r,n){return t.call(e,r,n)};case 3:return function(r,n,o){return t.call(e,r,n,o)}}return function(){return t.apply(e,arguments)}}},function(t,e){t.exports=function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function");return t}},function(t,e,r){var n,o,i=r(3),a=r(78),c=i.process,u=c&&c.versions,s=u&&u.v8;s?o=(n=s.split("."))[0]+n[1]:a&&(!(n=a.match(/Edge\/(\d+)/))||n[1]>=74)&&(n=a.match(/Chrome\/(\d+)/))&&(o=n[1]),t.exports=o&&+o},function(t,e,r){var n=r(41);t.exports=n("navigator","userAgent")||""},function(t,e,r){"use strict";var n=r(0),o=r(21).find,i=r(50),a=!0;"find"in[]&&Array(1).find((function(){a=!1})),n({target:"Array",proto:!0,forced:a},{find:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}}),i("find")},function(t,e,r){"use strict";var n=r(0),o=r(105),i=r(82),a=r(83),c=r(45),u=r(8),s=r(15),l=r(1),f=r(27),p=r(24),v=r(81),h=v.IteratorPrototype,d=v.BUGGY_SAFARI_ITERATORS,g=l("iterator"),y=function(){return this};t.exports=function(t,e,r,l,v,b,m){o(r,e,l);var x,w,S,_=function(t){if(t===v&&E)return E;if(!d&&t in j)return j[t];switch(t){case"keys":case"values":case"entries":return function(){return new r(this,t)}}return function(){return new r(this)}},A=e+" Iterator",O=!1,j=t.prototype,k=j[g]||j["@@iterator"]||v&&j[v],E=!d&&k||_(v),C="Array"==e&&j.entries||k;if(C&&(x=i(C.call(new t)),h!==Object.prototype&&x.next&&(f||i(x)===h||(a?a(x,h):"function"!=typeof x[g]&&u(x,g,y)),c(x,A,!0,!0),f&&(p[A]=y))),"values"==v&&k&&"values"!==k.name&&(O=!0,E=function(){return k.call(this)}),f&&!m||j[g]===E||u(j,g,E),p[e]=E,v)if(w={values:_("values"),keys:b?E:_("keys"),entries:_("entries")},m)for(S in w)!d&&!O&&S in j||s(j,S,w[S]);else n({target:e,proto:!0,forced:d||O},w);return w}},function(t,e,r){"use strict";var n,o,i,a=r(82),c=r(8),u=r(6),s=r(1),l=r(27),f=s("iterator"),p=!1;[].keys&&("next"in(i=[].keys())?(o=a(a(i)))!==Object.prototype&&(n=o):p=!0),null==n&&(n={}),l||u(n,f)||c(n,f,(function(){return this})),t.exports={IteratorPrototype:n,BUGGY_SAFARI_ITERATORS:p}},function(t,e,r){var n=r(6),o=r(13),i=r(29),a=r(106),c=i("IE_PROTO"),u=Object.prototype;t.exports=a?Object.getPrototypeOf:function(t){return t=o(t),n(t,c)?t[c]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?u:null}},function(t,e,r){var n=r(4),o=r(107);t.exports=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(r,[]),e=r instanceof Array}catch(t){}return function(r,i){return n(r),o(i),e?t.call(r,i):r.__proto__=i,r}}():void 0)},function(t,e,r){var n=r(11),o="["+r(85)+"]",i=RegExp("^"+o+o+"*"),a=RegExp(o+o+"*$"),c=function(t){return function(e){var r=String(n(e));return 1&t&&(r=r.replace(i,"")),2&t&&(r=r.replace(a,"")),r}};t.exports={start:c(1),end:c(2),trim:c(3)}},function(t,e){t.exports="\t\n\v\f\r                　\u2028\u2029\ufeff"},function(t,e,r){var n=r(14),o=r(1)("toStringTag"),i="Arguments"==n(function(){return arguments}());t.exports=function(t){var e,r,a;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),o))?r:i?n(e):"Object"==(a=n(e))&&"function"==typeof e.callee?"Arguments":a}},function(t,e,r){"use strict";var n=r(4);t.exports=function(){var t=n(this),e="";return t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.dotAll&&(e+="s"),t.unicode&&(e+="u"),t.sticky&&(e+="y"),e}},function(t,e,r){var n=r(16),o=r(11),i=function(t){return function(e,r){var i,a,c=String(o(e)),u=n(r),s=c.length;return u<0||u>=s?t?"":void 0:(i=c.charCodeAt(u))<55296||i>56319||u+1===s||(a=c.charCodeAt(u+1))<56320||a>57343?t?c.charAt(u):i:t?c.slice(u,u+2):a-56320+(i-55296<<10)+65536}};t.exports={codeAt:i(!1),charAt:i(!0)}},function(t,e,r){"use strict";var n=r(55),o=r(4),i=r(9),a=r(11),c=r(57),u=r(58);n("match",1,(function(t,e,r){return[function(e){var r=a(this),n=null==e?void 0:e[t];return void 0!==n?n.call(e,r):new RegExp(e)[t](String(r))},function(t){var n=r(e,t,this);if(n.done)return n.value;var a=o(t),s=String(this);if(!a.global)return u(a,s);var l=a.unicode;a.lastIndex=0;for(var f,p=[],v=0;null!==(f=u(a,s));){var h=String(f[0]);p[v]=h,""===h&&(a.lastIndex=c(s,i(a.lastIndex),l)),v++}return 0===v?null:p}]}))},function(t,e,r){"use strict";var n=r(0),o=r(9),i=r(113),a=r(11),c=r(114),u="".startsWith,s=Math.min;n({target:"String",proto:!0,forced:!c("startsWith")},{startsWith:function(t){var e=String(a(this));i(t);var r=o(s(arguments.length>1?arguments[1]:void 0,e.length)),n=String(t);return u?u.call(e,n,r):e.slice(r,r+n.length)===n}})},function(t,e,r){var n=r(5),o=r(14),i=r(1)("match");t.exports=function(t){var e;return n(t)&&(void 0!==(e=t[i])?!!e:"RegExp"==o(t))}},function(t,e){t.exports={CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}},function(t,e,r){"use strict";var n=r(2);t.exports=function(t,e){var r=[][t];return!r||!n((function(){r.call(null,e||function(){throw 1},1)}))}},function(t,e,r){"use strict";var n=r(0),o=r(26),i=r(10),a=r(93),c=[].join,u=o!=Object,s=a("join",",");n({target:"Array",proto:!0,forced:u||s},{join:function(t){return c.call(i(this),void 0===t?",":t)}})},function(t,e,r){"use strict";var n=r(0),o=r(21).map;n({target:"Array",proto:!0,forced:!r(23)("map")},{map:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}})},function(t,e,r){"use strict";var n=r(0),o=r(130).start;n({target:"String",proto:!0,forced:r(131)},{padStart:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}})},function(t){t.exports=JSON.parse('{"a":"1.4.7"}')},function(t,e){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(t){"object"==typeof window&&(r=window)}t.exports=r},function(t,e,r){var n=r(3),o=r(39),i=n["__core-js_shared__"]||o("__core-js_shared__",{});t.exports=i},function(t,e,r){var n=r(3),o=r(65),i=n.WeakMap;t.exports="function"==typeof i&&/native code/.test(o.call(i))},function(t,e,r){var n=r(7),o=r(12),i=r(4),a=r(34);t.exports=n?Object.defineProperties:function(t,e){i(t);for(var r,n=a(e),c=n.length,u=0;c>u;)o.f(t,r=n[u++],e[r]);return t}},function(t,e,r){var n=r(41);t.exports=n("document","documentElement")},function(t,e,r){var n=r(10),o=r(31).f,i={}.toString,a="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return a&&"[object Window]"==i.call(t)?function(t){try{return o(t)}catch(t){return a.slice()}}(t):o(n(t))}},function(t,e,r){"use strict";var n=r(0),o=r(70).includes,i=r(50);n({target:"Array",proto:!0},{includes:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}}),i("includes")},function(t,e,r){"use strict";var n=r(81).IteratorPrototype,o=r(33),i=r(18),a=r(45),c=r(24),u=function(){return this};t.exports=function(t,e,r){var s=e+" Iterator";return t.prototype=o(n,{next:i(1,r)}),a(t,s,!1,!0),c[s]=u,t}},function(t,e,r){var n=r(2);t.exports=!n((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype}))},function(t,e,r){var n=r(5);t.exports=function(t){if(!n(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype");return t}},function(t,e,r){"use strict";var n=r(0),o=r(42),i=r(16),a=r(9),c=r(13),u=r(46),s=r(22),l=r(23),f=Math.max,p=Math.min;n({target:"Array",proto:!0,forced:!l("splice")},{splice:function(t,e){var r,n,l,v,h,d,g=c(this),y=a(g.length),b=o(t,y),m=arguments.length;if(0===m?r=n=0:1===m?(r=0,n=y-b):(r=m-2,n=p(f(i(e),0),y-b)),y+r-n>9007199254740991)throw TypeError("Maximum allowed length exceeded");for(l=u(g,n),v=0;v<n;v++)(h=b+v)in g&&s(l,v,g[h]);if(l.length=n,r<n){for(v=b;v<y-n;v++)d=v+r,(h=v+n)in g?g[d]=g[h]:delete g[d];for(v=y;v>y-n+r;v--)delete g[v-1]}else if(r>n)for(v=y-n;v>b;v--)d=v+r-1,(h=v+n-1)in g?g[d]=g[h]:delete g[d];for(v=0;v<r;v++)g[v+b]=arguments[v+2];return g.length=y-n+r,l}})},function(t,e,r){var n=r(5),o=r(83);t.exports=function(t,e,r){var i,a;return o&&"function"==typeof(i=e.constructor)&&i!==r&&n(a=i.prototype)&&a!==r.prototype&&o(t,a),t}},function(t,e,r){"use strict";var n=r(7),o=r(2),i=r(34),a=r(44),c=r(38),u=r(13),s=r(26),l=Object.assign;t.exports=!l||o((function(){var t={},e={},r=Symbol();return t[r]=7,"abcdefghijklmnopqrst".split("").forEach((function(t){e[t]=t})),7!=l({},t)[r]||"abcdefghijklmnopqrst"!=i(l({},e)).join("")}))?function(t,e){for(var r=u(t),o=arguments.length,l=1,f=a.f,p=c.f;o>l;)for(var v,h=s(arguments[l++]),d=f?i(h).concat(f(h)):i(h),g=d.length,y=0;g>y;)v=d[y++],n&&!p.call(h,v)||(r[v]=h[v]);return r}:l},function(t,e,r){"use strict";var n=r(86),o={};o[r(1)("toStringTag")]="z",t.exports="[object z]"!==String(o)?function(){return"[object "+n(this)+"]"}:o.toString},function(t,e,r){r(0)({target:"String",proto:!0},{repeat:r(59)})},function(t,e,r){var n=r(91);t.exports=function(t){if(n(t))throw TypeError("The method doesn't accept regular expressions");return t}},function(t,e,r){var n=r(1)("match");t.exports=function(t){var e=/./;try{"/./"[t](e)}catch(r){try{return e[n]=!1,"/./"[t](e)}catch(t){}}return!1}},function(t,e,r){"use strict";var n=r(21).forEach,o=r(93);t.exports=o("forEach")?function(t){return n(this,t,arguments.length>1?arguments[1]:void 0)}:[].forEach},function(t,e,r){"use strict";var n=r(0),o=r(21).filter;n({target:"Array",proto:!0,forced:!r(23)("filter")},{filter:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}})},function(t,e,r){var n=r(0),o=r(118);n({target:"Array",stat:!0,forced:!r(122)((function(t){Array.from(t)}))},{from:o})},function(t,e,r){"use strict";var n=r(75),o=r(13),i=r(119),a=r(120),c=r(9),u=r(22),s=r(121);t.exports=function(t){var e,r,l,f,p,v=o(t),h="function"==typeof this?this:Array,d=arguments.length,g=d>1?arguments[1]:void 0,y=void 0!==g,b=0,m=s(v);if(y&&(g=n(g,d>2?arguments[2]:void 0,2)),null==m||h==Array&&a(m))for(r=new h(e=c(v.length));e>b;b++)u(r,b,y?g(v[b],b):v[b]);else for(p=(f=m.call(v)).next,r=new h;!(l=p.call(f)).done;b++)u(r,b,y?i(f,g,[l.value,b],!0):l.value);return r.length=b,r}},function(t,e,r){var n=r(4);t.exports=function(t,e,r,o){try{return o?e(n(r)[0],r[1]):e(r)}catch(e){var i=t.return;throw void 0!==i&&n(i.call(t)),e}}},function(t,e,r){var n=r(1),o=r(24),i=n("iterator"),a=Array.prototype;t.exports=function(t){return void 0!==t&&(o.Array===t||a[i]===t)}},function(t,e,r){var n=r(86),o=r(24),i=r(1)("iterator");t.exports=function(t){if(null!=t)return t[i]||t["@@iterator"]||o[n(t)]}},function(t,e,r){var n=r(1)("iterator"),o=!1;try{var i=0,a={next:function(){return{done:!!i++}},return:function(){o=!0}};a[n]=function(){return this},Array.from(a,(function(){throw 2}))}catch(t){}t.exports=function(t,e){if(!e&&!o)return!1;var r=!1;try{var i={};i[n]=function(){return{next:function(){return{done:r=!0}}}},t(i)}catch(t){}return r}},function(t,e,r){"use strict";var n=r(0),o=r(5),i=r(32),a=r(42),c=r(9),u=r(10),s=r(22),l=r(23),f=r(1)("species"),p=[].slice,v=Math.max;n({target:"Array",proto:!0,forced:!l("slice")},{slice:function(t,e){var r,n,l,h=u(this),d=c(h.length),g=a(t,d),y=a(void 0===e?d:e,d);if(i(h)&&("function"!=typeof(r=h.constructor)||r!==Array&&!i(r.prototype)?o(r)&&null===(r=r[f])&&(r=void 0):r=void 0,r===Array||void 0===r))return p.call(h,g,y);for(n=new(void 0===r?Array:r)(v(y-g,0)),l=0;g<y;g++,l++)g in h&&s(n,l,h[g]);return n.length=l,n}})},function(t,e,r){var n=r(0),o=r(2),i=r(10),a=r(17).f,c=r(7),u=o((function(){a(1)}));n({target:"Object",stat:!0,forced:!c||u,sham:!c},{getOwnPropertyDescriptor:function(t,e){return a(i(t),e)}})},function(t,e,r){var n=r(0),o=r(7),i=r(67),a=r(10),c=r(17),u=r(22);n({target:"Object",stat:!0,sham:!o},{getOwnPropertyDescriptors:function(t){for(var e,r,n=a(t),o=c.f,s=i(n),l={},f=0;s.length>f;)void 0!==(r=o(n,e=s[f++]))&&u(l,e,r);return l}})},function(t,e,r){"use strict";var n=r(55),o=r(4),i=r(13),a=r(9),c=r(16),u=r(11),s=r(57),l=r(58),f=Math.max,p=Math.min,v=Math.floor,h=/\$([$&'`]|\d\d?|<[^>]*>)/g,d=/\$([$&'`]|\d\d?)/g;n("replace",2,(function(t,e,r){return[function(r,n){var o=u(this),i=null==r?void 0:r[t];return void 0!==i?i.call(r,o,n):e.call(String(o),r,n)},function(t,i){var u=r(e,t,this,i);if(u.done)return u.value;var v=o(t),h=String(this),d="function"==typeof i;d||(i=String(i));var g=v.global;if(g){var y=v.unicode;v.lastIndex=0}for(var b=[];;){var m=l(v,h);if(null===m)break;if(b.push(m),!g)break;""===String(m[0])&&(v.lastIndex=s(h,a(v.lastIndex),y))}for(var x,w="",S=0,_=0;_<b.length;_++){m=b[_];for(var A=String(m[0]),O=f(p(c(m.index),h.length),0),j=[],k=1;k<m.length;k++)j.push(void 0===(x=m[k])?x:String(x));var E=m.groups;if(d){var C=[A].concat(j,O,h);void 0!==E&&C.push(E);var P=String(i.apply(void 0,C))}else P=n(A,h,O,j,E,i);O>=S&&(w+=h.slice(S,O)+P,S=O+A.length)}return w+h.slice(S)}];function n(t,r,n,o,a,c){var u=n+t.length,s=o.length,l=d;return void 0!==a&&(a=i(a),l=h),e.call(c,l,(function(e,i){var c;switch(i.charAt(0)){case"$":return"$";case"&":return t;case"`":return r.slice(0,n);case"'":return r.slice(u);case"<":c=a[i.slice(1,-1)];break;default:var l=+i;if(0===l)return e;if(l>s){var f=v(l/10);return 0===f?e:f<=s?void 0===o[f-1]?i.charAt(1):o[f-1]+i.charAt(1):e}c=o[l-1]}return void 0===c?"":c}))}}))},function(t,e,r){var n=r(4),o=r(76),i=r(1)("species");t.exports=function(t,e){var r,a=n(t).constructor;return void 0===a||null==(r=n(a)[i])?e:o(r)}},function(t,e,r){"use strict";var n=r(0),o=r(84).trim;n({target:"String",proto:!0,forced:r(129)("trim")},{trim:function(){return o(this)}})},function(t,e,r){var n=r(2),o=r(85);t.exports=function(t){return n((function(){return!!o[t]()||"​ "!="​ "[t]()||o[t].name!==t}))}},function(t,e,r){var n=r(9),o=r(59),i=r(11),a=Math.ceil,c=function(t){return function(e,r,c){var u,s,l=String(i(e)),f=l.length,p=void 0===c?" ":String(c),v=n(r);return v<=f||""==p?l:(u=v-f,(s=o.call(p,a(u/p.length))).length>u&&(s=s.slice(0,u)),t?l+s:s+l)}};t.exports={start:c(!1),end:c(!0)}},function(t,e,r){var n=r(78);t.exports=/Version\/10\.\d+(\.\d+)?( Mobile\/\w+)? Safari\//.test(n)},function(t,e,r){"use strict";var n=r(0),o=r(16),i=r(133),a=r(59),c=r(2),u=1..toFixed,s=Math.floor,l=function(t,e,r){return 0===e?r:e%2==1?l(t,e-1,r*t):l(t*t,e/2,r)};n({target:"Number",proto:!0,forced:u&&("0.000"!==8e-5.toFixed(3)||"1"!==.9.toFixed(0)||"1.25"!==1.255.toFixed(2)||"1000000000000000128"!==(0xde0b6b3a7640080).toFixed(0))||!c((function(){u.call({})}))},{toFixed:function(t){var e,r,n,c,u=i(this),f=o(t),p=[0,0,0,0,0,0],v="",h="0",d=function(t,e){for(var r=-1,n=e;++r<6;)n+=t*p[r],p[r]=n%1e7,n=s(n/1e7)},g=function(t){for(var e=6,r=0;--e>=0;)r+=p[e],p[e]=s(r/t),r=r%t*1e7},y=function(){for(var t=6,e="";--t>=0;)if(""!==e||0===t||0!==p[t]){var r=String(p[t]);e=""===e?r:e+a.call("0",7-r.length)+r}return e};if(f<0||f>20)throw RangeError("Incorrect fraction digits");if(u!=u)return"NaN";if(u<=-1e21||u>=1e21)return String(u);if(u<0&&(v="-",u=-u),u>1e-21)if(r=(e=function(t){for(var e=0,r=t;r>=4096;)e+=12,r/=4096;for(;r>=2;)e+=1,r/=2;return e}(u*l(2,69,1))-69)<0?u*l(2,-e,1):u/l(2,e,1),r*=4503599627370496,(e=52-e)>0){for(d(0,r),n=f;n>=7;)d(1e7,0),n-=7;for(d(l(10,n,1),0),n=e-1;n>=23;)g(1<<23),n-=23;g(1<<n),d(1,1),g(2),h=y()}else d(0,r),d(1<<-e,0),h=y()+a.call("0",f);return h=f>0?v+((c=h.length)<=f?"0."+a.call("0",f-c)+h:h.slice(0,c-f)+"."+h.slice(c-f)):v+h}})},function(t,e,r){var n=r(14);t.exports=function(t){if("number"!=typeof t&&"Number"!=n(t))throw TypeError("Incorrect invocation");return+t}},function(t,e,r){"use strict";r.r(e);var n={};r.r(n),r.d(n,"on",(function(){return c})),r.d(n,"off",(function(){return u})),r.d(n,"createElementFromString",(function(){return l})),r.d(n,"removeAttribute",(function(){return f})),r.d(n,"createFromTemplate",(function(){return p})),r.d(n,"eventPath",(function(){return v})),r.d(n,"resolveElement",(function(){return h})),r.d(n,"adjustableInputNumbers",(function(){return d}));r(37),r(47),r(48),r(49),r(79),r(104),r(35),r(108),r(36),r(51),r(52),r(25),r(53),r(54),r(89),r(112),r(90),r(60),r(61),r(116),r(117),r(123),r(124),r(125),r(126),r(62),r(128);function o(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function i(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?o(r,!0).forEach((function(e){a(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):o(r).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function a(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var c=s.bind(null,"addEventListener"),u=s.bind(null,"removeEventListener");function s(t,e,r,n,o){void 0===o&&(o={}),e instanceof HTMLCollection||e instanceof NodeList?e=Array.from(e):Array.isArray(e)||(e=[e]),Array.isArray(r)||(r=[r]);var a=e,c=Array.isArray(a),u=0;for(a=c?a:a[Symbol.iterator]();;){var s;if(c){if(u>=a.length)break;s=a[u++]}else{if((u=a.next()).done)break;s=u.value}var l=s,f=r,p=Array.isArray(f),v=0;for(f=p?f:f[Symbol.iterator]();;){var h;if(p){if(v>=f.length)break;h=f[v++]}else{if((v=f.next()).done)break;h=v.value}var d=h;l[t](d,n,i({capture:!1},o))}}return Array.prototype.slice.call(arguments,1)}function l(t){var e=document.createElement("div");return e.innerHTML=t.trim(),e.firstElementChild}function f(t,e){var r=t.getAttribute(e);return t.removeAttribute(e),r}function p(t){return function t(e,r){void 0===r&&(r={});var n=f(e,":obj"),o=f(e,":ref"),i=n?r[n]={}:r;o&&(r[o]=e);for(var a=0,c=Array.from(e.children);a<c.length;a++){var u=c[a],s=f(u,":arr"),l=t(u,s?{}:i);s&&(i[s]||(i[s]=[])).push(Object.keys(l).length?l:u)}return r}(l(t))}function v(t){var e=t.path||t.composedPath&&t.composedPath();if(e)return e;var r=t.target.parentElement;for(e=[t.target,r];r=r.parentElement;)e.push(r);return e.push(document,window),e}function h(t){return t instanceof Element?t:"string"==typeof t?t.split(/>>/g).reduce((function(t,e,r,n){return t=t.querySelector(e),r<n.length-1?t.shadowRoot:t}),document):null}function d(t,e){function r(r){var n=[.001,.01,.1][Number(r.shiftKey||2*r.ctrlKey)]*(r.deltaY<0?1:-1),o=0,i=t.selectionStart;t.value=t.value.replace(/[\d.]+/g,(function(t,r){return r<=i&&r+t.length>=i?(i=r,e(Number(t),n,o)):(o++,t)})),t.focus(),t.setSelectionRange(i,i),r.preventDefault(),t.dispatchEvent(new Event("input"))}void 0===e&&(e=function(t){return t}),c(t,"focus",(function(){return c(window,"wheel",r,{passive:!1})})),c(t,"blur",(function(){return u(window,"wheel",r)}))}var g=r(97),y=(r(94),r(95),r(96),Math.min),b=Math.max,m=Math.floor,x=Math.round;function w(t,e,r){e/=100,r/=100;var n=m(t=t/360*6),o=t-n,i=r*(1-e),a=r*(1-o*e),c=r*(1-(1-o)*e),u=n%6;return[255*[r,a,i,i,c,r][u],255*[c,r,r,a,i,i][u],255*[i,i,c,r,r,a][u]]}function S(t,e,r){var n,o,i=y(t/=255,e/=255,r/=255),a=b(t,e,r),c=a-i;if(0===c)n=o=0;else{o=c/a;var u=((a-t)/6+c/2)/c,s=((a-e)/6+c/2)/c,l=((a-r)/6+c/2)/c;t===a?n=l-s:e===a?n=1/3+u-l:r===a&&(n=2/3+s-u),n<0?n+=1:n>1&&(n-=1)}return[360*n,100*o,100*a]}function _(t,e,r,n){e/=100,r/=100;var o=255*(1-y(1,(t/=100)*(1-(n/=100))+n)),i=255*(1-y(1,e*(1-n)+n)),a=255*(1-y(1,r*(1-n)+n));return[].concat(S(o,i,a))}function A(t,e,r){return e/=100,[t,2*(e*=(r/=100)<.5?r:1-r)/(r+e)*100,100*(r+e)]}function O(t){return S.apply(void 0,t.match(/.{2}/g).map((function(t){return parseInt(t,16)})))}function j(t){t=t.match(/^[a-zA-Z]+$/)?function(t){if("black"===t.toLowerCase())return"#000";var e=document.createElement("canvas").getContext("2d");return e.fillStyle=t,"#000"===e.fillStyle?null:e.fillStyle}(t):t;var e,r={cmyk:/^cmyk[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)/i,rgba:/^((rgba)|rgb)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i,hsla:/^((hsla)|hsl)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i,hsva:/^((hsva)|hsv)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i,hexa:/^#?(([\dA-Fa-f]{3,4})|([\dA-Fa-f]{6})|([\dA-Fa-f]{8}))$/i},n=function(t){return t.map((function(t){return/^(|\d+)\.\d+|\d+$/.test(t)?Number(t):void 0}))};t:for(var o in r)if(e=r[o].exec(t)){var i=function(t){return!!e[2]==("number"==typeof t)};switch(o){case"cmyk":var a=n(e),c=a[1],u=a[2],s=a[3],l=a[4];if(c>100||u>100||s>100||l>100)break t;return{values:_(c,u,s,l),type:o};case"rgba":var f=n(e),p=f[3],v=f[4],h=f[5],d=f[6];if(p>255||v>255||h>255||d<0||d>1||!i(d))break t;return{values:[].concat(S(p,v,h),[d]),a:d,type:o};case"hexa":var g=e[1];4!==g.length&&3!==g.length||(g=g.split("").map((function(t){return t+t})).join(""));var y=g.substring(0,6),b=g.substring(6);return b=b?parseInt(b,16)/255:void 0,{values:[].concat(O(y),[b]),a:b,type:o};case"hsla":var m=n(e),x=m[3],w=m[4],j=m[5],k=m[6];if(x>360||w>100||j>100||k<0||k>1||!i(k))break t;return{values:[].concat(A(x,w,j),[k]),a:k,type:o};case"hsva":var E=n(e),C=E[3],P=E[4],L=E[5],I=E[6];if(C>360||P>100||L>100||I<0||I>1||!i(I))break t;return{values:[C,P,L,I],a:I,type:o}}}return{values:null,type:null}}r(132);function k(t,e,r,n){void 0===t&&(t=0),void 0===e&&(e=0),void 0===r&&(r=0),void 0===n&&(n=1);var o=function(t,e){return function(r){return void 0===r&&(r=-1),e(~r?t.map((function(t){return Number(t.toFixed(r))})):t)}},i={h:t,s:e,v:r,a:n,toHSVA:function(){var t=[i.h,i.s,i.v,i.a];return t.toString=o(t,(function(t){return"hsva("+t[0]+", "+t[1]+"%, "+t[2]+"%, "+i.a+")"})),t},toHSLA:function(){var t=[].concat(function(t,e,r){var n=(2-(e/=100))*(r/=100)/2;return 0!==n&&(e=1===n?0:n<.5?e*r/(2*n):e*r/(2-2*n)),[t,100*e,100*n]}(i.h,i.s,i.v),[i.a]);return t.toString=o(t,(function(t){return"hsla("+t[0]+", "+t[1]+"%, "+t[2]+"%, "+i.a+")"})),t},toRGBA:function(){var t=[].concat(w(i.h,i.s,i.v),[i.a]);return t.toString=o(t,(function(t){return"rgba("+t[0]+", "+t[1]+", "+t[2]+", "+i.a+")"})),t},toCMYK:function(){var t=function(t,e,r){var n,o=w(t,e,r),i=o[0]/255,a=o[1]/255,c=o[2]/255;return[100*(1===(n=y(1-i,1-a,1-c))?0:(1-i-n)/(1-n)),100*(1===n?0:(1-a-n)/(1-n)),100*(1===n?0:(1-c-n)/(1-n)),100*n]}(i.h,i.s,i.v);return t.toString=o(t,(function(t){return"cmyk("+t[0]+"%, "+t[1]+"%, "+t[2]+"%, "+t[3]+"%)"})),t},toHEXA:function(){var t=function(t,e,r){return w(t,e,r).map((function(t){return x(t).toString(16).padStart(2,"0")}))}(i.h,i.s,i.v),e=i.a>=1?"":Number((255*i.a).toFixed(0)).toString(16).toUpperCase().padStart(2,"0");return e&&t.push(e),t.toString=function(){return"#"+t.join("").toUpperCase()},t},clone:function(){return k(i.h,i.s,i.v,i.a)}};return i}var E=function(t){return Math.max(Math.min(t,1),0)};function C(t){var e={options:Object.assign({lock:null,onchange:function(){return 0},onstop:function(){return 0}},t),_keyboard:function(t){var n=t.type,o=t.key;if(document.activeElement===r.wrapper){var i=e.options.lock,a="ArrowUp"===o,c="ArrowRight"===o,u="ArrowDown"===o,s="ArrowLeft"===o;if("keydown"===n&&(a||c||u||s)){var l=0,f=0;"v"===i?l=a||c?1:-1:"h"===i?l=a||c?-1:1:(f=a?-1:u?1:0,l=s?-1:c?1:0),e.update(E(e.cache.x+.01*l),E(e.cache.y+.01*f)),t.preventDefault()}else o.startsWith("Arrow")&&(e.options.onstop(),t.preventDefault())}},_tapstart:function(t){c(document,["mouseup","touchend","touchcancel"],e._tapstop),c(document,["mousemove","touchmove"],e._tapmove),t.preventDefault(),e._tapmove(t)},_tapmove:function(t){var n=e.options.lock,o=e.cache,i=r.element,a=r.wrapper,c=a.getBoundingClientRect(),u=0,s=0;if(t){var l=t&&t.touches&&t.touches[0];u=t?(l||t).clientX:0,s=t?(l||t).clientY:0,u<c.left?u=c.left:u>c.left+c.width&&(u=c.left+c.width),s<c.top?s=c.top:s>c.top+c.height&&(s=c.top+c.height),u-=c.left,s-=c.top}else o&&(u=o.x*c.width,s=o.y*c.height);"h"!==n&&(i.style.left="calc("+u/c.width*100+"% - "+i.offsetWidth/2+"px)"),"v"!==n&&(i.style.top="calc("+s/c.height*100+"% - "+i.offsetHeight/2+"px)"),e.cache={x:u/c.width,y:s/c.height};var f=E(u/a.offsetWidth),p=E(s/a.offsetHeight);switch(n){case"v":return r.onchange(f);case"h":return r.onchange(p);default:return r.onchange(f,p)}},_tapstop:function(){e.options.onstop(),u(document,["mouseup","touchend","touchcancel"],e._tapstop),u(document,["mousemove","touchmove"],e._tapmove)},trigger:function(){e._tapmove()},update:function(t,r){void 0===t&&(t=0),void 0===r&&(r=0);var n=e.options.wrapper.getBoundingClientRect(),o=n.left,i=n.top,a=n.width,c=n.height;"h"===e.options.lock&&(r=t),e._tapmove({clientX:o+a*t,clientY:i+c*r})},destroy:function(){var t=e.options,r=e._tapstart;u([t.wrapper,t.element],"mousedown",r),u([t.wrapper,t.element],"touchstart",r,{passive:!1})}},r=e.options,n=e._tapstart,o=e._keyboard;return c([r.wrapper,r.element],"mousedown",n),c([r.wrapper,r.element],"touchstart",n,{passive:!1}),c(document,["keydown","keyup"],o),e}function P(t){void 0===t&&(t={}),t=Object.assign({onchange:function(){return 0},className:"",elements:[]},t);var e=c(t.elements,"click",(function(e){t.elements.forEach((function(r){return r.classList[e.target===r?"add":"remove"](t.className)})),t.onchange(e)}));return{destroy:function(){return u.apply(n,e)}}}function L(t){var e,r=t.el,n=t.reference,o=t.padding,i=void 0===o?8:o,a={start:"sme",middle:"mse",end:"ems"},c={top:"tbrl",right:"rltb",bottom:"btrl",left:"lrbt"},u=(void 0===e&&(e={}),function(t,r){if(void 0===r&&(r=e[t]),r)return r;var n=t.split("-"),o=n[0],i=n[1],a=void 0===i?"middle":i,c="top"===o||"bottom"===o;return e[t]={position:o,variant:a,isVertical:c}});return{update:function(t){var e=u(t),o=e.position,s=e.variant,l=e.isVertical,f=n.getBoundingClientRect(),p=r.getBoundingClientRect(),v=function(t){return t?{s:f.left+f.width-p.width,m:-p.width/2+(f.left+f.width/2),e:f.left}:{s:f.bottom-p.height,m:f.bottom-f.height/2-p.height/2,e:f.bottom-f.height}},h={};function d(t,e,n){var o="top"===n,i=o?p.height:p.width,a=window[o?"innerHeight":"innerWidth"],c=t,u=Array.isArray(c),s=0;for(c=u?c:c[Symbol.iterator]();;){var l;if(u){if(s>=c.length)break;l=c[s++]}else{if((s=c.next()).done)break;l=s.value}var f=e[l],v=h[n]=f+"px";if(f>0&&f+i<a)return r.style[n]=v,!0}return!1}for(var g=0,y=[l,!l];g<y.length;g++){var b=y[g],m=d(c[o],b?{t:f.top-p.height-i,b:f.bottom+i}:{r:f.right+i,l:f.left-p.width-i},b?"top":"left"),x=d(a[s],v(b),b?"left":"top");if(m&&x)return}r.style.left=h.left,r.style.top=h.top}}}function I(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var R=function(){function t(t){var e=this;I(this,"_initializingActive",!0),I(this,"_recalc",!0),I(this,"_color",k()),I(this,"_lastColor",k()),I(this,"_swatchColors",[]),I(this,"_eventListener",{init:[],save:[],hide:[],show:[],clear:[],change:[],changestop:[],cancel:[],swatchselect:[]}),this.options=t=Object.assign({appClass:null,theme:"classic",useAsButton:!1,padding:8,disabled:!1,comparison:!0,closeOnScroll:!1,outputPrecision:0,lockOpacity:!1,autoReposition:!0,container:"body",components:{interaction:{}},strings:{},swatches:null,inline:!1,sliders:null,default:"#42445a",defaultRepresentation:null,position:"bottom-middle",adjustableNumbers:!0,showAlways:!1,closeWithKey:"Escape"},t);var r=t,n=r.swatches,o=r.components,i=r.theme,a=r.sliders,c=r.lockOpacity,u=r.padding;["nano","monolith"].includes(i)&&!a&&(t.sliders="h"),o.interaction||(o.interaction={});var s=o.preview,l=o.opacity,f=o.hue,p=o.palette;o.opacity=!c&&l,o.palette=p||s||l||f,this._preBuild(),this._buildComponents(),this._bindEvents(),this._finalBuild(),n&&n.length&&n.forEach((function(t){return e.addSwatch(t)}));var v=this._root,h=v.button,d=v.app;this._nanopop=L({reference:h,padding:u,el:d}),h.setAttribute("role","button"),h.setAttribute("aria-label","toggle color picker dialog");var g=this;requestAnimationFrame((function e(){if(!d.offsetWidth&&d.parentElement!==t.container)return requestAnimationFrame(e);g.setColor(t.default),g._rePositioningPicker(),t.defaultRepresentation&&(g._representation=t.defaultRepresentation,g.setColorRepresentation(g._representation)),t.showAlways&&g.show(),g._initializingActive=!1,g._emit("init")}))}var e=t.prototype;return e._preBuild=function(){for(var t,e,r,n,o,i,a,c,u,s,l,f=this.options,v=0,d=["el","container"];v<d.length;v++){var g=d[v];f[g]=h(f[g])}this._root=(e=(t=f).components,r=t.strings,n=t.useAsButton,o=t.inline,i=t.appClass,a=t.theme,c=t.lockOpacity,s=p('\n      <div :ref="root" class="pickr">\n\n        '+(n?"":'<button type="button" :ref="button" class="pcr-button"></button>')+'\n\n        <div :ref="app" class="pcr-app '+(i||"")+'" data-theme="'+a+'" '+(o?'style="position: unset"':"")+' aria-label="color picker dialog" role="form">\n          <div class="pcr-selection" '+(u=function(t){return t?"":'style="display:none" hidden'})(e.palette)+'>\n            <div :obj="preview" class="pcr-color-preview" '+u(e.preview)+'>\n              <button type="button" :ref="lastColor" class="pcr-last-color" aria-label="use previous color"></button>\n              <div :ref="currentColor" class="pcr-current-color"></div>\n            </div>\n\n            <div :obj="palette" class="pcr-color-palette">\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="palette" class="pcr-palette" tabindex="0" aria-label="color selection area" role="listbox"></div>\n            </div>\n\n            <div :obj="hue" class="pcr-color-chooser" '+u(e.hue)+'>\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="slider" class="pcr-hue pcr-slider" tabindex="0" aria-label="hue selection slider" role="slider"></div>\n            </div>\n\n            <div :obj="opacity" class="pcr-color-opacity" '+u(e.opacity)+'>\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="slider" class="pcr-opacity pcr-slider" tabindex="0" aria-label="opacity selection slider" role="slider"></div>\n            </div>\n          </div>\n\n          <div class="pcr-swatches '+(e.palette?"":"pcr-last")+'" :ref="swatches"></div> \n\n          <div :obj="interaction" class="pcr-interaction" '+u(Object.keys(e.interaction).length)+'>\n            <input :ref="result" class="pcr-result" type="text" spellcheck="false" '+u(e.interaction.input)+'>\n\n            <input :arr="options" class="pcr-type" data-type="HEXA" value="'+(c?"HEX":"HEXA")+'" type="button" '+u(e.interaction.hex)+'>\n            <input :arr="options" class="pcr-type" data-type="RGBA" value="'+(c?"RGB":"RGBA")+'" type="button" '+u(e.interaction.rgba)+'>\n            <input :arr="options" class="pcr-type" data-type="HSLA" value="'+(c?"HSL":"HSLA")+'" type="button" '+u(e.interaction.hsla)+'>\n            <input :arr="options" class="pcr-type" data-type="HSVA" value="'+(c?"HSV":"HSVA")+'" type="button" '+u(e.interaction.hsva)+'>\n            <input :arr="options" class="pcr-type" data-type="CMYK" value="CMYK" type="button" '+u(e.interaction.cmyk)+'>\n\n            <input :ref="save" class="pcr-save" value="'+(r.save||"Save")+'" type="button" '+u(e.interaction.save)+' aria-label="save and exit">\n            <input :ref="cancel" class="pcr-cancel" value="'+(r.cancel||"Cancel")+'" type="button" '+u(e.interaction.cancel)+' aria-label="cancel and exit">\n            <input :ref="clear" class="pcr-clear" value="'+(r.clear||"Clear")+'" type="button" '+u(e.interaction.clear)+' aria-label="clear and exit">\n          </div>\n        </div>\n      </div>\n    '),(l=s.interaction).options.find((function(t){return!t.hidden&&!t.classList.add("active")})),l.type=function(){return l.options.find((function(t){return t.classList.contains("active")}))},s),f.useAsButton&&(this._root.button=f.el),f.container.appendChild(this._root.root)},e._finalBuild=function(){var t=this.options,e=this._root;if(t.container.removeChild(e.root),t.inline){var r=t.el.parentElement;t.el.nextSibling?r.insertBefore(e.app,t.el.nextSibling):r.appendChild(e.app)}else t.container.appendChild(e.app);t.useAsButton?t.inline&&t.el.remove():t.el.parentNode.replaceChild(e.root,t.el),t.disabled&&this.disable(),t.comparison||(e.button.style.transition="none",t.useAsButton||(e.preview.lastColor.style.transition="none")),this.hide()},e._buildComponents=function(){var t=this,e=this,r=this.options.components,n=(e.options.sliders||"v").repeat(2),o=n.match(/^[vh]+$/g)?n:[],i=o[0],a=o[1],c=function(){return t._color||(t._color=t._lastColor.clone())},u={palette:C({element:e._root.palette.picker,wrapper:e._root.palette.palette,onstop:function(){return e._emit("changestop",e)},onchange:function(t,n){if(r.palette){var o=c(),i=e._root,a=e.options;e._recalc&&(o.s=100*t,o.v=100-100*n,o.v<0&&(o.v=0),e._updateOutput());var u=o.toRGBA().toString(0);this.element.style.background=u,this.wrapper.style.background="\n                        linear-gradient(to top, rgba(0, 0, 0, "+o.a+"), transparent),\n                        linear-gradient(to left, hsla("+o.h+", 100%, 50%, "+o.a+"), rgba(255, 255, 255, "+o.a+"))\n                    ",a.comparison?a.useAsButton||e._lastColor||(i.preview.lastColor.style.color=u):i.button.style.color=u;var s=o.toHEXA().toString(),l=e._swatchColors,f=Array.isArray(l),p=0;for(l=f?l:l[Symbol.iterator]();;){var v;if(f){if(p>=l.length)break;v=l[p++]}else{if((p=l.next()).done)break;v=p.value}var h=v,d=h.el,g=h.color;d.classList[s===g.toHEXA().toString()?"add":"remove"]("pcr-active")}i.preview.currentColor.style.color=u,e.options.comparison||i.button.classList.remove("clear")}}}),hue:C({lock:"v"===a?"h":"v",element:e._root.hue.picker,wrapper:e._root.hue.slider,onstop:function(){return e._emit("changestop",e)},onchange:function(t){if(r.hue&&r.palette){var n=c();e._recalc&&(n.h=360*t),this.element.style.backgroundColor="hsl("+n.h+", 100%, 50%)",u.palette.trigger()}}}),opacity:C({lock:"v"===i?"h":"v",element:e._root.opacity.picker,wrapper:e._root.opacity.slider,onstop:function(){return e._emit("changestop",e)},onchange:function(t){if(r.opacity&&r.palette){var n=c();e._recalc&&(n.a=Math.round(100*t)/100),this.element.style.background="rgba(0, 0, 0, "+n.a+")",u.palette.trigger()}}}),selectable:P({elements:e._root.interaction.options,className:"active",onchange:function(t){e._representation=t.target.getAttribute("data-type").toUpperCase(),e._recalc&&e._updateOutput()}})};this._components=u},e._bindEvents=function(){var t=this,e=this._root,r=this.options,n=[c(e.interaction.clear,"click",(function(){return t._clearColor()})),c([e.interaction.cancel,e.preview.lastColor],"click",(function(){t._emit("cancel",t),t.setHSVA.apply(t,(t._lastColor||t._color).toHSVA().concat([!0]))})),c(e.interaction.save,"click",(function(){!t.applyColor()&&!r.showAlways&&t.hide()})),c(e.interaction.result,["keyup","input"],(function(e){t.setColor(e.target.value,!0)&&!t._initializingActive&&t._emit("change",t._color),e.stopImmediatePropagation()})),c(e.interaction.result,["focus","blur"],(function(e){t._recalc="blur"===e.type,t._recalc&&t._updateOutput()})),c([e.palette.palette,e.palette.picker,e.hue.slider,e.hue.picker,e.opacity.slider,e.opacity.picker],["mousedown","touchstart"],(function(){return t._recalc=!0}))];if(!r.showAlways){var o=r.closeWithKey;n.push(c(e.button,"click",(function(){return t.isOpen()?t.hide():t.show()})),c(document,"keyup",(function(e){return t.isOpen()&&(e.key===o||e.code===o)&&t.hide()})),c(document,["touchstart","mousedown"],(function(r){t.isOpen()&&!v(r).some((function(t){return t===e.app||t===e.button}))&&t.hide()}),{capture:!0}))}if(r.adjustableNumbers){var i={rgba:[255,255,255,1],hsva:[360,100,100,1],hsla:[360,100,100,1],cmyk:[100,100,100,100]};d(e.interaction.result,(function(e,r,n){var o=i[t.getColorRepresentation().toLowerCase()];if(o){var a=o[n],c=e+(a>=100?1e3*r:r);return c<=0?0:Number((c<a?c:a).toPrecision(3))}return e}))}if(r.autoReposition&&!r.inline){var a=null,u=this;n.push(c(window,["scroll","resize"],(function(){u.isOpen()&&(r.closeOnScroll&&u.hide(),null===a?(a=setTimeout((function(){return a=null}),100),requestAnimationFrame((function t(){u._rePositioningPicker(),null!==a&&requestAnimationFrame(t)}))):(clearTimeout(a),a=setTimeout((function(){return a=null}),100)))}),{capture:!0}))}this._eventBindings=n},e._rePositioningPicker=function(){var t=this.options;if(!t.inline){var e=this._root.app;matchMedia("(max-width: 576px)").matches?Object.assign(e.style,{margin:"auto",height:e.getBoundingClientRect().height+"px",top:0,bottom:0,left:0,right:0}):(Object.assign(e.style,{margin:null,right:null,top:null,bottom:null,left:null,height:null}),this._nanopop.update(t.position))}},e._updateOutput=function(){var t=this._root,e=this._color,r=this.options;if(t.interaction.type()){var n="to"+t.interaction.type().getAttribute("data-type");t.interaction.result.value="function"==typeof e[n]?e[n]().toString(r.outputPrecision):""}!this._initializingActive&&this._recalc&&this._emit("change",e)},e._clearColor=function(t){void 0===t&&(t=!1);var e=this._root,r=this.options;r.useAsButton||(e.button.style.color="rgba(0, 0, 0, 0.15)"),e.button.classList.add("clear"),r.showAlways||this.hide(),this._lastColor=null,this._initializingActive||t||(this._emit("save",null),this._emit("clear",this))},e._parseLocalColor=function(t){var e=j(t),r=e.values,n=e.type,o=e.a,i=this.options.lockOpacity,a=void 0!==o&&1!==o;return r&&3===r.length&&(r[3]=void 0),{values:!r||i&&a?null:r,type:n}},e._emit=function(t){for(var e=this,r=arguments.length,n=new Array(r>1?r-1:0),o=1;o<r;o++)n[o-1]=arguments[o];this._eventListener[t].forEach((function(t){return t.apply(void 0,n.concat([e]))}))},e.on=function(t,e){return"function"==typeof e&&"string"==typeof t&&t in this._eventListener&&this._eventListener[t].push(e),this},e.off=function(t,e){var r=this._eventListener[t];if(r){var n=r.indexOf(e);~n&&r.splice(n,1)}return this},e.addSwatch=function(t){var e=this,r=this._parseLocalColor(t).values;if(r){var n=this._swatchColors,o=this._root,i=k.apply(void 0,r),a=l('<button type="button" style="color: '+i.toRGBA().toString(0)+'" aria-label="color swatch"/>');return o.swatches.appendChild(a),n.push({el:a,color:i}),this._eventBindings.push(c(a,"click",(function(){e.setHSVA.apply(e,i.toHSVA().concat([!0])),e._emit("swatchselect",i),e._emit("change",i)}))),!0}return!1},e.removeSwatch=function(t){var e=this._swatchColors[t];if(e){var r=e.el;return this._root.swatches.removeChild(r),this._swatchColors.splice(t,1),!0}return!1},e.applyColor=function(t){void 0===t&&(t=!1);var e=this._root,r=e.preview,n=e.button,o=this._color.toRGBA().toString(0);return r.lastColor.style.color=o,this.options.useAsButton||(n.style.color=o),n.classList.remove("clear"),this._lastColor=this._color.clone(),this._initializingActive||t||this._emit("save",this._color),this},e.destroy=function(){var t=this;this._eventBindings.forEach((function(t){return u.apply(n,t)})),Object.keys(this._components).forEach((function(e){return t._components[e].destroy()}))},e.destroyAndRemove=function(){var t=this;this.destroy();var e=this._root,r=e.root,n=e.app;r.parentElement&&r.parentElement.removeChild(r),n.parentElement.removeChild(n),Object.keys(this).forEach((function(e){return t[e]=null}))},e.hide=function(){return this._root.app.classList.remove("visible"),this._emit("hide",this),this},e.show=function(){return this.options.disabled||(this._root.app.classList.add("visible"),this._rePositioningPicker(),this._emit("show",this)),this},e.isOpen=function(){return this._root.app.classList.contains("visible")},e.setHSVA=function(t,e,r,n,o){void 0===t&&(t=360),void 0===e&&(e=0),void 0===r&&(r=0),void 0===n&&(n=1),void 0===o&&(o=!1);var i=this._recalc;if(this._recalc=!1,t<0||t>360||e<0||e>100||r<0||r>100||n<0||n>1)return!1;this._color=k(t,e,r,n);var a=this._components,c=a.hue,u=a.opacity,s=a.palette;return c.update(t/360),u.update(n),s.update(e/100,1-r/100),o||this.applyColor(),i&&this._updateOutput(),this._recalc=i,!0},e.setColor=function(t,e){if(void 0===e&&(e=!1),null===t)return this._clearColor(e),!0;var r=this._parseLocalColor(t),n=r.values,o=r.type;if(n){var i=o.toUpperCase(),a=this._root.interaction.options,c=a.find((function(t){return t.getAttribute("data-type")===i}));if(c&&!c.hidden){var u=a,s=Array.isArray(u),l=0;for(u=s?u:u[Symbol.iterator]();;){var f;if(s){if(l>=u.length)break;f=u[l++]}else{if((l=u.next()).done)break;f=l.value}var p=f;p.classList[p===c?"add":"remove"]("active")}}return!!this.setHSVA.apply(this,n.concat([e]))&&this.setColorRepresentation(i)}return!1},e.setColorRepresentation=function(t){return t=t.toUpperCase(),!!this._root.interaction.options.find((function(e){return e.getAttribute("data-type").startsWith(t)&&!e.click()}))},e.getColorRepresentation=function(){return this._representation},e.getColor=function(){return this._color},e.getSelectedColor=function(){return this._lastColor},e.getRoot=function(){return this._root},e.disable=function(){return this.hide(),this.options.disabled=!0,this._root.button.classList.add("disabled"),this},e.enable=function(){return this.options.disabled=!1,this._root.button.classList.remove("disabled"),this},t}();R.utils=n,R.libs={HSVaColor:k,Moveable:C,Nanopop:L,Selectable:P},R.create=function(t){return new R(t)},R.version=g.a;e.default=R}]).default}));

$mx(function() {
	if ($mx('[data-intercom-hash]').length == 0) return;
	var f = $mx('[data-intercom-app]');
	var d = f.data();
	
	function getOptions(f, d) {
		var options = {};
		if (f.length) {

			options.app_id = d.intercomApp;
			options.domain = d.intercomDomain;
			options.language_override = d.intercomLanguage;
			
			if (d.intercomEmail != undefined) {
				options.email = d.intercomEmail;
				options.user_id = d.intercomUid;
				options.nickname = d.intercomNickname;
				options.created_at = d.intercomCreated;
				options.user_hash = d.intercomHash;
				options.followers = d.intercomFollowers;
				
				if (d.intercomPlan) {
					options.plan_name = d.intercomPlan;
					options.upgraded_at = d.intercomPlanUpgraded;
				} else {
					options.plan_name = 'basic';
				}
			}
		}

		return options;	
	}
	
	window.intercomSettings = getOptions(f, d);
	
	window.$events.on('navigate', function(e, to) {
		window.Intercom('update');
	})
	
	window.$events.on('account:refresh', (e, account) => {
		let options = getOptions(f, d);
		options.plan_name = account.tariff;
		options.email = account.user.email;
		options.user_id = account.user.user_id;
		options.user_hash = account.user.hash;
		window.Intercom('update', options);
	});
	
    var w = window;
    var ic = w.Intercom;
	
	$mx.observe('track-event', function(o) {
		if (w.Intercom != undefined) w.Intercom('trackEvent', o.data('event'));
	});
	
	$mx(document.body).on('click', '[data-track-event]', function() {
		var o = $mx(this);
		if (w.Intercom != undefined) w.Intercom('trackEvent', o.data('track-event'));
	});

    if (typeof ic === "function") {
        ic('reattach_activator');
        ic('update', intercomSettings);
    } else {
        var i = function() {
            i.c(arguments)
        };
        i.q = [];
        i.c = function(args) {
            i.q.push(args)
        };
        w.Intercom = i;
        
        $mx.lazy('//widget.intercom.io/widget/' + d.intercomApp);
    }
});

(function() { 'use strict';

	let objects = [];
	let classes = {};
	
	let _do = (e) => {
		const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
		
		_.each(objects, o => {
			if (o.offsetTop < windowHeight + window.pageYOffset) {
				o.classList.add(classes[o]);
			} else {
				o.classList.remove(classes[o]);
			}
		});
	}

	
	$mx.observe('[data-animation-show]', (o) => {
		objects.push(o[0]);
		classes[o[0]] = o.data('animation-show');
		_do();
	}, (o) => {
		delete classes[o[0]];
		objects.splice(objects.indexOf(o[0]), 1);
	});
	
		
	$mx(window).on('scroll resize', _do)
})();
var scrollwatch = (function() {
	let w = $mx(window);

	let _this = {
		elements: [],
		
		init() {
			$mx.observe('[data-scroll-watch]', (o) => {
				let w = $mx(o.data('scroll-watch'));
				if (w.length) this.elements.push({o: o, d: o.data(), w: w});
			});

			w.on('resize orientationchange scroll', _this.check);
			this.check();
		},
		
		check() {
			const scrollY = window.scrollY;
			//const visible = document.documentElement.clientHeight;
			//const pageHeight = document.documentElement.scrollHeight;
			
			for (i = 0; i < _this.elements.length; i++) {
				let e = _this.elements[i];
				if (e.d.scrollWatchClass != undefined) {
					let c = e.d.scrollWatchClass;
					let v = (scrollY < e.w.offset().top);
					
					if (c.substr(0, 4) == 'not:') {
						c = c.substr(4);
						v != v;
					}
					
					e.o.toggleClass(c, v);
				}
			}
		}
	};
	
	_this.init();
	
	return _this;
})();
window.vue_components = {};
window.vue_modules = {};
window.modules = {};

if (window.Vue == undefined) {
	Vue = {
		component: function(name, options) {
			window.vue_components[name] = options;
		}
	}
	
	window.defineModule = function(name, options) {
		window.modules[name] = options;
		window.vue_modules[name] = options;
	}
}

$mx.observe('.vue:not(.vue-inited)', function(o) {
	o.addClass('vue-inited');
	
    let m = /^vue\-([^-]+)/ig;
    let tag = this.tagName.toLowerCase();
	let t = m.exec(tag);
	
	if (t) $mx('<div style="height: 4em;position: relative"><div class="loading-overlay is-active"><div class="loading-icon"></div></div></div>').appendTo(o);
	
    $mx.lazy('app.js', 'app.css', () => {
	    
		i18n.init(window.$locale || {});
		
// 		o.html('');
	    
		App.defineModuleComplete();
	    
	    if (t) {
		    var module = t[1];
			if (window.modules_loaded[module] == undefined) {
				window.modules_loaded[module] = true;
				Vue.component(tag, function(resolve) {
					window.components_hooks[tag] = resolve;
					$mx.lazy('vue.'+module+'.js', 'vue.'+module+'.css');
	/*
				    var link = document.createElement('link');
				    link.href = '/s/css/vue.'+module+'.css'+scriptsVersion;
				    link.type = 'text/css';
				    link.rel = 'stylesheet';
				    document.body.appendChild(link);	
					
					var script = document.createElement('script');
				    script.src = '/s/js/vue.'+module+'.js'+scriptsVersion;
				    script.async = true;
					document.body.appendChild(script);  
	*/
					
				});
			}
			
			// Загружаем VUE если его нет
// 		    if (window.Vue != undefined) {
			    if (window.account != undefined) {
				    Vue.prototype.$auth.refresh(window.account);
				    window.$vue = new Vue(window.vue_options).$mount(o.parent()[0]);
			    } else {
			    	Vue.prototype.$api.get('account/get', null, null, null, true).then((data) => {
						if (data.result == 'success') Vue.prototype.$auth.refresh(data.response);
						window.$vue = new Vue(window.vue_options).$mount(o.parent()[0]);
					});
				}
// 		    }
		} else {
			window.$vue = new Vue(window.vue_options).$mount(o[0]);
			$mx('#loading-global').remove();
		}
	});
    
});

function openVueForm(name) {
	function cb() {
		if (!window.$vue) window.$vue = new Vue({ data : { account: {} } }); 
		window.$vue.$modal(name);
	}

	if (window.$vue == undefined) {
		$mx.lazy('app.js', cb);
	} else {
		cb();
	}
}