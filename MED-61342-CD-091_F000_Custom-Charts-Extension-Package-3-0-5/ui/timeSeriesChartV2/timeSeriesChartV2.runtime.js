/*global Encoder,TW */

var TW_timeSeriesChartV2IsExtension;

(function () {

    var addedDefaultChartStyles = false;

    TW.Runtime.Widgets.timeSeriesChartV2 = function () {
        var thisWidget = this,
            widgetProperties,
            widgetContainer,
            widgetContainerId,
            chartContainer,
            chartContainerId,
            chart,
            purge,
            MAX_SERIES = 8,
            chartStyles = {},
            dataLabels = [],
            scaleControlsCreated = false,
            valueUnderMouse = {},
            clickedRowId,
            selectedRowIndices,
            chartTitleStyle,
            isResponsive = false,
            isInHiddenTab = false,
            isInHiddenBrowserTab,
            mashupParamDataSources = false,
            scaling = "time",
            thisWidgetElement,
            resizeHandler,
            yAxisMinimum = thisWidget.getProperty('Y-AxisMinimum', 0) * 1,
            yAxisMaximum = thisWidget.getProperty('Y-AxisMaximum', 100) * 1,
            xAxisMinimum = thisWidget.getProperty('X-AxisMinimum', 0) * 1,
            xAxisMaximum = thisWidget.getProperty('X-AxisMaximum', 100) * 1;

        thisWidget.chartTitleTextSizeClass = 'textsize-normal';
        thisWidget.chartSeries = [];
        thisWidget.chartData = null;
        thisWidget.processing = false;
        thisWidget.returnData = [];
        thisWidget.dynamicSeries = undefined;
        thisWidget.singleDataSource = thisWidget.getProperty('SingleDataSource');
        thisWidget.nSeries = Math.min(MAX_SERIES, thisWidget.getProperty('NumberOfSeries'));
        thisWidget.title = TW.Runtime.convertLocalizableString(thisWidget.getProperty('ChartTitle'));
        thisWidget.titleAlignment = thisWidget.getProperty("ChartTitleAlignment");
        thisWidget.xAxisLabel = TW.Runtime.convertLocalizableString(thisWidget.getProperty('X-AxisLabel'));
        thisWidget.yAxisLabel = TW.Runtime.convertLocalizableString(thisWidget.getProperty('Y-AxisLabel'));
        thisWidget.showAxisLabels = thisWidget.getProperty('ShowAxisLabels');
        thisWidget.showXAxisLabels = Boolean(thisWidget.getProperty('ShowX-AxisLabels'));
        thisWidget.showYAxisLabels = Boolean(thisWidget.getProperty('ShowY-AxisLabels'));
        thisWidget.showZoomStrip = thisWidget.getProperty('ShowZoomStrip');
        thisWidget.showInteractiveGuideline = thisWidget.getProperty('ShowInteractiveGuideline');
        thisWidget.showLegend = thisWidget.getProperty('ShowLegend');
        thisWidget.legendLocation = thisWidget.getProperty('LegendLocation') ? thisWidget.getProperty('LegendLocation') : 'top';
        thisWidget.interpolation = thisWidget.getProperty('Interpolation');
        thisWidget.duration = thisWidget.getProperty('Duration');
        thisWidget.fillArea = Boolean(thisWidget.getProperty('FillArea'));
        thisWidget.labelAngle = thisWidget.getProperty('LabelAngle') * -1;
        thisWidget.xAxisIntervals = thisWidget.getProperty('X-AxisIntervals');
        thisWidget.xAxisMinMaxVisible = Boolean(thisWidget.getProperty('ShowX-AxisMinMax'));
        thisWidget.autoScale = Boolean(thisWidget.getProperty('AutoScale'));
        thisWidget.yAxisIntervals = thisWidget.getProperty('Y-AxisIntervals');
        thisWidget.yAxisMinMaxVisible = thisWidget.getProperty('ShowY-AxisMinMax');
        thisWidget.margins = thisWidget.getProperty('Margins');
        thisWidget.width = thisWidget.getProperty('Width');
        thisWidget.height = thisWidget.getProperty('Height');
        thisWidget.zIndex = thisWidget.getProperty('Z-index');
        thisWidget.selectedItems = [];
        thisWidget.enableSelection = true;
        thisWidget.toggleScaling = true;
        thisWidget.emptyChart = false;
        thisWidget.xAxisField = thisWidget.getProperty('X-AxisField');
        thisWidget.timeScale = thisWidget.getProperty('TimeScale');
        thisWidget.reSort = thisWidget.getProperty('Re-Sort');
        thisWidget.timeFormat = thisWidget.timeScale;
        
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
                    evtMap = {focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h};
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
        this.runtimeProperties = function () {
            return {
                'needsDataLoadingAndError': false
            };
        };

        this.renderHtml = function () {
            return renderChartHtml(thisWidget, "timeSeriesChartV2");
        };

        this.renderStyles = function () {

            var formatResult = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartBodyStyle', 'DefaultChartStyle'));
            chartTitleStyle = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartTitleStyle', 'DefaultChartTitleStyle'));
            var chartAxisStyle = TW.getStyleFromStyleDefinition(thisWidget.getProperty('ChartAxisStyle', 'DefaultChartAxisStyle'));
            var chartTitleStyleBG = TW.getStyleCssGradientFromStyle(chartTitleStyle);
            var chartTitleStyleText = TW.getStyleCssTextualNoBackgroundFromStyle(chartTitleStyle);
            var chartBackground = TW.getStyleCssGradientFromStyle(formatResult);
            var chartBorder = TW.getStyleCssBorderFromStyle(formatResult);
            // chart series lines are stroked in color in svg processing, not in css
            // to be replaced with iterator on however many series/styles were set up
            var chartStyle1 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle1', 'DefaultChartStyle1'));
            var chartStyle2 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle2', 'DefaultChartStyle2'));
            var chartStyle3 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle3', 'DefaultChartStyle3'));
            var chartStyle4 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle4', 'DefaultChartStyle4'));
            var chartStyle5 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle5', 'DefaultChartStyle5'));
            var chartStyle6 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle6', 'DefaultChartStyle6'));
            var chartStyle7 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle7', 'DefaultChartStyle7'));
            var chartStyle8 = TW.getStyleFromStyleDefinition(thisWidget.getProperty('SeriesStyle8', 'DefaultChartStyle8'));
            var chartStrokeStyle1 = TW.getStyleCssBorderFromStyle(chartStyle1);
            var chartStrokeStyle2 = TW.getStyleCssBorderFromStyle(chartStyle2);
            var chartStrokeStyle3 = TW.getStyleCssBorderFromStyle(chartStyle3);
            var chartStrokeStyle4 = TW.getStyleCssBorderFromStyle(chartStyle4);
            var chartStrokeStyle5 = TW.getStyleCssBorderFromStyle(chartStyle5);
            var chartStrokeStyle6 = TW.getStyleCssBorderFromStyle(chartStyle6);
            var chartStrokeStyle7 = TW.getStyleCssBorderFromStyle(chartStyle7);
            var chartStrokeStyle8 = TW.getStyleCssBorderFromStyle(chartStyle8);
            chartStyles.series1 = chartStyle1.lineColor;
            chartStyles.series1StrokeWidth = getStrokeWidth(chartStrokeStyle1);
            chartStyles.series2 = chartStyle2.lineColor;
            chartStyles.series2StrokeWidth = getStrokeWidth(chartStrokeStyle2);
            chartStyles.series3 = chartStyle3.lineColor;
            chartStyles.series3StrokeWidth = getStrokeWidth(chartStrokeStyle3);
            chartStyles.series4 = chartStyle4.lineColor;
            chartStyles.series4StrokeWidth = getStrokeWidth(chartStrokeStyle4);
            chartStyles.series5 = chartStyle5.lineColor;
            chartStyles.series5StrokeWidth = getStrokeWidth(chartStrokeStyle5);
            chartStyles.series6 = chartStyle6.lineColor;
            chartStyles.series6StrokeWidth = getStrokeWidth(chartStrokeStyle6);
            chartStyles.series7 = chartStyle7.lineColor;
            chartStyles.series7StrokeWidth = getStrokeWidth(chartStrokeStyle7);
            chartStyles.series8 = chartStyle8.lineColor;
            chartStyles.series8StrokeWidth = getStrokeWidth(chartStrokeStyle8);
            var styleBlock = '';

            var chartCssInfo = TW.getStyleCssTextualNoBackgroundFromStyle(formatResult);
            var chartLineInfo = TW.getStyleCssBorderFromStyle(chartAxisStyle);

            // d3 uses color values directly
            chartStyles.text = chartCssInfo.split(';')[0].split(':')[1];
            chartStyles.gridStyle = chartLineInfo.split(';')[1].split(':')[1];
            //regular widget styles
            if (thisWidget.getProperty('ChartBodyStyle', 'DefaultChartBodyStyle') === 'DefaultChartBodyStyle'
                && thisWidget.getProperty('ChartTitleStyle', 'DefaultChartTitleStyle') === 'DefaultChartTitleStyle'
                && thisWidget.getProperty('FocusStyle', 'DefaultButtonFocusStyle') === 'DefaultButtonFocusStyle') {
                if (!addedDefaultChartStyles) {
                    addedDefaultChartStyles = true;
                    // add chart title default style
                    var defaultStyles = '.chart-title {' + chartTitleStyleBG + ' ' + chartTitleStyleText + ' }' +
                        ' .widget-timeSeriesChartV2 {' + chartBackground + ' ' + chartBorder + ' }';
                    $.rule(defaultStyles).appendTo(TW.Runtime.globalWidgetStyleEl);
                }
            } else {
                // add custom chart title style
                styleBlock += '#' + thisWidget.jqElementId + ' .chart-title { ' + chartTitleStyleBG + ' ' + chartTitleStyleText + ' } ' +
                    '#' + thisWidget.jqElementId + '.widget-chart-title-text { ' + chartTitleStyle + ' }' +
                    '#' + thisWidget.jqElementId + '.widget-timeSeriesChartV2 {' + chartBackground + chartBorder + '}';
            }
            return styleBlock;

            function getStrokeWidth(styleRef) {
                if (styleRef !== "none") {
                    var widthPix = styleRef.split(';')[0].split(':')[1];
                    return widthPix.substring(0, widthPix.indexOf("px"))
                }
                return 1
            }

            function getStrokeStyle(styleRef) {
                if (styleRef !== "none") {
                    var strokeStyle = styleRef.split(';')[2].split(':')[1];
                    // dashed, dotted, solid, none
                    switch (strokeStyle) {
                        case 'dashed':
                            //set up d3 equivalent
                            return ["stroke-linecap", "miter", "stroke-dasharray", ("10,3")];
                            break;
                        case 'dotted' :
                            //d3 equivalent
                            return ["stroke-linecap", "round", "stroke-dasharray", ("1,6")];
                            break;
                        case 'none':
                        // does it make sense to handle this?
                        default:
                            return ["stroke-linecap", "bevel"];
                            break;
                    }
                }
                return 1
            }
        };

        this.afterRender = function () {

            thisWidgetElement = thisWidget.jqElement;
            widgetProperties = thisWidget.properties;
            widgetContainer = thisWidget.jqElementId;
            widgetContainerId = '#' + widgetContainer;
            chartContainer = widgetContainer + '-chart'; //root_nvd3line-6-chart
            chartContainerId = '#' + chartContainer; //#root_nvd3line-6-chart

            // look to see if chart is in a mashupContainer
            // class contains widget-mashupcontainer
            mashupParamDataSources = $(widgetContainerId).parents('.widget-mashupcontainer').length;

            var widgetSelector = widgetContainer + ' .-element';
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

            thisWidget.jqElement.find('.nv-legend').on('click', function (e) {
                thisWidget.jqElement.triggerHandler('DoubleClicked');
                e.preventDefault();
            });

            if (thisWidget.properties.ResponsiveLayout) {

                isResponsive = true;
                $(widgetContainerId + '-bounding-box').height('100%').width('100%');
                $(widgetContainerId + '-bounding-box').css('overflow', 'hidden');
                $(widgetContainerId).height("100%").width("100%");
                $(chartContainerId).height("100%").width("100%");
                $(widgetContainerId).css('overflow', 'hidden');
            } else {
                $(chartContainerId).width(thisWidget.width + 20);
                $(chartContainerId).height(thisWidget.height - 24);
            }

            $(widgetContainerId + '-bounding-box').css('z-index', thisWidget.zIndex);

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
        };

        this.updateProperty = function (updatePropertyInfo) {
            var thisWidget = this;
            var widgetProperties = thisWidget.properties;
            var seriesNumber;
            var nSeries = thisWidget.nSeries;

            // if this is in a inactive tab or similar we must prevent rendering until tab gets clicked
            if (isResponsive && $(widgetContainerId).closest('.tabsv2-actual-tab-contents').css('display') === 'none') {
                isInHiddenTab = true;
                $(chartContainerId).hide();
            } else {
                isInHiddenTab = false;
                $(chartContainerId).fadeIn(thisWidget.duration);
            }

            if (updatePropertyInfo.TargetProperty === "ChartTitle") {
                var updatedTitle = updatePropertyInfo.RawSinglePropertyValue;
                thisWidget.setProperty('ChartTitle', updatedTitle);
                thisWidget.title = updatedTitle;
                $('#' + thisWidget.jqElementId + '-title').text(updatedTitle);
                return;
            }

            if (updatePropertyInfo.TargetProperty === "Y-AxisMinimum") {
                yAxisMinimum = updatePropertyInfo.RawSinglePropertyValue;
                if(chart !== undefined && thisWidget.autoScale === false && yAxisMinimum < yAxisMaximum) {
                    chart.forceY([yAxisMinimum, yAxisMaximum]);
                }
                return;
            }

            if (updatePropertyInfo.TargetProperty === "Y-AxisMaximum") {
                yAxisMaximum = updatePropertyInfo.RawSinglePropertyValue;
                if(chart !== undefined && thisWidget.autoScale === false && yAxisMinimum < yAxisMaximum) {
                    chart.forceY([yAxisMinimum, yAxisMaximum]);
                }
                return;
            }

            if (updatePropertyInfo.TargetProperty === "X-AxisMinimum") {
                xAxisMinimum = updatePropertyInfo.RawSinglePropertyValue;
                if(chart !== undefined && thisWidget.autoScale === false && xAxisMinimum < xAxisMaximum) {
                    chart.forceX([xAxisMinimum, xAxisMaximum]);
                }
                return;
            }

            if (updatePropertyInfo.TargetProperty === "X-AxisMaximum") {
                xAxisMaximum = updatePropertyInfo.RawSinglePropertyValue;
                if(chart !== undefined && thisWidget.autoScale === false && xAxisMinimum < xAxisMaximum) {
                    chart.forceX([xAxisMinimum, xAxisMaximum]);
                }
                return;
            }

            if (updatePropertyInfo.TargetProperty.indexOf('Data') === 0 && !isInHiddenBrowserTab && thisWidget.processing === false) {
                thisWidget.dataRows = updatePropertyInfo.ActualDataRows;
                // iterate through the series fields
                if (updatePropertyInfo.TargetProperty === "Data") {
                    thisWidget.chartSeries = [];
                    for (seriesNumber = 1; seriesNumber <= nSeries; seriesNumber++) {

                        var dataField = widgetProperties['DataField' + seriesNumber];

                        if (dataField !== undefined && dataField !== '' && thisWidget.dataRows != undefined) {

                            var seriesType = widgetProperties['SeriesType' + seriesNumber];

                            if (seriesType == 'chart' || seriesType === undefined || seriesType == null) {
                                seriesType = widgetProperties['ChartType'];
                            }

                            //this.enableSelection = widgetProperties['AllowSelection'];

                            var seriesDefinition = {
                                dataSource: updatePropertyInfo.TargetProperty,
                                field: dataField,
                                data: thisWidget.dataRows,
                                label: TW.Runtime.convertLocalizableString(this.getProperty('DataLabel' + seriesNumber)),
                                style: widgetProperties['SeriesStyle' + seriesNumber]
                            };
                            thisWidget.chartSeries.push(seriesDefinition);
                        } else {
                            TW.log.warn("dataField is empty or undefined");
                        }
                    }
                    if (!isInHiddenTab) {
                        thisWidget.liveData = this.processDataset();
                    }
                } else if (updatePropertyInfo.TargetProperty.indexOf('DataLabel') === 0) {
                    for (seriesNumber = 1; seriesNumber <= nSeries; seriesNumber++) {
                        var labelName = 'DataLabel' + seriesNumber.toString();
                        if (updatePropertyInfo.TargetProperty === labelName && updatePropertyInfo.RawSinglePropertyValue !== undefined) {
                            thisWidget.setProperty(labelName, updatePropertyInfo.RawSinglePropertyValue);
                            dataLabels = this.forceUniqueValues(dataLabels);
                            // replace the dataLabel by position in array dataLabels
                            dataLabels[seriesNumber - 1] = thisWidget.getProperty(labelName);
                            // set the label of the corresponding chartSeries element in liveData
                            thisWidget.liveData[seriesNumber - 1].key = dataLabels[seriesNumber - 1];
                            if (!isInHiddenTab) {
                                thisWidget.liveData = this.processDataset();
                            }
                        }
                    }
                } else {
                    // multiple datasource handling
                    if (thisWidget.dataRows !== undefined && !thisWidget.singleDataSource) {
                        // each data load resets the purge timeout
                        // so we only purge after final data load in case some dataSources were deselected
                        clearTimeout(purge);
                        purge = setTimeout(function () {
                            purgeDataSources(dataSourceId)
                        }, 20);
                        var dataSourceName = updatePropertyInfo.TargetProperty;

                        //check if targetProperty is a dataSource already displayed
                        var newSeries = true;

                        var dataSourceId = dataSourceName.substr(dataSourceName.length - 1, 1);
                        for (var i = 0; i < thisWidget.chartSeries.length; i++) {
                            // if the series' datasource is already in chartSeries
                            // or the id is greater than the max number of series allowed it is a repeat
                            if (thisWidget.chartSeries[i].dataSource === updatePropertyInfo.TargetProperty || dataSourceId > nSeries) {
                                newSeries = false;
                            }
                        }

                        var dataField = widgetProperties['DataField' + dataSourceId];

                        var seriesDefinition = {
                            dataSource: dataSourceName,
                            id: dataSourceId,
                            field: dataField,
                            data: thisWidget.dataRows,
                            label: TW.Runtime.convertLocalizableString(this.getProperty('DataLabel' + dataSourceId)),
                            style: widgetProperties['SeriesStyle' + dataSourceId]
                        };

                        // if existing dataSource, update
                        if (newSeries === false) {
                            thisWidget.chartSeries.splice(dataSourceId - 1, 1, seriesDefinition);
                            // replace the dataLabel by position in array dataLabels
                            dataLabels.splice(dataSourceId - 1, 1, seriesDefinition.label);
                            // set the label of the corresponding chartSeries element in liveData
                            if (thisWidget.liveData !== undefined) {
                                thisWidget.liveData[dataSourceId].key = dataLabels[dataSourceId];
                            }
                        }

                        // if new dataSource, add
                        if (newSeries === true) {
                            // if max series already displayed, drop FIFO
                            if (thisWidget.chartSeries.length > nSeries) {
                                chartSeries.shift();
                                dataLabels.shift();
                            }
                            thisWidget.chartSeries.push(seriesDefinition);
                        }

                    } else {
                        TW.log.warn("data rows undefined or empty for targetProperty: " + updatePropertyInfo.TargetProperty);
                    }
                }
                if (!isInHiddenTab) {
                    thisWidget.liveData = this.processDataset();
                }
            }

            if (thisWidget.enableSelection) {

                var selectedRowIndices = updatePropertyInfo.SelectedRowIndices;

                if (selectedRowIndices !== undefined) {
                    //this is chart updating selection flags to match grid row
                    //TW.ChartLibrary.handleChartSelectionUpdate(this, this.chart, updatePropertyInfo.TargetProperty, selectedRowIndices);
                }
                else {
                    TW.ChartLibrary.handleChartSelectionUpdate(this, this.chart, updatePropertyInfo.TargetProperty, new Array());
                }
            }

        };



        function purgeDataSources(dataSourceId){
            if(thisWidget.chartSeries.length>thisWidget.nSeries) {
                thisWidget.chartSeries.splice(dataSourceId, (thisWidget.chartSeries.length - thisWidget.nSeries));
                if(! isInHiddenTab) {
                    liveData = thisWidget.processDataset();
                }
            }
        }

        // take field 'series' of infoTable and return in this format to nvd3:
        this.processDataset = function () {
            thisWidget.processing = true;
            var nRows = 0,
                // the field selected to supply data in the series
                seriesFieldName,
                timeField,
                nSeries = thisWidget.nSeries,
                singleDataSource = thisWidget.singleDataSource;

            thisWidget.returnData = [];

            var nSeriesToProcess = singleDataSource ? nSeries : thisWidget.chartSeries.length;
            for (var i = 0; i < nSeriesToProcess; i++) {
                var dataSource = thisWidget.chartSeries[i];
                var data;
                timeField = singleDataSource ? thisWidget.xAxisField : thisWidget.getProperty('X-AxisField' + dataSource.id);
                if (dataSource !== undefined) {
                    seriesFieldName = dataSource.field;

                    if (thisWidget.reSort) {
                        data = sortBy(dataSource.data, timeField);
                    } else {
                        data = dataSource.data;
                    }
                } else {
                    var message = "Error: A " + (singleDataSource ? "DataField" : "DataSource") + " needs to be selected";
                    //this might need to go in a try/catch
                    showEmptyChart(thisWidget, chart);
                    TW.log.error(message);
                    return;
                }

                if (seriesFieldName !== undefined && seriesFieldName != "") {
                    var timeStamp,
                        seriesValue,
                        seriesValues = [],
                        obj;

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
                        thisWidgetElement.find(".nv-area").show();
                        thisWidgetElement.find(".nv-linesWrap").show();
                        thisWidgetElement.find(".nv-wrap text").show();
                        if (thisWidget.showInteractiveGuideline === true) {
                            $('.xy-tooltip').show();
                        }

                        for (var rowid = 0; rowid < nRows; rowid++) {
                            var row = data[rowid];

                            if (row[seriesFieldName] !== undefined && row[seriesFieldName] !== '') {
                                seriesValue = row[seriesFieldName];
                            } else {
                                TW.log.error('timeSeriesChartV2 widget extension, ' + seriesFieldName + ' undefined or empty seriesValue forced to 0');
                                seriesValue = 0;
                            }
                            if (timeField !== undefined && row[timeField] !== undefined && row[timeField] !== '') {
                                timeStamp = row[timeField];
                            } else {
                                timeStamp = new Date();
                                TW.log.error('timeSeriesChartV2 widget extension, row timeField was not a date or was empty');
                            }

                            scaling === "time" ? obj = {"x": timeStamp, "y": seriesValue} : obj = {
                                "x": rowid,
                                "y": seriesValue
                            };

                            //console.log("obj.x: "+obj.x+" obj.y: "+obj.y);
                            //console.log("pds obj.y: " + obj.y);
                            seriesValues.push(obj);
                        }
                        var seriesData = {
                            'values': seriesValues,
                            // key should be label prop w fallback to dataSourceName
                            'key': TW.Runtime.convertLocalizableString(dataLabels[i]),
                            'color': chartStyles['series' + (i + 1)],
                            'area': thisWidget.fillArea,
                            'strokeWidth': chartStyles['series' + (i + 1) + 'StrokeWidth'],
                            // for dotted and dashed lines: classed: 'dashed' or 'dotted' and then css to apply style
                        };
                        thisWidget.returnData.push(seriesData);
                    }
                }
            }

            if (thisWidget.returnData.length > 0 && !isInHiddenTab) {
                if (thisWidget.chartData) {
                    $(chartContainerId).show();
                    thisWidget.update(thisWidget.returnData);
                } else {
                    thisWidget.render(thisWidget.returnData);
                }
                thisWidget.processing = false;
                return thisWidget.returnData;
            }
        };

        this.resize = function (width, height) {
            isInHiddenTab = chartResize(thisWidget, widgetContainerId, isInHiddenTab);
            thisWidget.moveLegends(width, height, thisWidget.getProperty('LegendOrientation'));
        };

        this.appendDateOrder = function() {
            let _dateOrder = thisWidget.getProperty('DateOrder');
            let _timeScale = thisWidget.timeScale;
            if (_timeScale === 'y') {
                return _timeScale.replace('y', _dateOrder+' ');
            }
            return _timeScale.replace('y ', _dateOrder+' ');

        }
        this.moveLegends = function(_chartWidth, _chartHeight, _legendOrientation) {
            let _offsetX = 0;
            let _offsetY = 0;
            let propMargin =  thisWidget.margins.split(',');
            d3.selectAll('.nv-legend .nv-series').attr('visibility', 'visible');
            d3.selectAll('.nv-legend .nv-series')[0].forEach(function (d) {
                
                d3.select(d).attr('transform', 'translate(' + _offsetX + ',' +  _offsetY + ')');
                if (_legendOrientation !== 'vertical') {
                    _offsetX += d.getBBox().width + 10;
                    if(thisWidget.legendLocation === 'left' && (_offsetX > thisWidget.marginValues._left - thisWidget.marginValues._yLabelMargin )) {
                        _offsetX = 0;
                        _offsetY += 20;
                    }
                    if(thisWidget.legendLocation === 'right' && ((_offsetX * 2 ) > thisWidget.marginValues._right - 20 )) {
                        _offsetX = 0;
                        _offsetY += 20;
                    }
                } else {
                    _offsetY += 20;
                    if(thisWidget.legendLocation === 'top' && (_offsetY > thisWidget.marginValues._top - 20 )) {
                        _offsetY = 0;
                        _offsetX += d.getBBox().width + 10;
                    }
                    if(thisWidget.legendLocation === 'bottom' && (_offsetY > thisWidget.marginValues._bottom - 20 )) {
                        _offsetY = 0;
                        _offsetX += d.getBBox().width + 10;
                    }
                }

                // Move the NV-Legend to the proper position
                // checking if any of the margin exists
                if(thisWidget.marginValues) {
                    if(thisWidget.legendLocation === 'left') {
                        d3.select(d.parentElement).attr('transform', 'translate(' + - (thisWidget.marginValues._left + 10) +',' + (_chartHeight/2 - _offsetY/2) +')');
                    } else if (thisWidget.legendLocation === 'right') {
                        d3.select(d.parentElement).attr('transform', 'translate(' +  (_chartWidth - (thisWidget.marginValues._right + 69 + Number(propMargin[3]))) +',' + (_chartHeight/2 - _offsetY/2) +')');
                    } else if (thisWidget.legendLocation === 'top') {
                        d3.select(d.parentElement).attr('transform', 'translate(' +  (_chartWidth/2 - _offsetX/2) +',' + -(thisWidget.marginValues._top - 10) +')');
                    } else if (thisWidget.legendLocation === 'bottom') {
                        let _zoomStrip = thisWidget.getProperty('ShowZoomStrip') ? 26 : 0;
                        d3.select(d.parentElement).attr('transform', 'translate(' +  (_chartWidth/2 - _offsetX/2) +',' + (_chartHeight - (thisWidget.marginValues._bottom + _zoomStrip + 10 ))  +')');
                    }
                }
            });
        };

        this.render = function (data, isUpdate) {
            $('.xy-tooltip').remove();
            var propMargin = thisWidget.margins.split(',');
            var xLabelMargin = (isResponsive ? 63 : 42) + propMargin[2] * 1;
            var yLabelMargin = 56 + propMargin[1] * 1;
            var legendMargin = 28 + propMargin[0] * 1;
            var showLegend = thisWidget.showLegend === true && thisWidget.nSeries > 1;
            var _chartWidth = thisWidget.jqElement.width();
            var _chartHeight = thisWidget.jqElement.height();
            thisWidget.timeFormat = thisWidget.timeScale.indexOf('y') > -1 ? thisWidget.appendDateOrder() : thisWidget.timeScale;

            // this will create an empty chart
            if (data === undefined) {
                TW.log.error('timeSeriesChartV2 widget extension, data undefined');
            }

            if (isUpdate !== undefined && isUpdate === true) {
                thisWidget.chartData.datum(data).transition().duration(thisWidget.duration).call(chart);
                if (!resizeHandler) {
                    resizeHandler = nv.utils.windowResize(chart.update);
                }
            } else {
                nv.addGraph(function () {
                    // auto date formatter
                    var tickMultiFormat = d3.time.format.multi([
                        ["%-I:%M%p", function (d) {
                            return d.getMinutes();
                        }], // not the beginning of the hour
                        ["%-I%p", function (d) {
                            return d.getHours();
                        }], // not midnight
                        ["%b %-d", function (d) {
                            return d.getDate() != 1;
                        }], // not the first of the month
                        ["%b %-d", function (d) {
                            return d.getMonth();
                        }], // not Jan 1st
                        ["%Y", function () {
                            return true;
                        }]
                    ]);

                    chart = nv.models.lineChart();
                    //zoomStrip-only settings
                    chart.focusEnable(thisWidget.showZoomStrip);
                    chart.x2Axis
                        .tickFormat(function (d) {
                        })
                        .showMaxMin(!!thisWidget.xAxisMinMaxVisible)
                        .ticks(thisWidget.xAxisIntervals)
                        .tickPadding(10);
                    chart.y2Axis
                        .showMaxMin(false);
                    chart.showYAxis(thisWidget.showYAxisLabels)
                        .showXAxis(thisWidget.showXAxisLabels);
                    chart.duration(thisWidget.duration);
                    if (thisWidget.showAxisLabels) {
                        chart.xAxis.axisLabel(thisWidget.xAxisLabel);
                        chart.yAxis.axisLabel(thisWidget.yAxisLabel);
                        yLabelMargin += isResponsive ? 14 : 7;
                        xLabelMargin += isResponsive ? 42 : 21;
                    }

                    if (!thisWidget.showAxisLabels && thisWidget.xAxisIntervals + thisWidget.yAxisIntervals > 0) {
                        yLabelMargin += 7;
                    }

                    // add margin if labelAngle used
                    if (thisWidget.labelAngle !== 0) {
                        xLabelMargin += 28;
                        yLabelMargin += 14;
                    }
                    // add margin if legend displayed
                    let _legendOrientation = thisWidget.getProperty('LegendOrientation') ? thisWidget.getProperty('LegendOrientation') : 'horizontal';
                    if (showLegend) {
                        if(thisWidget.legendLocation === 'top' || thisWidget.legendLocation === 'bottom') {
                            legendMargin += _legendOrientation === 'vertical' ? .12 * _chartHeight : 7;
                        } else {
                            legendMargin += (.12 * _chartWidth)
                        }
                    }
                    //add margin if showZoomStrip
                    if (thisWidget.timeScale === "%-I:%M:%S.%L%p") {
                        xLabelMargin += 21;
                        //thisWidget.jqElement.find('nv-axislabel', 'translateY(21px)');
                    }
                    if(thisWidget.showLegend) {
                        // move lower the x axis label with .nv-axisLabel class label
                        thisWidget.marginValues = {
                            _top : (thisWidget.legendLocation === 'top' ? legendMargin : 0),
                            _left :  thisWidget.legendLocation === 'left' ? (legendMargin + yLabelMargin) : 0,
                            _bottom : thisWidget.legendLocation === 'bottom' ? legendMargin : 0,
                            _right :  thisWidget.legendLocation === 'right' ? legendMargin : 0,
                            _xLabelMargin : xLabelMargin,
                            _yLabelMargin : yLabelMargin
                        }
                    } else {
                        thisWidget.marginValues = {
                            _top: legendMargin,
                            _left: yLabelMargin,
                            _bottom: xLabelMargin,
                            _right: 49 + (propMargin[3] * 1)
                        }
                    }
                    
                    if(thisWidget.legendLocation === 'top') {
                        chart.legend.margin({top:thisWidget.marginValues._top});
                    }
                    chart.margin({
                        top: thisWidget.marginValues._top,
                        left: thisWidget.marginValues._left + yLabelMargin,
                        bottom: thisWidget.marginValues._bottom + xLabelMargin,
                        right: 49 + (propMargin[3] * 1) + thisWidget.marginValues._right
                    })  //Adjust chart margins to give the x-axis some breathing room.
                        .useInteractiveGuideline(thisWidget.showInteractiveGuideline)
                        .duration(thisWidget.duration)  //how fast do you want the lines to transition?
                        .showLegend(showLegend) //Show the legend, allowing users to turn on/off line series.
                        .height = thisWidget.height - xLabelMargin - legendMargin;

                    
                    // set the y scale to user settings
                    if (thisWidget.autoScale === false && thisWidget.getProperty('Y-AxisMaximum')) {
                        if (yAxisMaximum > yAxisMinimum) {
                            chart.forceY([yAxisMinimum, yAxisMaximum]);
                        } else {
                            chart.forceY(yAxisMaximum);
                        }
                    }

                    // set the x scale to user settings
                    if (thisWidget.autoScale === false && thisWidget.getProperty('X-AxisMaximum')) {
                        if (xAxisMaximum > xAxisMinimum) {
                            chart.forceX([xAxisMinimum, xAxisMaximum]);
                        } else {
                            chart.forceX(xAxisMaximum);
                        }
                    }

                    chart.interpolate(thisWidget.interpolation);
                    // override default tooltip in interactive layer
                    if (thisWidget.ShowInteractiveGuideline) {
                        chart.interactiveLayer.tooltip.contentGenerator(function (d) {
                            return thisWidget.tooltipGenerator(d)
                        });
                    } else {
                        chart.lines.interactive(false);
                    }
                    if (scaling === "time") {
                        chart.xScale(d3.time.scale());
                    }

                    chart.options = nv.utils.optionsFunc.bind(chart);
                    chart.xAxis
                        .showMaxMin(!!thisWidget.xAxisMinMaxVisible)
                        .rotateLabels(thisWidget.labelAngle) // Want longer labels? Try rotating them to fit easier.
                        .axisLabel(thisWidget.showAxisLabels ? thisWidget.xAxisLabel : '')
                        .tickPadding(10);

                    if (thisWidget.xAxisIntervals !== "auto") {
                        chart.xAxis.ticks(data[0].values.length);
                    }

                    if (scaling === "time") {
                        chart.xAxis.tickFormat(function (d) {
                            if (thisWidget.timeScale === 'auto') {
                                return tickMultiFormat(new Date(d));
                            } else {
                                return d3.time.format(thisWidget.timeFormat)(new Date(d));
                            }
                        });
                    }
                    if (scaling === "linear") {
                        chart.xAxis.tickFormat(d3.format('.0d'));
                    }

                    // .tickValues(function(values) {
                    //     return _.map(values[0].values, function(v) {
                    //         return new Date(v.x);
                    //     });
                    // })

                    chart.yAxis
                        .showMaxMin(!!thisWidget.yAxisMinMaxVisible)
                        .axisLabel(thisWidget.showAxisLabels ? thisWidget.yAxisLabel : '')
                        //.tickFormat(d3.format('.02f')) //floating point/money 'd' for integers
                        .tickFormat(d3.format('.02f'));
                    thisWidget.yAxisIntervals === "per" ? chart.yAxis.ticks(data[0].values.length) : chart.yAxis.ticks();
                    // data applied to chart
                    thisWidget.chartData = d3.select(chartContainerId).datum(data);
                    thisWidget.chartData.transition().duration(thisWidget.duration).call(chart);
                    $('.xy-tooltip').remove();

                    doUpdateStyles();

                    if (!resizeHandler) {
                        resizeHandler = nv.utils.windowResize(function () {
                            chart.update();
                        });
                    }

                    chart.dispatch.on('stateChange', function (e) {
                        // setting up the visibiltiy to hidded as legends flickers on click.
                        d3.selectAll('.nv-legend .nv-series').attr('visibility', 'hidden');
                        chart.useInteractiveGuideline(false);
                        updateStyles(e)
                        setTimeout(function() {
                            if (thisWidget.showLegend) {
                                thisWidget.moveLegends(_chartWidth, _chartHeight, _legendOrientation);
                            }
                        },5);
                    });
                    if (thisWidget.showLegend) {
                        setTimeout(thisWidget.moveLegends(_chartWidth, _chartHeight, _legendOrientation),100);
                    }
                });
            }

            // triggered by chart clicks
            function handleClick() {
                var fieldName = thisWidget.chartSeries[valueUnderMouse.series].field;
                var seriesData = thisWidget.chartSeries[valueUnderMouse.series].data;

                for (var i = 0; i < seriesData.length; i++) {
                    if (seriesData[i][fieldName] === valueUnderMouse.value) {
                        // this is the row in datasource series
                        clickedRowId = i;
                        thisWidget.setSeriesSelection();
                    }
                }
            }

            // triggered by legend click
            function updateStyles(e) {
                $('.xy-tooltip').remove(); 
                setTimeout(function () {
                    doUpdateStyles();
                }, thisWidget.duration);
            }

            function doUpdateStyles() {
                d3.selectAll(widgetContainerId + '-chart .nv-line')
                    .style("fill", "none");
                d3.selectAll(widgetContainerId + '-chart text')
                    .style("fill", chartStyles.text);
                d3.selectAll(widgetContainerId + '-chart nv-legend-text')
                    .style("fill", chartStyles.text);
                d3.selectAll(widgetContainerId + '-chart line')
                    .style("stroke", chartStyles.gridStyle);
                d3.selectAll(widgetContainerId + '-chart path')
                    .style("cursor", "pointer")
                    .style("pointer-events", "all")
                    .on('click', function (e) {
                        handleClick();
                    });

                $('.xy-tooltip').remove();
                chart.useInteractiveGuideline(thisWidget.showInteractiveGuideline);
            }
        };

        this.update = function (data) {
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

            if (thisWidget.emptyChart === true) {
                // we have an empty single series chart
                showEmptyChart(thisWidget, chart);
            } else {
                thisWidget.chartData.datum(data).transition().duration(500).call(chart);
                chart.useInteractiveGuideline(thisWidget.showInteractiveGuideline);
                if (!resizeHandler) {
                    resizeHandler = nv.utils.windowResize(chart.update);
                }
            }
            var _chartWidth = thisWidget.jqElement.width();
            var _chartHeight = thisWidget.jqElement.height();
            thisWidget.moveLegends(_chartWidth, _chartHeight, thisWidget.getProperty("LegendOrientation"));
        };

        // stub in case we want to have sorting options later
        function sortBy(data, sortProp) {
            // get data field name from sortProp which is name of property holding field name

            function sortByProperty(property) {
                'use strict';
                return function (a, b) {
                    var sortStatus = 0;
                    if (a[property] < b[property]) {
                        sortStatus = -1;
                    } else if (a[property] > b[property]) {
                        sortStatus = 1;
                    }

                    return sortStatus;
                };
            }

            return data.sort(sortByProperty(sortProp));
        }

        this.createScaleControls = function () {
            if (scaleControlsCreated) {
                return;
            } else {
                var controlsWrap = d3.select(chartContainerId).append("g")
                    .attr("class", "nv-controlsWrap nvd3-svg")
                    .attr("transform", "translate(120,14)");

                var controlLegend = controlsWrap.append("g")
                    .attr("class", "nvd3 nv-legend");

                var controlTime = controlLegend.append("g")
                    .attr("class", "nv-series")
                    .attr("id", "controlTime")
                    .style("cursor", "pointer")
                    .on('click', function () {
                        d3.select("#linearSymbol").attr("fill", "transparent");
                        d3.select("#timeSymbol").attr("fill", "rgb(68,68,68)");
                        scaling = "time";
                        if (!isInHiddenTab) {
                            thisWidget.liveData = this.processDataset();
                        }
                    });

                var controlLinear = controlLegend.append("g")
                    .attr("class", "nv-series")
                    .attr("id", "controlLinear")
                    .attr("transform", "translate(90,0)")
                    .style("cursor", "pointer")
                    .on('click', function () {
                        d3.select("#timeSymbol").attr("fill", "transparent");
                        d3.select("#linearSymbol").attr("fill", "rgb(68,68,68)");
                        scaling = "linear";
                        if (!isInHiddenTab) {
                            thisWidget.liveData = this.processDataset();
                        }
                    });

                controlTime.append("circle")
                    .attr("class", "nv-legend-symbol")
                    .attr("id", "timeSymbol")
                    .attr("r", 5)
                    .attr("stroke-width", 2)
                    .attr("fill", "rgb(68,68,68)")
                    .attr("stroke", "rgb(68,68,68)");

                controlLinear.append("circle")
                    .attr("class", "nv-legend-symbol")
                    .attr("id", "linearSymbol")
                    .attr("r", 5)
                    .attr("stroke-width", 2)
                    .attr("fill", "transparent")
                    .attr("stroke", "rgb(68,68,68)");

                controlLinear.append("text")
                    .attr("text-anchor", "start")
                    .attr("class", "nv-legend-text")
                    .attr("transform", "translate(8,5)")
                    .text("Linear Scale");
                scaleControlsCreated = true;
            }
        };

        this.dblClickHandler = function () {
            thisWidget.jqElement.triggerHandler('DoubleClicked');
        };

        // this probably has to be run multiple times due to dataLabel being a dynamic runtime property
        // check for duplicate datalabels and append numeric suffix if needed
        this.forceUniqueValues = function (dataLabels) {
            var data = dataLabels;
            return data.map(function (item) {
                return this[item].count === 1 ? item : item + '-' + ++this[item].index;
            }, data.reduce(function (retVal, item) {
                retVal[item] = retVal[item] || {count: 0, index: 0};
                retVal[item].count++;
                return retVal;
            }, {}));
        };

        //Format function for the tooltip values column
        this.valueFormatter = function (d, i) {
            return d;
        };

        //Format function for the tooltip header value.
        this.headerFormatter = function (d) {
            return d;
        };

        this.keyFormatter = function (d, i) {
            return d;
        };

        this.tooltipGenerator = function (d) {
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
                    .html(thisWidget.headerFormatter(thisWidget.xAxisLabel));
            }

            var tbodyEnter = table.selectAll("tbody")
                .data([d])
                .enter().append("tbody");
            var rowEnterCounter = 0;
            var trowEnter = tbodyEnter.selectAll("tr")
                .data(function (p) {
                    return p.series
                })
                .enter()
                .append("tr")
                .classed("highlight", function (p, i) {

                    if (p.highlight) {
                        valueUnderMouse.series = rowEnterCounter;
                        valueUnderMouse.value = p.value;
                        rowEnterCounter = 0;
                    } else {
                        rowEnterCounter++;
                    }

                    return p.highlight
                });

            trowEnter.append("td")
                .classed("legend-color-guide", true)
                .append("div")
                .style("background-color", function (p) {
                    return p.color
                });

            trowEnter.append("td")
                .classed("key", true)
                .html(function (p, i) {
                    return thisWidget.keyFormatter(p.key, i)
                });

            trowEnter.append("td")
                .classed("value", true)
                .html(function (p, i) {
                    return thisWidget.valueFormatter(p.value, i)
                });

            trowEnter.selectAll("td").each(function (p) {
                if (p.highlight) {
                    var opacityScale = d3.scale.linear().domain([0, 1]).range(["#fff", p.color]);
                    var opacity = 0.6;
                    d3.select(this)
                        .style("border-bottom-color", opacityScale(opacity))
                        .style("border-top-color", opacityScale(opacity));
                }
            });

            var html = table.node().outerHTML;
            if (d.footer !== undefined)
                html += "<div class='footer'>" + d.footer + "</div>";
            return html;

        };

        //single item selection publish
        this.setSeriesSelection = function () {
            selectedRowIndices = [];
            selectedRowIndices.push(clickedRowId);
            thisWidget.updateSelection('Data', selectedRowIndices);
        };

        this.beforeDestroy = function () {
            if (resizeHandler) {
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
