# FriendEntryView3
define [
    'jquery'
    'View'
    'cascading-text-sheet'
    'view+text' # for @getTextForKey
    'd3'
    'module'
], ($, View, Text, ViewTextExtension, d3, FriendEntryView3Module) ->
    τ = 2 * Math.PI
    sin = Math.sin
    cos = Math.cos
    atan2 = Math.atan2
    round = Math.round
    norm = (v) => (v.x ** 2 + v.y ** 2) ** 0.5
    #tauτ alphaα deltaΔ
    class FriendEntryView3 extends View

        constructor: (config) ->
            super config
            config = config or {}
            @bundle FriendEntryView3Module.id
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

            radius = 0
            spiral = d3.svg.line.radial()
                .interpolate("basis")
                .tension(0)
                .radius (α) -> radius + α/τ * 10
                .angle (α) => α + τ/4
            spiral2 = d3.svg.line.radial()
                .interpolate("basis")
                .tension(0)
                .radius (α) => 0
                .angle (α) => α + τ/4
            α = 0
            old_α = 0
            radiusLocked = no

            drag = d3.behavior.drag()
                .on 'dragstart', =>
                    radiusLocked = no
                    radius = 0
                    old_α = 0
                    α = 0
                .on 'dragend', =>
                    path
                        .transition()
                        .duration(1000)
                        .ease(d3.ease("ease-out"))
                        .attr d: spiral2

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

                        path.datum []
                        line.attr
                            x1: pos.x
                            y1: pos.y
                        tip.attr
                            cx: pos.x
                            cy: pos.y
                            r: 5
                    else
                        total = 5 * α / τ
                        angles = [0..total].map (i) => i*α / total
                        angles.push α
                        console.log angles
                        path.datum angles
                        spiralTip_radius = spiral.radius() α
                        spiralTip_pos =
                            x: cos(α) * spiralTip_radius
                            y: sin(α) * spiralTip_radius

                        line.attr
                            x1: spiralTip_pos.x
                            y1: spiralTip_pos.y
                        tip.attr
                            cx: spiralTip_pos.x
                            cy: spiralTip_pos.y
                            r: 5
                        amountTens = round(radius / width * 20 )
                        amountOnes = round(10*α / τ)
                        amount
                            .text (amountTens*10 + amountOnes)
                            .attr spiralTip_pos

                    path
                        .attr d: spiral

                    amountTens = round(radius / width * 20 )
                    amountOnes = round(10*α / τ)


                    @$('.label').html @text




            path = g.append 'path'
            line = g.append 'line'
                .attr x0:0, y0:0
            tip = g.append 'circle'
                .attr r:0
            amount = g.append 'text'

            svg.call drag








