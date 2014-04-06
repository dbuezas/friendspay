/**
 * viewy-view 0.5.1
 * Copyright (c) 2014 Viewy Organization and Contributors
 * Released under the MIT license
 */

/**
 *  # viewy-view
 *    - JavaScript library that facilitates development of large scale client-side web applications with rich user interfaces
 *    - introduces a structural/architectural abstraction layer on top of common client-side web technology (HTML/CSS/JS)
 *    - inspired by and built upon concepts found in native UI development
 *
 *  ## Concept
 *
 *  Examination of a view from different perspectives & definition of terminology:
 *
 *  ### View Component (architectural point of view)
 *    - a reusable component being instantiated at runtime
 *    - consists of a view controller and a bundle
 *    - behavior and styling may be extended/overridden/customized by inheritance/cascading
 *
 *  ### View Controller (runtime/behavior point of view)
 *    - Constructor and prototype object providing common behavior across all instances of a view component
 *
 *  ### View Bundle (resource/graphical representation point of view)
 *    - collection of resources providing means for a common graphical representation across all instances of a view component
 *    - e.g. HTML markup, CSS stylesheet, media resources (e.g. images/audio/video)
 *
 *  ### View (general/runtime/instance point of view)
 *    - concrete instance of a view component
 *    - self-contained/self-managed piece of UI, most like a widget
 *    - scoping: managed DOM subtree that has scoped styling and behavior
 *    - composition: view instances can be in a parent/child relationship meaning that a view may have one or more other views nested inside of itself. This results in a tree structure, the "View Hierarchy"
 *    - lifecycle: a view has a lifecycle (construction/instantiation, loading, [showing, hiding, doing stuff], unloading, deallocation)
 *    - memory management
 *
 *  @author Andreas Tietz, David Buezas
 *  @module viewy-view
 *  @requires requirejs, jquery
 */

