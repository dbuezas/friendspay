# Application Entry Point
# This is a module without any requirement.
define ->

    # Module id of the first view to be loaded as the root view:
    ROOT_VIEW = 'MainView' # MainView

    # CTS file to be used throughout the entire app:
    TEXT_SHEET = 'res/texts_de.cts'


    # Setup RequireJS:
    require.config
        baseUrl: './'
        paths:

            # RequireJS loader plugins:
            'domReady':     'components/vendor/requirejs-domready/domReady'
            'html':         'components/vendor/requirejs-text/text'
            'css':          'components/vendor/require-css/css'
            'normalize':    'components/vendor/require-css/normalize'

            # Libraries:
            'jquery':    'components/vendor/jquery/jquery'
            'iscroll':   'components/vendor/iscroll/build/iscroll'
            'View':      'components/utils/view'
            'PouchDB':   'components/vendor/pouchdb/dist/pouchdb-nightly'
            'd3':        'components/vendor/d3/d3'
            # 'View':      'components/vendor/view/src/view'

            # Utilities:
            'cascading-text-sheet':     'components/utils/cascading-text-sheet'
            'view+text':                'components/utils/view+text'

            # Library Views:
            'Library/ButtonView':           'components/views/ButtonView/ButtonView'
            'Library/ToggleButtonView':     'components/views/ToggleButtonView/ToggleButtonView'
            'Library/LabelView':            'components/views/LabelView/LabelView'
            'Library/ProgressBarView':      'components/views/ProgressBarView/ProgressBarView'
            'Library/InputView':            'components/views/InputView/InputView'
            'Library/ListView':             'components/views/ListView/ListView'
            'Library/NavigationView':      'components/views/NavigationView/NavigationView'
            #'Library/PickerView':          'components/views/PickerView/PickerView'
            #'Library/ModalPopupView':      'components/views/ModalPopupView/ModalPopupView'
            #'Library/BarNavigationView':   'components/views/BarNavigationView/BarNavigationView'
            #'Library/MessageBoxView':      'components/views/MessageBoxView/MessageBoxView'
            #'Library/DebugView':           'components/views/DebugView/DebugView'

            # App Specific:
            'KitchenSinkView': 'views/KitchenSinkView/KitchenSinkView'
            'MainView': 'views/MainView/MainView'
            'FriendsView': 'views/FriendsView/FriendsView'
            'DialerView': 'views/DialerView/DialerView'
            'CalculatorView': 'views/CalculatorView/CalculatorView'
            'FriendEntryView': 'views/FriendEntryView/FriendEntryView'
            'FriendEntryView1': 'views/FriendEntryView1/FriendEntryView1'
            'FriendEntryView2': 'views/FriendEntryView2/FriendEntryView2'
            'FriendEntryView3': 'views/FriendEntryView3/FriendEntryView3'
            'DebtCreateView': 'views/DebtCreateView/DebtCreateView'

        shim:
            'iscroll':
                exports: 'IScroll'

    # Kick off requirement chain:
    require [
        'domReady'
        'cascading-text-sheet'
        'View',
        ROOT_VIEW
        'jquery'
        # the following depencencies don't return handles
        'view+text'
    ], (onDomReady, Text, View, RootView, $) ->

        # Initialize l10n:
        Text.use TEXT_SHEET

        # Kick off the initial view loading chain by creating and explicitly
        # loading the root view as soon as the DOM is ready:
        onDomReady =>
            rootView = new RootView
                name: 'root'
            .setAsRootView()
