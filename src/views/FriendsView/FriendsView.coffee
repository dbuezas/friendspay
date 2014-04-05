define [
    'View'
    'PouchDB'
    'Library/ListView'
    'Library/ButtonView'
    'DialerView'
    'FriendEntryView'
    'module'
], (View, PouchDB, ListView, ButtonView, DialerView, FriendEntryView, FriendsViewModule) ->

    class FriendsView extends View
        constructor: (config) ->
            super config

            @config = $.extend
                db: "users",
                user: "David"
            , config

            @bundle FriendsViewModule.id

            #Init db connection
            @remoteCouch = 'http://friendspay.iriscouch.com/todos'
            @db = new PouchDB('todos')

            @dialer = new DialerView
                parentView: @
                name: "dialer"
                onChange: (current) => @getUsers current #e.g.["abc","mno"]

            PouchDB.sync @remoteCouch, @db,
                onChange: => @getUsers @dialer.current
                onComplete: => console.log "sync completed", arguments
                continuous: true

            # Set up the list:
            @list = new ListView
                parentView: @
                name: 'list'

            @getUsers([])

        getUsers: (fuzzyTerms) ->
            @db.get(@config.db).then (doc) =>
                @lastDoc = doc;
                # todo: do this directly as a DB View?

                allFriends = doc.friends[@config.user]
                matcher = (terms, name) =>
                    #e.g:
                    # terms = ['def', 'abc']
                    # name = 'Emmet Brown' returns '(E)mmet (B)rown'
                    # name = 'Mc Fly' returns null

                    return name if terms.length is 0 #no more terms to match, we're done
                    for char in terms[0]
                        matchPos = name.toLowerCase().indexOf char
                        continue if matchPos is -1 #this char doesn't match, try the next one
                        tail = matcher terms[1..], name[matchPos+1..]
                        continue if tail is null #char found but following terms don't match, try next char
                        return name[...matchPos] + '<b>'+name[matchPos]+'</b>' + tail
                    null

                matchedFrieds = allFriends
                    .map (friend) => matcher(fuzzyTerms, friend)
                    .filter (match) => match?

                @list.viewForIndex (i) =>
                    if (friend = matchedFrieds[i])?
                        new ButtonView
                            label: friend
                            onRelease: =>
                                @.parentView().showNowOrNever
                                    view: new FriendsView
                                    transitionStyle: 'fromRight'

                @dialer.buttons.forEach (button) =>
                    button.enabled allFriends.some (friend) =>
                        matcher(fuzzyTerms.concat(button.label().text()), friend)?

            , (err) =>
                console.log err if err?
