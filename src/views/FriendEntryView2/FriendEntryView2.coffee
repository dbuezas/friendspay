# FriendEntryView2
define [
    'jquery'
    'View'
    'cascading-text-sheet'
    'view+text' # for @getTextForKey
    'd3'
    'module'
], ($, View, Text, ViewTextExtension, d3, FriendEntryView2Module) ->
    τ = 2 * Math.PI
    sin = Math.sin
    cos = Math.cos
    atan2 = Math.atan2
    round = Math.round
    norm = (v) => (v.x ** 2 + v.y ** 2) ** 0.5
    class FriendEntryView2 extends View

        constructor: (config) ->
            super config
            config = config or {}
            @bundle FriendEntryView2Module.id
            @text = config.text

        viewDidLoad: ->
            window.d3=d3
            @$('.label').html @text
            width = @$().width()
            height = @$().height()
            svg = d3.select(@$('svg')[0]);
            svg.attr height: height
            origin = x:width / 2, y:height / 2
            g = svg.append 'g'
                .attr transform: "translate(" + d3.values(origin) + ")"

            arc = d3.svg.arc()

            radiusLocked = no
            radius = 50
            α = 0
            old_α = 0
            drag = d3.behavior.drag()
                .on 'dragstart', =>
                    radiusLocked = no
                    α = 0

                .on "drag", =>
                    pos =
                        x: d3.event.x - origin.x
                        y: d3.event.y - origin.y
                    new_α = (Math.atan2 pos.y, pos.x)

                    Δ = new_α - old_α
                    Δ += τ while Δ < -τ/2
                    Δ -= τ while Δ > τ/2

                    α = old_α + Δ
                    old_α = α
                    radiusLocked = yes if pos.y > 40

                    if not radiusLocked
                        radius = norm(pos)

                        path.datum
                            innerRadius: radius
                            outerRadius: radius
                            startAngle: 0
                            endAngle: τ
                        line.attr
                            x1: pos.x
                            y1: pos.y
                    else
                        path.datum
                            innerRadius: radius *.9
                            outerRadius: radius
                            startAngle: 0 + τ/4
                            endAngle: α + τ/4
                        line.attr
                            x1: cos(α) * radius
                            y1: sin(α) * radius
                    path.attr d: arc

                    amountTens = round(radius / width * 20 )
                    amountOnes = round(10*α / τ)
                    @$('.label').html @text + (amountTens*10 + amountOnes)




            path = g.append 'path'
            line = g.append 'line'
                .attr x0:0, y0:0
            tip = g.append 'circle'
                .attr r:0

            svg.call drag








