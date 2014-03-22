define [
    'View'
    'Library/LabelView'
    'Library/InputView'
    'Library/ButtonView'
    'Library/ToggleButtonView'
    'Library/ProgressBarView'
    'Library/ListView'
    'Library/NavigationView'
    'module'
], (View, LabelView, InputView, ButtonView, ToggleButtonView, ProgressBarView, ListView, NavigationView, KitchenSinkViewModule) ->

    class KitchenSinkView extends View
        constructor: (config) ->
            super config

            config = config or {}
            @bundle KitchenSinkViewModule.id

            # Set up the header label:
            @header = new LabelView
                parentView: @
                name: 'header'
                #text: 'Kitchen Sink' # text comes from CTS

            # Set up the list:
            @list = new ListView
                parentView: @
                name: 'list'
                viewForIndex: (index) ->
                    if index < 50
                        new LabelView
                            text: 'List Item ' + index

            # Set up input field:
            @input = new InputView
                parentView: @
                name: 'input'
                onDone: =>
                    console.log @input.text()

            # Set up toggle button:
            @toggle = new ToggleButtonView
                parentView: @
                name: 'toggle'
                onRelease: =>
                    console.log 'onRelease'
                onToggle: =>
                    console.log 'onToggle'

            # Set up button:
            @button = new ButtonView
                parentView: @
                name: 'button'
                #label: 'This is a Button!' # text comes from CTS
                onRelease: =>
                    @input.placeholder 'Hello World!'
                    @input.text 'Hello World!'
                    @progress1.progress Math.random()
                    @progress2.progress Math.random()
                    @navigation.showNowOrNever
                        view: new ProgressBarView
                            progress: .66
                        transitionStyle: "fromSmall"

            # Set up progress bars:

            @progress1 = new ProgressBarView
                parentView: @
                name: 'progress1'
                progress: .33

            @progress2 = new ProgressBarView
                parentView: @
                name: 'progress2'
                progress: .66

            @navigation = new NavigationView
                parentView: @
                name: 'navigation'
                rootView: new ButtonView
                    #label: 'This is a Button!' # text comes from CTS
                    onRelease: =>
                        @navigation.show
                            view: new ProgressBarView
                                progress: .66
                            transitionStyle: "fromSmall"
