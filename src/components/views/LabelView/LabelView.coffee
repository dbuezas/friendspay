# LabelView
define [
    'jquery'
    'View'
    'cascading-text-sheet'
    'view+text' # for @getTextForKey
    'module'
], ($, View, Text, ViewTextExtension, LabelViewModule) ->

    class LabelView extends View

        constructor: (config) ->
            super config
            config = config or {}
            @bundle LabelViewModule.id
            @defaultText config.defaultText
            @text config.text

        defaultText: View.prototype.definePropertyAccessors 'defaultText',
            get: ->
                if @_defaultText? then @_defaultText else 'Label'
            set: (defaultText) ->
                @_defaultText = defaultText

        text: View.prototype.definePropertyAccessors 'text',
            get: ->
                if @_text? then @_text
                else if @isLoaded() and textFromCTS = @getTextForKey(@$().attr('data-text-key'))
                    textFromCTS
                else @defaultText()
            set: (text) ->
                @_text = if text instanceof Array then Text.get text else text
                if @isLoaded() then @$().html @text()

        viewDidLoad: ->
            # Set DOM states from internal states:
            @$().html @text()
