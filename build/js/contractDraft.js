//个人信息页面及其子页面接口对接
var contractCenter = (function () {
    return {
        tableObj: {},
        isSearch: false,

        //页面初始化函数
        init: function () {
            var self = this;
            if (momo.addMenuItem("contractDraft") == "over")return;//添加左边菜单栏
            //初始化列表
            this.tableObj = new momoTable({
                    width: "100%",
                    singlePageItemNum: 20,
                    singlePageItemName: "pageNumber",
                    itemKeyName: "contractId",//表格ID
                    indexData: {name: "序号", width: 1},//是否显示项目下标
                    tableID: "#momoTable1",//表格ID
                    dataUrl: "/contract/getdrafts",//获取信息的URL
                    checkData: {width: 0.5, url: "/contract/deleteAllDraft", idName: "contractId", postIdName: "contractIds", otherElem: ["accessToken"], isGet: true, title: "批量删除", tipText: "删除的合同将无法恢复，\r\n您确定删除吗？"},//是否有勾选按钮
                }
                , [
                    {title: "合同名称", width: 3, valueName: "contractName", className: ""},
                    {title: "申购人", width: 1.5, valueName: "requisitionerName", className: ""},
                    {title: "保存日期", width: 1.5, valueName: "draftCreateDateString", className: ""},
                ], [
                    {name: "操作", width: 1},
                    {name: "编辑", isEmpty: true},
                    {name: "删除", isEmpty: true}
                    //{name: "删除", url: "laws/contract/deleteDraft", isGet: true, itemElem: ["contractId"], otherElem: ["accessToken"]}
                ]
            );
            this.tableObj.postOtherElem = {"accessToken": 6048};
            this.tableObj.getDataCall = function () {//添加获取信息后的回调函数
                if (this.isSearch)$("#tabBox0 .result").show();
            }.bind(this);
            this.tableObj.init();


            //输入关键字实现查询
            $(document).on("click", ".keyWord span", this.searchData.bind(this));

            //添加键盘操作
            $(document).on("keydown", function (data) {
                if (data.keyCode == 13)self.searchData.call(self);
            });

            //设置删除按钮的事件
            $(document).on("click", ".m_handleClass2", function (e) {
                console.log("m_handleClass2");

                //阻止事件继续冒泡
                e.stopPropagation();
                e.stopImmediatePropagation();

                //显示确认模态框
                var itemIndex = $(this).parents("tr").index();
                $("#m_askDialog").remove();
                $("body").append(
                    "<section id='m_askDialog' title='项目删除'> " +
                    "<p><span class='ui-icon ui-icon-alert' style='float:left; margin:0 7px 20px 0;'></span>" +
                    "'确定删除吗？'" + "</p></section>");
                $("#m_askDialog").dialog({
                    resizable: false,
                    height: 200,
                    modal: true,
                    buttons: {
                        "确定": function () {
                            var body = {
                                accessToken: momo.accessToken,
                                contractId: self.tableObj.dataItemList[itemIndex - 1].contractId
                            };
                            momo.sendPost(body, "contract/deleteDraft", function () {
                                self.tableObj.getData();
                            }, true, "操作成功");
                            $(this).dialog("close");
                        },
                        "取消": function () {
                            $(this).dialog("close");
                        }
                    }
                });
            });

            //设置批量删除按钮
            $(".m_deleteAll").hide();
            $(document).on("click", ".deleteAll", function () {
                
                if($(".m_selectItem[type=checkbox]:checked").length == 0){
                    momo.ctrlMsgBox("show", "body", "请选择需要删除的合同");
                }else{
                    $(".m_deleteAll").trigger("click");
                }
            });

            //添加点击跳转
            this.addJumpEvent();
        },

        //关键字搜索
        searchData: function () {
            this.tableObj.postOtherElem["keyword"] = $(".keyWord input").val();//为请求添加参数
            this.tableObj.curPageNum = 1;
            this.tableObj.getData();
            this.isSearch = true;
        },

        //添加项目点击跳转事件
        addJumpEvent: function () {
            var self = this;
            $(document).on("click", "#momoTable1 tr", function () {
                var index = $(this).index() - 1;
                if (index < 0)return;
                var item = self.tableObj.dataItemList[index];
                var href = "./contractDetail.html?"
                    + "name=" + item.contractName
                    + "&accessToken=" + momo.accessToken
                    + "&from=" + "draft"
                    + "&type=" + "edit"
                    + "&menuIndex=" + "3"
                    + "&contractId=" + item.contractId;
                console.log(href);
                //return;
                location.href = href;
            })
        }
    }
})();

var onLoad = contractCenter.init.bind(contractCenter);//页面开发环境
