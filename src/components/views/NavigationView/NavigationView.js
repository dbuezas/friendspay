//David Buezas, antwerpes ag 6.11.13, based on code from Andreas Tietz & David Buezas

// NavigationView
(function (factory) {
    // Define this module and it's dependencies via AMD if posssible, otherwise use the global scope:
    if (typeof define === "function" && define.amd) {
        define(["jquery", "View", "module"], factory);
    } else {
        NavigationView = NavigationView || factory(jQuery, AppUI.View);
    }
}(function ($, View, NavigationViewModule) {

    // Constructor:
    function NavigationView(config) {
        var self = this;

        // Call parent constructor:
        View.call(self, config);

        $.extend(self, {
            rootView: undefined,
            onBeforeChildViewWillAppear: function(view){}
        }, config);

        // a deferred based queue is used to avoid transition overlaping
        self._selfDidInitialLoad = new $.Deferred();
        self._lastViewDidShow = self._selfDidInitialLoad;

        self._containers = {
            visible : undefined,
            hidden : undefined
        };
        self._history = [];

        if (self.rootView === undefined) throw "[NavigationView] ERROR: RootView cannot be undefined";

        self._visibleContainerName;

        self.show({
            view: self.rootView,
            transitionStyle: "noAnimation"
        });
    }

    // Inherit from View:
    NavigationView.prototype = new View({
        bundle: NavigationViewModule.id
    });

    NavigationView.prototype.constructor = NavigationView;

    // View Lifecycle interface:
    NavigationView.prototype.viewDidLoad = function () {
        var self = this;

        if (self._visibleContainerName == "contentViewContainer_1"){
            self._containers = {
                visible : self.m('[data-view-container="contentViewContainer_1"]'),
                hidden  : self.m('[data-view-container="contentViewContainer_2"]')
            }
        } else {
            self._containers = {
                visible : self.m('[data-view-container="contentViewContainer_2"]'),
                hidden  : self.m('[data-view-container="contentViewContainer_1"]')
            }
        }

        if (self._visibleContainerName !== undefined){
            self._visibleView.viewWillAppear();
            self._containers.visible.attr("data-position", "center");
            self._visibleView.viewDidAppear();
        }

        self._selfDidInitialLoad.resolve();
    };

    // Public interface:
    NavigationView.prototype.showIfQueueIsEmpty = function(transitionSettings) {
        var self = this;
        if (self._lastViewDidShow.isResolved()){
            self.show(transitionSettings);
        }
    };

    NavigationView.prototype.show = function(transitionSettings) {
        var self = this;
        transitionSettings = $.extend({
            view: undefined,
            transitionStyle: ["noAnimation", "splash", "fromRight", "fromLeft", "fromOver", "fromBelow", "fromSmall", "fromBig", "clockwise", "counterClockwise"][1],
            trackHistory: true, //to enable back functionality,
            purgeHistory: false
        }, transitionSettings);

        if (transitionSettings.view === undefined) throw "[NavigationView] ERROR: show was called with view === undefined";

        // Wait queue is implemented with chained deferreds
        var currentViewDidShow = new $.Deferred();
        self._lastViewDidShow.then(function () {
            if (transitionSettings.purgeHistory){
                self._history = [];
            }
            self._history.push(transitionSettings);
            self._showNow(transitionSettings, currentViewDidShow);
        });
        self._lastViewDidShow = currentViewDidShow;
        return currentViewDidShow;
    };

    NavigationView.prototype.backIfQueueIsEmpty = function(){
        var self = this;
        if (self._lastViewDidShow.isResolved()){
            self.back();
        }
    };

    NavigationView.prototype.back = function(){
        var self = this;

        var currentViewDidShow = new $.Deferred();
        self._lastViewDidShow.then(function () {
            self._backNow(currentViewDidShow);
        });
        self._lastViewDidShow = currentViewDidShow;
        return currentViewDidShow;
    }

    // Private interface:
    NavigationView.prototype._showNow = function(transitionSettings, currentViewDidShow, invertAnimation) {
        var self = this;

        // Register Navigation view in the environment of the view to show
        transitionSettings.view.environment.navigationView = self;

        if (self._visibleView === transitionSettings.view){
            // View is already loaded and visible.
            self._history.pop(); // remove this transition from the history.
            console.log("WARNING: View "+transitionSettings.view.constructor.name+" is already visible. It will not be loaded again.");
            currentViewDidShow.resolve();
            return;
        }

        // Load view into the container that is about to appear:
        transitionSettings.view._container = self._containers.hidden.attr("data-view-container");

        self.addChildView(transitionSettings.view).done(function(){
            // Notify views of the appear/disappear that's going to happen soon:
            if (self._visibleView) self._visibleView.viewWillDisappear();
            self.onBeforeChildViewWillAppear(transitionSettings.view);
            transitionSettings.view.viewWillAppear();
            var comesAndGoes ={
                "splash":           { oldGoesTo: "back",  newComesFrom:"back" },
                "noAnimation":      { oldGoesTo: "back",  newComesFrom:"back" },
                "fromRight":        { oldGoesTo: "left",  newComesFrom:"right" },
                "fromLeft":         { oldGoesTo: "right", newComesFrom:"left" },
                "fromOver":         { oldGoesTo: "below", newComesFrom:"over" },
                "fromBelow":        { oldGoesTo: "over",  newComesFrom:"below" },
                "fromBig":          { oldGoesTo: "small", newComesFrom:"big" },
                "fromSmall":        { oldGoesTo: "big",   newComesFrom:"small" },
                "clockwise":        { oldGoesTo: "small", newComesFrom:"counterClockwise" },
                "counterClockwise": { oldGoesTo: "small", newComesFrom:"clockwise" },
            };
            if (comesAndGoes[transitionSettings.transitionStyle] === undefined){
                throw("NavigationView._showNow ERROR: transitionStyle '"+transitionSettings.transitionStyle+ "' does not exist.");
            }
            var oldGoesTo    = comesAndGoes[transitionSettings.transitionStyle].oldGoesTo;
            var newComesFrom = comesAndGoes[transitionSettings.transitionStyle].newComesFrom;

            // Set containers' initial positions.
            self._containers.visible.removeClass("animated")
                .attr("data-position", "center");
            self._containers.hidden.removeClass("animated")
                .attr("data-position", invertAnimation ? oldGoesTo : newComesFrom);

            // Set containers' final positions.
            var animated = transitionSettings.transitionStyle !== "noAnimation";
            setTimeout(function(){
                self._containers.visible.toggleClass("animated", animated)
                    .attr("data-position", invertAnimation ? newComesFrom : oldGoesTo);
                self._containers.hidden.toggleClass("animated", animated)
                    .attr("data-position", "center");
            },0);

            var onTransitionEndCallback = function(){
                var hiddenView = self._visibleView;
                self._visibleView = transitionSettings.view;

                var temp = self._containers.visible;
                self._containers.visible = self._containers.hidden;
                self._containers.hidden = temp;

                self._visibleContainerName = self._containers.visible.attr('data-view-container');
                // Notify views of the appear/disappear has happened just now:
                if (hiddenView) {
                    hiddenView.viewDidDisappear();
                    hiddenView.removeFromParentView(); //also unloads view
                }
                self._visibleView.viewDidAppear();

                 /* Hack to force a repaint (https://jira.intranet.doccheck.ag/browse/AVON-220) */{
                    // http://stackoverflow.com/a/3485654/719141
                    self._containers.visible[0].style.display='none';
                    self._containers.visible[0].offsetHeight; // no need to store this anywhere, the reference is enough
                    self._containers.visible[0].style.display='';
                }
                // Give permision for the next transition if in the queue.
                currentViewDidShow.resolve();

                if (transitionSettings.trackHistory == false) {
                    // Remove view refference since it should not be in the history
                    transitionSettings.view = undefined;
                }
            };
           /*if (animated){
               self._containers.hidden.one($.transitionEndEvent(), onTransitionEndCallback);
           } else  {
               setTimeout(onTransitionEndCallback, 0);
           }*/

           // Unfortunately transitionEnd is buggy and wont get fired every time.
           setTimeout(onTransitionEndCallback, animated ? 400 : 0);
        });
    };

    NavigationView.prototype.canGoBack = function(){
        var self = this;

        for (var i=0; i < self._history.length -1; i++){
            if (self._history[i].trackHistory) return true;
        }

        return false;
    }

    NavigationView.prototype._backNow = function(currentViewDidShow){
        var self = this;

        // Discard current view and all not tracked views
        var discarded, peak;
        do{
            if (self._history.length <= 1) {
                currentViewDidShow.resolve();
                console.log("WARNING: Track history is empty, can not go back.");
                return; //If there is nothing to pop from history, exit.
            }
            discarded = self._history.pop();
            peak = self._history[self._history.length-1];
        } while (peak.trackHistory == false);

        // Discarded transitionSettings Object has the right transitionStyle
        var transitionSettings = {
            transitionStyle : discarded.transitionStyle,
            view : peak.view
        }
        var invertAnimation = true;
        self._showNow(transitionSettings, currentViewDidShow, invertAnimation);
    }


    // Return the constructor as the module value:
    return NavigationView;
}));
