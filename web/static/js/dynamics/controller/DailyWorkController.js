var DailyWorkController = function(options) {
    this.id                      = options.id;
    this.myWorkListElement       = options.myWorkListElement;
    this.whatsNextListElement    = options.whatsNextListElement;

    this.init();
    this.initializeConfigs();
    this.paint();
};

DailyWorkController.prototype = new CommonController();

DailyWorkController.prototype.paint = function() {
    var me = this;
    
    ModelFactory.initializeFor(
        ModelFactory.initializeForTypes.dailyWork,
        this.id, 
        function(model) {
            me.model = model;
            me.createTaskLists();
        }
    );
};

DailyWorkController.prototype.createTaskLists = function() {
    this.createMyWorkList();
    this.createWhatsNextList();
};

DailyWorkController.prototype.createMyWorkList = function() {
    this.myWorkListView = new DynamicTable(
        this, 
        this.model, 
        this.myWorkListConfig,
        this.myWorkListElement
    );

    this.myWorkListView.dailyWorkViewType = "myWork";
    this.myWorkListView.render();
};

DailyWorkController.prototype.createWhatsNextList = function() {
    this.whatsNextListView = new DynamicTable(
        this, 
        this.model, 
        this.whatsNextListConfig,
        this.whatsNextListElement
    );

    this.whatsNextListView.render();
    this.whatsNextListView.dailyWorkViewType = "whatsNext";
};

DailyWorkController.prototype.taskControllerFactory = function(view, model) {
    var taskController = new TaskController(model, view, this);
    this.addChildController("dailyWorkTask", taskController);
    return taskController;
};

DailyWorkController.prototype.dailyWorkTaskControllerFactory = function(view, model) {
    var taskController = new DailyWorkTaskController(model, view, this);
    this.addChildController("dailyWorkTask", taskController);
    return taskController;
};

