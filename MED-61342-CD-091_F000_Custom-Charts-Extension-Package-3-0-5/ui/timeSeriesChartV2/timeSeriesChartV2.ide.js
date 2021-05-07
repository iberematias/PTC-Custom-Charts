/*global Encoder,TW */

TW.IDE.Widgets.timeSeriesChartV2 = function () {

    // max could be much higher
    this.MAX_SERIES = 8;
    this.isResponsive = false;
    var widgetContainerId;
    this.widgetIconUrl = function () {
        //widget
        //return  "../Common/thingworx/widgets/timeSeriesChartV2/images/timeSeriesChartV2.ide.png";
        //extension
        return  "../Common/extensions/chartWidget_ExtensionPackage/ui/timeSeriesChartV2/images/timeSeriesChartV2.ide.png";
    };

    this.widgetProperties = function () {
        var properties = {
            'name': 'Time Series Chart',
            'description': 'Displays a time series chart',
            'category': ['Data', 'Charts'],
            'supportsLabel': false,
	        'supportsAutoResize': true,
            'borderWidth': 1,
            'defaultBindingTargetProperty': 'Data',
            'properties': {
                'SingleDataSource': {
                    'description': 'Use a Single Data Source for All Series',
                    'defaultValue': true,
                    'baseType': 'BOOLEAN',
                    'isVisible': true
                },
                'NumberOfSeries': {
                    'description': 'Desired number of series in this chart',
                    'defaultValue': 1,
                    'baseType': 'NUMBER',
                    'isVisible': true
                },
                'Data': {
                    'description': 'Data source',
                    'isBindingTarget': true,
                    'isEditable': false,
                    'baseType': 'INFOTABLE',
                    'isVisible': true,
                    'warnIfNotBoundAsTarget': false
                },
                'ChartTitle': {
                    'description': 'Chart Title',
                    'baseType': 'STRING',
                    'isBindingTarget': true,
                    'defaultValue': '',
                    'isVisible': true,
                    'isLocalizable': true
                },
                'ShowAxisLabels':{
                    'description': 'Show Major axis labels',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true
                },
                'X-AxisLabel': {
                    'description': 'Label for X Axis',
                    'defaultValue': 'X Axis',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'isLocalizable': true
                },
                'X-AxisField': {
                    'description': 'Field that will provide time values',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data',
                    'isBindingTarget': false,
                    'baseTypeRestriction': 'DATETIME',
                    'isVisible': true
                },
                'Re-Sort':{
                    'description': 'Re-sort all data by date field',
                    'baseType': 'BOOLEAN',
                    'isVisible': false,
                    'defaultValue': true
                },
                'TimeScale': {
                    'description': 'Dates,Times',
                    'baseType': 'STRING',
                    'defaultValue' : 'auto',
                    'selectOptions': [
                        { value: 'auto', text: 'Auto-Detect' },
                        { value: 'y', text: 'Date' },
                        { value: '%-I:%M:%S%p', text: 'Time' },
                        { value: 'y %-I:%M:%S%p', text: 'Date with time' },
                        { value: '%-I:%M:%S.%L%p', text: 'Time with milliseconds' },
                        { value: 'y %-I:%M:%S.%L%p', text: 'Date and time with milliseconds' }
                    ],
                    'isEditable': true,
                    'isVisible': true
                },
                
                'DateOrder': {
                    'description': 'Year Month and Day position',
                    'baseType': 'STRING',
                    'defaultValue': '%Y-%-m-%-d',
                    'selectOptions': [
                        { value: '%Y-%-m-%-d', text: 'year-month-day' },
                        { value: '%-d-%-m-%Y', text: 'day-month-year' },
                        { value: '%-m-%-d-%Y', text: 'month-day-year' },
                        { value: '%Y-%-d-%-m', text: 'year-day-month' },
                        { value: '%-m-%Y-%-d', text: 'month-year-day' },
                        { value: '%-d-%Y-%-m', text: 'day-year-month' }
                    ],
                    'isVisible': true
                },
                /*
                'Interval': {
                    'description': 'Initial interval size',
                    'baseType': 'NUMBER',
                    'defaultValue': 0
                },
                'IntervalType': {
                    'description': 'Initial interval type',
                    'baseType': 'STRING',
                    'defaultValue': 'h',
                    'selectOptions': [
                        { value: 'y', text: 'Years' },
                        { value: 'd', text: 'Days' },
                        { value: 'h', text: 'Hours' },
                        { value: 'm', text: 'Minutes' },
                        { value: 's', text: 'Seconds' },
                        { value: 's', text: 'Millseconds' }
                    ]
                },
                'DateDisplay': {
                    'description': 'Date Length',
                    'baseType': 'STRING',
                    'defaultValue': 'short',
                    'selectOptions': [
                        { value: 'numeric', text: 'Numeric' },
                        { value: 'short', text: 'Short' },
                        { value: 'full', text: 'Full' }
                    ]
                },
                'DisplaySeconds': {
                    'description': 'Display Time with Seconds',
                    'baseType': 'BOOLEAN',
                    'defaultValue' : true,
                    'isEditable': true
                },
                'DisplayMilliseconds': {
                    'description': 'Display Time with M<illiseconds',
                    'baseType': 'BOOLEAN',
                    'defaultValue' : false,
                    'isEditable': true
                },
                'DateFormat': {
                    'description': '',
                    'baseType': 'STRING',
                    'defaultValue' : 'dd-mm-yy',
                    'isEditable': false,
                    'isVisible': false
                },
                'TimeFormat': {
                    'description': '',
                    'baseType': 'STRING',
                    'defaultValue' : 'hh:mm:ss',
                    'isEditable': false,
                    'isVisible': false
                },
                */
                'Y-AxisLabel': {
                    'description': 'Label for Y Axis',
                    'defaultValue': 'Y Axis',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'isLocalizable': true
                },
                'LabelAngle':{
                    'description': 'Longer labels in chart fit diagonally',
                    'defaultValue': 0,
                    'isVisible': true,
                    'baseType': 'INTEGER'
                },
                'Interpolation':{
                    'description': 'Line Smoothness',
                    'defaultValue': 'linear',
                    'isVisible': true,
                    'baseType': 'String',
                    'selectOptions': [
                        { value: 'linear', text: 'Linear' },
                        { value: 'basis', text: 'Smooth' },
                        { value: 'cardinal', text: 'Less Smooth' },
                        { value: 'step-before', text: 'Stepped Before' },
                        { value: 'step-after', text: 'Stepped After' }
                    ]
                },
                'Duration':{
                    'description': 'Length of chart animation',
                    'defaultValue':500,
                    'isVisible': true,
                    'baseType':'NUMBER'
                },
                'ChartBodyStyle': {
                    'description': 'Chart overall style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultChartStyle'
                },
                'ChartTitleStyle': {
                    'description': 'Chart title and outline style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultChartTitleStyle'
                },
                'ChartAxisStyle': {
                    'description': 'Chart grid and outline style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultChartAxisStyle'
                },
                'ChartFocusStyle': {
                    'description': 'Chart focus outline style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultButtonFocusStyle'
                },
                'ChartTitleAlignment': {
                    'baseType': 'STRING',
                    'defaultValue': 'center',
                    'isVisible': true,
                    'selectOptions': [
                        { value: 'left', text: 'Left' },
                        { value: 'center', text: 'Center' },
                        { value: 'right', text: 'Right' }
                    ]
                },
                'ShowZoomStrip': {
                    'description': 'Display zoom control below graph',
                    'baseType': 'BOOLEAN',
                    'defaultValue': false,
                    'isVisible': !this.properties.ResponsiveLayout
                },
                'ShowInteractiveGuideline': {
                    'description': 'Display Data Tooltip',
                    'baseType': 'BOOLEAN',
                    'defaultValue': false,
                    'isVisible': true
                },
                'FillArea': {
                    'description': 'Fill the area defined by line with color',
                    'baseType': 'BOOLEAN',
                    'defaultValue': false,
                    'isVisible' : true
                },
                'ShowLegend': {
                    'description': 'Show or hide the legend',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true
                },
                'LegendLocation': {
                    'description':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-location.description'),
                    'baseType':     'STRING',
                    'defaultValue': 'top',

                    'selectOptions': [
                        {
                            'value': 'right',
                            'text':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-location.select-options.right')
                        },
                        {
                            'value': 'top',
                            'text':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-location.select-options.top')
                        },
                        {
                            'value': 'bottom',
                            'text':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-location.select-options.bottom')
                        },
                        {
                            'value': 'left',
                            'text':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-location.select-options.left')
                        }
                    ]
                },

                'LegendOrientation': {
                    'description':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-orientation.description'),
                    'baseType':     'STRING',
                    'defaultValue': 'horizontal',

                    'selectOptions': [
                        {
                            'value': 'vertical',
                            'text':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-orientation.select-options.vertical')
                        },
                        {
                            'value': 'horizontal',
                            'text':  TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.legend-orientation.select-options.horizontal')
                        }
                    ]
                },

                'X-AxisMinimum': {
                    'isBindingTarget': true,
                    'isVisible':       true,
                    'description':     TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.x-axis-minimum.description'),
                    'baseType':        'DATETIME'
                },

                'X-AxisMaximum': {
                    'isBindingTarget': true,
                    'isVisible':       true,
                    'description':     TW.IDE.I18NController.translate('tw.timeserieschart-ide.properties.x-axis-maximum.description'),
                    'baseType':        'DATETIME'
                },
                /*
                'ShowX-AxisMinMax':{
                    'description': 'Display rounded min and max values',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true
                },
                */
                'AutoScale': {
                    'isVisible': true,
                    'description': 'Automatically scale the chart to fit data',
                    'baseType': 'BOOLEAN',
                    'defaultValue': true
                },
                'X-AxisIntervals': {
                    'description': 'Preferred X axis chart intervals (affects ticks, grid)',
                    'baseType': 'STRING',
                    'defaultValue': 'auto',
                    'selectOptions': [
                        {value: 'auto', text: 'Auto'},
                        {value: 'per', text: 'One Per Row'},
                    ]
                },
                'ShowX-AxisLabels': {
                 'description': 'Show Y axis labels and grid lines',
                 'baseType': 'BOOLEAN',
                 'defaultValue': true
                 },
                'ShowY-AxisMinMax':{
                    'description': 'Display rounded min and max values',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true
                },
                'Y-AxisIntervals': {
                    'description': 'Preferred Y axis chart intervals (affects ticks, grid)',
                    'baseType': 'STRING',
                    'selectOptions': [
                        { value: 'auto', text: 'Auto' },
                        { value: 'per', text: 'One Per Row' }
                    ]
                },            
                'ShowY-AxisLabels': {
                 'description': 'Show Y axis labels and grid lines',
                 'baseType': 'BOOLEAN',
                 'defaultValue': true
                 },
                'Y-AxisMinimum': {
                    'isBindingTarget': true,
                    'isVisible': true,
                    'description': 'Minimum range for the Y axis',
                    'baseType': 'NUMBER',
                    'defaultValue': 0.0
                },
                'Y-AxisMaximum': {
                    'isBindingTarget': true,
                    'isVisible': true,
                    'description': 'Maximum range for the Y axis',
                    'baseType': 'NUMBER',
                    'defaultValue': 100.0
                },
                'Margins':{
                    'isVisible': true,
                    'description': 'Additional label margin pixel values Top, Left, Bottom, Right',
                    'baseType': 'STRING',
                    'defaultValue': '0,0,0,0'
                },
                'Width': {
                    'defaultValue': 640
                },
                'Height': {
                    'defaultValue': 240
                },
                'Z-index': {
                    'baseType': 'NUMBER',
                    'defaultValue': 10
                }
            }
        };
        
        var seriesNumber;
        for (seriesNumber = 1; seriesNumber <= this.MAX_SERIES; seriesNumber++) {
            var datasetProperty = {
                'description': 'Series data source ' + seriesNumber,
                'isBindingTarget': true,
                'isEditable': false,
                'baseType': 'INFOTABLE',
                'warnIfNotBoundAsTarget': false,
                'isVisible': true
            };

            var datalabelProperty = {
                'description': 'Series data label ' + seriesNumber,
                'baseType': 'STRING',
                'isBindingTarget': true,
                'isVisible': true,
                'isLocalizable': true
            };

            var datafieldProperty = {
                'description': 'Series data field ' + seriesNumber,
                'baseType': 'FIELDNAME',
                'sourcePropertyName': 'Data',
                'isBindingTarget': false,
                'baseTypeRestriction': 'NUMBER',
                'isVisible': true
            };

            var xaxisfieldProperty = {
                'description': 'Series X axis field ' + seriesNumber,
                'baseType': 'FIELDNAME',
                'sourcePropertyName': 'Data',
                'isBindingTarget': false,
                'baseTypeRestriction': 'DATETIME',
                'isVisible': true
            };
            var seriesStyleProperty = {
                'description': 'Series style ' + seriesNumber,
                'baseType': 'STYLEDEFINITION',
                'isVisible': true
            };
            properties.properties['DataSource' + seriesNumber] = datasetProperty;
            properties.properties['DataField' + seriesNumber] = datafieldProperty;
            properties.properties['DataLabel' + seriesNumber] = datalabelProperty;
            properties.properties['X-AxisField' + seriesNumber] = xaxisfieldProperty;
            properties.properties['SeriesStyle' + seriesNumber] = seriesStyleProperty;
            properties.properties['SeriesStyle' + seriesNumber]['defaultValue'] = 'DefaultChartStyle' + seriesNumber;
        }

        return properties;
    };

    this.setSeriesProperties = function (value, singleSource) {
        var allWidgetProps = this.allWidgetProperties();

        var seriesNumber;

            if (singleSource) {
                for (seriesNumber = 1; seriesNumber <= value; seriesNumber++) {
                    allWidgetProps['properties']['DataField' + seriesNumber]['sourcePropertyName'] = 'Data';
                    allWidgetProps['properties']['DataField' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['SeriesStyle' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['DataLabel' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['DataSource' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['X-AxisField' + seriesNumber]['isVisible'] = false;
                }
                for (seriesNumber = value + 1; seriesNumber <= this.MAX_SERIES; seriesNumber++) {
                    allWidgetProps['properties']['DataField' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['SeriesStyle' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['DataLabel' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['DataSource' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['X-AxisField' + seriesNumber]['isVisible'] = false;
                }
                allWidgetProps['properties']['Data']['isVisible'] = true;
                allWidgetProps['properties']['X-AxisField']['isVisible'] = true;
            }else{
                for (seriesNumber = 1; seriesNumber <= value; seriesNumber++) {
                    allWidgetProps['properties']['DataField' + seriesNumber]['sourcePropertyName'] = 'DataSource' + seriesNumber;
                    allWidgetProps['properties']['DataField' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['SeriesStyle' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['DataLabel' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['DataSource' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['X-AxisField' + seriesNumber]['isVisible'] = true;
                    allWidgetProps['properties']['X-AxisField' + seriesNumber]['sourcePropertyName'] = 'DataSource' + seriesNumber;
                }
                for (seriesNumber = value + 1; seriesNumber <= this.MAX_SERIES; seriesNumber++) {
                    allWidgetProps['properties']['DataField' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['SeriesStyle' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['DataLabel' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['DataSource' + seriesNumber]['isVisible'] = false;
                    allWidgetProps['properties']['X-AxisField' + seriesNumber]['isVisible'] = false;
                }
                allWidgetProps['properties']['Data']['isVisible'] = false;
                allWidgetProps['properties']['X-AxisField']['isVisible'] = false;
            }
    };

    this.widgetEvents = function () {
        return {
        	'DoubleClicked': {}
        };
    };

    this.renderHtml = function () {
        var html = '';
        html += '<div class="widget-content widget-timeSeriesChartV2">'
             +  '<table height="100%" width="100%"><tr><td valign="middle" align="center">'
             +  '<span>Time Series Chart V2</span>'
             +  '</td></tr></table></div>';
        return html;
    };

    this.afterRender = function () {
        // this property can't be hidden in setProperties because ResponsiveLayout is still undefined in most cases
        widgetContainerId = '#' + this.jqElementId;
        // if this is in a inactive tab or similar we must prevent rendering until tab gets clicked
        if(this.properties.ResponsiveLayout){
            this.isResponsive = true;
        }
        if(this.isResponsive && $(widgetContainerId).closest('.widget-panel')) {
            this.isResponsive = false;

        }
            this.allWidgetProperties()['properties']['ShowZoomStrip']['isVisible']= !this.isResponsive;
            this.updatedProperties();
    };

    this.afterLoad = function () {
        // first function to run if widget already in mashup
        this.setSeriesProperties(this.getProperty('NumberOfSeries'), this.getProperty('SingleDataSource'));
    };

    this.afterSetProperty = function (name, value) {
        var allWidgetProps = this.allWidgetProperties();

        if (name === 'Width' ||
            name === 'Height' ||
            name==='ChartTitle' ||
            name==='Alignment') {
            return true;
        }

        if (name === 'ShowAxisLabels'){
            allWidgetProps['properties']['X-AxisLabel']['isVisible'] = this.getProperty('ShowAxisLabels');
            allWidgetProps['properties']['Y-AxisLabel']['isVisible'] = this.getProperty('ShowAxisLabels');
            this.updatedProperties();

            return true;
        }
/*
        if (name === 'TimeScale'){
            // check its value and change visibility of other properties affected
            var timeScale = this.getProperty('TimeScale');
            allWidgetProps['properties']['DateOrder']['isVisible'] = (timeScale !== 'y' || timeScale === 'auto');
            this.updatedProperties();

            return true;
        }
*/
        if (name === 'NumberOfSeries' || name === 'SingleDataSource') {
            this.setSeriesProperties(this.getProperty('NumberOfSeries'), this.getProperty('SingleDataSource'));
            this.updatedProperties();

            return true;
        }

        if (name.indexOf('Y-AxisMode') === 0) {
            this.setSeriesAxisProperties(this.getProperty('NumberOfSeries'));
            this.updatedProperties();

            return true;
        }
    };
    
    this.beforeSetProperty = function (name, value) {
        // first function called on a drop into mashup
        this.setSeriesProperties(this.getProperty('NumberOfSeries'), this.getProperty('SingleDataSource'));
        if (name === 'NumberOfSeries') {
            value = parseInt(value, 10);
            if (value <= 0 || value > 8)
                return "Number Of Series Must Be Between 1 and 8";
        }
    };

    this.validate = function () {
        var result = [];

        if (!this.isPropertyBoundAsTarget('Data')) {
        	var bound = false;
        	
            for (var seriesNumber = 1; seriesNumber <= this.MAX_SERIES; seriesNumber++) {
                var dsProperty = 'DataSource' + seriesNumber;
                if(this.isPropertyBoundAsTarget(dsProperty)) {
                	bound = true;
                	break;
                }
            }
            
            if(!bound)
            	result.push({ severity: 'warning', message: 'You must assign at least one data source' });
        }

        return result;
    };
    
    this.afterAddBindingSource = function (bindingInfo) {
        if (bindingInfo.targetProperty == "Data") {
            this.setProperty('SingleDataSource', true);

            this.setSeriesProperties(this.getProperty('NumberOfSeries'), this.getProperty('SingleDataSource'));
            this.updatedProperties();
        }
    };
};
