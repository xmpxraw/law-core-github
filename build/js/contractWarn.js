//个人信息页面及其子页面接口对接
var contractWarn = (function () {
    return {
        tableObj: {},
        isSearch: false,

        //页面初始化函数
        init: function () {
            var self = this;
            if(momo.addMenuItem("contractWarn") == "over")return;//添加左边菜单栏

            //初始化列表//初始化列表
            this.tableObj = new momoTable({
                    width: "100%",
                    itemKeyName: "contractId",//表格ID
                    indexData: {name: "序号", width: 1},//是否显示项目下标
                    tableID: "#momoTable1",//表格ID
                    dataUrl: "/contract/getcontractwarn",//获取信息的URL
                }
                , [
                    {title: "合同名称", width: 3, valueName: "contractName", className: ""},
                    {title: "发起人", width: 2, valueName: "createName", className: ""},
                    {title: "合同期限", width: 2, valueName: "draftCreateDateString", className: ""},
                    {title: "状态", width: 1.5, valueName: "statusstr", className: ""},
                ]
            );
            this.tableObj.postOtherElem = {"accessToken": 6048};
            this.tableObj.getDataCall = function () {//添加获取信息后的回调函数
                if (this.isSearch)$("#tabBox0 .result").show();
            }.bind(this);
            this.tableObj.init();

            //输入关键字实现查询
            $(document).on("click", ".keyWord span", this.searchData.bind(this));

            $(document).on("keydown", function (data) {
                if (data.keyCode == 13)self.searchData.call(self);
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
                    + "&from=" + "warn"
                    + "&type=" + "detail"
                    + "&menuIndex=" + "4"
                    + "&instanceID=" + item.intanceId
                    + "&contractId=" + item.contractId;
                console.log(href);
                //return;
                location.href = href;
            })
        }
    }
})();

var onLoad = contractWarn.init.bind(contractWarn);//页面开发环境
