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
                    t = terms[0]
                    return name if !t?
                    ts = terms.slice(1)

                    result = no
                    t.split("").some (char) =>
                        matchPos = name.toLowerCase().indexOf(char)

                        if matchPos is -1
                            no
                        else
                            next = matcher(ts, name.slice(matchPos+1))
                            if next is no
                                return no
                            else
                                result = name.slice(0,matchPos) + '('+name[matchPos]+')' + next
                                return yes
                    return result
                matchedFrieds = allFriends.map (friend) =>
                    matcher(fuzzyTerms, friend)
                .filter (match) => match isnt no

                @list.viewForIndex (i) =>
                    if (friend = matchedFrieds[i])?
                        new LabelView
                            text: friend
            , (err) =>
                console.log err if err?
