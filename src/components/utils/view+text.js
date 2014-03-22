// View + text extension
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'View', 'cascading-text-sheet'], factory);
    } else {
        factory(jQuery, AppUI.View, CascadingTextSheet);
    }
}(function ($, View, Text) {

    // Returns an array with the path of Views and View Containers to the RootView
    View.prototype.getPathToRoot = function() {
        var view = this;
        var path = [];
        while (view) {
            path.push(view.constructor.name);
            path.push(view._name);
            view = view._parentView;
        }
        return path;
    };

    View.prototype.getTextForKey = function () {
        var self = this;
        var pathFromViewToRoot = self.getPathToRoot();

        for (var i = 0; i < arguments.length; i++) {
            pathFromViewToRoot.unshift(arguments[i]);
        }

        return Text.get(pathFromViewToRoot);
    };

    /*
    // Unused at the moment.
    View.prototype.onPostProcessDom = function () {
        var self = this,
            pathFromViewToRoot = self.getPathToRoot(),
            textNodes = self.m('[data-text-key]');

        if (self.m().is('[data-text-key]')) textNodes.push(self.m());

        textNodes.each(function () {
            var element = $(this);
            element.html(self.getTextForKey(element.attr('data-text-key')));
        });
    };
    */
}));
