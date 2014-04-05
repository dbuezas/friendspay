define [
    'View'
    'Library/ButtonView'
    'module'
], (View, ButtonView, DialerViewModule) ->

    buttonNames = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    #todo: add "onChildViewsWillLoad" to view.js in order to create containers onViewDidLoad

    class DialerView extends View
        constructor: (config) ->
            super config

            config = $.extend
                onChange: (current) => console.log current
            , config

            @bundle DialerViewModule.id

            _this = this
            @buttons = buttonNames.map (buttonName) =>
                new ButtonView
                    parentView: @
                    name: buttonName
                    label: buttonName
                    onRelease: ->
                        _this.current.push @label().text()
                        config.onChange(_this.current)
            new ButtonView
                parentView: @
                name: "clear"
                label: "clear"
                onRelease: =>
                    @current = []
                    config.onChange(@current)
        current: []
