/**
 * viewy-view 0.5.1
 * Copyright (c) 2014 Viewy Organization and Contributors
 * Released under the MIT license
 */

/**
 *  # viewy-view
 *    - JavaScript library that facilitates development of large scale client-side web applications with rich user interfaces
 *    - introduces a structural/architectural abstraction layer on top of common client-side web technology (HTML/CSS/JS)
 *    - inspired by and built around concepts found in native UI development
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
 *  @author Andreas Tietz
 *  @module viewy-view
 *  @requires requirejs, jquery
 */
(function (factory) {
    'use strict';

    // Define this module and it's dependencies via RequireJS if possible:
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    // Otherwise export to node if possible:
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(jQuery);
    // Otherwise define in the global scope:
    } else {
        window.View = factory(jQuery);
    }
}(function ($) {
    'use strict';

    /**
     *  Base implementation of a view controller providing scoped and configurable behavior across all instances of a view component.
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
        self.parentView(config.parentView);
        self.childViews(config.childViews);
        self.onViewDidLoad().subscribe(config.onViewDidLoad);
        self.onViewDidLoad().subscribe(self.viewDidLoad);
        self.onViewWillUnload().subscribe(config.onViewWillUnload);
        self.onViewWillUnload().subscribe(self.viewWillUnload);
    }

    /*
     *  Inheritance
     */

    /**
     *  Helper function that facilitates prototypal inheritance from Views.
     *
     *  Note: Assign a name to the passed in constructor function in order for it to be correctly printed out in console logs.
     *
     *  @method extend
     *  @param {Mixed} [extension] Prototype attributes and methods being added to the view prototype to be inherited from.
     *  @return {Function} Constructor of the extended/inherited view.
     *  @example
     *      var MyView = View.prototype.extend({
     *          constructor: function MyView (config) {..},
     *          viewDidLoad: function () {..},
     *          myNewFunction: function () {..}
     *          myNewAttribute: ..
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
     *  Lifecycle inheritance interface/notification hooks
     */

    /**
     *  Function being called on the view itself when the "view did load" event occurs.
     *
     *  Inherited views may override and implement this function.
     *
     *  @method viewDidLoad
     */
    View.prototype.viewDidLoad = function () {
        // optionally override and implement in inherited view
    };

    /**
     *  Function being called on the view itself when the "view will unload" event occurs.
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
     *  Helper function for defining accessors.
     *
     *  @method defineAccessors
     *  @param {Mixed} [accessors] Object defining {set: and get:} accessors.
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
     *  Unique name for the view to be distinguished from other views at the same hierarchy level.
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
     *  HTML & CSS module/filenames.
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
     *  @property parentView
     *  @type View
     *  @default undefined
     */
    View.prototype.parentView = View.prototype.definePropertyAccessors('parentView', {
        get: function () { return this._parentView; },
        set: function (parentView) {
            if (this.isLoaded()) throw new Error(this + '->parentView( ' + parentView + ' ): Cannot change property while view is loaded.');
            if (this._parentView) this._parentView.removeChildView(this); // remove view from current parent view
            this._parentView = parentView;
            if (typeof this._parentView !== 'undefined') {
                this._parentView._childViews.push(this);
            }
        }
    });

    /**
     *  Direct child views down the view hierarchy "owned" by the view.
     *
     *  @property childViews
     *  @type Array of Views
     *  @default []
     */
    View.prototype.childViews = View.prototype.definePropertyAccessors('childViews', {
        get: function () { return this._childViews || []; },
        set: function (newChildViews) {
            var self = this;

            // Lazily initialize:
            self._childViews = self._childViews || [];
            newChildViews = newChildViews || [];

            // Unload and detach existing child views from view hierarchy:
            self.removeAllChildViews();

            // Add new child views:
            $.each(newChildViews, function (index, newChildView) {
                self.addChildView(newChildView);
            });
        }
    });

    /**
     *  Determines whether the view is the first view in a view hierarchy and therefore has no parent view.
     *  This is a purely calculated property.
     *
     *  @property isRootView
     *  @type Boolean
     */
    View.prototype.isRootView = View.prototype.definePropertyAccessors('isRootView', {
        get: function () { return this.parentView() === undefined; }
    });

    /**
     *  Determines whether the view's DOM is currently loaded.
     *  This is a purely calculated property.
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
     *  Subscription for "view did load" events.
     *
     *  @property onViewDidLoad
     *  @type Mixed
     *  @default {
     *               subscribe: Function
     *               unsubscribe: Function
     *               once: Function
     *           }
     */
    View.prototype.onViewDidLoad = View.prototype.definePropertyAccessors('onViewDidLoad', {
        get: function () {
            var self = this;
            self._onViewDidLoadCallbacks = self._onViewDidLoadCallbacks || $.Callbacks();
            return {
                subscribe: self._onViewDidLoadCallbacks.add,
                unsubscribe: self._onViewDidLoadCallbacks.remove,
                once: function(callback){
                    var wrap;
                    self._onViewDidLoadCallbacks.add( wrap = function(){
                        self._onViewDidLoadCallbacks.remove(wrap);
                        callback.call(this);
                    });
                },
                promise: function(){
                    var dfrd = new $.Deferred();
                    self.onViewDidLoad().once(function(){ dfrd.resolve(); });
                    return dfrd.promise();
                }
            };
        }
    });

    /**
     *  Subscription for "view will unload" events.
     *
     *  @property onViewWillUnload
     *  @type Mixed
     *  @default {
     *               subscribe: Function
     *               unsubscribe: Function
     *               once: Function
     *           }
     */
    View.prototype.onViewWillUnload = View.prototype.definePropertyAccessors('onViewWillUnload', {
        get: function () {
            var self = this;
            self._onViewWillUnloadCallbacks = self._onViewWillUnloadCallbacks || $.Callbacks();
            return {
                subscribe: self._onViewWillUnloadCallbacks.add,
                unsubscribe: self._onViewWillUnloadCallbacks.remove,
                once: function(callback){
                    var wrap;
                    self._onViewWillUnloadCallbacks.add( wrap = function(){
                        self._onViewWillUnloadCallbacks.remove(wrap);
                        callback.call(this);
                    });
                },
                promise: function(){
                    var dfrd = new $.Deferred();
                    self.onViewWillUnload().once(function(){ dfrd.resolve(); });
                    return dfrd.promise();
                }
            };
        }
    });

    /*
     *  Private attributes
     */

    /**
     *  The jQuery DOM Node containing the ui of the view.
     *
     *  @property _containerElement
     *  @private
     *  @type jQuery Element
     */
    View.prototype._containerElement;

    /*
     *  View hierarchy management
     */

    /**
     *  Sets the view as a root view and loads it (together with its child views if present)
     *
     *  @method setAsRootView
     *  @return {Promise} a jQuery Promise which will be resolved when the view and its descendants are loaded.
     */
    View.prototype.setAsRootView = function () {
        var self = this;

        if (self.isRootView() === false){
            throw('[View.prototype.setAsRootView] Error setting '+self.constructor.name+' as root view. ParentView is not undefined (it is '+self._parentView+')');
        }

        self._load();
    };

    /**
     *  Adds a view to the view hierarchy as a direct child. Does not actually load the child view.
     *
     *  @method addChildView
     *  @param {View} newChildView Child view to be added.
     *  @return {Promise} jQuery Promise to be resolved when the childview loads.
     */
    View.prototype.addChildView = function (newChildView) {
        var self = this;

        self._childViews.forEach(function(childView){
            if (childView.name() === newChildView.name()){
                throw new Error(self + '->addChildView( ' + newChildView + ' ): Another child view ' + childView + ' already occupies the same view container.');
            }
        });

        // Connect parent/child relationship:
        newChildView.parentView(self);

        var childViewDidLoad = new $.Deferred();

        newChildView.onViewDidLoad().once(function(){
            childViewDidLoad.resolve();
        });

        if (self.isLoaded()) {
            newChildView._load();
        } // else { it will be loaded by its parent view when (and if) she gets loaded }
        return childViewDidLoad.promise();
    };

    /**
     *  Removes a direct child view from the view hierarchy. Unloads the child view if necessary.
     *
     *  @method removeChildView
     *  @param {View} childView Child view to be removed.
     *  @return {View} This view (parent view).
     */
    View.prototype.removeChildView = function (childView) {
        var self = this;

        var index = self._childViews.indexOf(childView);

        // If childView is in fact a child view:
        if (index !== -1) {

            // Unload from DOM:
            childView._unload();

            // Detach parent/child relationship:
            childView._parentView = undefined;
            self._childViews.splice(index, 1);
        } else {
            // Throw an error if the view is not a child view:
            throw new Error(self + '->removeChildView( ' + childView + ' ): View is not a child view.');
        }
        return self;
    };

    /**
     *  Removes all direct child view from the view hierarchy. Unloads child views if necessary.
     *
     *  @method removeAllChildViews
     *  @return {View} This view (parent view).
     */
    View.prototype.removeAllChildViews = function () {
        var self = this;

        // Unload and detach child->parent references:
        $.each(self._childViews, function (index, existingChildView) {
            existingChildView._unload();
            existingChildView._parentView = undefined;
        });
        // Detach parent->child references:
        self._childViews.length = 0;
        return self;
    };

    /**
     *  Removes the view from the parent view hierarchy (behaves the same as removeChildView). Unloads the view if necessary.
     *
     *  @method removeFromParentView
     *  @return {View} This view (child view).
     */
    View.prototype.removeFromParentView = function () {
        var self = this;
        if (self._parentView === undefined) {
            throw new Error(self + '->removeFromParentView(): View has no parent view.');
        }
        self._parentView.removeChildView(self);
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
     *  @return {jQuery Element} Root element of a loaded view if invoked without a parameter,
     *                           scoped jQuery selection result if invoked with a selector
     *  @throws {ViewIsNotLoaded} If the view is not loaded.
     */
    View.prototype.$ = function (selector) {
        var self = this;
        if (self.isLoaded() === false) {
            throw new Error(self + '->$("' + selector + '"): View is not loaded.');
        } else if (selector === undefined){
            return self._containerElement.children();
        }
        var viewElement = self._containerElement.children();
        return viewElement.find(selector).not(
            viewElement.find('[data-view-name]').find(selector)
        );
    };

    /**
     *  Loads markup and styles from HTML and CSS files specified by the bundle property into the container element identified by the name property.
     *
     *  @method _load
     */
    View.prototype._load = function () {
        var self = this;

        // Skip if parent view is not loaded yet:
        if (self.parentView() && !self.parentView().isLoaded()) {
            throw new Error(self + '->load(): Parent view is not loaded yet.');
        }

        // A unique name must be configured so that the view instance can be distinguished from other views at the same hierarchy level:
        if (!self.name()) {
            throw new Error(self + '->load(): Container Name not specified.');
        }

        // A bundle must be configured (it must match a valid requirejs module id later on):
        if (!self.bundle()) {
            throw new Error(self + '->load(): (HTML/CSS)-bundle not specified.');
        }

        if (self.isLoaded()){
            throw new Error(self + '->load(): Cannot load, view already loaded.');
            //self._unload();
        }

        var containerElementSelector = '[data-view-name="' + self.name() + '"]';
        var containerElement = ( self.parentView() ?
            self.parentView().$(containerElementSelector)
                :
            $ (containerElementSelector));

        // In order for a view to get loaded, a valid container element must be existent:
        if (containerElement.length === 0) {
            throw new Error(self + '->load(): Container element not specified or not existent.');
        }

        if (self.isRootView() && containerElement.parents('[data-view-name]').length) {
            throw new Error(self + '->load(): the container of a Root View cannot be inside another View');
        }


        // Load equally named HTML markup and CSS stylesheet files via require loader plugins (they can only be loaded paired/they must have the same file name):
        require(['html!' + self.bundle() + '.html', 'css!' + self.bundle()], function (html, css) {

            // As isLoaded() checks if containerElement is defined, it must be set when the view actually loaded.
            // It is actually still not fully loaded, but if a childView were to be added after this function
            // finishes but before the childviews are fully loaded, addChildView must also call _load (and it
            // only does it if isLoaded == true)
            self._containerElement = containerElement;
            self._containerElement.html(html);

            // TODO: add onChildViewsWillLoad.

            // Load child views recursively and prepare the array of "child did load" deferreds
            var childViewsDidLoad = $.map(self.childViews(), function (childView) {
                var deferred = new $.Deferred();
                childView.onViewDidLoad().once(function(){
                    deferred.resolve();
                });
                childView._load();
                return deferred;
            });

            $.when.apply($, childViewsDidLoad).then(function(){
                // Call "did load" notification on self and on subscribed stakeholders:
                self._onViewDidLoadCallbacks.fireWith(self);
            });
        });
    };

    /**
     *  Unloads the DOM by restoring the originally occupied container element.
     *
     *  @method unload
     */
    View.prototype._unload = function () {
        var self = this;

        if (self.isLoaded() === false) {
            throw new Error(self + ' -> Cannot be unloaded since it is not loaded.');
        }

        // Call "will unload" notification on self and on subscribed stakeholders:
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
     *  Provides a human readable string representation of a view.
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
        str += (self.isLoaded()) ? ':loaded' : ':!loaded';
        str += ']';
        return str;
    };

    /**
     *  Recursively traverses down the child view hierarchy of a view while invoking
     *  a function for each view passing it the view and the recursion level.
     *
     *  @method traverse
     *  @param {Function} fn Function being invoked for each view and being passed the view object and the recursion level.
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
}));
