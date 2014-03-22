define [
    'View'
    'module'
], (View, ProgressBarViewModule) ->

    class ProgressBarView extends View

        constructor: (config) ->
            super config

            config = config or {}

            @bundle ProgressBarViewModule.id
            @progress config.progress

        progress: View.prototype.definePropertyAccessors 'progress',
            get: ->
                if @_progress? then @_progress
                else 0
            set: (progress) ->
                @_progress = progress
                if @isLoaded() then @$('.bar').css('-webkit-transform', 'scale(' + @progress() + ', 1)')

        viewDidLoad: ->
            # Set DOM states from internal states:
            @$('.bar').css('-webkit-transform', 'scale(' + @progress() + ', 1)')
