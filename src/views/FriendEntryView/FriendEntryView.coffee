# FriendEntryView
define [
    'jquery'
    'View'
    'Library/ButtonView'
    'cascading-text-sheet'
    'view+text' # for @getTextForKey
    'd3'
    'module'
], ($, View, ButtonView, Text, ViewTextExtension, d3, FriendEntryViewModule) ->

    class FriendEntryView extends ButtonView

        constructor: (config) ->
            super config
            config = config or {}
            @bundle FriendEntryViewModule.id


        viewDidLoad: ->
