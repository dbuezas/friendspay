define [
    'jquery'
    'View'
    'Library/LabelView'
    'module'
], ($, View, LabelView, ButtonViewModule) ->

    class ButtonView extends View

        constructor: (config) ->
            super config

            config = config or {}

            @bundle ButtonViewModule.id
            @label config.label
            @selected config.selected
            @enabled config.enabled

            # Create callbacks prior to configuring:
            @_onPushCallbacks = $.Callbacks()
            @_onReleaseCallbacks = $.Callbacks()

            # Configure callbacks:
            @onPush().subscribe config.onPush
            @onRelease().subscribe config.onRelease

            # Cache platform dependend event names:
            isTouchEnabled = ('ontouchstart' in window) or window.DocumentTouch and document instanceof DocumentTouch # taken from modernizr
            @_$startEventName = (if isTouchEnabled then 'touchstart.ButtonView' else 'mousedown.ButtonView')
            @_$moveEventName = (if isTouchEnabled then 'touchmove.ButtonView' else 'mousemove.ButtonView')
            @_$endEventName = (if isTouchEnabled then 'touchend.ButtonView' else 'mouseup.ButtonView')

        label: View.prototype.definePropertyAccessors 'label',
            get: ->
                @_labelView = @_labelView ?= new LabelView
                    parentView: @
                    name: 'label'
                    defaultText: 'Button'
            set: (viewOrString) ->
                if !viewOrString? or typeof viewOrString is 'string'
                    if !@_labelView?
                        @childViews [] # clear current child views
                        @_labelView ?= new LabelView
                            parentView: @
                            name: 'label'
                            defaultText: 'Button'
                    @_labelView.text viewOrString
                else if viewOrString instanceof View
                    @_labelView = viewOrString
                    @_labelView.name 'label'
                    @_labelView.defaultText 'Button'
                    @childViews @_labelView # replace any existing child view
                else
                    throw new Error @ + '->label( ' + viewOrString + ' ): Expected a string or an instance of View.'
                if @isLoaded() then @_labelView.load()

        selected: View.prototype.definePropertyAccessors 'selected',
            get: ->
                if @_selected? then @_selected else false
            set: (selected) ->
                @_selected = selected
                if @isLoaded() then @$().attr 'data-selected', (if @selected() then 'yes' else 'no')

        enabled: View.prototype.definePropertyAccessors 'enabled',
            get: ->
                if @_enabled? then @_enabled else true
            set: (enabled) ->
                @_enabled = enabled;
                if @isLoaded() then @$().attr 'data-enabled', (if @enabled() then 'yes' else 'no')

        onPush: View.prototype.definePropertyAccessors 'onPush',
            get: ->
                subscription =
                    subscribe: @_onPushCallbacks.add
                    unsubscribe: @_onPushCallbacks.remove
            set: (subscription) ->
                if subscription?.subscribe? then @_onPushCallbacks.add subscription.subscribe

        onRelease: View.prototype.definePropertyAccessors 'onRelease',
            get: ->
                subscription =
                    subscribe: @_onReleaseCallbacks.add
                    unsubscribe: @_onReleaseCallbacks.remove
            set: (subscription) ->
                if subscription?.subscribe? then @_onReleaseCallbacks.add subscription.subscribe

        isPushed: View.prototype.definePropertyAccessors 'isPushed',
            get: ->
                if @isLoaded() then @$().attr 'data-pushed' == 'yes' else false

        viewDidLoad: ->

            # Set DOM states from internal states:
            @$().attr 'data-selected', (if @selected() then 'yes' else 'no')
            @$().attr 'data-enabled', (if @enabled() then 'yes' else 'no')

            # Handle user interaction:

            startEvent = {}
            $document = $ document

            @$().on @_$startEventName, (event) =>
                return unless @enabled()

                startEvent = event.originalEvent
                sx = startEvent.pageX or startEvent.touches[0].pageX
                sy = startEvent.pageY or startEvent.touches[0].pageY
                @$().attr 'data-pushed', 'yes'

                @_onPushCallbacks.fire @

                $document.on @_$moveEventName, (event) =>
                    endEvent = event.originalEvent
                    ex = endEvent.pageX or endEvent.touches[0].pageX
                    ey = endEvent.pageY or endEvent.touches[0].pageY
                    if Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2) > Math.pow(10, 2)
                        @$().attr 'data-pushed', 'no'
                        $document.off @_$moveEventName
                        @$().off @_$endEventName

                @$().on @_$endEventName, (event) =>
                    @$().attr 'data-pushed', 'no'

                    @_onReleaseCallbacks.fire @

                    $document.off @_$moveEventName
                    @$().off @_$endEventName

        viewWillUnload: ->
            @$().off '.ButtonView'
