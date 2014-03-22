# Application Entry Point
# This is a module without any requirement.
define ->

    # Module id of the first view to be loaded as the root view:
    ROOT_VIEW = 'KitchenSinkView' # MainView

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
