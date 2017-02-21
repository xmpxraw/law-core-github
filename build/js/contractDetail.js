//个人信息页面及其子页面接口对接
var contractDetail = (function () {
    return {
        instanceID: "",
        contractId: "",
        accessToken: "",
        tabIndex: 0,//页面tab下标
        tabObjList: [
            {name: "baseData", hadInit: false},
            {name: "attachment", hadInit: false},
            {name: "stamp", hadInit: false},
            {name: "file", hadInit: false},
            {name: "progress", hadInit: false}
        ],

        //页面初始化函数
        init: function () {
            var self = this;
            this.tabIndex = momo.getURLElement("tabIndex") ? momo.getURLElement("tabIndex") : this.tabIndex;

            //根据不同的入口显示不同的菜单和路径
            var menuIndex = momo.getURLElement("menuIndex");
            var menuObj = {
                "0": {name: "新建合同", menuItme: "contractDetail"},
                "2-0": {name: "合同详情", menuItme: "contractCenter", pathName: "合同列表", url: "./contractCenter.html?tabIndex=0"},
                "2-1": {name: "合同详情", menuItme: "contractCenter", pathName: "我的待办", url: "./contractCenter.html?tabIndex=1"},
                "2-2": {name: "合同详情", menuItme: "contractCenter", pathName: "我的已办", url: "./contractCenter.html?tabIndex=2"},
                "2-3": {name: "合同详情", menuItme: "contractCenter", pathName: "我的申请", url: "./contractCenter.html?tabIndex=3"},
                "2-4": {name: "合同详情", menuItme: "contractCenter", pathName: "我的已阅", url: "./contractCenter.html?tabIndex=4"},
                "3": {name: "合同草案", menuItme: "contractDraft"},
                "4": {name: "合同预警", menuItme: "contractWarn"}
            };
            $(".m_titleName").text(menuObj[menuIndex].name);
            $(".m_titleArrow").text(">");
            if (menuIndex == "0") $(".m_titleArrow").hide();
            if (menuObj[menuIndex].pathName) {
                $(".m_titlePath").prop("href", menuObj[menuIndex].url);
                $(".m_titlePath").text(menuObj[menuIndex].pathName);
            }
            if (momo.addMenuItem(menuObj[menuIndex].menuItme) == "over")return;//添加左边菜单栏

            //从URL获取全局信息
            contractDetail.instanceID = momo.getURLElement("instanceID");
            contractDetail.contractId = momo.getURLElement("contractId");
            contractDetail.accessToken = momo.accessToken;
            console.log("instanceID    " + contractDetail.instanceID);
            console.log("contractId    " + contractDetail.contractId);
            console.log("accessToken    " + contractDetail.accessToken);
            if (contractDetail.instanceID) {
                $('#tabBar .progressTab').css("display", "inline-block");
                $("#tabBar span").eq(1).removeClass("itemRight");
            }

            //添加tab点击事件
            $(document).on("click", "#tabBar span", function () {
                self.tabIndex = $(this).index();
                console.log(self.tabIndex);
                $(".tabBox").hide();
                $("#tabBox" + self.tabIndex).show();
                $("#tabBar span").removeClass("active");
                $(this).addClass("active");
                console.log(self.tabObjList);
                if (!self.tabObjList[self.tabIndex].hadInit) {
                    self.tabObjList[self.tabIndex].hadInit = true;
                    self[self.tabObjList[self.tabIndex].name].init();
                }
                $('body,html').animate({scrollTop: 0}, 500);
            });

            //动态设置Index的值
            if (momo.getURLElement("tabIndex")) this.tabIndex = momo.getURLElement("tabIndex");

            //显示页面内容
            if (momo.getURLElement("type") != "new") {
                this.stamp.init();//初始化盖章列表
                this.file.init();//初始化归档列表
            }
            $("#tabBar span").eq(this.tabIndex).click();
        },

        //流程概览
        progress: {
            progressData: {},//当前流程对象
            viewIndex: 0,
            isMe: false,//是否创建人
            isMaster: false,//是否当前环节处理人
            isFromAll: false,//是否当前环节处理人
            isFromOther: false,//从其他页面进入的详情
            theStage: "",//当前所处节点
            canComment: false,//判断当前环节能否进行评论

            //初始化页面
            init: function () {
                var self = this;
                console.log("init--------progress      id     " + contractDetail.accessToken);

                //添加tab点击事件
                $(document).on("click", "#tabBox4 .viewTabBar span", function () {
                    $("#tabBox4 .viewTabBar span").removeClass("active");
                    $(this).addClass("active");
                    var tabIndex = $(this).index();
                    if (tabIndex == 0) {
                        $("#tabBox4 #view0").css("display", "inline-block");
                        $("#tabBox4 #view1").css("display", "none");
                    }
                    else {
                        $("#tabBox4 #view0").css("display", "none");
                        $("#tabBox4 #view1").css("display", "inline-block");
                    }
                });

                //添加预审环节评论框的折叠点击功能//在选中的评论框中加入操作栏
                $(document).on("click", "#tabBox4 .dialogFoldBtn", function () {
                    var text = $(this).text();
                    var group = $(this).nextAll(".dialogBox");
                    if (text == "折叠") {
                        $(this).text("展开");
                        group.hide(500);
                    } else { //展开操作
                        //关闭其他的留言框
                        var other = $("#tabBox4 .dialogFoldBtn");
                        for (var i = 0, length = other.length; i < length; i++) {
                            var item = other.eq(i);
                            if (item.text() == "折叠") {
                                item.text("展开");
                                item.nextAll(".dialogBox").hide(500);
                            }
                        }

                        console.log(self.canComment);
                        if (self.canComment) {//若可以评论，则显示评论框
                            var operation = $("#tabBox4 .operationBox");
                            operation.find("textarea").val("");
                            group.append(operation);
                            operation.show();
                        }
                        $(this).text("折叠");
                        group.show(500);
                    }
                });

                if (momo.getURLElement("from") == "all") this.isFromAll = true;
                if (momo.getURLElement("from") != "wait") this.isFromOther = true;

                if (!this.isFromAll) {
                    //添加评论回复事件
                    $(document).on("click", "#tabBox4 .operationBtn", this.addComment);

                    //添加底部操作栏提交点击事件
                    $(document).on("click", "#tabBox4 .handleSubmitBtn", self.addSubmit.bind(self));

                    //添加待阅人意见操作
                    $(document).on("click", "#tabBox4 .handleSubmitread", self.addSubmintread.bind(self));
                }

                //显示流程图
                momo.sendPost({accessToken: momo.accessToken, instanceID: contractDetail.instanceID}, "workflow/getWfImage", function (data) {
                    var iframe = $("#tabBox4 #view0 iframe");
                    console.log("显示流程图：" + data.data);
                    data.data = data.data.substr(5, data.data.length);
                    iframe.prop("src", data.data).show();
                });

                //显示页面内容
                $("#tabBox4 .viewTabBar span").eq(1).click();
                //$("#tabBox4 .viewTabBar span").eq(0).click();

                //调用接口，获取线形图内容  
                //cehsi
                momo.sendPost({
                    accessToken: contractDetail.accessToken,
                    instanceID: contractDetail.instanceID, //流程开始
                     processID: momo.getURLElement("processID")
                }, "contract/getworkflowtrace", self.setProgress.bind(self));
            },

            //设置线性图
            setProgress: function (data) {
                //获取数据，抽取判断当前状态
                this.progressData = data;
                contractDetail.contractId = data.data.contractId;
                var itemData = data.data.items;
                var firstItem = itemData[0];
                var lastItem = itemData[itemData.length - 1];
                var stage = lastItem.activityLabel; //当前所处状态
                console.log(lastItem);

                //根据不同的节点显示不同的数据
                var domStr = "";
                var temp = $("#nodeItemTemp").text();
                if (firstItem.executor == contractDetail.accessToken) this.isMe = true;
                for (var i = itemData.length - 1; i > -1; i--) {
                    var nodeColor = "#21CA71";
                    var style = "background-image: url('../image/icon00044.png')";
                    var item = itemData[i];
                    var display = "none";
                    var display1 = "none";
                    var useTime = "耗时:" + item.useTime;
                    if (i == 0) useTime = "";

                    //if (item.activityLabel.indexOf("预审") != -1) display1 = "block";//判断是否是预审
                    if (item.status == "待办") {
                        nodeColor = "#B4B4B4";
                        style = "background-image: url('../image/icon00042.png')";
                    }
                    if (item.activityLabel == "预审" && item.status == "已完成") display1 = "block"; //判断是否是预审//回复的展开功能
                    if (item.status == "待办" && this.isMe && !this.isFromAll) display = "inline-block";   //显示催办按钮
                    if (item.executor == momo.accessToken) display = "none";
                    console.log("uID    " + item.uID + "    momo.accessToken     " + momo.accessToken);
                    domStr += momo.template(temp, {
                        itemId: item.uID,
                        style: style,
                        nodeColor: nodeColor,
                        day: item.created.substr(0, 10),
                        time: item.created.substr(11, 18),
                        peopleId: item.executor,
                        nodeName: item.activityLabel,
                        status: item.status,
                        name: item.executorName + "     " + item.executor,
                        department: item.acDeptName,
                        remark: item.content,
                        useTime: useTime,
                        display: display,
                        display1: display1,
                    })
                }
                $("#tabBox4 #statusEnd").after(domStr);

                $("#tabBox4 .nodeLine2").show();
                $("#tabBox4 .nodeLine2").last().hide();

                //获取预审评论信息Momo//暂时不调用
                momo.sendPost({
                    accessToken: contractDetail.accessToken,
                    contractId: contractDetail.contractId,
                    isAll: 1
                }, "reply/getReplyByact", this.getComment.bind(this));

                console.log("3333333333");
                if (stage.indexOf("归档") != -1 && lastItem.status != "待办") { //待归档状态
                    console.log("22222222222222");
                    var theEnd = $("#tabBox4 #statusEnd");
                    theEnd.find(".day").text(lastItem.created.substr(0, 10));
                    theEnd.find(".time").text(lastItem.created.substr(11, 18));
                    theEnd.show();
                }
                if (this.isFromAll) return;

                //判断是否是创建人
                if (firstItem.executor == contractDetail.accessToken) this.isMe = true;
                if (this.progressData.data.menuMap.currentDeal) this.isMaster = true;
                if (this.isMe == false || this.isFromAll) $("#tabBox4 .poepleBtn").hide(); //当不是创建人，则隐藏催办按钮
                if (this.progressData.data.menuMap.isEnd) { //合同终止
                    var theEnd = $("#tabBox4 #statusEnd");
                    theEnd.find(".day").text(lastItem.created.substr(0, 10));
                    theEnd.find(".time").text(lastItem.created.substr(11, 18));
                    theEnd.find(".pointName").text("合同中止");
                    theEnd.show();
                }
                else if (this.progressData.data.menuMap.rollback && this.isMe) { //判断能否撤回
                    $("#tabBox4 .handleText").hide();
                    $("#tabBox4 .handleSubmitBtn").text("撤回");
                    $("#tabBox4 .HandleBox").show();
                }
                else if (stage.indexOf("发起审批") != -1) { //待预审状态
                    this.theStage = "发起审批";
                    this.canComment = true;//当前阶段可以评论
                    if (this.isMe) {
                        $("#tabBox4 .handleText").hide();
                        $("#tabBox4 .handleSubmitBtn").text("发起审批");
                        $("#tabBox4 .HandleBox").show();
                        $("#tabBox4 .addPeopleBtn").css("display", "inline-block");

                        //点击添加知会人
                        $(document).on("click", "#tabBox4 .addPeopleBtn", function () {
                            window.SP_enterCallback = function (dataList) {
                                momo.sendPost({
                                    accessToken: contractDetail.accessToken,
                                    instanceID: contractDetail.instanceID,
                                    opinion: "同意",
                                    userids: dataList,
                                    formData: "{'contractId':'" + contractDetail.contractId + "'}"
                                }, "contract/transferToRead", function (data) {
                                    if (data.result == "0") momo.ctrlMsgBox("show", "body", "添加成功");
                                    else {
                                        momo.ctrlMsgBox("show", "body", "移交失添加失败");
                                    }
                                });
                            };
                            layer.open({
                                type: 2,
                                title: '添加知会人',
                                area: ['800px', '600px'],
                                content: '../plugin/selectPeople/multiple/contract_person.html'
                            });
                        });
                    }
                }
                else if (stage.indexOf("预审") != -1) { //待预审状态
                    this.theStage = "预审中";
                    this.canComment = true;//当前阶段可以评论
                    console.log("预审中     " + this.canComment);
                    if (this.isMaster && !this.isFromOther) {
                        $("#tabBox4 .otherHandle0").show();
                        $("#tabBox4 .HandleBox").show();
                    }
                }
                else if (stage.indexOf("开始") != -1) { //退回后的再次开始状态
                    this.theStage = "开始";
                    if (this.isMe) {
                        $("#tabBox4 .handleText").hide();
                        $("#tabBox4 .handleSubmitBtn").text("再次提交");
                        $("#tabBox4 .addPeopleBtn").text("中止");
                        $("#tabBox4 .addPeopleBtn").css("display", "inline-block");
                        $("#tabBox4 .HandleBox").show();


                        //再次提交时的中止操作
                        $(document).on("click", "#tabBox4 .addPeopleBtn", function () {
                            var processID = momo.getURLElement("processID");
                            console.log("================processID:" + processID);
                            momo.sendPost({
                                accessToken: contractDetail.accessToken,
                                instanceID: contractDetail.instanceID,
                                processID: processID,
                                opinion: "中止",
                                formData: "{'contractId':'" + contractDetail.contractId + "'}"
                            }, "contract/end", function (data) {
                                if (data.result == "0") {
                                    momo.ctrlMsgBox("show", "body", "中止成功", function () {
                                        var tabIndex = momo.getURLElement("tabIndex");
                                        if (!tabIndex) location.href = location.href + "&tabIndex=" + 4;
                                    });
                                }
                                else {
                                    momo.ctrlMsgBox("show", "body", "中止失败");
                                }
                            });
                        });
                    }
                }
                else if (stage.indexOf("审批") != -1) { //待审批状态
                    this.theStage = "审批中";
                    if (this.isMaster && !this.isFromOther) {
                        $("#tabBox4 .otherHandle1").show();
                        $("#tabBox4 .HandleBox").show();
                        if (this.progressData.data.menuMap.canEnded) $("#tabBox4 .otherHandle1 .stop").show();
                    }
                }
                else if (stage.indexOf("盖章") != -1) { //待盖章状态
                    this.theStage = "盖章中";
                    if (this.isMaster) {
                        $("#tabBox4 .handleSubmitBtn").text("盖章");
                        $("#tabBox4 .otherHandle4").show();
                        $("#tabBox4 .HandleBox").show();
                    }
                }
                else if (stage.indexOf("归档") != -1) { //待归档状态
                    if (lastItem.status == "待办") {
                        this.theStage = "归档中";
                        var tempObj = this.progressData.data.menuMap;
                        if (this.isMe == false) {
                            if (this.progressData.data.menuMap.isSealer) { //当前用户是否是盖章人
                                $("#tabBox4 .handleSubmitBtn").text("再次盖章");
                                $("#tabBox4 .otherHandle4").show();
                                $("#tabBox4 .HandleBox").show();
                            }
                            else if (this.isMaster) {
                                $("#tabBox4 .handleSubmitBtn").text("归档");
                                $("#tabBox4 .otherHandle3").show();
                                $("#tabBox4 .HandleBox").show();
                            }
                        }
                    } else { //合同流程已完成
                        var theEnd = $("#tabBox4 #statusEnd");
                        theEnd.find(".day").text(lastItem.created.substr(0, 10));
                        theEnd.find(".time").text(lastItem.created.substr(11, 18));
                        theEnd.show();
                    }
                }
                console.log(" 获取当前type类型： " + momo.getURLElement("read"));
                //判断是否是待阅
                if (momo.getURLElement("read") == "2") {
                    console.log("状态为待阅操作");
                    $("#tabBox4 .readbox").show();

                }


                this.addHandle();
                console.log("this.isMe    " + this.isMe);
                console.log("this.theStage    " + this.theStage);
            },

            //添加操作栏其他操作事件
            addHandle: function () {
                //添加催办接口
                $(document).on("click", "#tabBox4 .poepleBtn", function () {
                    var peopleId = $(this).parents(".poepleItem").attr("data-id");
                    momo.sendPost({
                        accessToken: contractDetail.accessToken,
                        contractId: contractDetail.contractId,
                        receiverId: peopleId
                    }, "workflow/remind", function (data) {
                        if (data.errorcode == "0") momo.ctrlMsgBox("show", "body", "催办成功");
                        else {
                            momo.ctrlMsgBox("show", "body", "催办失败!\r\n" + data.message);
                        }
                    });
                });

                console.log("addHandle");
                var handle0 = $("#tabBox4 .otherHandle0");
                var handle1 = $("#tabBox4 .otherHandle1");
                var handle2 = $("#tabBox4 .otherHandle2");
                var handle3 = $("#tabBox4 .otherHandle3");
                var handle4 = $("#tabBox4 .otherHandle4");
                if (handle0.css("display") != "none") {

                }
                else if (handle1.css("display") != "none") {
                    var self = this;

                    //点击同意
                    $(document).on("click", "#tabBox4 .otherHandle1 #agree", function () {
                        var textValue = momo.getStrLength($("#tabBox4 .handleText").val());
                        if (textValue < 1) $("#tabBox4 .handleText").val("同意");
                    });

                    //点击移交审批人
                    $(document).on("click", "#tabBox4  .rightBtn0", function () {
                        window.SP_enterCallback = function (data) {
                            console.log("this.    " + self.instanceID);
                            momo.sendPost({
                                accessToken: contractDetail.accessToken,
                                instanceID: contractDetail.instanceID,
                                opinion: "同意",
                                userids: data.peopleId,
                                formData: "{'contractId':'" + contractDetail.contractId + "'}"
                            }, "contract/transferToDeal", function (data) {
                                if (data.result == "0") {
                                    momo.ctrlMsgBox("show", "body", "移交成功", function () {
                                        location.href = "./contractCenter.html?tabIndex=1";
                                    });
                                } else {
                                    momo.ctrlMsgBox("show", "body", "移交失败" + data.result);
                                }
                            });
                        };
                        layer.open({
                            type: 2,
                            title: '选择移交审批人',
                            area: ['800px', '600px'],
                            content: '../plugin/selectPeople/single/contract_person.html'
                        });
                    });

                    //点击添加审批人
                    $(document).on("click", "#tabBox4  .rightBtn1", function () {
                        window.SP_enterCallback = function (dataList) {
                            momo.sendPost({
                                accessToken: contractDetail.accessToken,
                                instanceID: contractDetail.instanceID,
                                activity: self.progressData.data.wfinfo.content.activity,
                                userids: dataList,
                            }, "contract/addExcutors", function (data) {
                                if (data.result == "0") {
                                    momo.ctrlMsgBox("show", "body", "添加成功", function () {
                                        location.reload();
                                    });
                                } else {
                                    momo.ctrlMsgBox("show", "body", "添加失败" + data.result);

                                }
                            });
                        };
                        layer.open({
                            type: 2,
                            title: '添加审批人',
                            area: ['800px', '600px'],
                            content: '../plugin/selectPeople/multiple/contract_person.html'
                        });
                    });

                    //点击添加知会人
                    $(document).on("click", "#tabBox4  .rightBtn2", function () {
                        window.SP_enterCallback = function (dataList) {
                            momo.sendPost({
                                accessToken: contractDetail.accessToken,
                                instanceID: contractDetail.instanceID,
                                opinion: "同意",
                                userids: dataList,
                                formData: "{'contractId':'" + contractDetail.contractId + "'}"
                            }, "contract/transferToRead", function (data) {
                                if (data.result == "0") momo.ctrlMsgBox("show", "body", "添加成功");
                                else {
                                    momo.ctrlMsgBox("show", "body", "添加失败" + data.result);
                                }
                            });
                        };
                        layer.open({
                            type: 2,
                            title: '添加知会人',
                            area: ['800px', '600px'],
                            content: '../plugin/selectPeople/multiple/contract_person.html'
                        });
                    });
                }
                else if (handle2.css("display") != "none") {

                }
                else if (handle3.css("display") != "none") {

                }
                else if (handle4.css("display") != "none") {

                }
            },

            //添加底部操作栏点击事件
            addSubmit: function () {
                console.log("addSubmit添加底部操作栏点击事件");

                var tipText = "";
                var jumpWhere = "";
                var remarkText = $("#tabBox4 .handleText");
                if (remarkText.val().length < 1 && remarkText.css("display") != "none") { //如果输入框内容为空
                    momo.ctrlMsgBox("show", "body", "请填写意见");
                    return;
                }
                remarkText = remarkText.val();

                var body = {}; //接口调用的参数
                var url = "contract/submit";
                var activity = momo.getURLElement("activity");
                var processID = momo.getURLElement("processID");
                //获取全局信息
                body.accessToken = contractDetail.accessToken;
                body.instanceID = contractDetail.instanceID;
                body.contractDetail = contractDetail.contractDetail;
                body.contractId = contractDetail.contractId;
                body.formData = "{'contractId':'" + contractDetail.contractId + "','activity':'" + activity + "','processID':'" + processID + "'";
                if (this.progressData.data.menuMap.rollback && this.isMe) { //判断能否撤回
                    url = "workflow/rollBack";
                    tipText = "撤回成功!";
                    jumpWhere = "./contractCenter.html?tabIndex=1";
                    delete body.formData;
                }
                else if (this.theStage == "发起审批") { //待预审状态
                    if (this.isMe) {
                        tipText = "发起审批成功!";
                        body.opinion = "发起审批";
                    }
                }
                else if (this.theStage == "预审中") { //待预审状态
                    if (this.isMaster) {
                        tipText = "提交成功!";
                        body.opinion = remarkText;
                    }
                }
                else if (this.theStage == "开始") { //退回后的再次开始状态
                    if (this.isMe) {
                        tipText = "提交成功!";
                    }
                }
                else if (this.theStage == "审批中") { //待审批状态
                    if (this.isMaster) {
                        var value = -1;
                        var inputList = $("#tabBox4 .otherHandle1 input");
                        for (var i = 0; i < 3; i++) {
                            var item = inputList.eq(i);
                            if (item.prop("checked") == true) {
                                value = i;
                                break;
                            }
                        }
                        body.opinion = remarkText;
                        if (value == -1) {
                            momo.ctrlMsgBox("show", "body", "请选择审批类型");
                            return;
                        } else if (value == 0) { //审批通过
                            tipText = "提交成功!";
                        } else if (value == 1) {
                            tipText = "退回成功!";
                            url = "contract/deny";
                        } else if (value == 2) {
                            tipText = "中止成功!";
                            url = "contract/end";
                        }
                    }
                }
                else if (this.theStage == "盖章中") { //待盖章状态
                    if (this.isMaster) {
                        tipText = "盖章成功!";
                        var inputList = $("#tabBox4 .otherHandle4 input");
                        var num = inputList.val();
                        if (momo.getStrLength(num) < 1) {
                            momo.ctrlMsgBox("show", "body", "请输入归档份数");
                            return;
                        } else if (num < 1) {
                            momo.ctrlMsgBox("show", "body", "归档分数不能为负数或零");
                            return;
                        }
                        body.formData += ",'contractNum':'" + num + "'";
                        body.formData += ",'sealDec':'" + remarkText + "'";
                        body.formData += ",'activity':'" + this.progressData.data.wfinfo.content.activity + "'";
                    }
                }
                else if (this.theStage == "归档中") { //待归档状态
                    if (this.isMe == false) {
                        if (this.progressData.data.menuMap.isSealer) { //当前用户是否是盖章人
                            tipText = "再次盖章成功!";
                            var inputList = $("#tabBox4 .otherHandle4 input");
                            var num = inputList.val();
                            if (momo.getStrLength(num) < 1) {
                                momo.ctrlMsgBox("show", "body", "请输入归档份数");
                                return;
                            } else if (num < 1) {
                                momo.ctrlMsgBox("show", "body", "归档分数不能为负数或零");
                                return;
                            }
                            url = "contractSeal/reAgainSeal";
                            body.contractNum = num;
                            body.sealDec = remarkText;
                            //最终发生请求
                            momo.sendPost(body, url, function (data) {
                                if (data.success) {
                                    momo.ctrlMsgBox("show", "body", tipText, function () {
                                        location.href = "contractDetail.html?tabIndex=2";
                                        location.reload();
                                    });
                                }
                            });
                            return;
                        } else {
                            tipText = "归档成功!";
                            var inputList = $("#tabBox4 .otherHandle3 input");
                            var code = inputList.eq(0).val();
                            var num = inputList.eq(1).val();
                            if (momo.getStrLength(code) < 1) {
                                momo.ctrlMsgBox("show", "body", "请输入归档编号");
                                return;
                            } else if (momo.getStrLength(num) < 1) {
                                momo.ctrlMsgBox("show", "body", "请输入归档份数");
                                return;
                            } else if (num < 1) {
                                momo.ctrlMsgBox("show", "body", "归档分数不能为负数或零");
                                return;
                            }
                            body.formData += ",'archiveStatus':'2'";
                            body.formData += ",'archiveDate':'" + "2016-10-10'";
                            body.formData += ",'archiveDesc':'" + remarkText + "'";
                            body.formData += ",'archiveCount':'" + num + "'";
                            body.formData += ",'archiveCode':'" + code + "'";
                            body.formData += ",'activity':'" + this.progressData.data.wfinfo.content.activity + "'";
                        }
                    }
                }
                body.formData = body.formData + "}";
                //最终发生请求
                console.log("退回参数测试 ：" + body);
                console.log(body);
                momo.sendPost(body, url, function (data) {
                    if (data.result == "0") {
                        momo.ctrlMsgBox("show", "body", tipText, function () {
                            if (jumpWhere.length > 0) location.href = jumpWhere;
                            else {
                                var tabIndex = momo.getURLElement("tabIndex");
                                if (!tabIndex) location.href = location.href + "&tabIndex=" + 4;
                            }
                        });
                    }
                });
            },
            //添加待阅人 操作
            addSubmintread: function () {
                console.log("addSubmitread添加待阅人 操作 ");


                var tipText = "待阅转已阅成功";
                var jumpWhere = "./contractCenter.html?tabIndex=4";
                var remarkTextread = $("#tabBox4 .handleTextread");
                if (remarkTextread.val().length < 1 && remarkTextread.css("display") != "none") { //如果输入框内容为空
                    momo.ctrlMsgBox("show", "body", "请填写意见");
                    return;
                }
                remarkTextread = remarkTextread.val();
                var body = {}; //接口调用的参数
                var url = "contract/signWorkRead";
                body.accessToken = contractDetail.accessToken;
                body.instanceID = contractDetail.instanceID;
                body.opinion = remarkTextread;
                momo.sendPost(body, url, function (data) {
                    if (data.result == "0") {
                        momo.ctrlMsgBox("show", "body", tipText, function () {
                            if (jumpWhere.length > 0) location.href = jumpWhere;
                            else {
                                var tabIndex = momo.getURLElement("tabIndex");
                                if (!tabIndex) location.href = location.href + "&tabIndex=" + 4;
                            }
                        });
                    }
                });

            },

            //获取评论信息
            getComment: function (data) {
                console.log("getComment");
                var data = data.data.result;
                var temp = $("#commentTemp").text();
                //var groupList = $(".poepleItem");
                var groupList = $(".nodeItem");
                for (var i = 0, length = data.length; i < length; i++) {
                    var item = data[i];
                    var itemId = item.activityId;
                    var domStr = momo.template(temp, {
                        day: item.createDateStr.substr(0, 10),
                        time: item.createDateStr.substr(11, 19),
                        name: item.createName,
                        department: item.createrDep,
                        text: item.content
                    });
                    for (var a = 0, length2 = groupList.length; a < length2; a++) {
                        var groupItem = groupList.eq(a);
                        if (groupItem.find(".dialogFoldBtn").css("display") == "none") continue;
                        var groupId = groupItem.attr("data-id");
                        if (groupId == itemId) groupItem.find(".dialogBox").prepend(domStr);
                    }
                }
            },

            //添加评论
            addComment: function () {
                console.log("addComment");
                var item = $(this).parents(".poepleItem");
                var nodeItem = $(this).parents(".nodeItem");
                var id = item.attr("data-id");
                var name = item.find(".poepleName").text();
                var content = $(".operationReply").val();
                if (content.length < 1) {
                    momo.ctrlMsgBox("show", "body", "请输入评论内容");
                    return;
                }
                console.log(item.attr("data-id"));

                momo.sendPost({
                    accessToken: contractDetail.accessToken,
                    contractId: contractDetail.contractId,
                    activityName: "预审",
                    content: content,
                    replyerId: id,
                    replyerName: name,
                    activityId: nodeItem.attr("data-id"),
                }, "reply/add", function (data) {
                    var now = new Date();
                    var date = now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate();
                    var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
                    if (data.data == "回复成功") {
                        var temp = $("#commentTemp").text();
                        var domStr = momo.template(temp, {
                            day: date,
                            time: time,
                            name: sessionStorage.getItem("userName"),
                            department: sessionStorage.getItem("departmentName"),
                            text: content
                        });
                        item.find(".operationBox").before(domStr);
                        $(".operationReply").val("");
                    } else {
                        momo.ctrlMsgBox("show", "body", data.errorMessage);
                        return;
                    }
                    //评论成功后添加评论信息
                })
            }
        },

        //归档列表
        file: {
            tableObj: {},
            init: function () {
                console.log("----------------file");
                if (contractDetail.tabObjList[3].hadInit) return;
                contractDetail.tabObjList[3].hadInit = true;
                //初始化列表
                this.tableObj = new momoTable({
                    width: "100%",
                    itemKeyName: "contractId", //表格ID
                    indexData: {
                        name: "序号",
                        width: 0.5
                    }, //是否显示项目下标
                    tableID: "#momoTable1", //表格ID
                    dataItemPrefix: ["data", "archives"],
                    dataUrl: "contract/getArchiveInfo", //获取信息的URL
                    noPage: true
                }, [{
                    title: "归档编号",
                    width: 1,
                    valueName: "archiveCode",
                    className: ""
                }, {
                    title: "归档日期",
                    width: 2,
                    valueName: "archiveDate",
                    className: ""
                }, {
                    title: "归档数量",
                    width: 1,
                    valueName: "archiveCount",
                    className: ""
                }, {
                    title: "归档人",
                    width: 1,
                    valueName: "applyName",
                    className: ""
                }, {
                    title: "备注",
                    width: 2,
                    valueName: "archiveDes",
                    className: ""
                }, {
                    title: "状态",
                    width: 1,
                    valueName: "archiveStatus",
                    className: ""
                },]);
                this.tableObj.postOtherElem = {
                    "accessToken": contractDetail.accessToken,
                    "contractId": contractDetail.contractId
                };
                this.tableObj.getDataCall = function () { //添加获取信息后的回调函数
                    console.log("file-----");
                    console.log(this.tableObj.dataItemList);
                    if (this.tableObj.dataItemList.length > 0) $("#tabBar .fileTab").css("display", "inline-block");
                }.bind(this);
                this.tableObj.init();
            }
        },

        //盖章列表
        stamp: {
            tableObj: {},
            init: function () {
                console.log("----------------stamp");
                if (contractDetail.tabObjList[2].hadInit) return;
                contractDetail.tabObjList[2].hadInit = true;
                //初始化列表
                this.tableObj = new momoTable({
                    width: "100%",
                    itemKeyName: "contractId", //表格ID
                    indexData: {
                        name: "序号",
                        width: 0.5
                    }, //是否显示项目下标
                    tableID: "#momoTable0", //表格ID
                    dataItemPrefix: ["data"],
                    dataUrl: "contractSeal/findSealByCon", //获取信息的URL
                    noPage: true
                }, [{
                    title: "盖章人",
                    width: 1,
                    valueName: "applyName",
                    className: ""
                }, {
                    title: "盖章日期",
                    width: 1.5,
                    valueName: "sealDate",
                    className: ""
                }, {
                    title: "盖章数量",
                    width: 1,
                    valueName: "contractNum",
                    className: ""
                }, {
                    title: "备注",
                    width: 3,
                    valueName: "sealDec",
                    className: ""
                }, {
                    title: "状态",
                    width: 1,
                    valueName: "sealStatus",
                    className: ""
                },]);
                this.tableObj.postOtherElem = {
                    "accessToken": contractDetail.accessToken,
                    "contractId": contractDetail.contractId
                };
                this.tableObj.getDataCall = function () { //添加获取信息后的回调函数
                    console.log("getDataCall");
                    console.log(this.tableObj.dataItemList);
                    if (this.tableObj.dataItemList.length > 0) $("#tabBar .stampTab").css("display", "inline-block");
                }.bind(this);
                this.tableObj.init();
            }
        },

        //附件
        attachment: {
            idIndex: 0, //文件标识符下标，只能递增
            fileList: [], //文件暂存数组，以对象的形式保存
            saveUrl: "", //

            init: function () {
                console.log("attachment------Init");
                var self = this;

                //删除附件
                $(document).on("click", "#tabBox1 .deleteBtn", this.deleteFile);
                //添加文件
                $(document).on("change", "#tabBox1 .selectFile", this.selectFile);
                //提交信息
                $(document).on("click", "#tabBox1 .submitBtn", this.create.bind(this));
                $(document).on("click", "#tabBox1 .saveBtn", this.create.bind(this));
                // 点击批量删除
                // $(document).on("click", "#tabBox1 .deleteAll", this.showDeleBtn.bind(this));
                $(document).on("click", "#tabBox1 .deleteAll", this.DeleItem.bind(this));


                // 合同附件的下载
                $(document).on("click", "#mianAttachment .downLoadBtn", function (e) {
                    var $target = $(e.currentTarget);
                    console.log($target.attr("data-id"));
                    contractAttachmentId = $target.attr("data-id");

                    location.href = momo.baseURL + "contractAttachment/download?contractAttachmentId=" + contractAttachmentId + "&accessToken=" + contractDetail.accessToken;
                });

                // 其他附件的下载
                $(document).on("click", "#otherAttachment .downLoadBtn", function (e) {
                    var $target = $(e.currentTarget);
                    console.log($target.attr("data-id"));
                    contractAttachmentId = $target.attr("data-id");

                    location.href = momo.baseURL + "contractAttachment/download?contractAttachmentId=" + contractAttachmentId + "&accessToken=" + contractDetail.accessToken;
                });


                // 取消批量删除
                // $(document).on("click", "#tabBox1 .cancelDelect", this.cancelDelectItem.bind(this));
            },

            //删除附件
            deleteFile: function () {
                console.log("deleteFile");
                var self = contractDetail.attachment;
                var index = $(this).parents(".item").find(".itemName").attr("data-id");
                console.log("index    " + index);
                for (var i = 0, length = self.fileList.length; i < length; i++) {
                    var item = self.fileList[i];
                    console.log("item.id    " + item.fileID);
                    console.log(index == item.fileID);
                    if (index == item.fileID) {
                        self.fileList.splice(i, 1);
                        break;
                    }
                }
                console.log(self.fileList);
                $(this).parents(".item").remove();

            },

            //选择文件
            selectFile: function () {
                //文件上传测试
                var self = contractDetail.attachment;
                var group = $(this).parents(".group");
                var attackTemp = $("#attackTemp").text();
                var theFile = this.files[0];
                var domStr = ""; //项目模板文本
                console.log(theFile);

                //设置文件属于哪个组
                theFile.fileType2 = group.attr("id");

                //文件类型过滤
                if (theFile.size > 31457280) {
                    momo.ctrlMsgBox("show", "body", "附件大小不能超过30M");
                    // alert("附件大小不能超过30M");
                    return;
                }
                ;

                //判断如果是合同文本
                if (theFile.fileType2 == "contractText" && !(/.*\.pdf|.*\.doc|.*\.xlsx|.*\.xls|.*\.docx|.*\.ppt|.*\.pptx$/.test(theFile.name))) {
                    momo.ctrlMsgBox("show", "body", "合同文本只支持PowerPoint,Word,Excel格式!");
                    // alert("合同文本只支持PowerPoint,Word,Excel格式!");
                    return;
                }
                ;

                //保存文件
                self.idIndex++;
                theFile.fileID = self.idIndex;
                domStr = momo.template(attackTemp, {
                    id: self.idIndex,
                    name: theFile.name,
                    size: momo.getUnit(theFile.size)
                });
                if (theFile.fileType2 == "contractText") { //如果是重复选择合同文本，则删除旧的再加入新的
                    var itemDom = group.find(".item");
                    if (itemDom.length < 0) return;
                    var id = itemDom.attr("data-id");
                    for (var i = 0, length = self.fileList.length; i < length; i++) {
                        var item = self.fileList[i];
                        if (id == item.id) {
                            self.fileList.splice(i, 1);
                            break;
                        }
                    }
                    itemDom.remove();
                }
                self.fileList.push(theFile);
                group.append(domStr);

                // 如果是新建页面，编辑&&下载按钮不显示
                var judgeType = momo.getURLElement("type");
                if (judgeType == "new") {
                    $("#tabBox1").find(".editBtn,.downLoadBtn").hide();
                }
                ;
                // 隐藏合同文本下的多选按钮以及下载按钮
                $("#contractText .checkRadio").addClass("hidden");
                console.log(self.fileList);
            },

            // 删除checkbox
            DeleItem: function (e) {
                var self = contractDetail.attachment;
                var $target = $(e.currentTarget);
                var group = $target.parents(".group");
                var groupId = group.attr("id");
                var checkRadio = $target.parents(".titleHandle").parents().nextAll(".item").find(".checkRadio");
                if (checkRadio.length == 0 || !checkRadio.is(':checked')) {
                    momo.ctrlMsgBox("show", "body", "请选择一项删除附件");
                    // alert("请选择一项附件");
                    return;
                }
                var status = confirm("是否删除选中选项");
                if (status == true) {
                    // 遍历选中checkradio
                    $(checkRadio).each(function (index) {
                        if ($(this).is(':checked') == true) {
                            // 获取删除的fileID
                            var delectId = $(this).next().next().attr("data-id");
                            console.log(delectId);
                            // 遍历数组，删除该checkbox对应的fileID
                            for (var i = 0, length = self.fileList.length; i < length; i++) {
                                var item = self.fileList[i];
                                if (delectId == item.fileID) {
                                    self.fileList.splice(i, 1);
                                    break;
                                }
                            }
                            ;
                            $(this).parents(".item").remove();
                            console.log(self.fileList);
                        }
                    });
                }
            },

            // 验证基本信息页表单以及附件栏的合同文本
            verification: function () {
                // 表单验证
                var isok = momo.checkForm(); //校验
                if (isok) {
                    momo.ctrlMsgBox("show", "body", isok);
                    // alert(isok);
                    return false;
                }
                ;
                // 日期验证
                var startDate = $("#d_expiryDateStartstr").val();
                var endDate = $("#d_expiryDateEnd").val();
                if (startDate > endDate) {
                    momo.ctrlMsgBox("show", "body", "开始日期不能大于结束日期");
                    // alert("开始日期不能大于结束日期");
                    return false;
                } else if (startDate == endDate) {
                    momo.ctrlMsgBox("show", "body", "开始日期不能与结束日期相等");
                    // alert("开始日期不能与结束日期相等");
                    return false;
                }
                ;


                // 我方主体不能为自己填写的
                if (!$("#d_selfMainBodyName").hasClass('isRealVal')) {
                    $("#d_selfMainBodyName").addClass("m_inputEmpty");
                    momo.ctrlMsgBox("show", "body", "我方主体名称不能自填");
                    // alert("我方主体名称不能自填");
                    return false;
                } else {
                    $("#d_selfMainBodyName").removeClass("m_inputEmpty");
                }
                ;

                // 对方主体不能为自己填写的
                if (!$("#d_otherMainBodyName").hasClass('isRealVal')) {
                    $("#d_otherMainBodyName").addClass("m_inputEmpty");
                    momo.ctrlMsgBox("show", "body", "对方主体名称不能自填");
                    // alert("对方主体名称不能自填");
                    return false;
                } else {
                    $("#d_otherMainBodyName").removeClass("m_inputEmpty");
                }
                ;

                if ($("#d_paymentType").val() == "-1") {
                    momo.ctrlMsgBox("show", "body", "请选择收付方向");
                    // alert("请选择收付方向");
                    return false;
                }
                ;

                // 类目不能为空
                if ($("#d_paymentType2").css("display") != 'none' && $("#d_paymentType2").val() == "-1") {
                    momo.ctrlMsgBox("show", "body", "类目不能为空");
                    // alert("类目不能为空");
                    return false;
                }
                ;

                if ($("#d_otherpaymentType2").css("display") != 'none' && $("#d_otherpaymentType2").val() == "-1") {
                    momo.ctrlMsgBox("show", "body", "类目不能为空");
                    // alert("类目不能为空");
                    return false;
                }
                ;

                // 是否补充协议验证
                var d_isMakeUpVal = $("#d_isMakeUp").val();
                if (d_isMakeUpVal == "1") {
                    // 原合同编号验证
                    if (!$("#d_oldContractCode").val()) {
                        momo.ctrlMsgBox("show", "body", "原合同编号不能为空");
                        // alert("原合同编号不能为空");
                        return false;
                    }
                    ;
                    // 原合同金额验证
                    if (!$("#d_oldContractMoney").val()) {
                        momo.ctrlMsgBox("show", "body", "原合同金额不能为空");
                        // alert("原合同金额不能为空");
                        return false;
                    }
                    ;
                }
                ;
                // 合同文本验证
                if ($("#contractText .checkRadio").length == 0) {
                    momo.ctrlMsgBox("show", "body", "合同文本为必填项");
                    // alert("合同文本为必填项");
                    return false;
                }
                ;

            },

            //提交资源，创建合同
            create: function (e) {
                console.log(this.fileList);
                var self = this;
                var hadUploadNum = -1;
                var fileLength = this.fileList.length;
                var allFilelist = [];
                // 是否免审
                var trial_contract;
                var $target = $(e.currentTarget);
                if ($target.html() == "提交") {
                    // 提交按鈕
                    this.saveUrl = "contract/add";
                } else {
                    // 保存按钮
                    // 如果是编辑的保存。增加contractId
                    var judgeType = momo.getURLElement("type");
                    var from = momo.getURLElement("from");
                    if (judgeType && judgeType == "edit" && from !== "draft") {
                        this.saveUrl = "contract/edit";
                    } else {
                        this.saveUrl = "contract/savedrafts";
                    }
                    ;

                }

                //验证所有表单
                var check = self.verification();
                if (check == false) {
                    return;
                }
                ;

                // 点击提交的时候，發送請求到後台驗證是否能讓該用戶進行免审
                if ($target.html() == "提交") {
                    // 设置参数，用以提交成功后做判断，提交为submit，保存为save
                    var clickType = "submit";
                    momo.sendPost({
                        paymentType: $("#d_paymentType").val(),
                        contractMoney: $("#d_contractMoney").val().replace(/,/g, ""),
                        accessToken: contractDetail.accessToken
                    }, "contract/ismianshen", function (data) {
                        console.log("create===========>", data);
                        if (data.msstatus == 1) {
                            // 免审
                            var checkData = "请选择是否免审";
                            //显示确认模态框
                            $("#m_askDialog").remove();
                            $("body").append(
                                "<section id='m_askDialog' title=" + checkData + "> " +
                                "<p><span class='ui-icon ui-icon-alert' style='float:left; margin:0 7px 20px 0;'></span>" +
                                checkData + "</p></section>");
                            $("#m_askDialog").dialog({
                                resizable: false,
                                height: 200,
                                modal: true,
                                buttons: {
                                    "预审": function () {
                                        $(this).dialog("close");
                                        console.log("sure");
                                        trial_contract = 0;
                                        uploadFile.call(self); //开始上传
                                    },
                                    "免预审": function () {
                                        console.log("cancel");
                                        $(this).dialog("close");
                                        trial_contract = 1;
                                        uploadFile.call(self); //开始上传
                                    }
                                }
                            });
                        } else {
                            uploadFile.call(self); //开始上传
                        }
                        return;
                    });
                } else {
                    uploadFile.call(self); //开始上传
                    // 设置参数，用以提交成功后做判断，提交为submit，保存为save

                    // 如果是编辑的保存,clicktype = edit
                    var judgeType = momo.getURLElement("type");
                    var from = momo.getURLElement("from");
                    if (judgeType && judgeType == "edit" && from !== "draft") {
                        var clickType = "edit";
                    } else {
                        var clickType = "save";
                    }
                    ;

                }
                ;

                //上传文件
                function uploadFile() {
                    hadUploadNum++;
                    if (hadUploadNum == fileLength) { //全部上传完成
                        momo.setLoadingBar("hide", null, "上传完成!");
                        console.log(allFilelist, "========allFilelist");
                        // 合同文本id
                        var mainAttachId = momo.getContractId(allFilelist, "contractText");
                        // 合同附件id
                        var mianAttachment = momo.getContractId(allFilelist, "mianAttachment");
                        // 合同其他附件id
                        var otherAttachIds = momo.getContractId(allFilelist, "otherAttachment");
                        console.log(mainAttachId, "=========合同文本id");
                        console.log(mianAttachment, "=========合同附件id");
                        console.log(otherAttachIds, "=========合同其他附件id");

                        // 我方附属主体
                        var moreSelfMainBodyIds = momo.getBodyId("#d_selfMoreGroupId");
                        // 对方附属主体
                        var d_moreSelfItemId = momo.getBodyId("#d_moreSelfItemId");

                        // 类目
                        if ($("#d_paymentType1").val() == "0") {
                            var moneyType = $("#d_paymentType2").find("option:selected").attr("data-name");
                            var moneyId = $("#d_paymentType2").val();
                        } else {
                            var moneyType = $("#d_otherpaymentType2").find("option:selected").attr("data-name");
                            var moneyId = $("#d_otherpaymentType2").val();
                        }
                        ;

                        // 类型，费用类别/关键行动六
                        if ($("#d_paymentType1").val() == 0) {
                            var costType = "cost";
                        } else {
                            var costType = "keyaction";
                        }
                        var sendData = {
                            accessToken: contractDetail.accessToken,
                            // 发起人
                            createBy: contractDetail.accessToken,
                            // 合同名称
                            contractName: $("#d_contractName").val(),
                            // 我方主体id
                            selfMainBodyId: $("#d_selfMainBodyName").attr("data-id"),
                            // 我方主体名称
                            selfMainBodyName: $("#d_selfMainBodyName").val(),
                            // 对方主体id
                            otherMainBodyId: $("#d_otherMainBodyName").attr("data-id"),
                            // 对方主体名称
                            otherMainBodyName: $("#d_otherMainBodyName").val(),
                            // 费用类别 费用类别/关键行动六
                            costType: costType,
                            // 类目
                            costTypeName: moneyType,
                            // 类目id
                            costTypeId: moneyId,
                            // 收付方向类型 1为收款 2为付款 3为不涉及金额
                            paymentType: $("#d_paymentType").val(),
                            // 汇率类型
                            exchangeId: $("#d_exchangeRate").find("option:selected").attr("data-name"),
                            // 币种 汇率
                            exchangeRate: $("#d_exchangeRate").val(),
                            // 合同金额
                            contractMoney: $("#d_contractMoney").val().replace(/,/g, ""),
                            // 是否补充协议 0为否 1为是
                            isMakeUp: $("#d_isMakeUp").val(),
                            // 原合同编号
                            oldContractCode: $("#d_oldContractCode").val(),
                            // 原合同金额
                            oldContractMoney: $("#d_oldContractMoney").val(),
                            // 申购人id
                            requisitionerId: $("#d_requisitionerId").attr("data-id"),
                            // 有效开始时间
                            expiryDateStart: $("#d_expiryDateStartstr").val(),
                            // 有效结束时间
                            expiryDateEnd: $("#d_expiryDateEnd").val(),
                            // 签约背景
                            signContext: $("#d_signContext").val(),
                            //  合同文本id
                            mainAttachId: mainAttachId,
                            // 合同附件id
                            attachIds: mianAttachment,
                            // 合同其他附件id
                            otherAttachIds: otherAttachIds,
                            // 是否框架协议 1为是 0为否
                            frame: $("#d_isMakeUp1").val(),
                            // 我方附属主体 非必填
                            moreSelfMainBodyIds: moreSelfMainBodyIds,
                            // 对方附属主体 非必填
                            moreOtherMainBodyIds: d_moreSelfItemId,
                        };

                        // 如果是编辑的保存。增加contractId
                        var judgeType = momo.getURLElement("type");
                        if (judgeType == "edit") {
                            sendData.contractId = contractDetail.contractId;
                        }
                        ;
                        // 是否免审标识 0免审，1不免审
                        if (trial_contract !== undefined && trial_contract !== null) {
                            sendData.trial_contract = trial_contract;
                        } else {
                            sendData.trial_contract = 0;
                        }
                        ;

                        console.log(sendData, "======================sendData");
                        momo.sendPost(sendData, this.saveUrl, function (data) {
                            console.log(data, "==========點擊提交或者保存");
                            if (data.success = true) {
                                // clickType,submit 为提交，save为保存
                                if (clickType == "submit") {
                                    if (data.data.errorDescription == "成功") {
                                        momo.ctrlMsgBox("show", "body", "提交成功", function () {
                                            location.href = "./contractDetail.html?from=all&type=detail&menuIndex=2-3&tabIndex=4&instanceID=" + data.data.instanceID + "&contractId=" + data.data.contractId + "&processID=" + data.data.processID;
                                        });
                                        // alert("提交成功");

                                    } else {
                                        momo.ctrlMsgBox("show", "body", "提交失败，请重试");
                                        // alert("提交失败，请重试");
                                    }

                                } else if (clickType == "save") {
                                    momo.ctrlMsgBox("show", "body", "保存成功", function () {
                                        location.href = "./contractDraft.html?tabIndex=4";
                                    });
                                    // alert("保存成功");

                                } else {
                                    momo.ctrlMsgBox("show", "body", "编辑保存成功");
                                }
                                ;

                            }
                        });
                    } else {
                        //判断所属组
                        var url = "";
                        var fileItem = this.fileList[hadUploadNum];
                        console.log(this.fileList.length);

                        // 原来的接口，暂时不用，使用sharepoint接口
                        // if (fileItem.fileType2 == "contractText") url = "file/uploadFile?";

                        // 合同文本上传到sharepoint
                        if (fileItem.fileType2 == "contractText") url = "file/uploadOwaFile?";

                        else if (fileItem.fileType2 == "mianAttachment") url = "file/uploadAttachment?attachmentType=contract";
                        else if (fileItem.fileType2 == "otherAttachment") url = "file/uploadAttachment?attachmentType=other";
                        url += "&accessToken=" + contractDetail.accessToken;
                        momo.uploadFile(url, fileItem, function (data) {
                            if (data) {
                                console.log(data, "＝＝＝＝＝＝＝＝＝＝＝上传图片返回数据");
                                allFilelist.push({
                                    id: data.data[0].fileId,
                                    fileItem: fileItem.fileType2
                                });
                                uploadFile.call(this); //开始上传
                            } else {
                                alert("微软接口报错");
                            }
                        }.bind(this));
                    }
                    ;
                };
            }
        },

        //基本信息页对象
        baseData: {
            init: function () {
                console.log("baseData-------Init");
                $("#tabBox0").show();
                momo.addKeyContral();
                momo.addInputRule("#tabBox0", {
                    maxLength: 20,
                    minValue: 0,
                    // maxValue: 100000
                }, function () {});
                // $("#m_left").height($("#m_right").height());

                this.addEvent();
                // 渲染时候隐藏一个类目
                $("#d_otherpaymentType2").hide();
                // 渲染时设置发起部门发起人
                $("#d_accessToken").attr("data-token", momo.accessToken).val(sessionStorage.getItem("userName"));
                $("#d_accessToken1").val(sessionStorage.getItem("departmentName"));

                // 退出链接
                $(".xm_topInfo a").attr("href", momo.baseURL + "logout");

                //momo.addInputTip("#tabBox0 #d_selfMainBodyName", this.myDataList,     "companyName");


                // 获取类型类目//模板渲染
                momo.sendPost({
                    pageNo: 1,
                    pageSize: 100,
                    accessToken: contractDetail.accessToken
                }, "api/otherInterface/getCostType", function (data) {
                    console.log(data, "==========类目");
                    var selectTpl = $("#categoryTmp").text();
                    var domStr = "";
                    // 循环渲染
                    for (var i = 0; i < data.result.length; i++) {
                        domStr += momo.template(selectTpl, {
                            name: data.result[i].name,
                            code: data.result[i].code,
                        });
                    }
                    ;
                    $("#d_paymentType2").append(domStr);
                    //判断是详情还是编辑
                    this.judge();
                }.bind(this), "isGet");

                // 获取汇率//模板渲染
                momo.sendPost({
                    pageNo: 1,
                    pageSize: 100,
                    accessToken: contractDetail.accessToken
                }, "api/otherInterface/getExchangeForNow", function (data) {
                    console.log(data, "==========汇率");
                    var selectTpl = $("#test2").text();
                    var domStr = "";
                    // 循环渲染
                    for (var i = 0; i < data.result.length; i++) {
                        domStr += momo.template(selectTpl, {
                            name: data.result[i].currency,
                            rate: data.result[i].rate
                        });
                    }
                    ;
                    $("#d_exchangeRate").append(domStr);
                }, "isGet");

                var type = momo.getURLElement("type");
                var stage = momo.getURLElement("stage");
                var from = momo.getURLElement("from");

                // 判断当前是否是详情页面，如果是详情页面，则不调用这些接口(接口返回数据量太大，渲染需要较长时间)
                if (type == "new" || stage == "stage3" || from == "draft" || stage == "stage1") {
                    //获取我方主体数据//添加我的主体筛选组件
                    momo.sendPost({
                        accessToken: contractDetail.accessToken,
                        isAll: 1
                    }, "api/otherInterface/searchSelfByName", function (data) {
                        momo.addInputTip("#tabBox0 #d_selfMainBodyName", data.data.result, "selfComanyName", "selfComanyCode", function () {
                            console.log($(this));
                            console.log($(this).attr("data-id"));
                            $("#d_selfMainBodyName").attr("data-id", $(this).attr("data-id"));

                            //设置我方主体，选中之后
                            var ourVal = $("#tabBox0 #d_selfMainBodyName").val();
                            // 当前id名
                            var idName = $("#d_selfMainBodyName");
                            // 同时还应匹配我方附属主体内容
                            var otherIdName = $("#d_selfMoreGroupId");
                            // 当前对象是否是附属主体
                            var isFushu = false;
                            var checkTheSame = momo.checkTheSame(idName, ourVal, otherIdName, isFushu);

                            // 验证我方主体与我方附属主体名称是否重复
                            if (checkTheSame == false) {
                                momo.ctrlMsgBox("show", "body", "我方主体名称与附属主体名称不能重复", function () {
                                    $("#d_selfMainBodyName").removeAttr("disabled");
                                    $("#d_selfMainBodyName").find(".ourItemDeleteBtn").remove();
                                    $("#tabBox0 #d_selfMainBodyName").val("");
                                });
                                // alert("我方主体名称与附属主体名称不能重复");

                            } else {
                                // 设置不能输入，点击 x 之后清空原有值之后，才能再次输入
                                $("#d_selfMainBodyName").attr("disabled", "disabled");
                                var ourDomStr = "<div class='ourItemDeleteBtn'></div>";
                                $("#tabBox0 #d_selfMainBodyName").after(ourDomStr);
                                $("#d_selfMainBodyName").addClass("isRealVal");
                                // 设置title提示
                                idName.attr("title", idName.val());
                            }
                            ;

                        }); //设置我方主体
                        momo.addInputTip("#tabBox0 #d_moreSelfMainBodyIds", data.data.result, "selfComanyName", "selfComanyId", function () {
                            console.log($(this));
                            console.log($(this).attr("data-id"));

                            //设置我方附属主体，选中之后
                            var val = $("#tabBox0 #d_moreSelfMainBodyIds").val();

                            // 当前id名
                            var idName = $("#d_selfMoreGroupId");
                            // 同时还应匹配我方主体内容
                            var otherIdName = $("#d_selfMainBodyName");
                            // 当前对象是否是附属主体
                            var isFushu = true;
                            var checkTheSame = momo.checkTheSame(idName, val, otherIdName, isFushu);
                            $("#tabBox0 #d_moreSelfMainBodyIds").val("");
                            // 验证附属主体名称是否重复
                            if (checkTheSame == false) {
                                momo.ctrlMsgBox("show", "body", "附属主体名称不能重复或与我方主体名称相同");
                                // alert("附属主体名称不能重复或与我方主体名称相同");
                            } else {
                                // 不重复执行插入dom节点操作
                                var domStr = "<div class='moreItem'> <div class='moreItemName'>" + val + "</div> <div class='moreItemDeleteBtn'></div> </div>";
                                $("#tabBox0 #d_moreSelfMainBodyIds").before(domStr);
                            }
                            ;
                        });
                    });

                    //获取对方主体数据//添加对方主体筛选组件
                    momo.sendPost({
                        accessToken: contractDetail.accessToken,
                        isAll: 1
                    }, "api/otherInterface/searchOtherByName", function (data) {
                        // momo.addInputTip("#tabBox0 #d_otherMainBodyName", data.data.result, "companyName");
                        momo.addInputTip("#tabBox0 #d_otherMainBodyName", data.data.result, "companyName", "companyCode", function () {
                            // console.log($(this));
                            // console.log($(this).attr("data-id"));
                            $("#d_otherMainBodyName").attr("data-id", $(this).attr("data-id"));

                            //设置对方主体，选中之后
                            var ourVal = $("#tabBox0 #d_otherMainBodyName").val();
                            // 当前id名
                            var idName = $("#d_otherMainBodyName");
                            // 同时还应匹配我方附属主体内容
                            var otherIdName = $("#d_moreSelfItemId");
                            // 当前对象是否是附属主体
                            var isFushu = false;
                            var checkTheSame = momo.checkTheSame(idName, ourVal, otherIdName, isFushu);

                            // 验证我方主体与我方附属主体名称是否重复
                            if (checkTheSame == false) {
                                momo.ctrlMsgBox("show", "body", "对方主体名称与附属主体名称不能重复", function () {
                                    $("#d_otherMainBodyName").removeAttr("disabled");
                                    $("#d_otherMainBodyName").find(".ourItemDeleteBtn").remove();
                                    $("#tabBox0 #d_otherMainBodyName").val("");
                                });
                                // alert("对方主体名称与附属主体名称不能重复");

                            } else {
                                // 设置不能输入，点击 x 之后清空原有值之后，才能再次输入
                                $("#d_otherMainBodyName").attr("disabled", "disabled");
                                var ourDomStr = "<div class='ourItemDeleteBtn'></div>";
                                $("#tabBox0 #d_otherMainBodyName").after(ourDomStr);
                                $("#d_otherMainBodyName").addClass("isRealVal");
                                idName.attr("title", idName.val());
                            }
                            ;

                        }); //设置对方主体

                        momo.addInputTip("#tabBox0 #d_otherSelfMainBodyIds", data.data.result, "companyName", "otherCompanyId", function () {
                            //设置对方附属主体，选中之后
                            var val = $("#tabBox0 #d_otherSelfMainBodyIds").val();
                            $("#tabBox0 #d_otherSelfMainBodyIds").val("");

                            var idName = $("#d_moreSelfItemId");
                            // 同时还应匹配对方主体内容
                            var otherIdName = $("#d_otherMainBodyName");
                            // 当前对象是否是附属主体
                            var isFushu = true;
                            var checkTheSame = momo.checkTheSame(idName, val, otherIdName, isFushu);
                            // 验证附属主体名称是否重复
                            if (checkTheSame == false) {
                                momo.ctrlMsgBox("show", "body", "附属主体名称不能重复或与对方主体名称相同", function () {
                                    $("#tabBox0 #d_moreSelfMainBodyIds").val("");
                                });
                                // alert("附属主体名称不能重复或与对方主体名称相同");
                            } else {
                                // 不重复执行插入dom节点操作
                                var domStr = "<div class='moreItem'> <div class='moreItemName'>" + val + "</div> <div class='moreItemDeleteBtn'></div> </div>";
                                $("#tabBox0 #d_otherSelfMainBodyIds").before(domStr);
                            }
                            ;
                        });
                    });
                }
                ;

                $(document).on("change", "#d_requisitionerId", function () {
                    var keyword = $("#d_requisitionerId").val();
                    $("#d_purchaseDepartment").val("");
                });


                $(document).on("click", ".menuGroup a", function (e) {
                    // 阻止冒泡
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    var type = momo.getURLElement("type"),
                        stage = momo.getURLElement("stage"),
                        from = momo.getURLElement("from"),
                        $target = $(e.currentTarget);
                    // 当前编辑状态时，跳转进行二次确认
                    if (type == "new" || stage == "stage3" || from == "draft" || stage == "stage1") {
                        $("body").append(
                            "<section id='m_askDialog' title='跳转'> " +
                            "<p><span class='ui-icon ui-icon-alert' style='float:left; margin:0 7px 20px 0;'></span>" +
                            "确定放弃当前编辑，进行跳转吗" + "</p></section>");
                        $("#m_askDialog").dialog({
                            resizable: false,
                            height: 200,
                            modal: true,
                            buttons: {
                                "确定": function () {
                                    $(this).dialog("close");
                                    var href = $target.attr("href");
                                    window.location.href = href;
                                },
                                "取消": function () {
                                    $(this).dialog("close");
                                }
                            }
                        });
                        return false;
                    }
                });

                // 类型类目选择
                $(document).on("change", "#d_paymentType1", function () {
                    var selectVal = $("#d_paymentType1").val();
                    if (selectVal == 0) {
                        $("#d_paymentType2").show();
                        $("#d_otherpaymentType2").hide();
                    } else {
                        $("#d_paymentType2").hide();
                        $("#d_otherpaymentType2").show();
                    }
                });

                //初始化日期插件
                $("#d_expiryDateStartstr").datepicker({
                    changeMonth: true,
                    changeYear: true
                });
                $("#d_expiryDateEnd").datepicker({
                    changeMonth: true,
                    changeYear: true
                });
                $("#d_expiryDateStartstr").datepicker("option", "dateFormat", "yy-mm-dd");
                $("#d_expiryDateEnd").datepicker("option", "dateFormat", "yy-mm-dd");
            },

            judge: function () {
                console.log("=======详情页面=========");
                var judgeType = momo.getURLElement("type");
                console.log("获取type类型 显示详细信息 ： " + judgeType);
                if (judgeType == "detail" || judgeType == "edit") {
                    // 详情页面
                    this.showDetail();
                } else {
                    console.log("isnotedit");
                }
                ;
            },

            showDetail: function () {
                var isFrom = momo.getURLElement("from"),
                    getDetailUrl, getDetailData;
                if (isFrom == "wait") {
                    // 来自待办，调用获取待办详情的接口
                    getDetailUrl = "contract/getBaseinfo";
                    getDetailData = {
                        accessToken: contractDetail.accessToken,
                        instanceID: contractDetail.instanceID
                    };
                } else {
                    // 来自草案，调用获取草案详情的接口
                    getDetailUrl = "contract/getbaseinfo";
                    getDetailData = {
                        accessToken: contractDetail.accessToken,
                        contractId: contractDetail.contractId
                    };

                }
                ;
                momo.sendPost(getDetailData, getDetailUrl, function (data) {
                    console.log(data, "======================详情数据");
                    if (data.data.contract.contractCode) {
                        $(".contractIdNumItem").removeClass("hidden").find("#d_contractIdNum").val(data.data.contract.contractCode).attr("title", data.data.contract.contractCode);
                    }
                    // 发起人
                    $("#d_accessToken").val(data.data.contract.createName);
                    // 发起部门
                    $("#d_accessToken1").val(data.data.contract.createDepa);
                    // 合同名称
                    $("#d_contractName").val(data.data.contract.contractName);
                    // 我方主体id
                    $("#d_selfMainBodyName").attr("data-id", data.data.contract.selfMainBodyId);
                    // 我方主体名称
                    if (data.data.contract.selfMainBodyName) {
                        $("#d_selfMainBodyName").val(data.data.contract.selfMainBodyName).attr("title", data.data.contract.selfMainBodyName);
                        // 设置不能输入，点击 x 之后清空原有值之后，才能再次输入
                        $("#d_selfMainBodyName").attr("disabled", "disabled");
                        var ourDomStr = "<div class='ourItemDeleteBtn'></div>";
                        $("#tabBox0 #d_selfMainBodyName").after(ourDomStr);
                        $("#d_selfMainBodyName").addClass("isRealVal");
                    }
                    ;

                    // 我方附属主体,strToArr函数遍历数组，返回html元素
                    if (data.data.contract.moreSelfMainBodyIds) {
                        var moreSelfDomStr = momo.strToArr(data.data.contract.moreSelfMainBodyIds);
                        $("#tabBox0 #d_moreSelfMainBodyIds").before(moreSelfDomStr);
                    }

                    // 对方主体id
                    $("#d_otherMainBodyName").attr("data-id", data.data.contract.otherMainBodyId);
                    // 对方主体名称
                    if (data.data.contract.otherMainBodyName) {
                        $("#d_otherMainBodyName").val(data.data.contract.otherMainBodyName).attr("title", data.data.contract.otherMainBodyName);
                        $("#d_otherMainBodyName").attr("disabled", "disabled");
                        var ourDomStr = "<div class='ourItemDeleteBtn'></div>";
                        $("#tabBox0 #d_otherMainBodyName").after(ourDomStr);
                        $("#d_otherMainBodyName").addClass("isRealVal");
                    }
                    ;

                    // 对方附属主体,strToArr函数遍历数组，返回html元素
                    if (data.data.contract.moreOtherMainBodyIds) {
                        var moreOtherDomStr = momo.strToArr(data.data.contract.moreOtherMainBodyIds);
                        $("#tabBox0 #d_otherSelfMainBodyIds").before(moreOtherDomStr);
                    }

                    // 费用类别 类型
                    if (data.data.contract.costType == "cost") {
                        $("#d_paymentType1").val("0");
                        $("#d_paymentType2").show();
                        $("#d_otherpaymentType2").hide();

                    } else {
                        $("#d_paymentType1").val("1");
                        $("#d_paymentType2").hide();
                        $("#d_otherpaymentType2").show();
                    }
                    ;

                    // 收付方向类型 1为收款 2为付款 3为不涉及金额
                    $("#d_paymentType").val(data.data.contract.paymentType).trigger("change");
                    // 汇率类型
                    //  $("#d_exchangeRate").selected).attr("data-name");
                    // 汇率
                    setTimeout(function () {
                        $("#d_exchangeRate").val(data.data.contract.exchangeRate).trigger("change");
                        $("#d_contractMoney").trigger("change");
                        // 类目
                        if ($("#d_paymentType2").is(":visible")) {
                            $("#d_paymentType2").val(data.data.contract.costTypeId);
                        } else {
                            $("#d_otherpaymentType2").val(data.data.contract.costTypeId);
                        }

                    }, 800);

                    // 合同金额
                    $("#d_contractMoney").val(data.data.contract.contractMoney);
                    // 是否补充协议 0为否 1为是
                    if (data.data.contract.isMakeUp == false) {
                        $("#d_isMakeUp").val("0");
                    } else {
                        $("#d_isMakeUp").val("1").trigger("change");
                        // // 原合同编号
                        $("#d_oldContractCode").val(data.data.contract.oldContractCode);
                        // // 原合同金额
                        $("#d_oldContractMoney").val(data.data.contract.oldContractMoney);
                    }
                    // 是否框架协议 0为否 1为是
                    if (data.data.contract.frame == true) {
                        $("#d_isMakeUp1").val("0");
                    } else {
                        $("#d_isMakeUp1").val("1");
                    }
                    ;

                    // 申购人
                    // var requisitionerName = data.data.contract.requisitionerName + ",（" + data.data.contract.requisitionerDepa + "，" + data.data.contract.requisitionerId + "）";
                    // 直接使用申购人
                    $("#d_requisitionerId").val(data.data.contract.requisitionerName);
                    // 申购人id
                    $("#d_requisitionerId").attr({
                        "data-id": data.data.contract.requisitionerId,
                        "title": data.data.contract.requisitionerName
                    });
                    // 申购部门
                    $("#d_purchaseDepartment").val(data.data.contract.requisitionerDepa).attr("title", data.data.contract.requisitionerDepa);
                    // // 有效开始时间
                    $("#d_expiryDateStartstr").val(data.data.contract.expiryDateStartString);
                    // // 有效结束时间
                    $("#d_expiryDateEnd").val(data.data.contract.expiryDateEndString);
                    // // 签约背景
                    $("#d_signContext").val(data.data.contract.signContext);
                    // 是否免审标识 0免审，1不免审
                    // trial_contract;
                    // 是否框架协议 1为是 0为否
                    if (data.data.contract.frame == false) {
                        $("#d_isMakeUp1").val("0");
                    } else {
                        $("#d_isMakeUp1").val("1");
                    }
                    // 附件的渲染
                    this.getAnnex();
                }.bind(this));

            },

            // 附件渲染
            getAnnex: function () {
                momo.sendPost({
                    accessToken: contractDetail.accessToken,
                    contractId: contractDetail.contractId
                }, "contract/getattachs", function (data) {
                    console.log(data, "============附件信息");
                    var selectTpl = $("#attackTemp").text();
                    var contractTextdomStr = "";
                    var mianAttachmentdomStr = "";
                    var otherAttachmentdomStr = "";

                    if (data.mainFile) {
                        // 合同文本渲染
                        contractTextdomStr = momo.template(selectTpl, {
                            size: data.mainFile.fileSizeStr,
                            name: data.mainFile.fileName,
                            id: data.mainFile.contractFileId
                        });
                        $("#contractText").append(contractTextdomStr);
                        // 合同文本编辑的链接
                        $("#contractText .editBtn a").attr({"href": data.mainFile.owaPath, "target": "_blank"});
                        // 后台给的fileid,渲染到 .oldFileId 对应的data-id属性上，方便点击提交或者保存的按钮时候，遍历，获取fileid,一并提交
                        $("#contractText").find(".itemName").addClass("oldFileId");
                        // 隐藏checkbox框
                        $("#contractText").find(".checkRadio").hide();

                        // 打水印：返回参数中追加了一个pdfStatus字段 1代表转成功了 0 未成功
                        if (data.pdfStatus == "0") {
                            // $("#contractText .itemHandleGroup .statusBtn").html("转换中").removeClass("downLoadBtn");
                        }
                    }
                    ;

                    if (data.contractAttachs) {
                        // 合同附件渲染
                        for (var i = 0; i < data.contractAttachs.length; i++) {
                            mianAttachmentdomStr += momo.template(selectTpl, {
                                size: data.contractAttachs[i].fileSizeStr,
                                name: data.contractAttachs[i].fileName,
                                id: data.contractAttachs[i].contractAttachmentId
                            });
                        }
                        ;
                        $("#mianAttachment").append(mianAttachmentdomStr);
                        // 合同附件隐藏编辑按钮
                        $("#mianAttachment .editBtn").hide();
                        // 后台给的fileid,渲染到 .oldFileId 对应的data-id属性上，方便点击提交或者保存的按钮时候，遍历，获取fileid,一并提交
                        $("#mianAttachment").find(".itemName").addClass("oldFileId");
                    }
                    ;

                    if (data.otherAttachs) {
                        // 其他附件渲染
                        for (var i = 0; i < data.otherAttachs.length; i++) {
                            otherAttachmentdomStr += momo.template(selectTpl, {
                                size: data.otherAttachs[i].fileSizeStr,
                                name: data.otherAttachs[i].fileName,
                                id: data.otherAttachs[i].contractAttachmentId
                            });
                        }
                        ;
                        $("#otherAttachment").append(otherAttachmentdomStr);
                        // 其他附件隐藏编辑按钮
                        $("#otherAttachment .editBtn").hide();
                        // 后台给的fileid,渲染到 .oldFileId 对应的data-id属性上，方便点击提交或者保存的按钮时候，遍历，获取fileid,一并提交
                        $("#otherAttachment").find(".itemName").addClass("oldFileId");
                    }

                    // 判断编辑还是详情
                    var judgeType = momo.getURLElement("type");
                    // 环节名称
                    var stage = momo.getURLElement("stage");
                    if (judgeType == "detail") {
                        // 基本信息不能编辑
                        this.detailSth();
                        // 附件不能编辑
                        this.cannotAnnex();
                    } else if (judgeType == "edit") {
                        $("#tabBox0 .m_resetBtn").hide();
                        // 历史版本按钮
                        $("#contractText .titleHandle").append("<div class='cursorPointer historyBtn'>历史版本</div>");

                        // 每个环节对应的操作 stage ＝＝》环节名
                        if (stage) {
                            if (stage == "stage1") {
                                // 开始环节 相当于新建，保留，看以后是否有新的业务需求
                                // console.log("is stage1");
                            } else if (stage == "stage2") {
                                // 基本信息不能编辑
                                this.detailSth();
                                // // 预审环节:  附件中（合同文本附件不可删除，显示下载、编辑、历史版本按钮，合同附件、其他附件可上传、下载）
                                $("#contractText .deleteBtn,#contractText .fileMask").hide();
                                $("#tabBox1 .submitBtn").hide();
                            } else if (stage == "stage3") {
                                // 提审环节:  表单可编辑，附件中（合同文本附件不可删除，显示下载、编辑、历史版本按钮，合同附件、其他附件可上传、下载、 删除）
                                $("#contractText .deleteBtn,#contractText .fileMask").hide();
                                $("#tabBox1 .submitBtn").hide();

                            } else if (stage == "stage4" || "stage5" || "stage6") {
                                // 审批：表单不可编辑，附件中（合同文本附件不可删除，显示下载、历史版本按钮，合同附件、其他附件可下载）

                                // 盖章：表单不可编辑，附件中（合同文本附件不可删除，显示下载、历史版本按钮，合同附件、其他附件可下载）

                                // 归档：表单不可编辑，附件中（合同文本附件不可删除，显示下载、历史版本按钮，合同附件、其他附件可下载）
                                // 基本信息不能编辑
                                this.detailSth();

                                // 合同文本编辑按钮隐藏
                                $("#contractText .editBtn").hide();

                                $("#contractText .deleteBtn,#contractText .fileMask").hide();
                                $("#tabBox1 .submitBtn,#tabBox1 .saveBtn").hide();
                                $("#mianAttachment .deleteBtn,#otherAttachment .deleteBtn").hide();
                                $("#mianAttachment .titleHandle,#otherAttachment .titleHandle").hide();
                            } else {
                                console.log("is nostage")
                            }
                        }
                    } else {

                    }
                    ;
                }.bind(this))
            },

            // 基本信息不能编辑(如果是详情需要执行的函数: 区分详情与编辑)
            detailSth: function () {
                // 限制所有的输入框不能输入
                momo.cancelInput("#tabBox0", function () {
                    //重置按钮
                    $("#tabBox0 .m_resetBtn").hide();
                });

                // 设置我方&对方附属主体背景
                $("#tabBox0 #d_moreSelfMainBodyIds").css("background", "#fff");
                $("#tabBox0 #d_otherSelfMainBodyIds").css("background", "#fff");

                // 隐藏我方&对方附属主体下的删除按钮
                $("#tabBox0 #d_selfMoreGroupId").find(".moreItemDeleteBtn").hide();
                $("#tabBox0 #d_moreSelfItemId").find(".moreItemDeleteBtn").hide();

                // 隐藏主体的x按钮
                $("#tabBox0 .ourItemDeleteBtn").hide();
            },

            // 附件不能编辑
            cannotAnnex: function () {
                $("#tabBox1 .saveBtn").hide();
                $("#tabBox1 .submitBtn").hide();
                $("#tabBox1 .selectFile").hide();
                $("#tabBox1 .deleteAll").hide();
                // 附件部分：隐藏删除按钮
                $("#tabBox1 .deleteBtn").hide();
                // 蕴藏上传按钮
                $("#tabBox1 .fileMask").hide();
                $("#tabBox1 .editBtn").hide();
                // 附件部分：隱藏多選按鈕
                $("#tabBox1 .checkRadio").hide();
                // 隐藏下一步按钮
                $("#tabBox1 .submitBtn").hide();
            },

            //添加事件监听
            addEvent: function () {
                var self = this;
                //提交表单
                // $(document).on("click", "#tabBox0 .submitBtn", function() {
                //   console.log("finish");
                //   var obj = momo.getInput("#tabBox0");
                // })

                //提交表单
                $(document).on("click", "#tabBox0 .submitBtn", function () {
                    $("#tabBar span").eq(1).click();
                    console.log("finish");
                    // momo.getInput("#tabBox0");
                    // if (momo.checkData("#tabBox0")) {
                    //     momo.sendPost({}, "contract/create", function() {});
                    // }
                });

                //选择是否补充协议
                $(document).on("change", "#tabBox0 #d_isMakeUp", function () {
                    if ($(this).val() == 0) $(".foldItem").hide(500);
                    else $(".foldItem").show(500);
                });

                //选择是否收付方向
                $(document).on("change", "#tabBox0 #d_paymentType", function () {
                    if ($(this).val() == 3) {
                        $("#d_contractMoney").attr("disabled", "disabled").val("0").trigger("change");
                        $("#d_exchangeRate").attr("disabled", "disabled");

                    } else {
                        $("#d_contractMoney").removeAttr("disabled");
                        $("#d_exchangeRate").removeAttr("disabled")
                    }
                    ;

                });

                //清空设置项
                momo.addReset("#tabBox0", function () { //额外的重置操作
                });

                //点击删除附属项目
                $(document).on("click", ".moreItemDeleteBtn", function () {
                    $(this).parent().remove();
                });

                //点击删除我方主体项目
                $(document).on("click", ".ourItemDeleteBtn", function () {
                    $(this).prev().removeAttr("disabled").val("").removeClass('isRealVal');
                    $(this).remove();
                });

                // 申购人选择，调用组件
                $(document).on("click", "#clickChooseRequist", function () {
                    window.SP_enterCallback = function (data) {
                        console.log(data);
                        var str = data.peopleName + ",(" + data.orgName + "," + data.peopleId + ")";
                        $("#d_requisitionerId").val(data.peopleName).attr("title", data.peopleName);
                        // 申购部门相应变化
                        $("#d_requisitionerId").attr("data-id", data.peopleId);
                        var requisitionerIdStr = $("#d_requisitionerId").val();
                        // 从申购人里面截取出部门名字
                        // var index = requisitionerIdStr.lastIndexOf("(");
                        // var index2 = requisitionerIdStr.lastIndexOf(",");
                        // var orgName = requisitionerIdStr.substring(index, index2);
                        // $("#d_purchaseDepartment").val(orgName.substring(1)).attr("title", orgName.substring(1));
                        $("#d_purchaseDepartment").val(data.orgName).attr("title", data.orgName);
                    };

                    // 当前页面是非详情的情况下，调用选人组件
                    var urlType = momo.getURLElement("type");
                    if (urlType !== "detail" || !urlType) {
                        layer.open({
                            type: 2,
                            title: '选择申购人',
                            area: ['800px', '600px'],
                            content: '../plugin/selectPeople/single/contract_person.html'
                        });
                    }

                });

                //输入合同金额
                $(document).on("change input", "#d_contractMoney", function () {
                    // 合同金额的值去掉逗号
                    var inputVal = $("#d_contractMoney").val().replace(/,/g, "");
                    if (inputVal == 0) {
                        // 如果金额为0，大写显示0
                        $("#d_Conversion").val("0");
                        $(".chineseNum").val("零");
                    } else {
                        // 合同金额的值加上逗号（每隔三位）
                        var commaVal = inputVal.replace(/\B(?=(?:\d{3})+\b)/g, ',');
                        $("#d_contractMoney").val(commaVal);
                        // 人民币汇率转换
                        var d_exchangeRateVal = $("#d_exchangeRate").val();
                        var d_ConversionVal = d_exchangeRateVal * inputVal;
                        //折算人民币转换
                        $("#d_Conversion").val(d_ConversionVal.toFixed(2).replace(/\B(?=(?:\d{3})+\b)/g, ','));
                        //大小写转换<==>折算后的金额
                        $("#tabBox0 .chineseNum").val(momo.numToCh(d_ConversionVal.toFixed(2))).attr("title", momo.numToCh(d_ConversionVal.toFixed(2)));
                    }

                });

                // 聚焦离开的时候验证当前填写的是否合法
                $(document).on("blur", "#d_contractMoney", function () {
                    var inputVal = $("#d_contractMoney").val().replace(/,/g, "");
                    if (isNaN(inputVal)) {
                        momo.ctrlMsgBox("show", "body", "请输入数字", function () {
                            $("#d_contractMoney").val("");
                        });
                        // alert("请输入数字");
                    }
                    ;
                });

                $(document).on("change", "#d_exchangeRate", function () {
                    // 触发合同金额的change事件  人民币汇率转换
                    $("#d_contractMoney").trigger("change");
                    $(".exchangeRateInput").val($("#d_exchangeRate").val());
                });

                //点击合同文本的历史版本按钮，显示历史版本弹窗
                $(document).on("click", "#contractText .historyBtn", function (e) {
                    var $target = $(e.currentTarget);
                    // 当前文本的contractFileId
                    var contractFileId = $("#contractText .downLoadBtn").attr("data-id");
                    // 显示历史版本弹窗
                    $(".historyVersion").fadeIn();
                    // 发送请求，获取历史版本数据
                    momo.sendPost({
                        accessToken: contractDetail.accessToken,
                        contractFileId: contractFileId
                    }, "file/viewHistory", function (data) {
                        console.log(data, "============历史版本data");

                        // 历史版本模版
                        var historyTpl = $("#viewHistoryTemp").text(), viewHistorydomStr = "";

                        if (data.data && data.data.length != 0) {
                            for (var i = 0; i < data.data.length; i++) {
                                viewHistorydomStr += momo.template(historyTpl, {
                                    label: data.data[i].label,
                                    createTime: data.data[i].createTime,
                                    url: data.data[i].url
                                });
                            }
                            ;

                        } else {
                            viewHistorydomStr = "<p class='noMessage'>暂无历史版本</p>";
                        }
                        // 渲染历史版本弹窗
                        $(".historyVersion .hv_list .hv_listContainer").html(viewHistorydomStr);
                        // 文件名带过去
                        $(".historyVersion .hv_list_Title .hv_list_TitleName").html($("#contractText .oldFileId").html());
                    });

                });

                //点击合同文本的历史版本按钮，显示历史版本弹窗
                $(document).on("click", "#contractText .downLoadBtn", function (e) {
                    var $target = $(e.currentTarget);
                    // 当前文本的contractFileId
                    var contractFileId = $target.attr("data-id");
                    // 发送请求，获取最新版本数据
                    location.href = momo.baseURL + "file/downloadMaxVersion?&accessToken=" + contractDetail.accessToken + "&contractFileId=" + contractFileId;

                });

                $(document).on("click", ".hv_list_TitleImg", function () {
                    $(".historyVersion").fadeOut();

                });
            },

            //筛选我方主体或对方主体数据
            selectItem: function (who, text) {
                var item = {};
                var returnData = [];
                var data = this.myDataList;
                if (who == "you") data = this.yourDataList;
                for (var i = 0, length = data.length; i < length; i++) {
                    item = data[i];
                    if (item.selfComanyName.indexOf(text) != -1) returnData.push(item);
                }
                return returnData;
            },
        }

    }
})
();

var onLoad = contractDetail.init.bind(contractDetail); //页面开发环境