//个人信息页面及其子页面接口对接
var contractCenter = (function () {
    return {
        tabIndex: 0,//页面tab下标
        tabObjList: [//tab对象列表
            {name: "allContract", hadInit: false},
            {name: "myWait", hadInit: false},
            {name: "myDone", hadInit: false},
            {name: "myApply", hadInit: false},
            {name: "myRead", hadInit: false},
            {name: "myPress", hadInit: false},
            {name: "myWaitDone", hadInit: false}
        ],

        //页面初始化函数
        init: function () {
            var self = this;
            this.tabIndex = momo.getURLElement("tabIndex") ? momo.getURLElement("tabIndex") : this.tabIndex;
            if (momo.addMenuItem("contractCenter") == "over")return;//添加左边菜单栏
            if (sessionStorage.getItem("isMaster") == "true") {//若是管理员，则显示所有合同列表
                $("#tabBar .allList").css("display", "inline-block");
            }
            else if (this.tabIndex < 1) {//若不是管理员，则不让显示全部列表
                this.tabIndex = 1;
            }

            //添加tab点击事件
            $(document).on("click", "#tabBar span", function () {
                self.tabIndex = $(this).index();
                $(".tabBox").hide();
                $("#tabBox" + self.tabIndex).show();
                $("#tabBar span").removeClass("active");
                $(this).addClass("active");
                if (!self.tabObjList[self.tabIndex].hadInit) {
                    self.tabObjList[self.tabIndex].hadInit = true;
                    self[self.tabObjList[self.tabIndex].name].init();
                }

                //判断点击的是否是我的待办
                if (self.tabIndex == 1) $("#tabBar .m_redPoint").hide();//是否是我的待办
                else if ($("#tabBar .m_redPoint").text().length)$("#tabBar .m_redPoint").show();

            });

            //动态设置Index的值
            if (momo.getURLElement("tabIndex"))this.tabIndex = momo.getURLElement("tabIndex");

            //显示页面内容
            $("#tabBar span").eq(this.tabIndex).click();
        },

        //合同列表对象
        allContract: {
            tableObj: {},
            //页面初始化函数
            init: function () {
                console.log("---------------allContract");
                //设置Input框输入约束
                momo.addInputRule(".condition", {
                    maxLength: 99,
                    minValue: 0,
                    //maxValue: 100000
                }, function () {});


                //初始化列表
                this.tableObj = new momoTable({
                        width: "100%",
                        singlePageItemNum: 20,
                        singlePageItemName: "pageNumber",
                        itemKeyName: "selfMainBodyId",//表格ID
                        tableID: "#momoTable0",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        dataUrl: "contract/getcontract",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 3, valueName: "contractName", className: ""},
                        {title: "发起人", width: 1.5, valueName: "createName", className: ""},
                        {title: "发起时间", width: 1.5, valueName: "createDateString", className: ""},
                        {title: "状态", width: 1, valueName: "statusstr", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken};
                this.tableObj.init();

                //初始化时间插件
                $("#d_createDatebegin").datepicker();
                $("#d_createDateend").datepicker();
                $("#d_expiryDateStartstr").datepicker();
                $("#d_expiryDateEndstr").datepicker();
                $("#d_createDatebegin").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#d_createDateend").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#d_expiryDateStartstr").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#d_expiryDateEndstr").datepicker("option", "dateFormat", "yy-mm-dd");

                this.addEvent();
                this.addJumpEvent();//添加点击跳转
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                var self = this;
                $(document).on("click", "#momoTable0 tr", function () {
                    var index = $(this).index() - 1;
                    if (index < 0)return;
                    console.log("----------");
                    console.log(self.tableObj.dataItemList);
                    var item = self.tableObj.dataItemList[index];
                    var href = "./contractDetail.html?"
                        + "name=" + item.contractName
                        + "&from=" + "all"
                        + "&type=" + "detail"
                        + "&menuIndex=" + "2-0"
                        + "&instanceID=" + item.intanceId
                        + "&contractId=" + item.contractId
                        + "&processID=" + item.processId
                        + "&accessToken=" + momo.accessToken;
                    console.log(href);
                    //return;
                    location.href = href;
                })
            },

            //添加事件监听
            addEvent: function () {
                var self = this;

                //高级筛选
                $(document).on("click", "#tabBox0 .condition .tip", function () {
                    var text = $(this).text();
                    if (text == "展开") {
                        $(this).text("收起");
                        $("#tabBox0 .condition ").height("320px");
                    }
                    else {
                        $(this).text("展开");
                        $("#tabBox0 .condition ").height("50px");
                    }
                });

                //高级筛选条件重置
                $(document).on("click", "#tabBox0 .resetBtn", function () {
                    $("#tabBox0 .condition .d_status").val("");
                    $("#tabBox0 .condition .d_paymentType").val("");
                    $("#tabBox0 .condition .d_costTypeName").val("");
                    $("#tabBox0 .condition .d_selfMainBodyName").val("");
                    $("#tabBox0 .condition .d_otherMainBodyName").val("");
                    $("#tabBox0 .condition .d_requisitionerName").val("");
                    $("#tabBox0 .condition .d_requisitionerDepa").val("");
                    $("#tabBox0 .condition .d_createBy").val("");
                    $("#tabBox0 .condition .d_appliDepa").val("");
                    $("#tabBox0 .condition #d_expiryDateStartstr").val("");
                    $("#tabBox0 .condition #d_expiryDateEndstr").val("");
                    $("#tabBox0 .condition #d_createDatebegin").val("");
                    $("#tabBox0 .condition #d_createDateend").val("");
                    $("#tabBox0 .condition #d_minMoney").val("");
                    $("#tabBox0 .condition #d_maxMoney").val("");
                    self.searchData();
                });

                //关键字搜索
                $(document).on("click", "#tabBox0 .keyWord span", this.searchKey.bind(this));

                //高级搜索
                $(document).on("click", "#tabBox0 .condition .submitBtn", this.searchData.bind(this));

                //导出
                $(document).on("click", "#tabBox0 .loadBtn .load", this.loadExcel.bind(this));
            },
            //

            //关键字搜索
            searchKey: function () {
                var keyword = $("#tabBox0 .keyWord input").val();
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken, "keyword": keyword};
                this.tableObj.curPageNum = 1;
                this.tableObj.getData();
            },

            //高级筛选
            searchData: function () {
                var d_costTypeName = $("#tabBox0 .condition .d_costTypeName").val();
                var d_selfMainBodyName = $("#tabBox0 .condition .d_selfMainBodyName").val();
                var d_otherMainBodyName = $("#tabBox0 .condition .d_otherMainBodyName").val();
                var d_requisitionerName = $("#tabBox0 .condition .d_requisitionerName").val();
                var d_requisitionerDepa = $("#tabBox0 .condition .d_requisitionerDepa").val();
                var d_createBy = $("#tabBox0 .condition .d_createBy").val();
                var d_appliDepa = $("#tabBox0 .condition .d_appliDepa").val();
                var d_status = $("#tabBox0 .condition .d_status").val();
                var d_paymentType = $("#tabBox0 .condition .d_paymentType").val();
                var d_expiryDateStartstr = $("#tabBox0 .condition #d_expiryDateStartstr").val();
                var d_expiryDateEndstr = $("#tabBox0 .condition #d_expiryDateEndstr").val();
                var d_createDatebegin = $("#tabBox0 .condition #d_createDatebegin").val();
                var d_createDateend = $("#tabBox0 .condition #d_createDateend").val();
                var d_minMoney = $("#tabBox0 .condition #d_minMoney").val();
                var d_maxMoney = $("#tabBox0 .condition #d_maxMoney").val();
                console.log("d_status  " + d_status);
                console.log("d_paymentType  " + d_paymentType);
                console.log("d_costTypeName:  " + d_costTypeName);
                console.log("d_selfMainBodyName : " + d_selfMainBodyName);
                console.log("d_otherMainBodyName : " + d_otherMainBodyName);
                console.log("d_requisitionerName : " + d_requisitionerName);
                console.log("d_requisitionerDepa : " + d_requisitionerDepa);
                console.log("d_createBy:  " + d_createBy);
                console.log("d_appliDepa  " + d_appliDepa);
                console.log("d_expiryDateStartstr  " + d_expiryDateStartstr);
                console.log("d_expiryDateEndstr  " + d_expiryDateEndstr);
                console.log("d_createDatebegin  " + d_createDatebegin);
                console.log("d_createDateend  " + d_createDateend);
                console.log("d_minMoney  " + d_minMoney);
                console.log("d_maxMoney  " + d_maxMoney);
                //输入约束，约束日期和金额
                if (d_minMoney != "" && d_maxMoney != "" && !(d_maxMoney > d_minMoney))momo.ctrlMsgBox("show", "body", "合同金额范围输入错误");
                else if (d_createDatebegin != "" && d_createDateend != "" && momo.timeCompare(d_createDatebegin, d_createDateend) < 0)momo.ctrlMsgBox("show", "body", "申请时间范围输入错误");
                else if (d_expiryDateStartstr != "" && d_expiryDateEndstr != "" && momo.timeCompare(d_expiryDateStartstr, d_expiryDateEndstr) < 0)momo.ctrlMsgBox("show", "body", "合同有效期范围输入错误");
                else {
                    this.tableObj.postOtherElem = {
                        "accessToken": momo.accessToken,
                        "status": d_status,
                        "costTypeName": d_costTypeName,
                        "paymentType": d_paymentType,
                        "selfMainBodyName": d_selfMainBodyName,
                        "otherMainBodyName": d_otherMainBodyName,
                        "requisitionerName": d_requisitionerName,
                        "requisitionerDepa": d_requisitionerDepa,
                        "createBy": d_createBy,
                        "appliDepa": d_appliDepa,
                        "createDatebegin": d_createDatebegin,
                        "createDateend": d_createDateend,
                        "expiryDateStartstr": d_expiryDateStartstr,
                        "expiryDateEndstr": d_expiryDateEndstr,
                        "minMoney": d_minMoney,
                        "maxMoney": d_maxMoney
                    };
                    this.tableObj.curPageNum = 1;
                    this.tableObj.getData();
                }
            },

            //导出
            loadExcel: function(){
                var d_costTypeName = $("#tabBox0 .condition .d_costTypeName").val();
                var d_selfMainBodyName = $("#tabBox0 .condition .d_selfMainBodyName").val();
                var d_otherMainBodyName = $("#tabBox0 .condition .d_otherMainBodyName").val();
                var d_requisitionerName = $("#tabBox0 .condition .d_requisitionerName").val();
                var d_requisitionerDepa = $("#tabBox0 .condition .d_requisitionerDepa").val();
                var d_createBy = $("#tabBox0 .condition .d_createBy").val();
                var d_appliDepa = $("#tabBox0 .condition .d_appliDepa").val();
                var d_status = $("#tabBox0 .condition .d_status").val();
                var d_paymentType = $("#tabBox0 .condition .d_paymentType").val();
                var d_expiryDateStartstr = $("#tabBox0 .condition #d_expiryDateStartstr").val();
                var d_expiryDateEndstr = $("#tabBox0 .condition #d_expiryDateEndstr").val();
                var d_createDatebegin = $("#tabBox0 .condition #d_createDatebegin").val();
                var d_createDateend = $("#tabBox0 .condition #d_createDateend").val();
                var d_minMoney = $("#tabBox0 .condition #d_minMoney").val();
                var d_maxMoney = $("#tabBox0 .condition #d_maxMoney").val();

                var params = {
                    "accessToken": momo.accessToken,
                    "status": d_status,
                    "costTypeName": d_costTypeName,
                    "paymentType": d_paymentType,
                    "selfMainBodyName": d_selfMainBodyName,
                    "otherMainBodyName": d_otherMainBodyName,
                    "requisitionerName": d_requisitionerName,
                    "requisitionerDepa": d_requisitionerDepa,
                    "createBy": d_createBy,
                    "appliDepa": d_appliDepa,
                    "createDatebegin": d_createDatebegin,
                    "createDateend": d_createDateend,
                    "expiryDateStartstr": d_expiryDateStartstr,
                    "expiryDateEndstr": d_expiryDateEndstr,
                    "minMoney": d_minMoney,
                    "maxMoney": d_maxMoney
                };

                console.log(params);
                var perparams = "";
                for (var p in params)perparams += p + "=" + params[p] + "&";
                console.log(perparams);

                //momo.sendPost(params, "export/excel/contract", function (data) {
                //    console.log(data, "==========获取excel");
                //
                //}, "isGet");
                window.location.href = momo.baseURL + "export/excel/contract?"+ perparams;
            }
        },

        //我的待办
        myWait: {  //页面初始化函数
            tableObj: {},

            init: function () {
                console.log("---------------myWait");

                //初始化列表
                this.tableObj = new momoTable({
                        width: "100%",
                        singlePageItemNum: 20,
                        singlePageItemName: "pageNumber",
                        itemKeyName: "contractId",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        tableID: "#momoTable1",//表格ID
                        dataPagePrefix: ["data"],
                        dataItemPrefix: ["data", "result"],
                        dataUrl: "contract/findWorkToDo",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 2, valueName: "contractName", className: ""},
                        {title: "我方主体", width: 3, valueName: "selfBodyName", className: ""},
                        {title: "发起人", width: 1, valueName: "createName", className: ""},
                        {title: "发起时间", width: 2, valueName: "createDate", className: ""},
                        {title: "状态", width: 1.5, valueName: "status", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken};
                this.tableObj.init();

                //隐藏翻页
                $("#tabBox1 .m_handleBox").hide();

                //添加点击跳转
                this.addJumpEvent();
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                var self = this;
                $(document).on("click", "#momoTable1 tr", function () {
                    var index = $(this).index() - 1;
                    var role = "other";
                    var stage = "stage4";//默认审核环节
                    if (index < 0)return;
                    var item = self.tableObj.dataItemList[index];
                    console.log(item);
                    console.log(" 状 态 ："+item.type);
                    if (item.creator)role = "owner";//分辨角色
                    if (item.activity == "Startup")stage = "stage1";//开始环节
                    else if (item.activity == "step2")stage = "stage2";//预审环节
                    else if (item.activity == "step3")stage = "stage3";//提审环节
                    else if (item.activity == "step17_1")stage = "stage5";//盖章环节
                    else if (item.activity == "step18_1")stage = "stage6";//归档环节
                    var href = "./contractDetail.html?"
                        + "name=" + item.contractName
                        + "&accessToken=" + momo.accessToken
                        + "&from=" + "wait"
                        + "&type=" + "edit"
                        + "&role=" + role
                        + "&stage=" + stage
                        + "&menuIndex=" + "2-1"
                        + "&instanceID=" + item.instanceID
                        + "&contractId=" + item.contractId
                        + "&read=" + item.type
                        + "&activity=" + item.activity
                        + "&processID=" + item.processID;
                    console.log("我的待办跳转链接 ："+ href);
                    location.href = href;
                })
            }
        },

        //我的已办
        myDone: {
            tableObj: {},
            init: function () {
                console.log("---------------myDone");
                this.tableObj = new momoTable({
                        width: "100%",
                        singlePageItemNum: 20,
                        singlePageItemName: "pageNumber",
                        itemKeyName: "contractId",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        tableID: "#momoTable2",//表格ID
                        dataPagePrefix: ["data"],
                        dataItemPrefix: ["data", "result"],
                        dataUrl: "contract/findworktodone",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 2, valueName: "contractName", className: ""},
                        {title: "我方主体", width: 3, valueName: "selfBodyName", className: ""},
                        {title: "发起人", width: 1, valueName: "createName", className: ""},
                        {title: "发起时间", width: 2, valueName: "createDate", className: ""},
                        {title: "状态", width: 1.5, valueName: "status", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken};
                this.tableObj.init();

                //初始化时间选择控件
                $("#tabBox2 .startTime").datepicker();
                $("#tabBox2 .endTime").datepicker();
                $("#tabBox2 .startTime").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#tabBox2 .endTime").datepicker("option", "dateFormat", "yy-mm-dd");

                //添加点击跳转
                this.addJumpEvent();
                this.addEvent();
            },

            //添加各种事件
            addEvent: function () {
                var self = this;

                //添加选人控件
                $(document).on("click", "#tabBox2 .initiator", function () {
                    window.SP_enterCallback = function (data) {
                        $("#tabBox2 .initiator").val(data.peopleName);
                    };
                    layer.open({
                        type: 2,
                        title: '选择发起人',
                        area: ['800px', '560px'],
                        content: '../plugin/selectPeople/single/contract_person.html'
                    });
                });

                //添加提交事件
                $(document).on("click", "#tabBox2 .searchBtn", this.searchData.bind(this));

                //条件重置
                $(document).on("click", "#tabBox2 .resetBtn", function () {
                    $("#tabBox2 .initiator").val("");
                    $("#tabBox2 .endTime").val("");
                    $("#tabBox2 .startTime").val("");
                    self.searchData();
                });

            },

            //搜索
            searchData: function () {
                var initiator = $("#tabBox2 .initiator").val();
                var startTime = $("#tabBox2 .startTime").val();
                var endTime = $("#tabBox2 .endTime").val();
                this.tableObj.postOtherElem = {
                    "accessToken": momo.accessToken,
                    "initiator": initiator,
                    "startTime": startTime,
                    "endTime": endTime
                };
                this.tableObj.curPageNum = 1;
                this.tableObj.getData();
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                var self = this;
                $(document).on("click", "#momoTable2 tr", function () {
                    var index = $(this).index() - 1;
                    if (index < 0)return;
                    var item = self.tableObj.dataItemList[index];
                    var href = "./contractDetail.html?"
                        + "name=" + item.contractName
                        + "&accessToken=" + momo.accessToken
                        + "&from=" + "done"
                        + "&menuIndex=" + "2-2"
                        + "&type=" + "detail"
                        + "&instanceID=" + item.instanceID
                        + "&contractId=" + item.contractId
                        + "&processID=" + item.processID;
                    console.log(href);
                    location.href = href;
                })
            }
        },

        //我的申请
        myApply: {
            tableObj: {},
            init: function () {
                console.log("---------------myApply");
                //初始化列表
                this.tableObj = new momoTable({
                        width: "100%",
                        singlePageItemNum: 20,
                        singlePageItemName: "pageNumber",
                        itemKeyName: "contractId",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        tableID: "#momoTable3",//表格ID
                        dataPagePrefix: ["data"],
                        dataItemPrefix: ["data", "result"],
                        dataUrl: "contract/findMyApply",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 2, valueName: "contractName", className: ""},
                        {title: "我方主体", width: 3, valueName: "selfBodyName", className: ""},
                        {title: "发起时间", width: 2, valueName: "createDate", className: ""},
                        {title: "状态", width: 1.5, valueName: "status", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken};
                this.tableObj.init();

                //初始化时间选择控件
                $("#tabBox3 .startTime").datepicker();
                $("#tabBox3 .endTime").datepicker();
                $("#tabBox3 .startTime").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#tabBox3 .endTime").datepicker("option", "dateFormat", "yy-mm-dd");

                //添加点击跳转
                this.addEvent();
                this.addJumpEvent();//添加点击跳转
            },

            //添加各种事件
            addEvent: function () {
                var self = this;

                //添加提交事件
                $(document).on("click", "#tabBox3 .searchBtn", this.searchData.bind(this));

                //条件重置
                $(document).on("click", "#tabBox3 .resetBtn", function () {
                    $("#tabBox3 .endTime").val("");
                    $("#tabBox3 .startTime").val("");
                    self.searchData();
                });

            },

            //搜索
            searchData: function () {
                var startTime = $("#tabBox3 .startTime").val();
                var endTime = $("#tabBox3 .endTime").val();
                this.tableObj.postOtherElem = {
                    "accessToken": momo.accessToken,
                    "startTime": startTime,
                    "endTime": endTime
                };
                this.tableObj.curPageNum = 1;
                this.tableObj.getData();
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                var self = this;
                $(document).on("click", "#momoTable3 tr", function () {
                    var index = $(this).index() - 1;
                    if (index < 0)return;
                    var item = self.tableObj.dataItemList[index];
                    var href = "./contractDetail.html?"
                        + "name=" + item.contractName
                        + "&accessToken=" + momo.accessToken
                        + "&from=" + "apply"
                        + "&menuIndex=" + "2-3"
                        + "&type=" + "detail"
                        + "&instanceID=" + item.instanceID
                        + "&contractId=" + item.contractId
                        + "&processID=" + item.processID;
                    console.log(href);
                    location.href = href;
                })
            }
        },

        //我的已读
        myRead: {
            tableObj: {},
            init: function () {
                console.log("---------------myApply");
                this.tableObj = new momoTable({
                        width: "100%",
                        singlePageItemNum: 20,
                        singlePageItemName: "pageNumber",
                        itemKeyName: "contractId",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        tableID: "#momoTable4",//表格ID
                        dataPagePrefix: ["data"],
                        dataItemPrefix: ["data", "result"],
                        dataUrl: "contract/getreaded",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 2, valueName: "contractName", className: ""},
                        {title: "我方主体", width: 3, valueName: "selfBodyName", className: ""},
                        {title: "发起时间", width: 2, valueName: "createDate", className: ""},
                        {title: "状态", width: 1.5, valueName: "status", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken};
                this.tableObj.init();

                //初始化时间选择控件
                $("#tabBox4 .startTime").datepicker();
                $("#tabBox4 .endTime").datepicker();
                $("#tabBox4 .startTime").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#tabBox4 .endTime").datepicker("option", "dateFormat", "yy-mm-dd");

                //添加点击跳转
                this.addJumpEvent();
                this.addEvent();
            },

            //添加各种事件
            addEvent: function () {
                var self = this;

                //添加选人控件
                $(document).on("click", "#tabBox4 .initiator", function () {
                    window.SP_enterCallback = function (data) {
                        console.log(data);
                        $("#tabBox4 .initiator").val(data.peopleName);
                    };
                    layer.open({
                        type: 2,
                        title: '选择发起人',
                        area: ['800px', '560px'],
                        content: '../plugin/selectPeople/single/contract_person.html'
                    });
                });

                //添加提交事件
                $(document).on("click", "#tabBox4 .searchBtn", this.searchData.bind(this));

                //条件重置
                $(document).on("click", "#tabBox4 .resetBtn", function () {
                    $("#tabBox4 .initiator").val("");
                    $("#tabBox4 .endTime").val("");
                    $("#tabBox4 .startTime").val("");
                    self.searchData();
                });

            },

            //搜索
            searchData: function () {
                var initiator = $("#tabBox4 .initiator").val();
                var startTime = $("#tabBox4 .startTime").val();
                var endTime = $("#tabBox4 .endTime").val();
                this.tableObj.postOtherElem = {
                    "accessToken": momo.accessToken,
                    "initiator": initiator,
                    "startTime": startTime,
                    "endTime": endTime
                };
                this.tableObj.curPageNum = 1;
                this.tableObj.getData();
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                var self = this;
                $(document).on("click", "#momoTable4 tr", function () {
                    var index = $(this).index() - 1;
                    if (index < 0)return;
                    var item = self.tableObj.dataItemList[index];
                    var href = "./contractDetail.html?"
                        + "name=" + item.contractName
                        + "&accessToken=" + momo.accessToken
                        + "&from=" + "read"
                        + "&menuIndex=" + "2-4"
                        + "&type=" + "detail"
                        + "&instanceID=" + item.instanceID
                        + "&contractId=" + item.contractId
                        + "&processID=" + item.processID;
                    console.log(href);
                    location.href = href;
                })
            }
        },

        //我的催办
        myPress: {
            tableObj: {},
            init: function () {
                console.log("---------------myPress");
                this.tableObj = new momoTable({
                        width: "100%",
                        itemKeyName: "processId",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        tableID: "#momoTable5",//表格ID
                        noPage: true,
                        //dataPagePrefix: ["data"],
                        dataItemPrefix: ["data", "messages"],
                        dataUrl: "workflow/getMsg",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 2, valueName: "source", className: ""},
                        {title: "发送人", width: 1, valueName: "senderName", className: ""},
                        {title: "发送时间", width: 2, valueName: "publishDate", className: ""},
                        {title: "详情", width: 3, valueName: "title", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {
                    "accessToken": momo.accessToken,
                    "receiverId": momo.accessToken,
                    "messageType": "NOTICE",
                };
                this.tableObj.init();

                //添加点击跳转
                this.addJumpEvent();
                this.addEvent();
            },

            //添加各种事件//设置收件人
            addEvent: function () {
                var self = this;
                //添加选人控件
                $(document).on("click", "#tabBox5 .initiator", function () {
                    window.SP_enterCallback = function (data) {
                        console.log(data);
                        $("#tabBox5 .initiator").val(data.peopleName);
                        self.tableObj.postOtherElem = {
                            "accessToken": momo.accessToken,
                            "receiverId": data.peopleId,
                            "messageType": "NOTICE",
                        };
                        self.tableObj.getData();
                    };
                    layer.open({
                        type: 2,
                        title: '选择收件人',
                        area: ['800px', '560px'],
                        content: '../plugin/selectPeople/single/contract_person.html'
                    });
                });

                //条件重置
                $(document).on("click", "#tabBox5 .resetBtn", function () {
                    $("#tabBox5 .initiator").val(sessionStorage.getItem("userName"));
                    self.tableObj.postOtherElem = {
                        "accessToken": momo.accessToken,
                        "receiverId": momo.accessToken,
                        "messageType": "NOTICE",
                    };
                    self.tableObj.getData();
                });
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                //var self = this;
                //$(document).on("click", "#momoTable4 tr", function () {
                //    var index = $(this).index() - 1;
                //    if (index < 0)return;
                //    var item = self.tableObj.dataItemList[index];
                //    var href = "./contractDetail.html?"
                //        + "name=" + item.contractName
                //        + "&accessToken=" + momo.accessToken
                //        + "&from=" + "read"
                //        + "&menuIndex=" + "2-4"
                //        + "&type=" + "detail"
                //        + "&instanceID=" + item.instanceID
                //        + "&contractId=" + item.contractId;
                //    console.log(href);
                //    location.href = href;
                //})
            }
        },

        //我的待阅
        myWaitDone:  {  //页面初始化函数
            tableObj: {},

            init: function () {
                console.log("---------------myWaitDone");

                //初始化列表
                this.tableObj = new momoTable({
                        width: "100%",
                        singlePageItemNum: 20,
                        singlePageItemName: "pageNumber",
                        itemKeyName: "contractId",//表格ID
                        indexData: {name: "序号", width: 1},//是否显示项目下标
                        tableID: "#momoTable6",//表格ID
                        dataPagePrefix: ["data"],
                        dataItemPrefix: ["data", "result"],
                        dataUrl: "contract/getUnreadContract",//获取信息的URL
                    }
                    , [
                        {title: "合同名称", width: 2, valueName: "contractName", className: ""},
                        {title: "我方主体", width: 3, valueName: "selfBodyName", className: ""},
                        {title: "发起人", width: 1, valueName: "createName", className: ""},
                        {title: "发起时间", width: 2, valueName: "createDate", className: ""},
                        {title: "状态", width: 1.5, valueName: "status", className: ""},
                    ]
                );
                this.tableObj.postOtherElem = {"accessToken": momo.accessToken};
                this.tableObj.init();

                //隐藏翻页
                $("#tabBox6 .m_handleBox").hide();

                //添加点击跳转
                this.addJumpEvent();
            },

            //添加项目点击跳转事件
            addJumpEvent: function () {
                var self = this;
                $(document).on("click", "#momoTable6 tr", function () {
                    var index = $(this).index() - 1;
                    var role = "other";
                    var stage = "stage4";//默认审核环节
                    if (index < 0)return;
                    var item = self.tableObj.dataItemList[index];
                    if (item.creator)role = "owner";//分辨角色
                    if (item.activity == "Startup")stage = "stage1";//开始环节
                    else if (item.activity == "step2")stage = "stage2";//预审环节
                    else if (item.activity == "step3")stage = "stage3";//提审环节
                    else if (item.activity == "step17_1")stage = "stage5";//盖章环节
                    else if (item.activity == "step18_1")stage = "stage6";//归档环节

                    var href = "./contractDetail.html?"
                        + "name=" + item.contractName
                        + "&accessToken=" + momo.accessToken
                        + "&from=" + "wait"
                        + "&type=" + "edit"
                        + "&role=" + role
                        + "&stage=" + stage
                        + "&menuIndex=" + "2-1"
                        + "&instanceID=" + item.instanceID
                        + "&contractId=" + item.contractId;
                    location.href = href;
                })
            }
        }
    }
})();

var onLoad = contractCenter.init.bind(contractCenter);//页面开发环境
