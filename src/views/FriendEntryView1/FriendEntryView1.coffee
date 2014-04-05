# FriendEntryView
define [
    'jquery'
    'View'
    'cascading-text-sheet'
    'view+text' # for @getTextForKey
    'd3'
    'module'
], ($, View, Text, ViewTextExtension, d3, FriendEntryViewModule) ->

    class FriendEntryView extends View

        constructor: (config) ->
            super config
            config = config or {}
            @bundle FriendEntryViewModule.id
            @defaultText config.defaultText
            @text config.text
            @_namespace = Math.random().toString()[1..]
            @total = 0


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
            @$().html @total
            width = @$().width()
            height = @$().height()
            touchmove  = "touchmove"  + @_namespace + " " + "mousemove" + @_namespace
            touchstart = "touchstart" + @_namespace + " " + "mousedown" + @_namespace
            touchend   = "touchend"   + @_namespace + " " + "mouseup"   + @_namespace

            @$().on touchstart, (e) =>
                @_cleanUp()
                e = e.originalEvent.touches?[0] || e.originalEvent
                startY = e.pageY
                startX = null
                lastScale = null
                accum = 0
                $('body').on touchmove, (e) =>
                    e = e.originalEvent.touches?[0] || e.originalEvent
                    scale = switch Math.abs(e.pageY - startY) // height
                        when 0 then 0
                        when 1 then .25
                        when 2 then 1
                        when 3 then 10
                        else 25
                    delta = 0
                    if scale isnt lastScale
                        startX = e.pageX
                        lastScale = scale
                        accum = @total
                    else
                        delta = ((e.pageX - startX) * 10 + width / 2) // width
                        @total = accum + delta * scale

                    @text scale + " " + @total
                    return
                    exponent = Math.min(2,exponent)
                    if exponent isnt lastExponent
                        startX = e.pageX
                    scale = 10 ** exponent

                    lastX = e.pageX
                    @text @count.toFixed(1)
                $('body').on touchend, (e) =>
                    @_cleanUp()


        _cleanUp: ->
            $('body').off @_namespace
        viewDidUnload: ->
            @_cleanUp()
