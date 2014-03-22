define [
    'jquery'
    'View'
    'module'
], ($, View, NavigationViewModule) ->

    class NavigationView extends View

        constructor: (config) ->
            super config
            config = config or {}
            @bundle NavigationViewModule.id
            @rootView config.rootView

            # a deferred based queue is used to avoid transition overlaping
            @_lastViewDidShow  = @_selfDidInitialLoad = new $.Deferred()

            @._containers =
                visible : undefined
                hidden : undefined

            @_history = []
            @_visibleContainerName;
            @show
                view: @rootView
                transitionStyle: "noAnimation"

        rootView: View.prototype.definePropertyAccessors 'rootView',
            get: -> @_rootView
            set: (rootView) ->
                if not rootView?
                    throw "[NavigationView] ERROR: RootView cannot be undefined";
                @rootView = rootView
                #TODO: pop to root and show rootView

        viewDidLoad: ->
            #TODO: shitty code
            if @_visibleContainerName == "contentViewContainer_1"
                @_containers =
                    visible : @$('[data-view-name="contentViewContainer_1"]')
                    hidden  : @$('[data-view-name="contentViewContainer_2"]')
            else
                @_containers =
                    visible : @$('[data-view-name="contentViewContainer_2"]')
                    hidden  : @$('[data-view-name="contentViewContainer_1"]')

            if @_visibleContainerName?
                @_visibleView.viewWillAppear?()
                @_containers.visible.attr("data-position", "center")
                @_visibleView.viewDidAppear?()

            @_selfDidInitialLoad.resolve();

        showNowOrNever: (transitionSettings) ->
            @show(transitionSettings) if @_lastViewDidShow.state() is "resolved"

        show: (transitionSettings) ->
            transitionSettings = $.extend({
                view: undefined
                transitionStyle: ["noAnimation", "splash", "fromRight", "fromLeft", "fromOver", "fromBelow", "fromSmall", "fromBig", "clockwise", "counterClockwise"][1]
                trackHistory: true #o enable back functionality
                purgeHistory: false
            }, transitionSettings);

            if not transitionSettings.view? then throw "[NavigationView] ERROR: show was called with view === undefined";

            # Wait queue is implemented with chained deferreds
            currentViewDidShow = new $.Deferred()
            @_lastViewDidShow.then =>
                if transitionSettings.purgeHistory then @_history = []
                @_history.push transitionSettings
                @_showNow(transitionSettings, currentViewDidShow)
            @_lastViewDidShow = currentViewDidShow

        backNowOrNever: ->
            @back() if @_lastViewDidShow.state() is "resolved"

        back: ->
            currentViewDidShow = new $.Deferred()
            @_lastViewDidShow.then -> @_backNow currentViewDidShow
            @_lastViewDidShow = currentViewDidShow

        canGoBack: ->
            @_history.every (transitionSettings) => not transitionSettings.trackHistory

        # Private interface:
        _showNow: (transitionSettings, currentViewDidShow, invertAnimation) ->
            # Register Navigation view in the environment of the view to show
            if @_visibleView is transitionSettings.view # View is already loaded and visible.
                @_history.pop() # remove this transition from the history.
                console.log("WARNING: View "+transitionSettings.view.constructor.name+" is already visible. It will not be loaded again.")
                currentViewDidShow.resolve()
                return

            # Load view into the container that is about to appear:
            transitionSettings.view.name @_containers.hidden.attr("data-view-name")

            transitionSettings.view.onViewDidLoad().once =>
                # Notify views of the appear/disappear that's going to happen soon:
                @_visibleView?.viewWillDisappear?()
                #@onBeforeChildViewWillAppear?(transitionSettings.view); TODO: see if we still need this for the navbar view
                transitionSettings.view.viewWillAppear?()

                [oldGoesTo, newComesFrom] = switch transitionSettings.transitionStyle
                    when "splash"           then [ "back",  "back" ]
                    when "noAnimation"      then [ "back",  "back" ]
                    when "fromRight"        then [ "left",  "right" ]
                    when "fromLeft"         then [ "right", "left" ]
                    when "fromOver"         then [ "below", "over" ]
                    when "fromBelow"        then [ "over",  "below" ]
                    when "fromBig"          then [ "small", "big" ]
                    when "fromSmall"        then [ "big",   "small" ]
                    when "clockwise"        then [ "small", "counterClockwise" ]
                    when "counterClockwise" then [ "small", "clockwise" ]
                    else throw "NavigationView._showNow ERROR: transitionStyle '#{transitionSettings.transitionStyle}' does not exist."

                if invertAnimation
                    [oldGoesTo, newComesFrom] = [newComesFrom, oldGoesTo]

                console.log 2
                # Set containers' initial positions.
                @_containers.visible.removeClass("animated")
                    .attr("data-position", "center")
                @_containers.hidden.removeClass("animated")
                    .attr("data-position", newComesFrom)

                # Set containers' final positions.
                animated = transitionSettings.transitionStyle != "noAnimation"
                setTimeout =>
                    @_containers.visible.toggleClass("animated", animated)
                        .attr("data-position", oldGoesTo);
                    @_containers.hidden.toggleClass("animated", animated)
                        .attr("data-position", "center");
                    console.log @_containers.visible[0].outerHTML
                , 0

                onTransitionEndCallback = =>
                    hiddenView = @_visibleView
                    @_visibleView = transitionSettings.view

                    [@_containers.visible, @_containers.hidden] = [@_containers.hidden, @_containers.visible]

                    @_visibleContainerName = @_containers.visible.attr('data-view-name')
                    # Notify views of the appear/disappear has happened just now:
                    if hiddenView?
                        hiddenView.viewDidDisappear?()
                        hiddenView.removeFromParentView() #also unloads view

                    @_visibleView.viewDidAppear?()

                    do =>
                        # Hack to force a repaint (https://jira.intranet.doccheck.ag/browse/AVON-220)
                        # http://stackoverflow.com/a/3485654/719141
                        @_containers.visible[0].style.display = 'none'
                        @_containers.visible[0].offsetHeight # no need to store this anywhere, getting it is enough
                        @_containers.visible[0].style.display = ''

                    # Give permision for the next transition if in the queue.
                    currentViewDidShow.resolve()

                    if not transitionSettings.trackHistory
                        # Remove view refference since it should not be in the history
                        transitionSettings.view = undefined;

                # Unfortunately transitionEnd is buggy and wont get fired every time, so we use timeouts.
                setTimeout(onTransitionEndCallback, if animated then 400 else 0)
            @addChildView(transitionSettings.view)

        _backNow: (currentViewDidShow) ->
            # Discard current view and all not tracked views
            loop
                if @_history.length <= 1
                    #If there is nothing to pop from history, exit.
                    currentViewDidShow.resolve()
                    console.log("WARNING: Track history is empty, can not go back.")
                    return
                discarded = @_history.pop()
                peak = @_history[@_history.length-1];
                break if peak.trackHistory

            # Discarded transitionSettings Object has the right transitionStyle
            transitionSettings = {
                transitionStyle : discarded.transitionStyle,
                view : peak.view
            }
            invertAnimation = true;
            @_showNow(transitionSettings, currentViewDidShow, invertAnimation);
