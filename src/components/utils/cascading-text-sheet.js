(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        CascadingTextSheet = CascadingTextSheet || factory(jQuery);
    }
}(function ($) {

    var _file = '';
    var _cascadingTextTree = false;
    var _selectorKeyPathsByKey = {};

    var _initialize = function () {
        $.ajax({
            dataType: 'json',
            url: _file,
            async: false
        }).then(
            function(data) {
                _cascadingTextTree = data;

                // e.g.
                /*
                _cascadingTextTree = {
                    A: {
                        X: 'Text'
                        B: {
                            X: 'Text1'
                        },
                        C: {
                            Y: 'Text2'
                        }
                    },
                    C {
                        X: 'Text2'
                    },
                    Y: 'Text3'
                }
                */

                // Traverse tree and assemble a lookup table '_selectorKeyPathsByKey'
                // containing all absolute key paths for each unique key:
                (function depthFirstSearch(node, currentKeyPath) {
                    $.each(node, function (key, value) {
                        if (value.constructor === Object) {
                            currentKeyPath.unshift(key);
                            depthFirstSearch(value, currentKeyPath);
                            currentKeyPath.shift();
                        } else {
                            _selectorKeyPathsByKey[key] = _selectorKeyPathsByKey[key] || [];
                            _selectorKeyPathsByKey[key].push(currentKeyPath.slice(0));
                        }
                    });
                })(_cascadingTextTree, []);

                // e.g.
                /*
                _selectorKeyPathsByKey = {
                    X: [ [A], [B,A], [C] ],
                    Y: [ [C,A], [] ]
                }
                */
            },
            function(jqXHR, textStatus, errorThrown) {
                throw 'Error loading cascading text sheet file ' + _file + ': ' + textStatus;
            }
        );
    };

    return {
        use: function (file) {
            _cascadingTextTree = false;
            _selectorKeyPathsByKey = {};
            _file = file;
        },
        get: function (inputKeyPath) {
            if (!_cascadingTextTree) _initialize();

            // Find the best matching selector for the input key path:
            var inputKeyPath_clone = inputKeyPath.slice(0);
            var inputTextKey = inputKeyPath_clone.shift();
            var bestPath;
            var bestScore = -1;
            $.each(_selectorKeyPathsByKey[inputTextKey] || [], function (_i, selectorKeyPath) {
                var score = 0;
                var inputKeyPath_clone = inputKeyPath.slice(0);
                var selectorKeyPath_clone = selectorKeyPath.slice(0);
                while (inputKeyPath_clone.length){
                    score <<= 1;
                    if (inputKeyPath_clone.shift() === selectorKeyPath_clone[0]){
                        score++;
                        selectorKeyPath_clone.shift();
                    }
                }
                var found = (selectorKeyPath_clone.length === 0);
                /* uncomment to see debug infos
                +function(){
                    var path = selectorKeyPath.slice(0);
                    var node = _cascadingTextTree;
                    while (path.length){
                        node = node[path.pop()];
                    }
                    console.log('[' + inputTextKey + ',' + inputKeyPath + ']', found, node[inputTextKey],score);
                }();
                //*/
                if (found && score > bestScore){
                    bestScore = score;
                    bestPath = selectorKeyPath.slice(0);
                }
            });

            // Get the text by following the best matching key path:
            var node = _cascadingTextTree;

            if (!bestPath) {
                //console.log('[' + inputTextKey + ',' + inputKeyPath + '] not found');
                return undefined; // '*** ' + inputTextKey + ' not defined ***';
            }

            while (bestPath.length){
                node = node[bestPath.pop()];
            }

            return node[inputTextKey];
        }
    }
}));
