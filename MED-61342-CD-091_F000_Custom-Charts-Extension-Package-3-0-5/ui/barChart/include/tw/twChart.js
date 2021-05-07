/** common javascripts for chart widget extensions **/

/** showEmptyChart for line and time series
 *
 * @param chartWidget the chart widget that calls showEmptyChart
 * @param chart the chart object defined within the chartWidget
 */

showEmptyChart = function (chartWidget, chart) {
    chartWidget.jqElement.find(".nv-area").hide(200);
    chartWidget.jqElement.find(".nv-linesWrap").hide(200);
    chartWidget.jqElement.find(".nv-bar").hide(200);
    chartWidget.jqElement.find(".nv-wrap text").hide(200);
    if(chartWidget.showInteractiveGuideline===true) {
        $('.xy-tooltip').hide(200);
    }
    if(chart.useInteractiveGuideline !== undefined) {
        chart.useInteractiveGuideline(false);
    }
    chartWidget.emptyChart = false;
};

renderChartHtml = function (chartWidget, chartType) {

    var chartTitleStyle = TW.getStyleFromStyleDefinition(chartWidget.getProperty('ChartTitleStyle', 'DefaultChartTitleStyle'));

    if (chartWidget.getProperty('ChartTitleStyle') !== undefined) {
        chartWidget.chartTitleTextSizeClass = TW.getTextSizeClassName(chartTitleStyle.textSize);
    }

    var html =
        '<div class="' + chartType + '-content widget-' + chartType +'" id="' + window.twHtmlUtilities.encodeHtml(chartWidget.jqElementId) +
            '"' + ' style="z-index:'+ window.twHtmlUtilities.encodeHtml(chartWidget.zIndex) +';" > ' +
            '<div class="chart-title ' + chartWidget.chartTitleTextSizeClass + '" id="' +
            window.twHtmlUtilities.encodeHtml(chartWidget.jqElementId) + '-title" style="text-align:' +
            (window.twHtmlUtilities.encodeHtml(chartWidget.titleAlignment) || 'center') + ';">' +
                '<span class="widget-chart-title-text" style="Margin: 0 1em 0 1em;">'+ window.twHtmlUtilities.encodeHtml(chartWidget.title) +
                '</span>' +
            '</div>' +
        '</div>';

        chartWidget.renderStyles();

    return html;
};

chartResize = function (chartWidget, chartId, isHidden){
    if ($(chartId).closest('.tabsv2-actual-tab-contents').css('display')==='block' && isHidden) {
        chartWidget.processDataset();
    }
    $(chartId).fadeIn(chartWidget.duration);
    return isHidden;
};

d3LibCheck = function () {
    // nvd3 requires custom watchTransition method which may get lost when new d3 library gets loaded from another extension.
    // Thus check for it and add if not present
    if (!d3.watchTransition) {
        TW.log.info('Current D3 version :' + d3.version)
        d3.selection.prototype.watchTransition = function(renderWatch){
            if(arguments.length > 0) {
                var args = [this].concat([].slice.call(arguments, 1));
                return renderWatch.transition.apply(renderWatch, args);
            }
        };
    } 
};