// Define this module and it's dependencies solely via RequireJS because we depend on it:
define(['jquery'], function ($) {
    'use strict';

    /**
     *  Base implementation of a view controller providing scoped and
     *  configurable behavior across all instances of a view component.
     *
     *  @class View
     *  @constructor
     */
    function View(config) {
        var self = this;

        // Lazily initialize the config hash:
        config = config || {};

        // Initially assign properties from config:
        self.name(config.name);
        self.bundle(config.bundle);
        self.childViews(config.childViews);
        self.onChildViewsWillLoad().subscribe(config.onChildViewsWillLoad);
        self.onChildViewsWillLoad().subscribe(self.childViewsWillLoad);
        self.onViewDidLoad().subscribe(config.onViewDidLoad);
        self.onViewDidLoad().subscribe(self.viewDidLoad);
        self.onViewWillUnload().subscribe(config.onViewWillUnload);
        self.onViewWillUnload().subscribe(self.viewWillUnload);

        // Set the parent view last because the view might be loaded
        // immediately if its parent view is already loaded:
        self.parentView(config.parentView, true);
    }

    /*
     *  Inheritance
     */

    /**
     *  Helper function that facilitates prototypal inheritance from Views.
     *
     *  - <b>fully compatible with CoffeeScript classes</b>
     *  - a default constructor that only calls the super implementation is generated if not provided
     *  - additionally this.super represents the prototype object that has been inherited from
     *
     *  <b>Note: Assign a name to the passed in constructor function in order
     *  for it to be correctly printed out in console logs and stack traces.</b>
     *
     *  @method extend
     *  @param {Mixed} [extension] Prototype attributes and methods being added
     *                             to the view prototype to be inherited from.
     *  @return {Function} Constructor of the extended/inherited view.
     *  @example
     *      var MyView = View.prototype.extend({
     *          constructor: function MyView (config) {...},
     *          viewDidLoad: function () {...},
     *          myNewFunction: function () {...}
     *          myNewAttribute: ...
     *          ...
     *      };
     */
    View.prototype.extend = function (extension) {
        var self = this;

        // Configure extension defaults:
        extension = $.extend({
            constructor: function (config) { self.super.constructor.call(this, config); },
        }, extension);

        // Copy constructor properties:
        for (var key in self.constructor) {
            if ({}.hasOwnProperty.call(self.constructor, key)) extension.constructor[key] = self.constructor[key];
        }

        // Build prototype constructor (avoids calling extension.constructor):
        function PrototypeConstructor() {
            this.constructor = extension.constructor;
        }
        PrototypeConstructor.prototype = self.constructor.prototype;

        // Inherit prototype:
        extension.constructor.prototype = new PrototypeConstructor();
        extension.constructor.prototype.super = self.constructor.prototype;

        // Merge additional extensions into prototype:
        $.extend(extension.constructor.prototype, extension);

        return extension.constructor; // assignment is optional
    };

    /*
     *  Lifecycle event notification hooks
     */

    /**
     *  Function being called on the view itself when it has
     *  finished loading itself and will begin loading its child views.
     *
     *  Inherited views may override and implement this function.
     *
     *  @method childViewsWillLoad
     */
    View.prototype.childViewsWillLoad = function () {
        // optionally override and implement in inherited view
    };

    /**
     *  Function being called on the view itself when it has
     *  finished loading itself and its child views (recursively).
     *
     *  Inherited views may override and implement this function.
     *
     *  @method viewDidLoad
     */
    View.prototype.viewDidLoad = function () {
        // optionally override and implement in inherited view
    };

    /**
     *  Function being called on the view itself immediately
     *  before itself and its child views will be unloaded.
     *
     *  Inherited views may override and implement this function.
     *
     *  @method viewWillUnload
     */
    View.prototype.viewWillUnload = function () {
        // optionally override and implement in inherited view
    };

    /*
     *  Public properties
     */

    /**
     *  Provides syntactic sugar for defining property accessors (mandatory
     *  getter and optional setter) to privately stored state.
     *  It is a single function that:
     *  - acts as a getter when no argument is provided
     *  - acts as a setter when at least one argument is provided
     *
     *  @method definePropertyAccessors
     *  @param {String} name Name of the property being defined
     *                       (used only for throwing associative error messages).
     *  @param {Mixed} accessors Object defining `{ get: and [set:] }` accessors.
     *  @example
     *      var MyView = View.prototype.extend({
     *          ...
     *          myState: View.prototype.definePropertyAccessors('myState', {
     *              get: function () { return this._myPrivateState; },
     *              set: function (newState) {
     *                  this._myPrivateState = newState;
     *              }
     *          }),
     *          ...
     *      };
     *
     *      ...
     *
     *      var mv = new MyView();
     *      mv.myState('my new state'); // set
     *      console.log(mv.myState());  // get
     */
    View.prototype.definePropertyAccessors = function (name, accessors) {
        return function () {
            // Invoke getter:
            if (arguments.length === 0) {
                if (accessors && accessors.get) {
                    return accessors.get.apply(this);
                } else {
                    throw new Error(this + '->' + name + '(): Getter is not implemented.');
                }
            // Invoke setter:
            } else {
                if (accessors && accessors.set) {
                    return accessors.set.apply(this, $.makeArray(arguments));
                } else {
                    throw new Error(this + '->' + name + '(...): Setter is not implemented, property is read only.');
                }
            }
        };
    };

    /**
     *  Unique name for the view to be distinguished from other views at
     *  the same hierarchy level (within the same parent view scope).
     *  The view will be loaded into a DOM container element thats
     *  "data-view-name" attribute value matches this name.
     *
     *  @property name
     *  @type String
     *  @default undefined
     */
    View.prototype.name = View.prototype.definePropertyAccessors('name', {
        get: function () { return this._name; },
        set: function (name) {
            if (this.isLoaded()) throw new Error(this + '->name("' + name + '"): Cannot change property while view is loaded.');
            this._name = name;
        }
    });

    /**
     *  Represents the file location of HTML and CSS resources identified by a requirejs module id.
     *  Usually the same as the view controller's JavaScript module id but may be overridden.
     *
     *  @property bundle
     *  @type String
     *  @default undefined
     */
    View.prototype.bundle = View.prototype.definePropertyAccessors('bundle', {
        get: function () { return this._bundle; },
        set: function (bundle) {
            if (this.isLoaded()) throw new Error(this + '->bundle("' + bundle + '"): Cannot change property while view is loaded.');
            this._bundle = bundle;
        }
    });

    /**
     *  Parent view up the view hierarchy that "owns" the view.
     *
     *  - Invoking without an argument returns the current parent view.
     *  - Invoking with a direct or derived instance of View as an argument establishes
     *    a parent/child relationship by adding the view to the view hierarchy of the
     *    specified parent view as a child and loads the view as soon as possible.
     *  - Invoking with undefined or null removes the view from its current parent view and
     *    unloads the view if necessary.
     *
     *  @property parentView
     *  @type View
     *  @default undefined
     *  @chainable
     *  @example
     *      v.parentView();     // get parent view
     *      v.parentView(pv);   // set parent view
     *      v.parentView(null); // remove from parent view
     */
    View.prototype.parentView = View.prototype.definePropertyAccessors('parentView', {
        get: function () { return this._parentView; },
        set: function (newParentView, _ignoreNotSet) {
            var self = this;

            if (newParentView) {
                // New parent view must be an instance of view:
                if (newParentView instanceof View === false) {
                    throw new Error(self + '->parentView( ' + newParentView + ' ): Expected a direct or inherited instance of View.');
                }

                // Check for container element collisions (container elements are first-come-first-serve):
                newParentView._childViews.forEach(function(childView) {
                    if (childView.name() === self.name()) {
                        throw new Error(self + '->parentView( ' + newParentView + ' ): Another child view ' + childView + ' already claims to occupy the same container element.');
                    }
                });

                // Unload if necessary and remove from current parent view:
                if (self._parentView) {
                    self.parentView(null); // reuse own setter implementation
                }

                // Establish parent/child relationship:
                self._parentView = newParentView;
                self._parentView._childViews.push(self);

                // Load as soon as possible:
                if (self._parentView.isLoaded()) {
                    self._load();
                }
                // else { it will be loaded by its parent view when (and if) itself is being loaded sometime in the future }

            } else { // invoked with undefined or null

                // It must have a parent view:
                if (self._parentView) {

                    // It must be a child view of its parent view:
                    var index = self._parentView._childViews.indexOf(self);
                    if (index !== -1) {

                        // Unload if necessary and detach parent/child relationship:
                        if (self.isLoaded()) self._unload();
                        self._parentView._childViews.splice(index, 1);
                        self._parentView = null;
                    } else {
                        throw new Error('POTENTIAL BUG:' + self + '->parentView( ' + newParentView + ' ): View cannot be detached from its parent view because it\'s not a child view of its parent view ' + self._parentView + '.');
                    }
                } else if (_ignoreNotSet === undefined || _ignoreNotSet === false) {
                    throw new Error(self + '->parentView( ' + newParentView + ' ): View cannot be detached from its parent view because it has no parent view.');
                }
            }
            return self;
        }
    });

    /**
     *  Child views down the view hierarchy "owned" by the view.
     *
     *  - Invoking without an argument returns the current array of child views.
     *  - Invoking with an array of direct or derived instances of View as an argument
     *    establishes a parent/child relationship by replacing and unloading any current
     *    child views in the view hierarchy with those provided and loads those views as
     *    soon as possible.
     *  - Invoking with undefined, null or an empty array removes all current child views
     *    from the view hierarchy and unloads them if necessary.
     *
     *  @property childViews
     *  @type Array of Views
     *  @default []
     *  @chainable
     *  @example
     *      v.childViews();                 // get child views
     *      v.childViews([cv1, cv2, cv3]);  // set child views
     *      v.childViews(null);             // remove all child views
     *      v.childViews([]);               // remove all child views
     */
    View.prototype.childViews = View.prototype.definePropertyAccessors('childViews', {
        get: function () { return this._childViews || []; },
        set: function (newChildViews) {
            var self = this;

            // Lazily initialize:
            self._childViews = self._childViews || [];
            newChildViews = newChildViews || [];

            // New child views must be provided as an array:
            if (!$.isArray(newChildViews)) {
                throw new Error(self + '->childViews( ' + newChildViews + ' ): Expected an array.');
            }

            if (newChildViews.length > 0) {

                // New child views must be direct or inherited instances of View:
                var allNewChildViewsAreInstancesOfView = newChildViews.reduce(function (allNewChildViewsAreInstancesOfView, childView) {
                    return allNewChildViewsAreInstancesOfView && childView instanceof View;
                }, true);
                if (!allNewChildViewsAreInstancesOfView) {
                    throw new Error(self + '->childViews( ' + newChildViews + ' ): Expected an array of direct or inherited instances of View.');
                }

                // Remove current child views:
                self.childViews([]); // reuse own setter implementation

                // Add new child views:
                $.each(newChildViews, function (index, newChildView) {
                    newChildView.parentView(self); // reuse parentView setter implementation
                });

            } else { // invoked with undefined, null or []

                // Unload and remove all existing child views from the view
                // hierarchy by reusing the parentView setter implementation:
                while (self.childViews().length > 0) {
                    self.childViews()[0].parentView(null); // reuse parentView setter implementation
                }
            }
        }
    });

    /**
     *  Determines whether the view is the first view in a view hierarchy and therefore has no parent view.
     *
     *  @property isRootView
     *  @type Boolean
     */
    View.prototype.isRootView = View.prototype.definePropertyAccessors('isRootView', {
        get: function () { return this.parentView() === undefined; }
    });

    /**
     *  Determines whether the view's DOM is currently loaded.
     *
     *  @property isLoaded
     *  @readOnly
     *  @type Boolean
     */
    View.prototype.isLoaded = View.prototype.definePropertyAccessors('isLoaded', {
        get: function () {
            return this._containerElement !== undefined && this._containerElement.length > 0;
        }
    });
    /**
     *  Notification subscription being fired when the view has finished loading itself
     *  and will begin loading its child views.
     *
     *  The getter returns an object providing the following interface:
     *  - `subscribe:|unsubscribe:` adds or removes a callback subscription
     *  - `once:` registers a one-time fired callback
     *  - `promise:` returns a one-time resolved promise
     *  - `once:|promise:` do essentially the same thing but differ in the style
     *                     of interface exposed to the caller (callback/promise)
     *
     *  @property onViewDidLoad
     *  @type Mixed
     *  @default {
     *               subscribe: Function,
     *               unsubscribe: Function,
     *               once: Function,
     *               promise: Function
     *           }
     */
    View.prototype.onChildViewsWillLoad = View.prototype.definePropertyAccessors('onChildViewsWillLoad', {
        get: function () {
            var self = this;
            self._onChildViewsWillLoadCallbacks = self._onChildViewsWillLoadCallbacks || $.Callbacks();
            return {
                subscribe: self._onChildViewsWillLoadCallbacks.add,
                unsubscribe: self._onChildViewsWillLoadCallbacks.remove,
                once: function(callback) {
                    var wrap;
                    self._onChildViewsWillLoadCallbacks.add( wrap = function() {
                        self._onChildViewsWillLoadCallbacks.remove(wrap);
                        callback.call(this);
                    });
                },
                promise: function() {
                    var childViewsWillLoad = new $.Deferred();
                    self.onChildViewsWillLoad().once(function() { childViewsWillLoad.resolve(); });
                    return childViewsWillLoad.promise();
                }
            };
        }
    });

    /**
     *  Notification subscription being fired when the view has finished loading itself
     *  and its child views (recursively).
     *
     *  The getter returns an object providing the following interface:
     *  - `subscribe:|unsubscribe:` adds or removes a callback subscription
     *  - `once:` registers a one-time fired callback
     *  - `promise:` returns a one-time resolved promise
     *  - `once:|promise:` do essentially the same thing but differ in the style
     *                     of interface exposed to the caller (callback/promise)
     *
     *  @property onViewDidLoad
     *  @type Mixed
     *  @default {
     *               subscribe: Function,
     *               unsubscribe: Function,
     *               once: Function,
     *               promise: Function
     *           }
     */
    View.prototype.onViewDidLoad = View.prototype.definePropertyAccessors('onViewDidLoad', {
        get: function () {
            var self = this;
            self._onViewDidLoadCallbacks = self._onViewDidLoadCallbacks || $.Callbacks();
            return {
                subscribe: self._onViewDidLoadCallbacks.add,
                unsubscribe: self._onViewDidLoadCallbacks.remove,
                once: function(callback) {
                    var wrap;
                    self._onViewDidLoadCallbacks.add( wrap = function() {
                        self._onViewDidLoadCallbacks.remove(wrap);
                        callback.call(this);
                    });
                },
                promise: function() {
                    var viewDidLoad = new $.Deferred();
                    self.onViewDidLoad().once(function() { viewDidLoad.resolve(); });
                    return viewDidLoad.promise();
                }
            };
        }
    });

    /**
     *  Notification subscription being fired immediately before the view and its child views will be unloaded.
     *
     *  The getter returns an object providing the following interface:
     *  - `subscribe:|unsubscribe:` adds or removes a callback subscription
     *  - `once:` registers a one-time fired callback
     *  - `promise:` returns a one-time resolved promise
     *  - `once:|promise:` do essentially the same thing but differ in the style
     *                     of interface exposed to the caller (callback/promise)
     *
     *  @property onViewWillUnload
     *  @type Mixed
     *  @default {
     *               subscribe: Function,
     *               unsubscribe: Function,
     *               once: Function,
     *               promise: Function
     *           }
     */
    View.prototype.onViewWillUnload = View.prototype.definePropertyAccessors('onViewWillUnload', {
        get: function () {
            var self = this;
            self._onViewWillUnloadCallbacks = self._onViewWillUnloadCallbacks || $.Callbacks();
            return {
                subscribe: self._onViewWillUnloadCallbacks.add,
                unsubscribe: self._onViewWillUnloadCallbacks.remove,
                once: function(callback) {
                    var wrap;
                    self._onViewWillUnloadCallbacks.add( wrap = function() {
                        self._onViewWillUnloadCallbacks.remove(wrap);
                        callback.call(this);
                    });
                },
                promise: function() {
                    var viewWillUnload = new $.Deferred();
                    self.onViewWillUnload().once(function() { viewWillUnload.resolve(); });
                    return viewWillUnload.promise();
                }
            };
        }
    });

    /*
     *  Private attributes
     */

    /**
     *  The jQuery DOM element containing the UI of the view.
     *
     *  @property _containerElement
     *  @type jQuery Element
     *  @private
     */
    View.prototype._containerElement;

    /*
     *  View hierarchy management
     */

    /**
     *  Sets the view as a root view and loads it together with its child views if present.
     *
     *  @method setAsRootView
     *  @chainable
     */
    View.prototype.setAsRootView = function () {
        var self = this;

        if (self.isRootView() === false) {
            throw new Error(self + '->setAsRootView(): View cannot be a root view because it has ' + self._parentView + ' set as its parent view.');
        }

        self._load();
        return self;
    };

    /*
     *  Markup/DOM management
     */

    /**
     *  Performs a jQuery selector scoped to the root element of a loaded view.
     *
     *  @method $
     *  @param {String} [selector] jQuery selector being scoped to the root element.
     *  @return {jQuery Element} Root element of a loaded view if invoked without an argument,
     *                           scoped jQuery selection result if invoked with a selector.
     *  @throws {ViewIsNotLoaded} If the view is not loaded.
     */
    View.prototype.$ = function (selector) {
        var self = this;
        if (self.isLoaded() === false) {
            throw new Error(self + '->$("' + selector + '"): View is not loaded.');
        } else if (selector === undefined) {
            return self._containerElement.children();
        }
        var viewElement = self._containerElement.children();
        return viewElement.find(selector).not(
            viewElement.find('[data-view-name]').find(selector)
        );
    };

    /**
     *  Loads markup and styles from HTML and CSS files specified by the bundle
     *  property into the container element identified by the name property.
     *
     *  @method _load
     *  @private
     */
    View.prototype._load = function () {
        var self = this;

        // Parent view must be set and loaded:
        if (self.parentView() && !self.parentView().isLoaded()) {
            throw new Error(self + '->load(): Parent view is not loaded yet.');
        }

        // Name must be configured so that the view instance can be
        // distinguished from other views at the same hierarchy level:
        if (!self.name()) {
            throw new Error(self + '->load(): Container element name not specified.');
        }

        // Bundle must be configured (it must match a valid requirejs module id later on):
        if (!self.bundle()) {
            throw new Error(self + '->load(): (HTML/CSS)-bundle not specified.');
        }

        // Views cannot be reloaded:
        // TODO: check if this should be true
        if (self.isLoaded()) {
            throw new Error(self + '->load(): Cannot load, view already loaded.');
        }

        // Get the container element:
        var containerElementSelector = '[data-view-name="' + self.name() + '"]';
        var containerElement = ( self.isRootView() ? $(containerElementSelector) : self.parentView().$(containerElementSelector) );

        // Container element must be existent:
        if (containerElement.length === 0) {
            throw new Error(self + '->load(): Specified container element [data-view-name="' + self.name() + '"] does not exist.');
        }

        // Root views must load into root-level containers:
        if (self.isRootView() && containerElement.parents('[data-view-name]').length) {
            throw new Error(self + '->load(): The container of a root view cannot be inside another view.');
        }

        // Load equally named HTML markup and CSS stylesheet files via require loader plugins
        // (they can only be loaded paired/they must have the same file name):
        require(['html!' + self.bundle() + '.html', 'css!' + self.bundle()], function (html, css) {
            self._containerElement = containerElement;
            self._containerElement.html(html);

            // Fire "child views will load" notification on subscribed stakeholders:
            self._onChildViewsWillLoadCallbacks.fireWith(self);

            // Load child views recursively and prepare the array of child "view did load" promises:
            var childViewsDidLoad = $.map(self.childViews(), function (childView) {
                var childViewDidLoad = childView.onViewDidLoad().promise();
                childView._load();
                return childViewDidLoad;
            });

            $.when.apply($, childViewsDidLoad).then(function() {
                // Fire "view did load" notification on subscribed stakeholders:
                self._onViewDidLoadCallbacks.fireWith(self);
            });
        });
    };

    /**
     *  Unloads the DOM from the occupied container element.
     *
     *  @method _unload
     *  @private
     */
    View.prototype._unload = function () {
        var self = this;

        // Only loaded views can be unloaded:
        // TODO: check if this should be true
        if (self.isLoaded() === false) {
            throw new Error(self + ' -> Cannot be unloaded since it is not loaded.');
        }

        // Fire "view will unload" notification on subscribed stakeholders:
        self._onViewWillUnloadCallbacks.fireWith(self);

        // Unload child views recursively down the view hierarchy:
        $.each(self.childViews(), function (index, childView) {
            childView._unload();
        });

        // Clean and release DOM references:
        self._containerElement.empty();
        self._containerElement = undefined;
    };

    /*
     *  Debugging
     */

    /**
     *  Provides a human readable string representation of the view.
     *
     *  @method toString
     *  @return {String} String representation of the view.
     *  @example
     *      Format: "[<controller/constructor name>&<bundle name>@<path in hierarchy represented by container element names>:<loaded or !loaded>]"
     *      Output: "[View&TestView@root/a/b/c/d:!loaded]"
     */
    View.prototype.toString = function () {
        var self = this;
        var str = '[' + self.constructor.name + (self.constructor.name === self.bundle() ? '' : '&' + self.bundle());
        str += '@' + self.getPathInHierarchy();
        str += self.isLoaded() ? ':loaded' : ':!loaded';
        str += ']';
        return str;
    };

    /**
     *  Recursively traverses down the child view hierarchy of the view while invoking
     *  a function for each view passing it the view and the recursion level.
     *
     *  @method traverse
     *  @param {Function} fn Function being invoked for each view and being
     *                       passed the view object and the recursion level.
     *  @param {Number} level Indicates the current level of recursion.
     */
    View.prototype.traverse = function (fn, level) {
        var self = this;
        if (level === undefined) level = 0;
        fn(self, level);
        $.each(self.childViews(), function (index, childView) {
            childView.traverse(fn, level + 1);
        });
    };

    /**
     *  Provides a human readable string representation of the current state of the child view hierarchy.
     *
     *  @method getViewHierarchyHumanReadable
     *  @return {String} String representation of the child view hierarchy.
     *  @example
     *      Output:
     *      "[View&TestView1@root:loaded]
     *       |--> [View&TestView2@root/a:!loaded]
     *       |--> [View&TestView3@root/b:!loaded]"
     */
    View.prototype.getViewHierarchyHumanReadable = function () {
        var self = this;
        var hierarchyOutput = '';
        self.traverse(function (view, level) {
            for (var i = 1; i < level; i++) hierarchyOutput += '|    ';
            if (level > 0) hierarchyOutput += '|--> ';
            hierarchyOutput += view + '\n';
        });
        return hierarchyOutput;
    };

    /**
     *  Provides a human readable string representation of the view path inside the
     *  hierarchy represented by container element names starting with the root view.
     *
     *  @method getPathInHierarchy
     *  @return {String} String representation of the view path inside the hierarchy.
     *  @example
     *      View hierarchy (container element names):
     *      root
     *      |-> a
     *      |   |-> c
     *      |       |-> d
     *      |-> b
     *
     *      console.log(d.getViewHierarchyHumanReadable());
     *      Output: "root/a/c/d"
     */
    View.prototype.getPathInHierarchy = function () {
        var self = this;
        var pathOutput = self.name();
        var parentView = self.parentView();
        while(parentView) {
            pathOutput = parentView.name() + '/' + pathOutput;
            parentView = parentView.parentView();
        }
        return pathOutput;
    };

    // Return the constructor as the module value:
    return View;
});
