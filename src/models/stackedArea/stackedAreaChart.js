var StackedAreaChartPrivates = {
    showControls : true
    , tooltips : true
    , tooltip : function(key, x, y) {
        return '<h3>' + key + '</h3>' +
            '<p>' +  y + ' on ' + x + '</p>'
    }
    , yAxisTickFormat : d3.format(',.2f')
    , defaultState : null
    , controlWidth : 250
    , cData : ['Stacked', 'Stream', 'Expanded']
    , xScale: null
    , yScale: null
    , interactive: null
    , useVoronoi: null
    , _useInteractiveGuideline : false
    , _rightAlignYAxis : false
    , _controlLabels : {}
    , _color : nv.utils.defaultColor() // a function that takes in d, i and returns color
    , _duration : 250
};

/**
 * A StackedAreaChart
 */
function StackedAreaChart(options){
    options = nv.utils.extend({}, options, StackedAreaChartPrivates, {
        margin: {top: 30, right: 25, bottom: 50, left: 60}
        , chartClass: 'stackedAreaChart'
        , wrapClass: 'stackedAreaChartWrap'
    });

    Chart.call(this, options);

    this.stacked = this.getStackedArea();
    this.controls = this.getLegend();
    this.interactiveLayer = this.getInteractiveGuideline();
    this.state = this.getStatesManager();

    this.yAxis().tickFormat = function(_) {
        if (!arguments.length) return this.yAxisTickFormat();
        this.yAxisTickFormat(_);
        return this.yAxis();
    }.bind(this);
    this.yAxis().setTickFormat = this.yAxis().tickFormat;
}

nv.utils.create(StackedAreaChart, Chart, StackedAreaChartPrivates);

StackedAreaChart.prototype.getStatesManager = function(){
    return nv.utils.state();
};

StackedAreaChart.prototype.getInteractiveGuideline = function(){
    return nv.interactiveGuideline();
};

StackedAreaChart.prototype.getLegend = function(){
    return nv.models.legend();
};

StackedAreaChart.prototype.getStackedArea = function(){
    return nv.models.stackedArea();
};

/**
 * @override Chart::wrapper
 */
StackedAreaChart.prototype.wrapper = function (data) {
    Chart.prototype.wrapper.call(this, data,
        ['nv-stackedWrap', 'nv-controlsWrap', 'nv-interactive']
    );
    this.xAxis()
        .orient('bottom')
        .tickPadding(7);
    this.yAxis()
        .orient((this.rightAlignYAxis()) ? 'right' : 'left');
    this.controls.updateState(false);
    if (this.showXAxis()) this.renderWatch.models(this.xAxis());
    if (this.showYAxis()) this.renderWatch.models(this.yAxis());
};

/**
 * @override Chart::draw
 */
