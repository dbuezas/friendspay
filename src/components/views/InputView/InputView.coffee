define [
    'jquery'
    'View'
    'cascading-text-sheet'
    'view+text' # for @getTextForKey
    'module'
], ($, View, Text, ViewTextExtension, InputViewModule) ->

    class InputView extends View

        constructor: (config) ->
            super config

            config = config or {}

            @bundle InputViewModule.id

            @type config.type
            @placeholder config.placeholder
            @text config.text
            @enabled config.enabled
            # Create and configure callbacks:
            @_onDoneCallbacks = $.Callbacks()
            @onDone().subscribe config.onDone

        type: View.prototype.definePropertyAccessors 'type',
            get: ->
                if @_type? then @_type else 'text'
            set: (type) ->
                type = if type? then type else 'text'
                if ['text', 'email', 'number', 'password', 'tel', 'time', 'url'].indexOf(type) > -1
                    @_type = type
                else throw new Error @ + '->type("' + type + '"): Invalid type. Use one of the following instead: "text", "email", "number", "password", "tel", "time", "url"'
                if @isLoaded() then @$('input').attr 'type', @type()

        placeholder: View.prototype.definePropertyAccessors 'placeholder',
            get: ->
                if @_placeholder? then @_placeholder
                else if @isLoaded() and textFromCTS = @getTextForKey(@$().attr('data-text-key'))
                    textFromCTS
                else 'Input'
            set: (placeholder) ->
                @_placeholder = if placeholder instanceof Array then Text.get placeholder else placeholder
                if @isLoaded() then @$('input').attr 'placeholder', @placeholder()

        text: View.prototype.definePropertyAccessors 'text',
            get: ->
                if @_text? then @_text
                else if @isLoaded() then @$('input').val()
                else ''
            set: (text) ->
                @_text = if text instanceof Array then Text.get text else text
                if @isLoaded() then @$('input').val @text()

        enabled: View.prototype.definePropertyAccessors 'enabled',
            get: ->
                if @_enabled? then @_enabled else true
            set: (enabled) ->
                @_enabled = enabled
                if @isLoaded() then @$().attr 'data-enabled', (if @enabled() then 'yes' else 'no')

        onDone: View.prototype.definePropertyAccessors 'onDone',
            get: ->
                subscription =
                    subscribe: @_onDoneCallbacks.add
                    unsubscribe: @_onDoneCallbacks.remove
            set: (subscription) ->
                if subscription?.subscribe? then @_onDoneCallbacks.add subscription.subscribe

        blur: ->
            if @isLoaded() then @$('input').blur()

        viewDidLoad: ->
            # Set DOM states from internal states:
            @$('input').attr 'type', @type()
            @$('input').attr 'placeholder', @placeholder()
            @$('input').val @text()
            @enabled @enabled()

            # Handle user interaction:
            @$('input').on 'keyup', (event) =>
                if event.keyCode is 13
                    @blur()
                    @_onDoneCallbacks.fire()
                @_text = this.value # this???
                false
