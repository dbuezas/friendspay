define [
    'View'
    'PouchDB'
    'Library/ListView'
    'Library/LabelView'
    'DialerView'
    'module'
], (View, PouchDB, ListView, LabelView, DialerView, FriendsViewModule) ->

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
                    searchTerm = terms[0]
                    if !searchTerm?
                        # No more terms to search, undefined matches the rest of the name
                        return name
                    restTerms = terms.slice(1)
                    matchFound = undefined
                    chars = searchTerm.split("")
                    for i in [0..chars.length]
                        matchPos = name.toLowerCase().indexOf(chars[i])

                        if matchPos isnt -1
                            nextMatch = matcher(restTerms, name.slice(matchPos+1))
                            if nextmatch?
                                matchFound = name.slice(0,matchPos) + '('+name[matchPos]+')' + next
                                break
                    return matchFound

                matchedFrieds = allFriends.map (friend) =>
                    matcher(fuzzyTerms, friend)
                .filter (match) => match?

                @list.viewForIndex (i) =>
                    if (friend = matchedFrieds[i])?
                        new LabelView
                            text: friend
            , (err) =>
                console.log err if err?