StackedAreaChart.prototype.draw = function(data){

    var that = this,
        availableWidth = this.available.width,
        availableHeight = this.available.height;

    /*this.gEnter.append("rect")
        .style("opacity",0)
        .attr("width", availableWidth)
        .attr("height", availableHeight);*/

    this.xScale( this.stacked.xScale() );
    this.yScale( this.stacked.yScale() );
    this.x( this.stacked.x() );
    this.y( this.stacked.y() );

    if (this.showControls()) {
        var controlsData = [
            {
                key     : this.controlLabels().stacked || 'Stacked',
                metaKey : 'Stacked',
                disabled: this.stacked.style() != 'stack',
                style   : 'stack'
            },
            {
                key     : this.controlLabels().stream || 'Stream',
                metaKey : 'Stream',
                disabled: this.stacked.style() != 'stream',
                style   : 'stream'
            },
            {
                key     : this.controlLabels().expanded || 'Expanded',
                metaKey : 'Expanded',
                disabled: this.stacked.style() != 'expand',
                style   : 'expand'
            },
            {
                key     : this.controlLabels().stack_percent || 'Stack %',
                metaKey : 'Stack_Percent',
                disabled: this.stacked.style() != 'stack_percent',
                style   : 'stack_percent'
            }
        ];

        this.controlWidth( (this.cData().length/3) * 260 );

        controlsData = controlsData.filter(function(d) { return that.cData().indexOf(d.metaKey) !== -1 });

        this.controls
            .width( this.controlWidth() )
            .color(['#444', '#444', '#444']);

        this.g.select('.nv-controlsWrap')
            .datum(controlsData)
            .call(this.controls);

        if ( this.margin().top != Math.max(this.controls.height(), this.legend.height()) ) {
            this.margin().top = Math.max(this.controls.height(), this.legend.height());
            availableHeight = (this.height() || parseInt(this.svg.style('height')) || 400)
                - this.margin().top - this.margin().bottom;
        }

        this.g.select('.nv-controlsWrap')
            .attr('transform', 'translate(0,' + (-this.margin().top) +')');
    }

    //------------------------------------------------------------
    //Set up interactive layer
    if (this.useInteractiveGuideline()) {
        this.interactiveLayer
            .width(availableWidth)
            .height(availableHeight)
            .margin({left: this.margin().left, top: this.margin().top})
            .svgContainer(this.svg)
            .xScale(this.xScale());
        this.wrap.select(".nv-interactive").call(this.interactiveLayer);
    }

    this.stacked
        .margin({top: 0, right: 0, bottom: 0, left: 0})
        .width(availableWidth)
        .height(availableHeight);
    var stackedWrap = this.g.select('.nv-stackedWrap')
        .datum(data);
    stackedWrap.transition().call(this.stacked);

    if (this.showXAxis()) {
        this.xAxis()
            .scale(this.xScale())
            .ticks( availableWidth / 100 )
            .tickSize( -availableHeight, 0);

        this.g.select('.nv-x.nv-axis')
            .attr('transform', 'translate(0,' + availableHeight + ')')
            .transition().duration(0)
            .call(this.xAxis());
    }

    if (this.showYAxis()) {
        this.yAxis()
            .scale(this.yScale())
            .ticks(this.stacked.offset() == 'wiggle' ? 0 : availableHeight / 36)
            .tickSize(-availableWidth, 0)
            .setTickFormat(
                (this.stacked.style() == 'expand' || this.stacked.style() == 'stack_percent') ? d3.format('%') : this.yAxisTickFormat()
            );

        this.g.select('.nv-y.nv-axis')
            .transition().duration(0)
            .call(this.yAxis());
    }


    //Chart.prototype.draw.call(this, data);
};

/**
 * Set up listeners for dispatches fired on the underlying
 * multiBar graph.
 *
 * @override Chart::attachEvents
 */
