//个人信息页面及其子页面接口对接
var contractCenter = (function () {
    return {
        tableObj: {},

        //页面初始化函数
        init: function () {
            if (momo.addMenuItem("modeDownload") == "over")return;//添加左边菜单栏
            //初始化列表
            this.tableObj = new momoTable({
                    width: "100%",
                    itemKeyName: "contractId",//表格ID
                    indexData: {name: "序号", width: 1},//是否显示项目下标
                    tableID: "#momoTable1",//表格ID
                    dataItemPrefix: ["data", "result"],
                    dataUrl: "/file/listFile",//获取信息的URL
                    noPage: true
                }
                , [
                    {title: "合同范本名称", width: 3, valueName: "fileName", className: ""},
                ], [
                    {name: "操作", width: 1},
                    {name: "下载", url: momo.baseURL + "file/download", isJump: true, itemElem: ["fileName", "owaPath"], otherElem: ["accessToken"]},
                    //{name: "下载", url: "laws/file/download",isGet: true,  itemElem: ["fileName","owaPath"], otherElem: ["accessToken"]}
                ]
            );
            this.tableObj.postOtherElem = {"accessToken": 6048};
            this.tableObj.init();
        },
    }
})();

var onLoad = contractCenter.init.bind(contractCenter);//页面开发环境
