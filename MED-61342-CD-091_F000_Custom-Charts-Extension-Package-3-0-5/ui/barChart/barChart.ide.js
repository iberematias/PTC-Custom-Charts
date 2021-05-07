/*global Encoder,TW */

TW.IDE.Widgets.barChart = function () {

    // max could be much higher
    this.MAX_SERIES = 8;
    this.widgetIconUrl = function () {
        //widget
        //return  "../Common/thingworx/widgets/barChart/images/barChart.ide.png";
        //extension
        return  "../Common/extensions/chartWidget_ExtensionPackage/ui/barChart/images/barChart.ide.png";
    };
    // store datashape and data bindings for use when multiple service bindings are used to populate chart
    // also keep in a simple list to serial and deserialize
    // first add empty slot for no selection
    var multiServiceDataShape = [{'value': '', 'text' : ''}];
    var dataShapeList = [];
    var dataSourceList = [{'value': '', 'text' : ''}];
    var dataSources = [];

    /*
     ****************************************************************************************************************************************************************
     Widget
     ****************************************************************************************************************************************************************
     */

    /**
     * Invoked by the runtime to find out what properties this widget declares.
     * @return <Object>        The list of properties this widget supports.
     */
    this.widgetProperties = function () {
        var properties = {
            'name': 'Bar Chart',
            'description': 'Displays a bar chart',
            'category': ['Data', 'Charts'],
            'supportsLabel': false,
	        'supportsAutoResize': true,
            'borderWidth': 1,
            'defaultBindingTargetProperty': 'Data',
            'properties': {
                'SingleDataSource': {
                    'description': 'Use a single data source',
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
                    'description': 'Chart title',
                    'baseType': 'STRING',
                    'isBindingTarget': true,
                    'defaultValue': '',
                    'isVisible': true,
                    'isLocalizable': true
                },
                'ShowAxisLabels':{
                    'description': 'Show major axis labels',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true
                },
                'X-AxisLabel': {
                    'description': 'Label for x-axis',
                    'defaultValue': 'X Axis',
                    'baseType': 'STRING',
                    'isLocalizable': true,
                    'isVisible': true
                },
                'X-AxisField': {
                    'description': 'Field that identifies bar contents',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data',
                    'isBindingTarget': false,
                    'isVisible': true
                },
                'LabelDataSource': {
                    'description': '[Optional] Pick a data source to provide the field for x-axis labels when multiple data bindings are used',
                    'baseType': 'STRING',
                    'isVisible': false,
                    'selectOptions' : []
                },
                'LabelField': {
                    'description': '[Optional] Pick a field to provide labels for x-axis when multiple data bindings are used',
                    'baseType': 'STRING',
                    'isVisible': false,
                    'selectOptions' : []
                },
                'Y-AxisLabel': {
                    'description': 'Label for y-axis',
                    'defaultValue': 'Y Axis',
                    'baseType': 'STRING',
                    'isLocalizable': true,
                    'isVisible': true
                },
                'LabelAngle':{
                    'description': 'Longer labels in chart fit diagonally',
                    'defaultValue': 0,
                    'baseType': 'INTEGER'
                },
                'Duration':{
                    'description': 'Length of chart animation in milliseconds',
                    'defaultValue':500,
                    'baseType':'NUMBER'
                },
                'ChartBodyStyle': {
                    'description': 'Chart overall style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultChartStyle'
                },
                'ChartAxisStyle': {
                    'description': 'Chart grid and outline style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultChartAxisStyle'
                },
                'ChartTooltipStyle': {
                    'description': 'Chart axes tooltip style',
                    'baseType': 'STYLEDEFINITION',
                    'isVisible': true,
                    'defaultValue': 'DefaultTooltipStyle'
                },
                'ChartTitleStyle': {
                    'description': 'Chart title style',
                    'baseType': 'STYLEDEFINITION',
                    'defaultValue': 'DefaultChartTitleStyle'
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
                /*  no use case for not having this on
                 'UseInteractiveGuideline': {
                    'description': 'Display data under mouse',
                    'baseType': 'BOOLEAN',
                    'defaultValue': true
                },
                */
                'ShowLegend': {
                    'description': 'Show or hide the legend for multiple series',
                    'baseType': 'BOOLEAN',
                    'defaultValue': true
                },
                /* breaks grid intervals
                'ShowX-AxisMinMax':{
                    'description': 'Display min and max values',
                    'baseType': 'BOOLEAN',
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
                    'description': 'Preferred X-axis chart intervals (affects ticks, grid)',
                    'baseType': 'STRING',
                    'defaultValue': 'per',
                    'selectOptions': [
                        {value: 'auto', text: 'Auto'},
                        {value: 'per', text: 'One Per Row'}
                    ],
                    'isVisible': true
                },
                'ShowX-AxisLabels': {
                    'description': 'Show X axis labels',
                    'baseType': 'BOOLEAN',
                    'defaultValue': true
                },
                'TruncateX-AxisLabels': {
                    'description': 'Max characters to display before truncating with ellipses and showing full label text in tooltip. Default 0 disables feature, negative values truncate from start.',
                    'defaultValue': 0,
                    'baseType': 'INTEGER'
                },
                 'ShowY-AxisMinMax':{
                    'description': 'Display rounded min and max values',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true
                },
                'Y-AxisIntervals': {
                    'description': 'Preferred y-axis chart intervals (affects ticks, grid)',
                    'baseType': 'STRING',
                    'selectOptions': [
                        { value: 'auto', text: 'Auto' },
                        { value: 'per', text: 'One Per Row' }
                    ]
                },
                'ShowY-AxisLabels': {
                    'description': 'Show y-axis labels',
                    'baseType': 'BOOLEAN',
                    'defaultValue': true
                },
                'TruncateY-AxisLabels': {
                    'description': 'Max characters to display before truncating with ellipses and showing full label text in tooltip. Default 0 disables feature, negative values truncate from start.',
                    'defaultValue': 0,
                    'baseType': 'INTEGER'
                },
                'Y-AxisMinimum': {
                    'isBindingTarget': true,
                    'isVisible': true,
                    'description': 'Minimum range for the y-axis',
                    'baseType': 'NUMBER',
                    'defaultValue': 0.0
                },
                'Y-AxisMaximum': {
                    'isBindingTarget': true,
                    'isVisible': true,
                    'description': 'Maximum range for the y-axis',
                    'baseType': 'NUMBER',
                    'defaultValue': 100.0
                },
                'DataDisplay': {
                    'description': 'For single series only: show values over each bar or when mouse hovers over',
                    'baseType': 'STRING',
                    'selectOptions': [
                        { value: 'none', text: 'None' },
                        { value: 'EnableHover', text: 'Hover' },
                        { value: 'ShowValues', text: 'Show Values' }
                    ],
                    'isVisible': false,
                    'defaultValue': 'EnableHover'
                },
                'EnableHover': {
                    'description': 'Enable display of values on hover',
                    'baseType': 'BOOLEAN',
                    'isVisible': false,
                    'defaultValue': true
                },
                'ShowValues': {
                    'description': 'Enable display of values above each bar',
                    'baseType': 'BOOLEAN',
                    'isVisible': false,
                    'defaultValue': false
                },
                'ShowValuesFormat': {
                    'description': 'Set number of decimal places to display with ShowValues',
                    'baseType': 'NUMBER',
                    'isVisible': false,
                    'defaultValue': 2
                },
                'Margins':{
                    'isVisible': true,
                    'description': 'Additional label margin pixel values top, left, bottom, right',
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
                },

                // ******************************************** INTERNAL PROPERTIES ********************************************
                _boundDataSources : {
                    defaultValue : "",
                    baseType : 'STRING',
                    isVisible : false
                },
                _dataShape : {
                    defaultValue : "",
                    baseType : 'STRING',
                    isVisible : false
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

            var seriesStyleProperty = {
                'description': 'Series style ' + seriesNumber,
                'baseType': 'STYLEDEFINITION',
                'isVisible': true
            };

            properties.properties['DataSource' + seriesNumber] = datasetProperty;
            properties.properties['DataField' + seriesNumber] = datafieldProperty;
            properties.properties['DataLabel' + seriesNumber] = datalabelProperty;
            properties.properties['SeriesStyle' + seriesNumber] = seriesStyleProperty;
            properties.properties['SeriesStyle' + seriesNumber]['defaultValue'] = 'DefaultChartStyle' + seriesNumber;
        }

        return properties;
    };

    this.setSeriesAxisProperties = function(value) {

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

            var seriesStyleProperty = {
                'description': 'Series style ' + seriesNumber,
                'baseType': 'STYLEDEFINITION',
                'isVisible': true
            };
            properties.properties['DataSource' + seriesNumber] = datasetProperty;
            properties.properties['DataField' + seriesNumber] = datafieldProperty;
            properties.properties['DataLabel' + seriesNumber] = datalabelProperty;
            properties.properties['SeriesStyle' + seriesNumber] = seriesStyleProperty;
            properties.properties['SeriesStyle' + seriesNumber]['defaultValue'] = 'DefaultChartStyle' + seriesNumber;
        }

        return properties;
    };

    this.setSeriesProperties = function (value, singleSource) {

        var allWidgetProps = this.allWidgetProperties().properties;
        var seriesNumber;

        if (singleSource) {
            for (seriesNumber = 1; seriesNumber <= value; seriesNumber++) {
                allWidgetProps['DataField' + seriesNumber]['sourcePropertyName'] = 'Data';
                allWidgetProps['DataField' + seriesNumber]['isVisible'] = true;
                allWidgetProps['SeriesStyle' + seriesNumber]['isVisible'] = true;
                allWidgetProps['DataLabel' + seriesNumber]['isVisible'] = true;
                allWidgetProps['DataSource' + seriesNumber]['isVisible'] = false;
            }
            for (seriesNumber = value + 1; seriesNumber <= this.MAX_SERIES; seriesNumber++) {
                allWidgetProps['DataField' + seriesNumber]['isVisible'] = false;
                allWidgetProps['SeriesStyle' + seriesNumber]['isVisible'] = false;
                allWidgetProps['DataLabel' + seriesNumber]['isVisible'] = false;
                allWidgetProps['DataSource' + seriesNumber]['isVisible'] = false;
            }
            allWidgetProps['Data']['isVisible'] = true;
        }else{
            for (seriesNumber = 1; seriesNumber <= value; seriesNumber++) {
                allWidgetProps['DataField' + seriesNumber]['sourcePropertyName'] = 'DataSource' + seriesNumber;
                allWidgetProps['DataField' + seriesNumber]['isVisible'] = true;
                allWidgetProps['SeriesStyle' + seriesNumber]['isVisible'] = true;
                allWidgetProps['DataLabel' + seriesNumber]['isVisible'] = true;
                allWidgetProps['DataSource' + seriesNumber]['isVisible'] = true;
            }
            for (seriesNumber = value + 1; seriesNumber <= this.MAX_SERIES; seriesNumber++) {
                allWidgetProps['DataField' + seriesNumber]['isVisible'] = false;
                allWidgetProps['SeriesStyle' + seriesNumber]['isVisible'] = false;
                allWidgetProps['DataLabel' + seriesNumber]['isVisible'] = false;
                allWidgetProps['DataSource' + seriesNumber]['isVisible'] = false;
            }
            allWidgetProps['Data']['isVisible'] = false;
        }
    };

    /**
     * Invoked by the runtime to find out what events this widget declares.
     * @return <Object> The list of events this widget can trigger.
     */
    this.widgetEvents = function () {
        return {
        	'DoubleClicked': {}
        };
    };

    /**
     * Invoked by the runtime when the widget has to be rendered. This function should provide the HTML contents of
     * this widget.
     * @return <String> The widget's content as an HTML string.
     */
    this.renderHtml = function () {
        var html = '';
        html += '<div class="widget-content widget-barChart">'
             +  '<table height="100%" width="100%"><tr><td valign="middle" align="center">'
             +  '<span>Bar Chart</span>'
             +  '</td></tr></table></div>';
        return html;
    };

    /**
     * Invoked by the runtime immediately after this widget was placed in a mashup.
     * before widget is rendered
     */
    this.afterLoad = function () {
        var thisWidget = this;
        var allWidgetProps = thisWidget.allWidgetProperties().properties;
        thisWidget.setSeriesProperties(thisWidget.getProperty('NumberOfSeries'), thisWidget.getProperty('SingleDataSource'));

        //reconstitute dataSources and datashape on reopening configured widget
        if (thisWidget.getProperty('_boundDataSources') !== '') {
            dataSources = String(thisWidget.getProperty('_boundDataSources')).split(',');
            dataShapeList = String(thisWidget.getProperty('_dataShape')).split(',');
            var properties = this.allWidgetProperties().properties;
            var i, value;
            // put configured datashape field names in LabelField dropdown
            for (i = 0; i < dataShapeList.length; i++) {
                value = dataShapeList[i];
                multiServiceDataShape.push({'value': value, 'text': value});
            }
            properties['LabelField']['selectOptions'] = multiServiceDataShape;

            // put configured dataSource names in LabelDataSource dropdown
            for (i = 0; i < dataSources.length; i++) {
                value = dataSources[i];
                dataSourceList.push({'value': value, 'text': value});
            }
            properties['LabelDataSource']['selectOptions'] = dataSourceList;

            // but only display the properties if there are enough datasources to require them (more than one)
            if (dataSources.length > 1) {
                properties['LabelDataSource']['isVisible'] = true;
                properties['LabelField']['isVisible'] = true;
                this.updatedProperties();
            }
        }

        allWidgetProps['EnableHover']['isVisible'] = (this.getProperty('NumberOfSeries') !== 1);
        allWidgetProps['DataDisplay']['isVisible'] = (this.getProperty('NumberOfSeries') === 1);
        allWidgetProps['ShowValuesFormat']['isVisible'] = this.getProperty('ShowValues');
    };

    /**
     * Invoked by the runtime after the developer changes any widget property.
     * @param name <String>            The name of the property that was changed.
     * @param value <AnyObject>        The property's new value.
     * @return <Boolean, nullable>    If set to YES, the widget will be re-rendered, otherwise the widget will not be re-rendered.
     */
    this.afterSetProperty = function (name, value) {
        var allWidgetProps = this.allWidgetProperties().properties;

        if (name === 'Width' ||
            name === 'Height' ||
            name==='ChartTitle' ||
            name==='Alignment') {
            return true;
        }

        if (name === 'ShowAxisLabels'){
            allWidgetProps['X-AxisLabel']['isVisible'] = this.getProperty('ShowAxisLabels');
            allWidgetProps['Y-AxisLabel']['isVisible'] = this.getProperty('ShowAxisLabels');
            this.updatedProperties();
            return true;
        }

        if (name === 'NumberOfSeries' ) {

            var singleSeries = this.getProperty('NumberOfSeries') === 1;
            allWidgetProps['ShowValuesFormat']['isVisible'] = this.getProperty('ShowValues');
            allWidgetProps['DataDisplay']['isVisible'] = singleSeries;
            allWidgetProps['ShowX-AxisLabels']['isVisible'] = singleSeries;
            allWidgetProps['EnableHover']['isVisible'] = !singleSeries;
            this.setSeriesProperties(this.getProperty('NumberOfSeries'));
            this.updatedProperties();

            return true;
        }

        if (name === 'DataDisplay') {
            if (value === "ShowValues"){
                this.setProperty('ShowValues', true);
                this.setProperty('EnableHover', false);
            } else if (value === "EnableHover"){
                this.setProperty('EnableHover', true);
                this.setProperty('ShowValues', false);
            } else if (value === "none"){
                this.setProperty('EnableHover', false);
                this.setProperty('ShowValues', false);
            }
            allWidgetProps['ShowValuesFormat']['isVisible'] = this.getProperty('ShowValues');
            this.updatedProperties();

            return true;
        }

        if (name === "EnableHover"){
            if(value === true) {
                this.setProperty("DataDisplay", "EnableHover");
                this.setProperty("ShowValues", false);
            }
            if(value === false && this.getProperty("ShowValues") === false) {
                this.setProperty("DataDisplay", "none");
            }
            return true;
        }

        if (name.indexOf('Y-AxisMode') === 0) {
            this.setSeriesAxisProperties(this.getProperty('NumberOfSeries'));
            this.updatedProperties();

            return true;
        }
    };

    /**
     * Invoked by the runtime whenever the developer changes a widget property
     * called before the requested widget property change is performed to allow validation.
     * @param name <String> The name of the property that was changed.
     * @param value <AnyObject> The property's new value.
     * @return <String>  A message to developer will be displayed in IDE if the new property value is not valid.
     *                    Property will not be set to new value if message is returned.
     */
    this.beforeSetProperty = function (name, value) {
        this.setSeriesProperties(this.getProperty('NumberOfSeries'), this.getProperty('SingleDataSource'));
        if (name === 'NumberOfSeries') {
            value = parseInt(value, 10);
            if (value <= 0 || value > 8) {
                return "Number Of Series Must Be Between 1 and 8";
            }
        }
    };

    /**
     * Called when IDE refreshes its to-do list
     * @return <Object>  An object containing severity and message properties
     * A message to developer will be displayed in IDE if the new property value is not valid.
     */
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

    /**
     * Invoked by the platform whenever the user binds a data source to a property on this widget.
     * @param bindingInfo <Object>        An object containing the newly created binding's properties.
     */
    this.afterAddBindingSource = function (bindingInfo) {
        var thisWidget = this;
        var property = bindingInfo.targetProperty;
        var properties = thisWidget.allWidgetProperties().properties;
        var seriesNum = thisWidget.getProperty('NumberOfSeries');

        if( seriesNum === dataSources.length && seriesNum < thisWidget.MAX_SERIES){
            thisWidget.setProperty('NumberOfSeries', thisWidget.getProperty('NumberOfSeries') + 1);
        }
        // minimum binding requirement is met
        if (property.indexOf('Data') > -1) {
            this.jqElement.find(".configuration-warning").remove();
        }
        //adding multiple data services to populate chart - only need one dataShape - they all must be same
        if (property.indexOf('DataSource') > -1) {
            thisWidget.setProperty('SingleDataSource', false);
            var dataShape = thisWidget.getInfotableMetadataForProperty(property) || {};
            // build field names list if it is not already defined
            if(dataSources.length === 0 ) {
                thisWidget.setProperty('_dataShape', "");
                for (var key in dataShape) {
                    // check also if property is not inherited from prototype
                    if (dataShape.hasOwnProperty(key)) {
                        var value = dataShape[key];
                        multiServiceDataShape.push({'value': value.name, 'text': value.name});
                        dataShapeList.push(value.name);
                    }
                }
            }
            // build up an array of datashape names and types to allow user to pick dataSource to provide x-axis label field
            dataSourceList.push({'value': property, 'text' : property});
            // also provide a simple list of data sources to runtime to match them to the dataSource x-axis label field
            dataSources.push(property);

            properties['LabelField']['selectOptions'] = multiServiceDataShape;
            properties['LabelField']['isEditable'] = true;
            properties['LabelField']['isVisible'] = true;

            thisWidget.setProperty('_boundDataSources', dataSources.join(','));
            thisWidget.setProperty('_dataShape', dataShapeList.join(','));

            properties['LabelDataSource']['selectOptions'] = dataSourceList;
            properties['LabelDataSource']['isEditable'] = true;
            properties['LabelDataSource']['isVisible'] = true;

            this.setSeriesProperties(this.getProperty('NumberOfSeries'), this.getProperty('SingleDataSource'));
            this.updatedProperties();
        }
    };

    /**
     * Invoked by the platform whenever the user unbinds a data source to a property on this widget.
     * @param bindingInfo <Object>        An object containing the newly removed binding's properties.
     */
    this.afterRemoveBindingSource = function (bindingInfo) {
        var thisWidget = this;
        var property = bindingInfo.targetProperty;
        var properties = thisWidget.allWidgetProperties().properties;

        // remove the datasource that was unbound
        for(var i = 0; i < dataSourceList.length; i++){
            if(dataSourceList[i].value === property){
                dataSourceList.splice(i, 1);
            }
        }

        // dataSources is not in same order as dataSourceList so splice separately
        for(var i = 0; i < dataSources.length; i++){
            if(dataSources[i] === property){
                dataSources.splice(i, 1);
            }
        }

        thisWidget.setProperty('_boundDataSources', dataSources.join(','));

        if (property.indexOf('DataSource') > -1) {

            // the LabelField doesn't provide any functionality when there is one binding
            if (dataSources.length <= 1){
                properties['LabelField']['isVisible'] = false;
                properties['LabelDataSource']['isVisible'] = false;
                this.updatedProperties();
            }
        }

        //all data bindings were removed - sound the alarm!
        if (dataSources.length === 0 && property.indexOf('Data') > -1) {
            thisWidget.setProperty('_dataShape', "");
            this.addNoBindingWarning();
        }

        this.updatedProperties();
    };

    /**
     * Invoked by the platform to retrieve the data shape associated with an InfoTable property.
     * @param propertyName <String>                The name of the property whose data shape should be returned.
     * @return <String or Object, nullable>        The data shape field definitions object or a string identifying a data shape in the platform.
     *                                            The return value may also be undefined if the data shape cannot be determined at design time.
     */
    this.getSourceDatashapeName = function (propertyName) {
            return this.getInfotableMetadataForProperty(propertyName) || this.getProperty('DataShape');
    };

    this.addNoBindingWarning = function() {
        this.jqElement.find(".configuration-warning").remove();
        var configurationWarningElement = '<div class="configuration-warning">' + TW.Runtime.convertHTMLLocalizableString("[[mustBeBoundToData]]", "Must be bound to data.") + '</div>';
        this.jqElement.append(configurationWarningElement);
    };
};
