define [
    'View'
    'Library/NavigationView'
    'FriendsView'
    'module'
], (View, NavigationView, FriendsView, MainViewModule) ->

    class MainView extends View
        constructor: (config) ->
            super config
            @bundle MainViewModule.id
            new NavigationView
                rootView: new FriendsView()
                parentView: @
                name: "navigation"
