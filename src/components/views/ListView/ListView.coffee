define [
    'jquery'
    'iscroll'
    'View'
    'module'
], ($, IScroll, View, ListViewModule) ->

    class ListView extends View

        constructor: (config) ->
            super config
            config = config or {}
            @bundle ListViewModule.id
            @viewForIndex config.viewForIndex # returns an instance of View at the given index

        viewForIndex: View.prototype.definePropertyAccessors 'viewForIndex',
            get: ->
                if @_viewForIndex? then @_viewForIndex else $.noop
            set: (viewForIndex) ->
                if viewForIndex? and @_viewForIndex isnt viewForIndex
                    @_viewForIndex = viewForIndex
                    @reloadData()

        reloadData: ->
            if @isLoaded()

                @_scroll ?= new IScroll @$()[0],
                    mouseWheel: on
                    scrollbars: on
                    handleClick: off
                    bounce: off
                    useTransitions: on
                    preventDefault: on


                # Purge child views and DOM:
                @removeAllChildViews()
                @$('.scroll').empty()

                index = -1
                childViewsDidLoad = []

                # Fetch views until undefined or null is received:
                while (view = @viewForIndex()(++index))?

                    # Create container and add child view:
                    view.name(view.name() or 'entry' + index)
                    container = $('<div data-view-name="' + view.name() + '" />')
                    @$('.scroll').append container
                    childViewsDidLoad.push view.onViewDidLoad().promise()
                    @addChildView view

                # Wait for all views to be loaded (only then their height will be known, which is relevant for iScroll to know)
                $.when.apply($, childViewsDidLoad).then =>
                    @_scroll.refresh()
                    @_scroll.scrollTo 0, 0

        viewDidLoad: ->
            @reloadData()
