/*global Encoder,TW */

var TW_barChartIsExtension;

(function () {

    var addedDefaultChartStyles = false;

    TW.Runtime.Widgets.barChart = function () {
        var thisWidget = this,
            liveData,
            widgetProperties,
            widgetContainer,
            widgetContainerId,
            chartContainer,
            chartContainerId,
            chart,
            chartData,
            chartSeries = [],
            MAX_SERIES = 8,
            chartStyles = {},
            returnData = [],
            dataLabels = [],
            dataRows,
            dataRowsNum,
            clickedRowId,
            selectedRowIndices,
            chartTitleStyle,
            stackable = true,
            isResponsive = false,
            isInHiddenTab = false,
            isInHiddenBrowserTab,
            barLabels = [],
            resizeHandler,
            tooltipStyle,
            tooltipStyleId,
            customTooltipStyleName = '',
            xLabelMargin,
            globalWidgetSpecificBindings,
            sortedSeriesData = [],
            sortedSeriesLabel = [],
            sortedDataJSON = {},
            yLabelMargin;

        thisWidget.chartTitleTextSizeClass = 'textsize-normal';
        thisWidget.processing = false;
        thisWidget.singleDataSource = thisWidget.getProperty('SingleDataSource');
        thisWidget.nSeries = Math.min(MAX_SERIES, thisWidget.getProperty('NumberOfSeries'));
        thisWidget.title = TW.Runtime.convertLocalizableString(thisWidget.getProperty('ChartTitle'));
        thisWidget.titleAlignment = thisWidget.getProperty("ChartTitleAlignment");
        thisWidget.xAxisLabel = TW.Runtime.convertLocalizableString(thisWidget.getProperty('X-AxisLabel'));
        thisWidget.yAxisLabel = TW.Runtime.convertLocalizableString(thisWidget.getProperty('Y-AxisLabel'));
        thisWidget.xAxisField = thisWidget.getProperty('X-AxisField');
        thisWidget.labelField = thisWidget.getProperty('LabelField');
        thisWidget.labelDataSource = thisWidget.getProperty('LabelDataSource');
        thisWidget.showAxisLabels = thisWidget.getProperty('ShowAxisLabels');
        thisWidget.showXAxisLabels = Boolean(thisWidget.getProperty('ShowX-AxisLabels'));
        thisWidget.showYAxisLabels = Boolean(thisWidget.getProperty('ShowY-AxisLabels'));
        thisWidget.showZoomStrip = thisWidget.getProperty('ShowZoomStrip');
        thisWidget.useInteractiveGuideline = thisWidget.getProperty('UseInteractiveGuideline');
        thisWidget.showLegend = thisWidget.getProperty('ShowLegend');
        thisWidget.duration = thisWidget.getProperty('Duration');
        thisWidget.labelAngle = thisWidget.getProperty('LabelAngle')*-1;
        thisWidget.xAxisMinMaxVisible = Boolean(thisWidget.getProperty('ShowX-AxisMinMax'));
        thisWidget.yAxisMinimum = thisWidget.getProperty('Y-AxisMinimum')*1;
        thisWidget.yAxisMaximum = thisWidget.getProperty('Y-AxisMaximum')*1;
        thisWidget.autoScale = Boolean(thisWidget.getProperty('AutoScale'));
        thisWidget.enableHover = Boolean(thisWidget.getProperty('EnableHover'));
        thisWidget.showValues = Boolean(thisWidget.getProperty('ShowValues'));
        thisWidget.yAxisIntervals = thisWidget.getProperty('Y-AxisIntervals');
        thisWidget.xAxisIntervals = thisWidget.getProperty('X-AxisIntervals');
        thisWidget.precision = Math.max(thisWidget.getProperty('ShowValuesFormat'),0);
        thisWidget.yAxisMinMaxVisible = thisWidget.getProperty('ShowY-AxisMinMax');
        thisWidget.margins = thisWidget.getProperty('Margins');
        thisWidget.width = thisWidget.getProperty('Width');
        thisWidget.height = thisWidget.getProperty('Height');
        thisWidget.zIndex = thisWidget.getProperty('Z-index');
        thisWidget.selectedItems = [];
        thisWidget.enableSelection = true;
        thisWidget.truncateX = thisWidget.getProperty('TruncateX-AxisLabels');
        thisWidget.truncateY = thisWidget.getProperty('TruncateY-AxisLabels');
        thisWidget.emptyChart = false;

        d3LibCheck(); 

        (function () {
            var hidden = "hidden";
            // Standards:
            if (hidden in document) {
                document.addEventListener("visibilitychange", onchange);
            } else if ((hidden = "mozHidden") in document) {
                document.addEventListener("mozvisibilitychange", onchange);
            } else if ((hidden = "webkitHidden") in document) {
                document.addEventListener("webkitvisibilitychange", onchange);
            } else if ((hidden = "msHidden") in document) {
                document.addEventListener("msvisibilitychange", onchange);
            }

            function onchange(evt) {
                var v = "visible", h = "hidden",
                    evtMap = { focus: v,focusin: v,pageshow: v,blur: h,focusout: h,pagehide: h};
                evt = evt || window.event;
                document.body.classList.remove(v);
                document.body.classList.remove(h);
                if (evt.type in evtMap) {
                    document.body.classList.add(evtMap[evt.type]);
                    isInHiddenBrowserTab = evtMap[evt.type].charAt(0)==="h";
                } else {
                    document.body.classList.add(this[hidden] ? "hidden" : "visible");
                    isInHiddenBrowserTab = this[hidden];
                }
            }

            // set the initial state (but only if browser supports the Page Visibility API)
            if (document[hidden] !== undefined) {
                onchange({type: document[hidden] ? "blur" : "focus"});
            }
        })();

        /** Runtime Properties which are used for further processing
         * these properties are widget scope related and will be used by architecture flow 
         * for reflecting changes.
         */
        this.runtimeProperties = function () {
            return {
                'needsDataLoadingAndError': true
            };
        };

        /**
         * Below function is called first to create the UI of widget it
         * is called inside the thingworx.runtime.widget.js --> createBoundingBox function when the
         * first call is made.
         */

        this.renderHtml = function () {
            return renderChartHtml(thisWidget, "barChart");
        };

        /**
         * Below function is invoked inside the 
         * appendTo function of thingworx.runtime.widget file
         * after the above function renderHTML is called.
         * It will do the further processing like applying styles. Its invocation will happen
         * if present inside the widget file ....
         */
        this.renderStyles = function () {

            var formatResult = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartBodyStyle', 'DefaultChartStyle'));
            chartTitleStyle = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartTitleStyle', 'DefaultChartTitleStyle'));
            var chartAxisStyle = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartAxisStyle', 'DefaultChartAxisStyle'));
            var tooltipStyleDef = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartTooltipStyle', 'DefaultTooltipStyle'));

            var chartTitleStyleBG = TW.getStyleCssGradientFromStyle(chartTitleStyle);
            var chartTitleStyleText = TW.getStyleCssTextualNoBackgroundFromStyle(chartTitleStyle);
            var chartBackground = TW.getStyleCssGradientFromStyle(formatResult);
            var chartBorder = TW.getStyleCssBorderFromStyle(formatResult);
            var chartAxisStyleText = TW.getStyleCssTextualNoBackgroundFromStyle(chartAxisStyle);
            tooltipStyle = TW.getStyleCssTextualFromStyle(tooltipStyleDef) + TW.getStyleCssBorderFromStyle(tooltipStyleDef);
            // chart series lines are stroked in color in svg processing, not in css
            var chartCssInfo = TW.getStyleCssTextualNoBackgroundFromStyle(formatResult);
            var chartLineInfo = TW.getStyleCssBorderFromStyle(chartAxisStyle);
            var chartStyle1 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle1','DefaultChartStyle1'));
            var chartStyle2 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle2','DefaultChartStyle2'));
            var chartStyle3 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle3','DefaultChartStyle3'));
            var chartStyle4 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle4','DefaultChartStyle4'));
            var chartStyle5 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle5','DefaultChartStyle5'));
            var chartStyle6 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle6','DefaultChartStyle6'));
            var chartStyle7 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle7','DefaultChartStyle7'));
            var chartStyle8 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle8','DefaultChartStyle8'));
            chartStyles.series1 = chartStyle1.foregroundColor;
            chartStyles.series2 = chartStyle2.foregroundColor;
            chartStyles.series3 = chartStyle3.foregroundColor;
            chartStyles.series4 = chartStyle4.foregroundColor;
            chartStyles.series5 = chartStyle5.foregroundColor;
            chartStyles.series6 = chartStyle6.foregroundColor;
            chartStyles.series7 = chartStyle7.foregroundColor;
            chartStyles.series8 = chartStyle8.foregroundColor;

            var styleBlock = '';
            // styles used to locate axis labels that need tooltips

            // for d3 style assignments
            chartStyles.text = chartCssInfo.split(';')[0].split(':')[1];
            chartStyles.gridStyle = chartLineInfo.split(';')[1].split(':')[1];
            chartStyles.axisFontWeight = chartAxisStyleText.split(';')[0].split(':')[1];

            //regular widget styles
            if (thisWidget.getProperty('ChartBodyStyle', 'DefaultChartStyle') === 'DefaultChartStyle'
                && thisWidget.getProperty('ChartTitleStyle', 'DefaultChartTitleStyle') === 'DefaultChartTitleStyle'
                && thisWidget.getProperty('ChartAxisStyle', 'DefaultChartAxisStyle') === 'DefaultChartAxisStyle'
                && thisWidget.getProperty('ChartTooltipStyle', 'DefaultTooltipStyle') === 'DefaultTooltipStyle') {
                if (!addedDefaultChartStyles) {
                    addedDefaultChartStyles = true;
                    var defaultStyles = '.chart-title {' + chartTitleStyleBG + ' ' + chartTitleStyleText + ' }' +
                        ' .widget-barChart {' + chartBackground +' '+ chartBorder +' }' +
                        ' .nv-axis {' + chartAxisStyleText + '}' +
                        ' .widget-barChart-tooltipStyle {' + tooltipStyle + '}' ;
                    $.rule(defaultStyles).appendTo(TW.Runtime.globalWidgetStyleEl);
                }
            } else {
                customTooltipStyleName = "-qtip-" + thisWidget.jqElementId;
                // add custom chart title style
                styleBlock += '#' + thisWidget.jqElementId + ' .chart-title { ' + chartTitleStyleBG + ' } ' +
                    ' #' + thisWidget.jqElementId + ' .widget-chart-title-text { ' + chartTitleStyleText + ' }' +
                    ' #' + thisWidget.jqElementId + '.widget-barChart {' + chartBackground + chartBorder + '}' +
                    ' #' + thisWidget.jqElementId + ' .nv-axis {' + chartAxisStyleText + '}' +
                    ' .widget-barChart-tooltipStyle' + customTooltipStyleName + '{' + tooltipStyle + '}';
            }
            return styleBlock;

        };

        /**
         * Below function is invoked inside the 
         * appendTo function of thingworx.runtime.widget file
         * after the above function renderHTML is called.
         * It will do the further processing like applying further styles  (if renderStyle function is not present)
         * or changing (appending) some 
         * HTML structure already defined inside the renderHTML.
         */
        this.afterRender = function () {
            widgetProperties = thisWidget.properties;
            widgetContainer = thisWidget.jqElementId;
            widgetContainerId = '#' + widgetContainer;
            chartContainer = widgetContainer + '-chart';
            chartContainerId = '#' + chartContainer;

            widgetSelector = widgetContainer + ' .-element';
            // add svg tag to html element required to inject chart
            $('<svg id="' + chartContainer + '" ></svg>').appendTo(widgetContainerId);

            // styles
            var chartTitleElement = $(widgetContainerId).find('.chart-title');
            chartTitleElement.switchClass('textsize-normal', thisWidget.chartTitleTextSizeClass);

            // events
            $(widgetSelector).on('focus', function () {
                $(widgetContainer).addClass('focus');
            });

            $(widgetSelector).on('blur', function (e) {
                $(widgetContainer).removeClass('focus');
            });

            thisWidget.jqElement.dblclick(thisWidget.dblClickHandler);

            // required to delegate click event after controls are drawn
            thisWidget.jqElement.on('click', ('.nv-legend'), function (e) {
                thisWidget.jqElement.triggerHandler('DoubleClicked');
                e.preventDefault();
                thisWidget.updateTruncation();
            });

            if (thisWidget.properties.ResponsiveLayout) {
                isResponsive = true;
                $(widgetContainerId + '-bounding-box').height('100%').width('100%');  // root_barChart-30-bounding-box : 100/100
                $(widgetContainerId + '-bounding-box').css('overflow','hidden');
                $(widgetContainerId).height("100%").width("100%");  // root_barChart-30 : 100/100
                $(chartContainerId).height("100%").width("100%"); // #root_barChart-30 100/100
                $(widgetContainerId).css('overflow','hidden');
            } else {
                $(chartContainerId).width(thisWidget.width + 20);
                $(chartContainerId).height(thisWidget.height - 22);
            }

            $(widgetContainerId + '-bounding-box').css('z-index',thisWidget.zIndex);
            
            // get unbound dataLabel strings
            for (var i = 1; i < thisWidget.nSeries + 1; i++) {
                var dataLabel = widgetProperties['DataLabel' + i];
                if (dataLabel !== undefined && dataLabel !== '') {
                    dataLabels.push(dataLabel);
                } else {
                    dataLabels.push("Series " + i);
                }
            }

            dataLabels = this.forceUniqueValues(dataLabels);

            $(window).on('resize', _.debounce(thisWidget.processDataset, 300));
            this.gatherDataBindings();
        };

        /**
         * Below function is used to gather the bindings which are specific 
         * to a barChart widget Id. And will behave as a helper for tracking the bindings
         * present inside the widget.
         */

        this.gatherDataBindings = () => {
            let allDataBindings = this.mashup.DataBindings;
            let widgetSpecificBindings = [];
            allDataBindings.forEach(ele => {
                if (ele.TargetId === this.idOfThisElement) {
                    widgetSpecificBindings.push(ele);
                }
            });
            globalWidgetSpecificBindings = widgetSpecificBindings;
        };

        /**
         * This function cycle starts from thingworx.runtime.widget.js function (updateStandardProperty)
         * which is invoked inside the thingworx.datamager.controller.js file when iterated
         * over all the databindings present inside the UI.
         */
        this.updateProperty = function (updatePropertyInfo) {
            // globalWidgetSpecificBindings is used as a baseCase for the recursion used to sort the properties ...
            if (globalWidgetSpecificBindings.length > 0) {
                if (updatePropertyInfo.TargetProperty.indexOf('DataLabel') === 0) {
                    sortedSeriesLabel[Number(updatePropertyInfo.TargetProperty.substr(-1))] = updatePropertyInfo;
                    sortedDataJSON.Labels = sortedSeriesLabel;
                } else if (updatePropertyInfo.TargetProperty === "Data" || updatePropertyInfo.TargetProperty.indexOf('DataSource') === 0) {
                    if (updatePropertyInfo.TargetProperty === "Data") {
                        sortedSeriesData[0] = updatePropertyInfo;
                    } else if (updatePropertyInfo.TargetProperty.indexOf('DataSource') === 0) {
                        sortedSeriesData[Number(updatePropertyInfo.TargetProperty.substr(-1))] = updatePropertyInfo;
                    }
                    sortedDataJSON.Data = sortedSeriesData;
                } else {
                    sortedDataJSON[updatePropertyInfo.TargetProperty] = updatePropertyInfo;
                }
            }
            globalWidgetSpecificBindings.pop();

            if (globalWidgetSpecificBindings.length === 0) {
                if (updatePropertyInfo.SinglePropertyValue !== undefined || updatePropertyInfo.SinglePropertyValue !== '') {
                    sortedDataJSON[updatePropertyInfo.TargetProperty] = updatePropertyInfo;
                }
                this.extractData();
            }
        };

        /**
         * The below function will help to make the 
         * input data friendly for the afterUpdatePropertyInvoked function.
         */
        this.extractData = () => {
            Object.keys(sortedDataJSON).forEach(key => {
                let keyArray = [];
                if (key === 'Data') {
                    if (!Array.isArray(sortedDataJSON.Data)) {
                        keyArray.push(sortedDataJSON.Data);
                    } else { 
                        keyArray = sortedDataJSON.Data;
                    }
                    this.afterUpdatePropertyInvoked(keyArray.filter((v,i,a) => {return v !== undefined;}));
                } else if (key === 'Labels') {
                    if (!Array.isArray(sortedDataJSON.Labels)) {
                        keyArray.push(sortedDataJSON.Labels);
                    } else { 
                        keyArray = sortedDataJSON.Labels;
                    }
                    keyArray = sortedDataJSON.Labels;
                    this.afterUpdatePropertyInvoked(keyArray.filter((v,i,a) => {return v !== undefined;}));
                } else {
                    keyArray.push(sortedDataJSON[key]);
                    this.afterUpdatePropertyInvoked(keyArray);
                }
            });
            sortedDataJSON = {};
        };

        /**
         * @param dataArray // it is the array of updatePropertyInfo JSON.
         * In this function data is created and added inside the chartSeries global and local variable
         * in order to make them useful for further used cases.
         */

        this.afterUpdatePropertyInvoked = (dataArray) => {
            dataArray.forEach(updatePropertyInfo => {
                var thisWidget = this;
                var widgetProperties = thisWidget.properties;
                var seriesNumber;
                var nSeries = thisWidget.nSeries;
                dataRows = updatePropertyInfo.ActualDataRows;

                if (updatePropertyInfo.TargetProperty === "ChartTitle") {
                    var updatedTitle = updatePropertyInfo.RawSinglePropertyValue;
                    thisWidget.setProperty('ChartTitle', updatedTitle);
                    thisWidget.title = updatedTitle;
                    $('#' + thisWidget.jqElementId + '-title').text(updatedTitle);
                    return;
                }
    
                if (updatePropertyInfo.TargetProperty === "Y-AxisMinimum") {
                    thisWidget.yAxisMinimum = updatePropertyInfo.RawSinglePropertyValue;
                    if(chart !== undefined && thisWidget.autoScale === false && thisWidget.yAxisMinimum < thisWidget.yAxisMaximum) {
                        chart.forceY([thisWidget.yAxisMinimum, thisWidget.yAxisMaximum]);
                    }
                    return;
                }
    
                if (updatePropertyInfo.TargetProperty === "Y-AxisMaximum") {
                    thisWidget.yAxisMaximum = updatePropertyInfo.RawSinglePropertyValue;
                    if(chart !== undefined && thisWidget.autoScale === false && thisWidget.yAxisMinimum < thisWidget.yAxisMaximum) {
                        chart.forceY([thisWidget.yAxisMinimum, thisWidget.yAxisMaximum]);
                    }
                    return;
                }
    
                // in progress: for binding dataLabel
                if (updatePropertyInfo.TargetProperty.indexOf('DataLabel') === 0 && !isInHiddenBrowserTab && thisWidget.processing === false) {
                    for (seriesNumber = 1; seriesNumber <= nSeries; seriesNumber++) {
                        labelName = 'DataLabel' + seriesNumber.toString();
                        if (updatePropertyInfo.TargetProperty === labelName) {
                            thisWidget.setProperty(labelName, updatePropertyInfo.RawSinglePropertyValue);
                            // replace the dataLabel by position in array dataLabels
                            dataLabels[seriesNumber-1] = thisWidget.getProperty(labelName);
                            dataLabels = this.forceUniqueValues(dataLabels);
                            liveData[seriesNumber-1].key = dataLabels[seriesNumber-1];
                        }
                    }
                }
                // if this is in a inactive tab or similar we must prevent rendering until tab gets clicked
                if(isResponsive && $(widgetContainerId).closest('.tabsv2-actual-tab-contents').css('display')==='none') {
                    isInHiddenTab = true;
                    $(chartContainerId).hide();
                }else{
                    isInHiddenTab = false;
                    $(chartContainerId).fadeIn(thisWidget.duration);
                }
                if (updatePropertyInfo.TargetProperty.indexOf('Data') === 0 && !isInHiddenBrowserTab && thisWidget.processing === false) {

                    if(dataRowsNum === undefined && stackable === true) {
                        dataRowsNum = dataRows.length;
                    }else{
                        stackable = dataRowsNum === dataRows.length;
                    }
    
                    // iterate through the series fields
                    if (updatePropertyInfo.TargetProperty === "Data") {
                        chartSeries = [];
                        for (seriesNumber = 1; seriesNumber <= nSeries; seriesNumber++) {
    
                            var dataField = widgetProperties['DataField' + seriesNumber];
    
                            if (dataField !== undefined && dataField !== '' && dataRows != undefined) {
    
                                var seriesType = widgetProperties['SeriesType' + seriesNumber];
    
                                if (seriesType == 'chart' || seriesType === undefined || seriesType == null) {
                                    seriesType = widgetProperties['ChartType'];
                                }
    
                                this.enableSelection = widgetProperties['AllowSelection'];
    
                                //var seriesmarkerType = widgetProperties['SeriesMarkerType' + seriesNumber];
                                //if (seriesmarkerType === undefined || seriesmarkerType == 'chart')
                                //   seriesmarkerType = widgetProperties['MarkerType'];
    
                                var seriesDefinition = {
                                    dataSource: updatePropertyInfo.TargetProperty,
                                    type: seriesType,
                                    field: dataField,
                                    data: dataRows,
                                    label: TW.Runtime.convertLocalizableString(this.getProperty('DataLabel' + seriesNumber)),
                                    style: widgetProperties['SeriesStyle' + seriesNumber]
                                };
    
                                chartSeries.push(seriesDefinition);
                            }
                        }
                    } else if (updatePropertyInfo.TargetProperty.indexOf('DataSource') === 0) {
                        // multiple datasource handling
                        if (dataRows.length > 0 && !thisWidget.singleDataSource) {
    
                            dataRowsNum === undefined ? dataRowsNum = dataRows.length : stackable = dataRowsNum === dataRows.length;
                            
                            // each data load resets the purge timeout
                            // so we only purge after final data load in case some dataSources were deselected
                            // clearTimeout(purge);
                            // purge = setTimeout(function(){purgeDataSources(dataSourceId)}, 300);
                            var dataSourceName = updatePropertyInfo.TargetProperty;
    
                            //check if targetProperty is a dataSource already displayed
                            var newSeries = true;
    
                            var dataSourceId = dataSourceName.substr(dataSourceName.length - 1, 1);
                            for (var i = 0; i < chartSeries.length; i++) {
                                if (chartSeries[i].dataSource === updatePropertyInfo.TargetProperty || dataSourceId > nSeries) {
                                    newSeries = false;
                                }
                            }
    
                            var dataField = widgetProperties['DataField' + dataSourceId];
    
                            var seriesDefinition = {
                                dataSource: dataSourceName,
                                id: dataSourceId,
                                field: dataField,
                                data: dataRows,
                                label: TW.Runtime.convertLocalizableString(this.getProperty('DataLabel' + dataSourceId)),
                                style: widgetProperties['SeriesStyle' + dataSourceId]
                            };
                            // if existing dataSource update, update
                            if (newSeries === false) {
                                chartSeries.splice(dataSourceId - 1, 1, seriesDefinition);
                            }
    
                            // if new dataSource, add
                            if (newSeries === true) {
                                chartSeries.push(seriesDefinition);
                            }
    
                            // if max series already displayed, drop FIFO
                            if (chartSeries.length > nSeries) {
                                chartSeries.shift();
                            }
                        }
                    }
                    this.processDataset(chartSeries);
                }
    
                if(thisWidget.enableSelection) {
    
                    var selectedRowIndices = updatePropertyInfo.SelectedRowIndices;
    
                    if (selectedRowIndices !== undefined) {
                        //this is chart updating selection flags to match grid row
                        //TW.ChartLibrary.handleChartSelectionUpdate(this, this.chart, updatePropertyInfo.TargetProperty, selectedRowIndices);
                    }
                    else {
                        TW.ChartLibrary.handleChartSelectionUpdate(this, this.chart, updatePropertyInfo.TargetProperty, new Array());
                    }
                }
            });
        };

        /** Below function is not invoked any where. Just a skeleton */
        function purgeDataSources(dataSourceId){
            if(chartSeries.length > dataSourceId) {
                chartSeries.splice(dataSourceId, (chartSeries.length - dataSourceId));
                if(! isInHiddenTab) {
                    liveData = this.processDataset();
                }
            }
        }

        /** Below function is used to create the data friendly for render function.*/

        this.processDataset = function () {
            var nRows = 0, i,
            // the field selected to supply data in the series
            seriesFieldName,
            // the field providing labels along the x-axis
            xAxisField,
            nSeries = thisWidget.nSeries,
            dataSources = [],
            singleDataSource = thisWidget.singleDataSource,
            returnData = [],
            nSeriesToProcess = singleDataSource ? nSeries : chartSeries.length;
            thisWidget.processing = true;
            barLabels = [];
            nSeriesToProcess === 1 ? thisWidget.barType = 'discrete' : thisWidget.barType = 'multi';

            // get a list of actual data sources associated with series
            if(!singleDataSource && thisWidget.labelDataSource !== undefined){
                for(i = 0; i < thisWidget.labelDataSource.length; i++){
                    dataSources.push(thisWidget.labelDataSource[i].value)
                }
            }

            for (i = 0; i < nSeriesToProcess; i++) {
                var dataSource = chartSeries[i];
                var data;

                xAxisField = singleDataSource ? thisWidget.xAxisField : thisWidget['xAxisField' + chartSeries[i].id];
                
                if(dataSource !== undefined) {
                    seriesFieldName = dataSource.field;
                    data = dataSource.data;
                }else{
                    var message = "All series must have a " + ( singleDataSource ? "DataField" : "DataSource")+" set";
                    TW.log.error(message);
                    return;
                }

                if (seriesFieldName !== undefined && seriesFieldName != "") {
                    var barLabel = "",
                    seriesValue,
                    seriesValues = [],
                    obj,
                    offset;
                    nRows = data.length;

                    // if 0 rows return from service but chart already drawn from previous rows, we need to clear chart
                    if (nRows === 0) {
                        seriesData = {
                            'values': [],
                            'key': TW.Runtime.convertLocalizableString(dataLabels[0]),
                            'color': chartStyles['series' + (i + 1)]
                        };
                        returnData.push(seriesData);

                    } else {
                        thisWidget.jqElement.find(".nv-bar").show();
                        thisWidget.jqElement.find(".nv-wrap text").show();
                        $('.xy-tooltip').show();

                        for (var rowid = 0; rowid < nRows; rowid++) {
                            if (offset === undefined) {
                                offset = Math.max(1, rowid);
                            }
                            var row = data[rowid];

                            if (row[seriesFieldName] !== undefined && row[seriesFieldName] !== '') {
                                seriesValue = row[seriesFieldName];
                            } else {
                                TW.log.warn("undefined or empty seriesValue forced to 0");
                                seriesValue = 0;
                            }

                            if (thisWidget.labelField !== "" && thisWidget.labelField !== undefined) {
                                if (thisWidget.labelDataSource === chartSeries[i].dataSource) {
                                    barLabel = row[thisWidget.labelField];
                                    barLabels.push(barLabel);
                                }
                            } else if (xAxisField !== undefined && row[xAxisField] !== undefined && row[xAxisField] !== '') {
                                barLabel = row[xAxisField];
                                barLabels.push(barLabel);
                            } else {
                                barLabel = rowid + offset;
                                barLabels.push(barLabel);
                            }

                            // for series this only pushes per group not per record

                            obj = {"x": rowid + offset, "y": seriesValue};
                            seriesValues.push(obj);
                        }

                        var seriesData = {
                            'values': seriesValues,
                            // key should be label prop w fallback to dataSourceName
                            'key': TW.Runtime.convertLocalizableString(dataLabels[i]),
                            'color': chartStyles['series' + (i + 1)]
                        };

                        returnData.push(seriesData);
                    }
                }
            }
            if (returnData.length > 0 && !isInHiddenTab) {
                if(chartData){
                    $(chartContainerId).show();
                    thisWidget.update(returnData);
                }else {
                    thisWidget.render(returnData);
                }
                thisWidget.processing = false;
                return returnData;
            }
        };

        this.resize = function(width,height) {
            isInHiddenTab = chartResize(thisWidget, widgetContainerId, isInHiddenTab);
        };

        /** A library based call to create the chart UI inside the mashup and is being
         * invoked inside the this.processDataset function. See above.
         */
        this.render = function (data, isUpdate) {
            var propMargin = thisWidget.margins.split(',');
            xLabelMargin = (isResponsive ? 42 : 42) + propMargin[2] * 1;
            yLabelMargin = 21 + propMargin[1] * 1;
            var legendMargin = 21 + propMargin[0] * 1;
            var showLegend = thisWidget.showLegend === true && thisWidget.nSeries > 1;
            var chartTemplate = "discreteBarChart";

            // this will create an empty data
            if (data === undefined) {
                showEmptyChart(thisWidget, chart);
            }

            if (thisWidget.showAxisLabels === true) {
                xLabelMargin += isResponsive ? 21 : 7;
            }

            if (thisWidget.showYAxisLabels === true) {
                yLabelMargin += 50; //ideally use actual values width
            }

            if (thisWidget.showXAxisLabels === true) {
                yLabelMargin += isResponsive ? 0 : 0;
                xLabelMargin += isResponsive ? 21 : 14;
            }

            // add margin if legend displayed
            if (thisWidget.showLegend === true) {
                legendMargin += 7;
            }

            if (isUpdate !== undefined && isUpdate === true) {
                chartData.datum(data).transition().duration(thisWidget.duration).call(chart);
                if (!resizeHandler) {
                    resizeHandler = nv.utils.windowResize(chart.update);
                }
            } else {
                nv.addGraph(function () {
                    if (thisWidget.nSeries && thisWidget.showValues) {
                        chart = nv.models.discreteBarChart();
                        // unsupported option that would otherwise be expected here
                        //chart.showLegend(false);
                        chart.showValues(thisWidget.showValues);
                        chart.valueFormat(d3.format(',.' + thisWidget.precision + 'f'));
                        chart.color([chartStyles.series1]);
                    } else {
                        chartTemplate = "multiBarChart";
                        chart = nv.models.multiBarChart();
                        chart.reduceXTicks(thisWidget.xAxisIntervals === 'auto');
                        chart.groupSpacing(0.1);
                        if (chartSeries.length === 1) {
                            chart.showXAxisLabels = (thisWidget.showAxisLabels);
                            chart.color([chartStyles.series1]);
                            chart.showLegend(false);
                            stackable = false;
                        } else {
                            chart.showLegend(thisWidget.showLegend);
                        }
                    }
                    chart.rotateLabels(thisWidget.labelAngle);
                    chart.tooltip.enabled(thisWidget.enableHover);

                    chart.options = nv.utils.optionsFunc.bind(chart);
                    chart.xAxis.tickFormat(d3.format(','))
                        .showMaxMin(false)//(!!thisWidget.xAxisMinMaxVisible)
                        .ticks(chart.xAxis.ticks(data[0].values.length))
                        .tickFormat(function (d) {
                            return barLabels[d - 1]
                        })
                        .tickPadding(15);
                    chart.showXAxisLabels = thisWidget.showXAxisLabels;
                    chart.duration(thisWidget.duration);

                    chart.yAxis.tickFormat(d3.format('.02f'))
                        .showMaxMin(!!thisWidget.yAxisMinMaxVisible);
                    thisWidget.yAxisIntervals === "per" ? chart.yAxis.ticks(data[0].values.length) : chart.yAxis.ticks();
                    // set the y scale to user settings
                    if (thisWidget.autoScale === false && thisWidget.yAxisMinimum !== '') {

                        if (thisWidget.yAxisMaximum > thisWidget.yAxisMinimum) {
                            chart.forceY([thisWidget.yAxisMinimum, thisWidget.yAxisMaximum]);
                        }
                        else {
                            chart.forceY(thisWidget.yAxisMinimum);
                        }
                    }

                    chart.showXAxis(thisWidget.showXAxisLabels);
                    chart.showYAxis(thisWidget.showYAxisLabels);

                    if (thisWidget.showAxisLabels === true) {
                        if (chartTemplate === "multiBarChart") {
                            chart.xAxis.axisLabel(thisWidget.xAxisLabel);
                        }
                        chart.yAxis.axisLabel(thisWidget.yAxisLabel);
                    }

                    chart.margin({top: legendMargin+(propMargin[0]*1), left: yLabelMargin, bottom: xLabelMargin, right: 40+(propMargin[3]*1)});

                    if(chartTemplate==="discreteBarChart" && thisWidget.showAxisLabels) {
                        d3.select(chartContainerId).append("text")
                            .attr("x", $(chartContainerId).width() / 2)
                            .attr("y", $(chartContainerId).height() -28)
                            .attr("class", "nv-axislabel")
                            .style("text-anchor", "middle")
                            .text(thisWidget.xAxisLabel);
                    }

                    // override default tooltip in interactive layer
                    if(thisWidget.enableHover) {
                        chart.tooltip.contentGenerator(function (d) {
                            return thisWidget.tooltipGenerator(d)
                        });
                    }
                    chartData = d3.select(widgetContainerId+'-chart')
                        .datum(data)
                        .call(chart);

                    // hide controls for managing series stacking when only one series shown
                    if(!stackable){
                        $(widgetContainerId).find('.nv-controlsWrap').css('display', 'none');
                    }
                    // on initial render of chart
                    thisWidget.updateTruncation();
                });
            }
        };

        this.update = function (data){
            // Update the SVG with the new data and call chart

            /* when there are no rows we need to figure out if the chart should do one of the following:
            ** 1 if single series, show an empty chart gracefully (more on what that means... )
            *  2 if multi series and this is the first one empty, keep paying attention in case they are all empty
            *  3 if at least one series has data, skip over the empty ones but keep track of wheich ones have data
            */

            thisWidget.emptyChart = true;

            for (var i = 0; i < data.length; i++) {
                if (data[i].values.length > 0) {
                    thisWidget.emptyChart = false;
                    break;
                }
            }
            if(thisWidget.emptyChart === true) {
                // we have an empty single series chart
                showEmptyChart(thisWidget, chart);
            } else {
                chartData.datum(data).transition().duration(500).call(chart);
                thisWidget.updateTruncation();
                if (!resizeHandler) {
                    resizeHandler = nv.utils.windowResize(chart.update);
                }
            }
        };

        this.updateTruncation = function() {

            d3.selectAll(widgetContainerId + '-chart text')
                .style("fill", chartStyles.text)
                .style("font-weight",chartStyles.axisFontWeight);
            d3.selectAll(widgetContainerId + '-chart line')
                .style("stroke", chartStyles.gridStyle);
            //Destroy qtips attached with the chart's text elements so that old qtip gets removed everytime when service is triggered
            d3.selectAll(widgetContainerId + '-chart .nv-x .nv-axis .tick text, ' + widgetContainerId + '-chart .nv-y .nv-axis .tick text, nv-axisMaxMin-y text, ' + widgetContainerId + '-chart .nv-axisMaxMin text')
                .each(function() {
                    $(this).qtip('destroy', true);
            });

            if (thisWidget.truncateX !== 0) {
                d3.selectAll(widgetContainerId + '-chart .nv-x .nv-axis .tick text')
                    .each(function (i) {
                        var tick = d3.select(this);
                        var fullText = tick.text();
                        var truncText = fullText;
                        var doTruncation = false;
                        // standard truncation with ellipses
                        if (fullText.length > thisWidget.truncateX) {
                            truncText = fullText.substring(0, thisWidget.truncateX) + '...';
                            doTruncation = true;
                        }
                        // preceding truncation with ellipses
                        if (thisWidget.truncateX < 0){
                            truncText = '...' + fullText.substring(Math.abs(thisWidget.truncateX), fullText.length);
                            doTruncation = true;
                        }
                        if(doTruncation === true) {
                            tick.text(truncText);
                            tick
                                .append("svg:title")
                                .text(fullText)
                        }
                });
            }

            if (thisWidget.truncateY !== 0) {
                d3.selectAll( widgetContainerId +'-chart .nv-y .nv-axis .tick text, nv-axisMaxMin-y text, ' + widgetContainerId + '-chart .nv-axisMaxMin text')
                    .each(function (i) {
                        var tick = d3.select(this);
                        var fullText = tick.text();
                        var truncText = fullText;
                        var doTruncation = false;
                        // standard truncation with ellipses
                        if (fullText.length > thisWidget.truncateY) {
                            truncText = fullText.substring(0, thisWidget.truncateY) + '...';
                            doTruncation = true;
                        }
                        // preceding truncation with ellipses
                        if (thisWidget.truncateY < 0) {
                            truncText = '...' + fullText.substring(Math.abs(thisWidget.truncateY), fullText.length);
                            doTruncation = true;
                        }
                        if(doTruncation === true) {
                            tick.text(truncText);
                            tick
                                .append("svg:title")
                                .text(fullText)
                        }
                });
            }

            // qtip jquery extension over titles in d3 axis
            d3.selectAll('title').each(function (e) { // Grab all elements with a title element,and set "this"
                $(this).parent().qtip({
                    content: {
                        text: $(this).text()
                    },
                    position: {
                        target: 'mouse',
                        adjust: {
                            x: 10,
                            y: 10
                        }
                    },
                    style: {
                        classes: 'widget-barChart-tooltipStyle' + customTooltipStyleName,
                        widget: false, // Use the jQuery UI widget classes
                        def: false // Remove the default styling (usually a good idea, see below)
                    }
                });
                // remove title element
                $(this).remove();
            });
        };

        this.wrap = function(text, width) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        };

        this.dblClickHandler = function(){
            thisWidget.jqElement.triggerHandler('DoubleClicked');
            thisWidget.updateTruncation();
        };

        // this probably has to be run multiple times due to dataLabel being  a dynamic runtime property
        // check for duplicate datalabels and append numeric suffix if needed
        this.forceUniqueValues = function (dataLabels) {
            var data = dataLabels,
                result = data.map(function (item) {
                    return this[item].count === 1 ? item : item + '-' + ++this[item].index;
                }, data.reduce(function (retVal, item) {
                    retVal[item] = retVal[item] || {count: 0, index: 0};
                    retVal[item].count++;
                    return retVal;
                }, {}));
            return result;
        };

        //Format function for the tooltip values column
        this.valueFormatter = function(d,i) {
            return d;
        };

        //Format function for the tooltip header value.
        this.headerFormatter = function(d) {
            return d;
        };

        this.keyFormatter = function(d, i) {
            return d;
        };

        // this is not the tooltips on the axis labels
        /**
         * Below function is called when the tooltip is shown while hovering inside the
         * barChart runtime UI.
         */
        this.tooltipGenerator = function(d) {
            var headerEnabled = true;
            if (d === null) {
                return '';
            }

            var table = d3.select(document.createElement("table"));
            if (headerEnabled) {
                var theadEnter = table.selectAll("thead")
                    .data([d])
                    .enter().append("thead");

                theadEnter.append("tr")
                    .append("td")
                    .attr("colspan", 3)
                    .append("strong")
                    .classed("x-value", true)
                    //.html(headerFormatter(d.value)); // default is to use x value, which has no meaning
                    // use x-axis label, assume it id's "something" in quantity of something
                    .html(thisWidget.headerFormatter(function(d){return barLabels[d.value - 1]}));
            }

            var tbodyEnter = table.selectAll("tbody")
                .data([d])
                .enter().append("tbody");

            var trowEnter = tbodyEnter.selectAll("tr")
                .data(function(p) { return p.series})
                .enter()
                .append("tr")
                .classed("highlight", function(p) { return p.highlight});

            trowEnter.append("td")
                .classed("legend-color-guide",true)
                .append("div")
                .style("background-color", function(p) { return p.color});

            trowEnter.append("td")
                .classed("key",true)
                .html(function(p, i) {return thisWidget.keyFormatter(barLabels[p.key], i)});

            trowEnter.append("td")
                .classed("value",true)
                .html(function(p, i) { return thisWidget.valueFormatter(p.value, i) });


            trowEnter.selectAll("td").each(function(p) {
                if (p.highlight) {
                    var opacityScale = d3.scale.linear().domain([0,1]).range(["#fff",p.color]);
                    var opacity = 0.6;
                    d3.select(this)
                        .style("border-bottom-color", opacityScale(opacity))
                        .style("border-top-color", opacityScale(opacity))
                    ;
                }
            });

            var html = table.node().outerHTML;
            if (d.footer !== undefined)
                html += "<div class='footer'>" + d.footer + "</div>";
            return html;

        };

        //single item selection support to start off
        this.setSeriesSelection = function() {
            selectedRowIndices = [];
            //var selectedRowIndices = updatePropertyInfo.SelectedRowIndices;
            selectedRowIndices.push(clickedRowId);
            thisWidget.updateSelection('Data', selectedRowIndices);
        };

        this.beforeDestroy = function () {
            if(resizeHandler){
                resizeHandler.clear();
                resizeHandler = null;
            }
            try {
                thisWidget.jqElement.off();
            } catch (err) {
                TW.log.error('Error in TW.Runtime.Widgets.button.beforeDestroy', err);
            }
        };

    };
}());
