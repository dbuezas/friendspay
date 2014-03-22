define [
    'jquery'
    'View'
    'Library/ButtonView'
    'module'
], ($, View, ButtonView, ToggleButtonViewModule) ->

    class ToggleButtonView extends ButtonView

        constructor: (config) ->
            super config

            config = config or {}

            @bundle ToggleButtonViewModule.id

            # Create and configure callbacks:
            @_onToggleCallbacks = $.Callbacks()
            @onToggle().subscribe config.onToggle

            # Register for super button release event:
            @onRelease().subscribe =>
                @selected !@selected() # toggle
                @_onToggleCallbacks.fire @

        label: => # Override ButtonView->label property so that it does nothing as ToggleButtonView does not support labels

        onToggle: View.prototype.definePropertyAccessors 'onToggle',
            get: ->
                subscription =
                    subscribe: @_onToggleCallbacks.add
                    unsubscribe: @_onToggleCallbacks.remove
            set: (subscription) ->
                if subscription?.subscribe? then @_onToggleCallbacks.add subscription.subscribe