DailyWorkController.prototype.createConfig = function(configType) {
    var options = {};
    var actionColumnFactory = null;
    var sortCallback = null;
    
    if (configType == 'next') {
        options.caption = "Tasks I'm going to do next";
        options.dataSource = DailyWorkModel.prototype.getWhatsNexts;

        options.rowControllerFactory = DailyWorkController.prototype.dailyWorkTaskControllerFactory;
        options.sortCallback = DailyWorkTaskController.prototype.sortAndMoveDailyTask;
        options.sortOptions = {
                items: "> .dynamicTableDataRow",
                handle: "." + DynamicTable.cssClasses.dragHandle,
                // keep the tasks within this control
                containment: this.whatsNextListElement,
                axis: 'y'
        };
        
        options.appendTailer = true;

        sortCallback        = DynamicsComparators.valueComparatorFactory(DailyWorkTaskModel.prototype.getWhatsNextRank);
        actionColumnFactory = DailyWorkTaskController.prototype.actionColumnFactory;
    }
    else {
        options.caption = "Tasks assigned to me";
        options.dataSource = DailyWorkModel.prototype.getMyWorks;
        actionColumnFactory = TaskController.prototype.actionColumnFactory;

        options.tableDroppable = true;
        options.alwaysDrop = true;
        options.dropOptions = {
            accepts: function(model) {
                return (model instanceof DailyWorkTaskModel);
            },
            callback: function() {
            }
        };
        
        options.cssClassResolver = DailyWorkTaskController.prototype.cssClassResolver;
        options.rowControllerFactory = DailyWorkController.prototype.taskControllerFactory;
        options.sortCallback = DailyWorkTaskController.prototype.addAndRankDailyTask;
        options.sortOptions = {
                items: "> .dynamicTableDataRow",
                handle: "." + DynamicTable.cssClasses.dragHandle,
                // -sortable-tasklist
                connectWith: ".dynamictable > .ui-sortable",
                helper: 'clone',
                cancel: '.daily-work-next-assigned > .task-row'
        };

        sortCallback = DynamicsComparators.valueComparatorFactory(TaskModel.prototype.getRank);
    }
    
    var config = new DynamicTableConfiguration(options);
    config.addColumnConfiguration(TaskController.columnIndices.prio, {
        minWidth : 24,
        autoScale : true,
        cssClass : 'task-row',
        title : "#",
        headerTooltip : 'Priority',
        sortCallback: sortCallback,
        defaultSortColumn: true,
        subViewFactory: TaskController.prototype.toggleFactory
    });
    
    config.addColumnConfiguration(TaskController.columnIndices.name, {
        minWidth : 200,
        autoScale : true,
        cssClass : 'task-row',
        title : "Name",
        headerTooltip : 'Task name',
        get : TaskModel.prototype.getName,
        editable : true,
        dragHandle: true,
        edit : {
            editor : "Text",
            set : TaskModel.prototype.setName,
            required: true
        }
    });

    config.addColumnConfiguration(TaskController.columnIndices.state, {
        minWidth : 60,
        autoScale : true,
        cssClass : 'task-row',
        title : "State",
        headerTooltip : 'Task state',
        get : TaskModel.prototype.getState,
        decorator: DynamicsDecorators.stateColorDecorator,
        editable : true,
        sortCallback: DynamicsComparators.valueComparatorFactory(TaskModel.prototype.getState),
        edit : {
            editor : "SingleSelection",
            set : TaskModel.prototype.setState,
            items : DynamicsDecorators.stateOptions
        }
    });

    config.addColumnConfiguration(TaskController.columnIndices.responsibles, {
        minWidth : 60,
        autoScale : true,
        cssClass : 'task-row',
        title : "Responsibles",
        headerTooltip : 'Task responsibles',
        get : TaskModel.prototype.getResponsibles,
        getView : TaskModel.prototype.getAnnotatedResponsibles,
        decorator: DynamicsDecorators.annotatedUserInitialsListDecorator,
        editable : true,
        edit : {
            editor : "User",
            set : TaskModel.prototype.setResponsibles
        }
    });

    config.addColumnConfiguration(TaskController.columnIndices.el, {
        minWidth : 30,
        autoScale : true,
        cssClass : 'task-row',
        title : "EL",
        headerTooltip : 'Effort left',
        get : TaskModel.prototype.getEffortLeft,
        decorator: DynamicsDecorators.exactEstimateDecorator,
        editable : true,
        editableCallback: TaskController.prototype.effortLeftEditable,
        edit : {
        editor : "ExactEstimate",
        decorator: DynamicsDecorators.exactEstimateEditDecorator,
        set : TaskModel.prototype.setEffortLeft
    }
    });

    config.addColumnConfiguration(TaskController.columnIndices.oe, {
        minWidth : 30,
        autoScale : true,
        cssClass : 'task-row',
        title : "OE",
        headerTooltip : 'Original estimate',
        get : TaskModel.prototype.getOriginalEstimate,
        decorator: DynamicsDecorators.exactEstimateDecorator,
        editable : true,
        editableCallback: TaskController.prototype.originalEstimateEditable,
        edit : {
        editor : "ExactEstimate",
        decorator: DynamicsDecorators.exactEstimateEditDecorator,
        set : TaskModel.prototype.setOriginalEstimate
    }
    });

    if (Configuration.isTimesheetsEnabled()) {
        config.addColumnConfiguration(TaskController.columnIndices.es, {
            minWidth : 30,
            autoScale : true,
            cssClass : 'task-row',
            title : "ES",
            headerTooltip : 'Effort spent',
            get : TaskModel.prototype.getEffortSpent,
            decorator: DynamicsDecorators.exactEstimateDecorator
        });
    }

    config.addColumnConfiguration(TaskController.columnIndices.actions, {
        minWidth : 35,
        autoScale : true,
        cssClass : 'task-row',
        title : "Edit",
        subViewFactory: actionColumnFactory
    });

    config.addColumnConfiguration(TaskController.columnIndices.description, {
        fullWidth : true,
        get : TaskModel.prototype.getDescription,
        cssClass : 'task-data',
        visible : false,
        editable : true,
        edit : {
        editor : "Wysiwyg",
        set : TaskModel.prototype.setDescription
    }
    });

    config.addColumnConfiguration(TaskController.columnIndices.buttons, {
        fullWidth : true,
        visible : false,
        cssClass : 'task-row',
        subViewFactory : TaskController.prototype.taskButtonFactory
    });
    
    return config;
};

DailyWorkController.prototype.initializeConfigs = function() {
    this.myWorkListConfig    = this.createConfig('current'); 
    this.whatsNextListConfig = this.createConfig('next'); 
};