StackedAreaChart.prototype.attachEvents = function(){
    Chart.prototype.attachEvents.call(this);

    var data = null;

    this.svg.call(function(selection){
        selection.each(function(d){
            data = d;
        })
    });

    var that = this;

    this.stacked.dispatch
        .on('areaClick.toggle', function(e) {
            if (data.filter(function(d) { return !d.disabled }).length === 1)
                data.forEach(function(d) { d.disabled = false });
            else
                data.forEach(function(d,i) { d.disabled = (i != e.seriesIndex) });
            that.state.disabled = data.map(function(d) { return !!d.disabled });
            that.dispatch.stateChange(that.state);
            that.update();
        });

    this.legend.dispatch.on('stateChange', function(newState) {
        that.state.disabled = newState.disabled;
        that.dispatch.stateChange(that.state);
        that.update();
    });

    this.controls.dispatch.on('legendClick', function(d) {
        if (!d.disabled)  return;
        that.controlsData( that.controlsData().map(function(s) { s.disabled = true; return s }) );
        d.disabled = false;
        that.stacked.style(d.style);
        that.state.style = that.stacked.style();
        that.dispatch.stateChange(that.state);
        that.update();
    });

    this.interactiveLayer.dispatch.on('elementMousemove', function(e) {
        that.stacked.clearHighlights();
        var singlePoint, pointIndex, pointXLocation, allData = [];
        data
            .filter(function(series, i) { series.seriesIndex = i; return !series.disabled })
            .forEach(function(series,i) {
                pointIndex = nv.interactiveBisect(series.values, e.pointXValue, that.x());
                that.stacked.highlightPoint(i, pointIndex, true);

                var point = series.values[pointIndex];
                if (typeof point === 'undefined') return;
                if (typeof singlePoint === 'undefined') singlePoint = point;
                if (typeof pointXLocation === 'undefined') pointXLocation = that.xScale()(that.x()(point,pointIndex));

                //If we are in 'expand' mode, use the stacked percent value instead of raw value.
                var tooltipValue = (that.stacked.style() == 'expand') ? point.display.y : that.y()(point,pointIndex);
                allData.push({
                    key: series.key,
                    value: tooltipValue,
                    color: that.color()(series,series.seriesIndex),
                    stackedValue: point.display
                });
            });

        allData.reverse();

        //Highlight the tooltip entry based on which stack the mouse is closest to.
        if (allData.length > 2) {
            var yValue = that.yScale().invert(e.mouseY);
            var yDistMax = Infinity, indexToHighlight = null;
            allData.forEach(function(series,i) {

                //To handle situation where the stacked area chart is negative, we need to use absolute values
                //when checking if the mouse Y value is within the stack area.
                yValue = Math.abs(yValue);
                var stackedY0 = Math.abs(series.stackedValue.y0);
                var stackedY = Math.abs(series.stackedValue.y);
                if ( yValue >= stackedY0 && yValue <= (stackedY + stackedY0)) {
                    indexToHighlight = i;
                    return;
                }
            });
            if (indexToHighlight != null)
                allData[indexToHighlight].highlight = true;
        }

        var xValue = that.xAxis().tickFormat()(that.x()(singlePoint,pointIndex));

        //If we are in 'expand' mode, force the format to be a percentage.
        var valueFormatter = (that.stacked.style() == 'expand') ?
            function(d) {return d3.format(".1%")(d);} :
            function(d) {return that.yAxis().tickFormat()(d); };
        that.interactiveLayer.tooltip
            .position({left: pointXLocation + that.margin().left, top: e.mouseY + that.margin().top})
            .chartContainer(that.parentNode)
            .enabled(that.tooltips())
            .valueFormatter(valueFormatter)
            .data(
            {
                value: xValue,
                series: allData
            }
        )();

        that.interactiveLayer.renderGuideLine(pointXLocation);
    });

    this.interactiveLayer.dispatch.on("elementMouseout",function() {
        that.dispatch.tooltipHide();
        that.stacked.clearHighlights();
    });

    this.dispatch
        .on('tooltipShow', function(e) {
            if (that.tooltips())
                that.showTooltip(e, that.parentNode);
        })
        .on('changeState', function(e) { // Update chart from a state object passed to event handler
            if (typeof e.disabled !== 'undefined' && data.length === e.disabled.length) {
                data.forEach(function(series,i) { series.disabled = e.disabled[i] });
                that.state.disabled = e.disabled;
            }
            if (typeof e.style !== 'undefined')
                that.stacked.style(e.style);
            that.update();
        });

    this.stacked.dispatch
        .on('tooltipShow', function(e) {
            //disable tooltips when value ~= 0
            //// TODO: consider removing points from voronoi that have 0 value instead of this hack
            /*
             if (!Math.round(stacked.y()(e.point) * 100)) {  // 100 will not be good for very small numbers... will have to think about making this valu dynamic, based on data range
             setTimeout(function() { d3.selectAll('.point.hover').classed('hover', false) }, 0);
             return false;
             }
             */

            e.pos = [e.pos[0] + that.margin().left, e.pos[1] + that.margin().top];
            that.dispatch.tooltipShow(e);
        })
        .on('tooltipHide', function(e) {
            that.dispatch.tooltipHide(e);
        });

    this.dispatch.on('tooltipHide', function() {
        if (that.tooltips()) nv.tooltip.cleanup();
    });

};

StackedAreaChart.prototype.showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = this.xAxis().tickFormat()(this.stacked.x()(e.point, e.pointIndex)),
        y = this.yAxis().tickFormat()(this.stacked.y()(e.point, e.pointIndex)),
        content = this.tooltip()(e.series.key, x, y);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
};

StackedAreaChart.prototype.color = function(_) {
    if (!arguments.length) return this._color();
    this._color(nv.utils.getColor(_));
    this.legend.color(this.color());
    this.stacked.color(this.color());
    return this;
};

StackedAreaChart.prototype.rightAlignYAxis = function(_) {
    if(!arguments.length) return this._rightAlignYAxis();
    this._rightAlignYAxis(_);
    this.yAxis().orient( (_) ? 'right' : 'left');
    return this;
};

StackedAreaChart.prototype.useInteractiveGuideline = function(_) {
    if(!arguments.length) return this._useInteractiveGuideline();
    this._useInteractiveGuideline(_);
    if (_ === true) {
        this.interactive(false);
        this.useVoronoi(false);
    }
    return this;
};
StackedAreaChart.prototype.tooltipContent = function(_) {
    if (!arguments.length) return this.tooltip();
    this.tooltip(_);
    return this;
};
StackedAreaChart.prototype.transitionDuration = function(_) {
    return this.duration(_);
};

StackedAreaChart.prototype.controlsData = function(_) {
    if (!arguments.length) return this.cData();
    this.cData(_);
    return this;
};

StackedAreaChart.prototype.controlLabels = function(_) {
    if (!arguments.length) return this._controlLabels();
    if (typeof _ !== 'object') return this._controlLabels();
    this._controlLabels(_);
    return this;
};

StackedAreaChart.prototype.duration = function(_) {
    if (!arguments.length) return this._duration();
    this._duration(_);
    this.renderWatch.reset(_);
    // stacked.duration(duration);
    this.xAxis().duration(_);
    this.yAxis().duration(_);
    return this;
};

/**
 * The stackedAreaChart model returns a function wrapping an instance of a StackedAreaChart.
 */
nv.models.stackedAreaChart = function() {
    "use strict";

    var stackedAreaChart = new StackedAreaChart();

    function chart(selection) {
        stackedAreaChart.render(selection);
        return chart;
    }

    chart.dispatch = stackedAreaChart.dispatch;
    chart.stacked = stackedAreaChart.stacked;
    chart.controls = stackedAreaChart.controls;
    chart.interactiveLayer =  stackedAreaChart.interactiveLayer;

    d3.rebind(chart, stackedAreaChart.stacked, 'x', 'y', 'size', 'xScale', 'yScale', 'xDomain', 'yDomain', 'xRange', 'yRange', 'sizeDomain',
        'interactive', 'useVoronoi', 'offset', 'order', 'style', 'clipEdge', 'forceX', 'forceY', 'forceSize', 'interpolate');

    chart.options = nv.utils.optionsFunc.bind(chart);

    nv.utils.rebindp(chart, stackedAreaChart, StackedAreaChart.prototype,
        'margin', 'width', 'height', 'state', 'defaultState', 'noData', 'showControls', 'showLegend', 'showXAxis',
        'showYAxis', 'tooltip', 'tooltips', 'color', 'rightAlignYAxis', 'useInteractiveGuideline', 'tooltipContent',
        'transitionDuration', 'controlsData', 'controlLabels', 'tickFormat', 'duration', 'xAxis', 'yAxis'
    );

    return chart;
};

