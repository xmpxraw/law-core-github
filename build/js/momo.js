//常用公共组件
var momo = (function () {
    return {
        accessToken: "",

        postNum: 0,//连续发送post请求的数量

        //基础url
        baseURL: "",

        isOnline: false,

        hadClick: false,//标示是否已经点击过，用于点击约束

        canShowTip: true,//标示能否再次显示操作提示

        loadingObj: {},//加载进度条的对象

        //初始化页面设置，添加头部，添加侧边栏,计算baseURL
        addMenuItem: function (menuItem) {

            //设置前缀
            if (momo.isOnline) momo.baseURL = 'http://' + window.location.host + "/laws/";
        	//if (momo.isOnline) momo.baseURL = 'http://' + window.location.host + "/";
            // 中明后台服务器
            // else momo.baseURL = "http://10.108.1.168:8080/laws/";
            // 振体后台服务器
             else momo.baseURL = "http://10.108.20.249:8080/laws/";
            // 海龙后台服务器
            // else momo.baseURL = "http://10.108.20.20:8080/laws/";
            // 测试服务器
            //else momo.baseURL = "http://law-test.heylon.cn:8080/laws/";
            if (!menuItem)return;

            //修改title的链接地址
            $("#m_left .m_title a").attr("href", " https://portal-test.infinitus-int.com/_layouts/15/LKKHPG.PortalSite/APPSite/App_Index.aspx ");

            //设置用户accessToken
            var userID = sessionStorage.getItem("userID");
            if (userID != null && userID != "")momo.accessToken = userID;
            else {
                if (momo.isOnline) {
                    momo.sendPost({}, "account/getToken", function (data) {
                        if (data.data.accessToken !== null && data.data.accountName !== null) {
                            sessionStorage.setItem("userID", data.data.accessToken);
                            sessionStorage.setItem("userName", data.data.accountName);
                            sessionStorage.setItem("departmentID", data.data.orgId);
                            sessionStorage.setItem("departmentName", data.data.orgName);
                            sessionStorage.setItem("isMaster", data.data.master);
                            if (data.data.master) location.href = "./contractCenter.html?tabIndex=0";
                            else location.href = "./contractCenter.html?tabIndex=1";
                        }
                        else {
                            momo.ctrlMsgBox("show", "body", "请正确输入账号密码", function () {
                                location.href = "./login.html";
                            });
                        }
                    });
                }
                else {
                    momo.ctrlMsgBox("show", "body", "登录过期，请重新登录！", function () {
                        location.href = "./login.html";
                    });
                    return "over";
                }
                console.log("momo.isOnline    " + momo.isOnline);
            }

            //添加头部和底部
            var topDomList = '<div class="xm_topBG"></div> <section class="xm_top"><img src="../image/logo_contract.png" alt="" /><div class="xm_topTitle">法务合同管理应用</div><div class="xm_topInfo"><span class="headIdName"></span><a>退出</a></div><section>';
            var bottomDomList = '<footer class="xm_footer"><p>Copyright  2016 李锦记健康产品集团版权所有</p></footer>'
            $("#m_left").before(topDomList);
            $("#m_right").after(bottomDomList);

            // 设置头部用户名
            $(".headIdName").html(sessionStorage.getItem("userName"));

            //菜单列表
            var domList = [
                "<a href='./contractDetail.html"
                + "?accessToken=" + momo.accessToken + "&type=" + "new" + "&menuIndex=" + "0" +
                "'><div class='m_item'><img src='../image/icon00000.png'>新建合同</div></a>",
                "<a href='./modeDownload.html'><div class='m_item'><img src='../image/icon00002.png'>范本下载</div></a>",
                "<a href='./contractCenter.html'><div class='m_item'><div class='m_redPoint'></div><img src='../image/icon00003.png'>合同中心</div></a>",
                "<a href='./contractDraft.html'><div class='m_item'><img src='../image/icon00002.png'>合同草稿</div></a>",
                "<a href='./contractWarn.html'><div class='m_item'><div class='m_redPoint'></div><img src='../image/icon00009.png'>合同预警</div></a>"];

            //替换样式
            for (var i = 0, length = domList.length; i < length; i++) {
                var item = domList[i];
                if (item.indexOf(menuItem) != -1) {
                    //item = item.replace("./" + menuItem + ".html", "#");
                    item = item.replace("m_item", "m_item active");
                    //item = item.replace(".png", "_on.png");
                    domList[i] = item;
                    break;
                }
            }
            console.log("ii     " + i);
            $("#m_left .menuGroup").append(domList.join(""));
            $("#m_left .menuGroup").show();

            //显示内容
            $("#m_left").show();
            $("#m_right").show();

            //添加菜单左侧的悬浮效果
            $(document).scroll(function () {
                if ($(window).scrollTop() > 90) {
                    $("#m_left").css("position", "fixed").css("margin-top", "0");
                }
                else {
                    $("#m_left").css("position", "absolute").css("margin-top", "90px");
                }
            });

            //调用消息红点接口，设置消息红点
            momo.sendPost({accessToken: momo.accessToken}, "contract/getcontractTips", function (data) {
                var redPoint = $("#m_left .m_redPoint");
                var waitRedPoint = $("#m_right .m_redPoint");
                if (data.data.workToDoCount > 0) {
                    if (data.data.workToDoCount > 99)data.data.workToDoCount = "99+";
                    redPoint.eq(0).text(data.data.workToDoCount);
                    if (i != 2)redPoint.eq(0).show();
                    waitRedPoint.text(data.data.workToDoCount);
                    var parent = waitRedPoint.parents(".item");
                    if (!parent.hasClass("active"))waitRedPoint.show();
                }
                if (data.data.warnCount > 0) {
                    if (data.data.warnCount > 99)data.data.warnCount = "99+";
                    redPoint.eq(1).text(data.data.warnCount);
                    if (i != 4)redPoint.eq(1).show();
                }
            });
        },

        //获取URL参数
        getURLElement: function (name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return decodeURI(r[2]);
            return null;
        },

        //发送post请求
        sendPost: function (body, url, success, isGet, text) {
            //添加加载中动画
            momo.postNum++;
            if ($("#m_loading").length < 1) {
                $("body").append("<section id='m_loading'> <img src='../image/loading.gif'> </section>");
            }

            //设置加载动画
            var way = "POST";
            if (isGet)way = "GET";
            var bodyText = "";
            for (var p in body)bodyText += p + "=" + body[p] + "&";
            bodyText = bodyText.substr(0, bodyText.length - 1);
            console.log("//+++++++++++++++++//");
            console.log(this.baseURL + url);
            console.log(JSON.stringify(body));
            console.log(bodyText);
            console.log("//-----------------//");
            //alert("stop");
            $("#m_loading").show();
            momo.hadClick = true;
            $.ajax({
                type: way,
                data: bodyText,
                dataType: "text",
                contentType: "application/x-www-form-urlencoded",
                //timeout: 3000,
                url: this.baseURL + url,
                success: function (data) {
                    data = JSON.parse(data);
                    momo.hadClick = false;
                    console.log("mmmmmmmmmmmmmmmmm      " + url);
                    console.log("mmmmmmmmmmmmmmmmm      " + JSON.stringify(body));
                    console.log("mmmmmmmmmmmmmmmmm      " + bodyText);
                    console.log(data);
                    if (text)momo.setTipBox(text);
                    if (data.errcode == 10000)window.location.href = './login.html';
                    success(data);
                },
                error: function (data) {
                    momo.hadClick = false;
                    console.log("error ");
                    console.log(data);
                },
                complete: function (XMLHttpRequest, status) { //请求完成后最终执行参数
                    momo.postNum--;
                    if (momo.postNum == 0)$("#m_loading").hide();
                    if (status == 'timeout') {//超时,status还有success,error等值的情况
                        momo.ctrlMsgBox("show", "body", "当前网络不佳，请稍后重试");
                    }
                }
            });
        },

        //数字输入约束
        inputNum: function (item, min, max) {
            $(document).on("change", item, function () {
                var value = $(this).val();
                if (min != null && value < min)$(this).val(min);
                else if (max != null && value > max)$(this).val(max);
            })
        },

        //字符输入字数约束
        inputText: function (item, max) {
            $(document).on("keydown", item, function () {
                var value = $(this).val();
                if (!(value.length < max))$(this).val(value.substr(0, max - 1));
            });
            $(document).on("keyup", item, function () {
                var value = $(this).val();
                if (!(value.length < max))$(this).val(value.substr(0, max));
            });
        },

        //JS模板
        template: function (text, obj) {
            for (p in obj) {
                while (text.search("<%=" + p + "%>") != -1)text = text.replace("<%=" + p + "%>", obj[p]);
            }
            return text;
        },

        //根据特征重置所有输入框//xm//
        addReset: function (containerName, callBack) {
            $(document).on("click", containerName + " .m_resetBtn", function () {
                var i = 0;
                var item = "";
                var length = 0;
                var domList = [];

                domList = $(containerName + " input");//重置input框
                for (i = 0, length = domList.length; i < length; i++) {
                    item = domList.eq(i);
                    if (!item.hasClass("m_except"))item.val(null);
                }

                domList = $(containerName + " select");//重置select框
                for (i = 0, length = domList.length; i < length; i++) {
                    item = domList.eq(i);
                    if (!item.hasClass("m_except")) item.val(0).trigger("change");
                }

                callBack();
            });
        },

        //获取页面输入值
        getInput: function (containerName) {
            var i = 0;
            var item = "";
            var name = "";
            var length = 0;
            var domList = [];
            var valueObj = {};

            domList = $(containerName + " input");//重置input框
            for (i = 0, length = domList.length; i < length; i++) {
                item = domList.eq(i);
                name = item.attr("id");
                if (name && name.length > 1) {
                    name = name.substr(2, name.length);
                    valueObj[name] = item.val();
                }
            }

            domList = $(containerName + " select");//重置select框
            for (i = 0, length = domList.length; i < length; i++) {
                item = domList.eq(i);
                name = item.attr("id");
                if (name && name.length > 1) {
                    name = name.substr(2, name.length);
                    valueObj[name] = item.val();
                }
            }

            console.log(valueObj);
            return valueObj;
        },

        //设置数据检测和输入提示
        checkData: function (containerName) {
            var i = 0;
            var item = "";
            var value = "";//值
            var tipText = "";//提示语
            var length = 0;
            var domList = [];

            domList = $(containerName + " input");//检测input框
            for (i = 0, length = domList.length; i < length; i++) {
                item = domList.eq(i);
                if (!item.hasClass("m_exceptCheck")) {
                    value = item.val();
                    if (value == null || value == "") {
                        tipText = item.parents(".item").find(".itemName").text();
                        item.addClass("m_inputEmpty");
                        momo.ctrlMsgBox("show", "body", "请输入" + tipText);
                        return false
                    }
                    else item.removeClass("m_inputEmpty");
                }
            }

            return true;
        },

        //设置输入约束
        addInputRule: function (containerName, config, callBack) {
            var i = 0;
            var id = "";
            var item = "";
            var type = "";
            var value = "";//值
            var tipText = "";//提示语
            var length = 0;
            var domList = [];

            domList = $(containerName + " input");//检测input框
            for (i = 0, length = domList.length; i < length; i++) {
                item = domList.eq(i);
                id = "#" + item.attr("id");
                type = item.attr("type");
                if (type == "text" || null || "") {
                    var maxLength = item.attr("maxLength") ? item.attr("maxLength") : config.maxLength;
                    momo.inputText(containerName + " " + id, maxLength);
                }
                else if (type == "number") {
                    var minValue = item.attr("minValue") ? item.attr("minValue") : config.minValue;
                    var maxValue = item.attr("maxValue") ? item.attr("maxValue") : config.maxValue;
                    momo.inputNum(containerName + " " + id, minValue, maxValue);
                }
            }

            //由于textarea本身就有约束了，所以不用JS

            callBack();
        },

        //设置输入匹配功能
        addInputTip: function (inputID, data, itemName, itemIdName, callback) {
            var domBox = $(inputID + "_selectBox");

            //输入赛选提示
            $(document).on("input", inputID, function () {
                var item = [];
                var domStr = "";
                var tempStr = "";
                var valText = $(this).val();
                if (valText.length < 1) {
                    domBox.html("");
                    domBox.hide();
                    return;
                }
                var objList = momo.selectItem(data, itemName, valText);
                if (objList.length < 1) {
                    domBox.html("");
                    domBox.hide();
                    return;
                }
                for (var i = 0, length = objList.length; i < length; i++) {
                    tempStr = objList[i][itemName].replace(valText, "<span class='keyWord'>" + valText + "</span>");
                    domStr += "<div class='selectItem' data-id='" + objList[i][itemIdName] + "'>" + tempStr + "</div>";
                }
                domBox.html(domStr);
                domBox.show();
            });

            //点击选中候选项
            $(document).on("click", inputID + "_selectBox .selectItem", function () {
                console.log("11111");
                $(inputID).val($(this).text());
                if (callback) callback.call(this);
            });

            //点击其他取消焦点，隐藏
            $(document).on("focusout", inputID, function () {
                console.log("222");
                window.setTimeout(function () {
                    domBox.hide();
                }, 200);
            });

            //添加鼠标移过
            $(document).on("mouseover", inputID + "_selectBox .selectItem", function () {
                $(inputID + "_selectBox .selectItem").removeClass("hover");
                $(this).addClass("hover");
            });

            //鼠标移走
            $(document).on("mouseout", inputID + "_selectBox .selectItem", function () {
                $(this).removeClass("hover");
            })

        },

        //数据筛选功能
        selectItem: function (data, itemName, text) {
            var item = {};
            var returnData = [];
            for (var i = 0, length = data.length; i < length; i++) {
                item = data[i];
                if (item[itemName].indexOf(text) != -1)returnData.push(item);
            }
            return returnData;
        },

        //数据筛选的键盘操作
        addKeyContral: function () {
            //获取正在显示的候选框
            function getTarget() {
                var item = {};
                var displayStatus = "";
                var domList = $(".selectBox");
                for (var i = 0, length = domList.length; i < length; i++) {
                    item = domList.eq(i);
                    displayStatus = item.css("display");
                    if (displayStatus != "none")return item;
                }
                return [];
            }

            //设置候选项在可见范围
            function setItemShow(group, item) {
                var height = group.height();
                var itemHeight = item.height();
                var top = item.position().top;
                var scrollTop = group.scrollTop();
                var padding = 0;
                padding += Number(item.css("padding-top").replace("px", ""));
                padding += Number(item.css("padding-bottom").replace("px", ""));
                if ((top + itemHeight) > height)group.scrollTop(scrollTop + itemHeight + top - height + padding);//向下选
                else if (top < 0)group.scrollTop(scrollTop + top);//向上选
            }

            $(document).on("keydown", function (data) {
                console.log("keydown1");
                var keyCode = data.keyCode;
                var isFirstItem = false;
                if (keyCode != 38 && keyCode != 40 && keyCode != 13) {//其他
                    return;
                }

                data.stopImmediatePropagation();
                var target = getTarget();
                if (target.length < 1)return;
                var targetItem = target.find(".hover");
                if (targetItem.length < 1) {
                    targetItem = target.find(".selectItem").eq(0);
                    isFirstItem = true;
                }

                //设置操作
                var theNext = {};
                if (keyCode == 40) {//向下
                    if (isFirstItem)targetItem.addClass("hover");
                    else if (targetItem.next().length > 0) {
                        targetItem.removeClass("hover");
                        theNext = targetItem.next();
                        theNext.addClass("hover");
                        setItemShow(target, theNext);
                    }
                }
                else if (keyCode == 38) {//向上
                    if (isFirstItem)targetItem.addClass("hover");
                    else if (targetItem.prev().length > 0) {
                        targetItem.removeClass("hover");
                        theNext = targetItem.prev();
                        theNext.addClass("hover");
                        setItemShow(target, theNext);
                    }
                }
                else if (keyCode == 13) {//确认操作
                    targetItem.click();
                    target.hide();
                }
            });
        },

        // //将数字转化为中文大写
        // numToCh: function (num) {
        //     if (!/^\d*(\.\d*)?$/.test(num)) {
        //         console.log("numToCh  参数错误   " + num);
        //         return "Number is wrong!";
        //     }
        //     var i = 0;
        //     var k = 0;
        //     var returnStr = "";
        //     var unit = ["", "拾", "佰", "仟", "萬", "億", "点", ""];//单位
        //     var chStr = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];//中文字
        //     var numStrList = ("" + num).replace(/(^0*)/g, "").split(".");
        //     for (i = numStrList[0].length - 1; i >= 0; i--) {//没三位数添加一个小数点
        //         switch (k) {
        //             case 0:
        //                 returnStr = unit[7] + returnStr;
        //                 break;
        //             case 4:
        //                 if (!new RegExp("0{4}\\d{" + (numStrList[0].length - i - 1) + "}$").test(numStrList[0]))returnStr = unit[4] + returnStr;
        //                 break;
        //             case 8:
        //                 returnStr = unit[5] + returnStr;
        //                 unit[7] = unit[5];
        //                 k = 0;
        //                 break;
        //         }
        //         if (k % 4 == 2 && numStrList[0].charAt(i + 2) != 0 && numStrList[0].charAt(i + 1) == 0) returnStr = chStr[0] + returnStr;
        //         if (numStrList[0].charAt(i) != 0) returnStr = chStr[numStrList[0].charAt(i)] + unit[k % 4] + returnStr;
        //         k++;
        //     }

        //     if (numStrList.length > 1) //加上小数部分(如果有小数部分)
        //     {
        //         returnStr += unit[6];
        //         for (i = 0; i < numStrList[1].length; i++) returnStr += chStr[numStrList[1].charAt(i)];
        //     }
        //     return returnStr;
        // },

        // 将数字转化为中文大写(以上是旧的组件，予以保留)
        numToCh: function(n) {
            if (!/^\d*(\.\d*)?$/.test(n)) {
                console.log("numToCh  参数错误   " + n);
                return "Number is wrong!";
            };
            var fraction = ['角', '分'];
            var digit = [
                '零', '壹', '贰', '叁', '肆',
                '伍', '陆', '柒', '捌', '玖'
            ];
            var unit = [
                ['元', '万', '亿'],
                ['', '拾', '佰', '仟']
            ];
            var head = n < 0 ? '欠' : '';
            n = Math.abs(n);
            var s = '';
            for (var i = 0; i < fraction.length; i++) {
                s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
            }
            s = s || '整';
            n = Math.floor(n);
            for (var i = 0; i < unit[0].length && n > 0; i++) {
                var p = '';
                for (var j = 0; j < unit[1].length && n > 0; j++) {
                    p = digit[n % 10] + unit[1][j] + p;
                    n = Math.floor(n / 10);
                }
                s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
            }
            return head + s.replace(/(零.)*零元/, '元')
                .replace(/(零.)+/g, '零')
                .replace(/^整$/, '零元整');
        },


        //添加提示文本
        setTipBox: function (text) {
            if ($("#m_tipBox").length < 1)$("body").append("<section id='m_tipBox'>" +
                "<span class='ui-icon ui-icon-alert' style='float:left; margin:0 7px 20px 0;'></span>" +
                "<div></div></section>");
            $("#m_tipBox div").text(text);
            if (this.canShowTip) {
                this.canShowTip = false;
                $("#m_tipBox").show(300);
                window.setTimeout(function () {
                    momo.canShowTip = true;
                    $("#m_tipBox").hide(300);
                }, 1000);
            }
        },

        //转换文件单位
        getUnit: function (size) {
            var unitArr = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
            var index = 0;

            var srcSize = parseFloat(size);
            var quotient = srcSize;//quotient：商
            while (quotient > 1024) {
                index += 1;
                quotient = quotient / 1024;
            }
            return quotient.toFixed(2) + " " + unitArr[index];
        },

        //显示加载进度条
        setLoadingBar: function (type, precent, text) {
            if (type == "hide") {
                console.log("hide");
                var m_loadingBox = $("#m_loadingBox");
                if (m_loadingBox.length < 1)return;
                $("#m_loadingText").text(text);
                setTimeout(function () {
                    $("#m_loadingBox").hide();
                }, 1000);
            }
            else {
                if ($("#m_loadingBox").length < 1)$("body").append("<section id='m_loadingBox'> <div id='m_loadingBarBg'> <div id='m_loadingBar'></div> <div id='m_loadingText'>加载...</div></div> </section>");
                else $("#m_loadingBox").show();
                var m_loadingBar = $("#m_loadingBar");
                var m_loadingText = $("#m_loadingText");
                m_loadingText.text(text);
                m_loadingBar.width(precent + "%");
            }
        },

        //上传文件
        uploadFile: function (url, resource, callBack) {
            var formData = new FormData();
            //formData.append('accessToken', momo.accessToken);
            formData.append('file', resource);
            console.log("uploadFile---Url    " + url);
            $.ajax({
                url: momo.baseURL + url,
                type: 'post',
                data: formData,
                processData: false,
                contentType: false,
                xhr: function () {//监听上传进度
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function (event) { //evt.total
                        if (event.lengthComputable) {
                            var percentComplete = event.loaded / event.total * 100;
                            percentComplete = percentComplete.toFixed(2);
                            console.log('进度', percentComplete + "   percentComplete  " + percentComplete);
                            momo.setLoadingBar("show", percentComplete, resource.name + "(上传中" + percentComplete + "%)");
                        }
                    }, false);
                    return xhr;
                },
                success: function (data) { //附件上传成功
                    console.log("success");
                    console.log(data);
                    callBack(data);
                },
                error: function (XMLHttpRequest, textStatus) {
                    console.log("error");
                    console.log(XMLHttpRequest);
                    console.log(textStatus);
                }
            });
        },

        //获取字符串中除去空格的长度
        getStrLength: function (str) {
            str = str.replace(/\s+/g, "");
            return str.length;
        },

        //显示选择提示框
        ctrlMsgBox: function (action, contentName, info, enter, cancel) {
            console.log("ctrlMsgBox");
            if (action == "show") {
                if ($(".msgBox").length > 0) {//倘若已经在显示
                    console.log("msgBox  had show!!!!");
                    return;
                }
                $(contentName).append("<div class='m_msgBoxBG' ></div> " +
                    "<div class='m_msgBox' > " +
                    "<div class='m_msgText' >" + info + "</div> " +
                    "<div class='m_msgBtnList' > " +
                    "<div class='m_msgBtnCancel' >取消</div>" +
                    "<div class='m_msgBtnEnter' >确定</div> </div> </div>");
                if (!cancel)$(".m_msgBtnCancel").remove();

                $(".m_msgBoxBG").show();
                $(".m_msgBox").show();
                $(document).on("click", ".m_msgBtnEnter", function (e) {
                    e.stopPropagation();
                    momo.ctrlMsgBox("hide");
                    if (enter)enter.call(this);
                }.bind(this));
                $(document).on("click", ".m_msgBtnCancel", function (e) {
                    e.stopPropagation();
                    momo.ctrlMsgBox("hide");
                    if (cancel)cancel.call(this);
                }.bind(this));
            }
            else if (action == "hide") {
                $(document).off("click", ".m_msgBtnEnter");
                $(document).off("click", ".m_msgBtnCancel");
                $(".m_msgBoxBG").remove();
                $(".m_msgBox").remove();
            }
        },

        //日期比较
        timeCompare: function (timeStart, timeEnd) {
            var timeStart = new Date(timeStart);
            var timeEnd = new Date(timeEnd);
            console.log("timeEnd    " + timeEnd + "   timeStart   " + timeStart + "      " + (timeEnd - timeStart));
            return timeEnd - timeStart;
        },

        //mx/////////////////////////////

        // 校验
        checkForm: function () {
            var _this = this;
            var requirednode = $('.checkDesc');
            var txt = '';
            $('.checkDesc').removeClass("m_inputEmpty")
            $.each(requirednode, function (index, val) {
                if (!$(val).val()) {
                    txt = $(val).attr('data-txt') + '不能为空！';
                    $(val).addClass("m_inputEmpty");
                    return false
                }
            });
            return txt;
        },

        // 设置所有输入框不能输入，详情要用
        cancelInput: function (perentID, callBack) {
            $(perentID + " input").each(function () {$(this).attr("disabled", "disabled");});
            $(perentID + " select").each(function () {$(this).attr("disabled", "disabled");});
            $(perentID + " textarea").attr("disabled", "disabled");
            if (callBack)callBack();
        },

        // 字符串转数组
        strToArr: function (data) {
            var str = data;
            var domStr = "";
            var arr = str.split(",");
            for (var i = 0, length = arr.length; i < length; i++) {
                domStr += "<div class='moreItem'> <div class='moreItemName'>" + arr[i] + "</div> <div class='moreItemDeleteBtn'></div> </div>";
            }
            return domStr;
        },

        //获取我方/对方附属主体
        getBodyId: function (id) {
            var myclass = id + " .moreItem";
            var moreItemName, itemNameArr = [],
                itemStr;
            $(id).find('.moreItem').each(function (index) {
                moreItemName = $(this).find(".moreItemName").html();
                itemNameArr.push(moreItemName);
                itemStr = itemNameArr.join(",");
            });
            if (itemStr) {
                return itemStr;
            } else {
                return ""
            }
            ;
        },

        // 验证我方主体/对方主体与我方/对方附属主体不能重复输入同一个名字
        checkTheSame: function (idName, val, otherIdName, isFushu) {
            var myclass = idName + " .moreItem";
            var moreItemName,
                itemNameArr = [],
                returnVal,
            // 对比的相对应的val
                d_selfMainBodyNameVal = otherIdName.val();

            // 当前输入框是附属主体
            if (isFushu == true) {
                // 这里表明当前输入主体是  我方附属主体 / 对方附属主体
                // 如果当前输入的值与我方/对方输入框值相同
                if (val == d_selfMainBodyNameVal) {
                    return false;
                    return;
                }
                ;
                // 获取之前输入的附属主体名称
                console.log(val, "==========================val");
                // 遍历自身所有的输入值，push进itemNameArr数组
                $(idName).find('.moreItem').each(function (index) {
                    moreItemName = $(this).find(".moreItemName").html();
                    itemNameArr.push(moreItemName);
                });
                // 遍历数组，判断是否有相同选项
                for (var i = 0, length = itemNameArr.length; i < length; i++) {
                    if (val == itemNameArr[i]) {
                        returnVal = false;
                        break;
                    } else {
                        returnVal = true;
                    }
                }
                ;
            } else {
                // 这里表明当前输入主体是  我方主体 / 对方主体
                // 遍历附属主体所有的输入值，push进itemNameArr数组
                $(otherIdName).find('.moreItem').each(function (index) {
                    moreItemName = $(this).find(".moreItemName").html();
                    itemNameArr.push(moreItemName);
                });

                // 遍历数组，判断是否有相同选项
                for (var i = 0, length = itemNameArr.length; i < length; i++) {
                    if (idName.val() == itemNameArr[i]) {
                        returnVal = false;
                        break;
                    } else {
                        returnVal = true;
                    }
                }
                ;

            }
            ;

            itemNameArr = [];
            return returnVal;

        },

        // 获取不同合同附件id
        getContractId: function (allFilelist, idName) {
            console.log(allFilelist, "idName");
            var fileListArr = [];
            if (idName == "contractText" && $("#contractText .itemName").hasClass('oldFileId')) {
                // 因为合同文本只有一个，当id为contractText（合同文本）&&里面id为旧有的fileid时，直接用旧的fileid
                fileListArr.push($("#contractText .oldFileId").attr("data-id"));
            } else if (idName == "mianAttachment" && $("#mianAttachment .itemName").hasClass('oldFileId')) {
                // 当id为contractText（合同附件）&&里面存在有旧有的fileid时，首先用for循环，allFilelist数组（点击提交上传后获取到的数组）里面获取每一项的id名，此id即为提交或者保存需要用到的fileid
                for (var i = 0, length = allFilelist.length; i < length; i++) {
                    if (allFilelist[i].fileItem == idName) {
                        fileListArr.push(allFilelist[i].id);
                    }
                    ;
                }
                ;
                // 然后，里面如果有旧有的fileid，再次遍历所有oldFileId,逐一push进数组
                $("#mianAttachment").find('.oldFileId').each(function (index) {
                    fileListArr.push($(this).attr("data-id"));
                });
            } else if (idName == "otherAttachment" && $("#otherAttachment .itemName").hasClass('oldFileId')) {
                // 当id为otherAttachment（其他附件）&&里面存在有旧有的fileid时，首先用for循环，allFilelist数组（点击提交上传后获取到的数组）里面获取每一项的id名，此id即为提交或者保存需要用到的fileid
                for (var i = 0, length = allFilelist.length; i < length; i++) {
                    if (allFilelist[i].fileItem == idName) {
                        fileListArr.push(allFilelist[i].id);
                    }
                    ;
                }
                ;
                // 然后，里面如果有旧有的fileid，再次遍历所有oldFileId,逐一push进数组
                $("#otherAttachment").find('.oldFileId').each(function (index) {
                    fileListArr.push($(this).attr("data-id"));
                });
            } else {
                // 这是没有任何旧有数据的情况，当前状况为新建
                for (var i = 0, length = allFilelist.length; i < length; i++) {
                    if (allFilelist[i].fileItem == idName) {
                        fileListArr.push(allFilelist[i].id);
                    }
                    ;
                }
                ;
            }

            var fileListStr = fileListArr.join(",");
            return fileListStr;
        },

    }

})();

//表格默认配置
var _config = {
    curPageNum: 1,
    singlePageItemNum: 10,
    allPageNum: 0,
    allItemNum: 0,
    dataItemPrefix: ["result"],//返回的表单数据的前缀
    dataPagePrefix: [],//返回的页面数据的前缀
    curPageName: "currentPage",//当前页面数参数名
    allPageName: "totalPage",//总页码数参数名
    allItemName: "totalNumber",//全部项目数参数名
    singlePageItemName: "pageNumber",//单页项目数参数名
};

//自定义表格插件
var momoTable = (function () {
    //定义表单类,保存对象属性
    var table = function (config, itemRule, handleList) {
        for (var p in _config)config[p] = config[p] ? config[p] : _config[p];//设置完整的配置数据
        this.originData = {};//保存从接口返回全部原始数据
        this.dataItemList = [];//保存从接口返回的数据列表，用于各项操作时获取数据
        this.postOtherElem = {};//进行post请求时额外的参数
        this.config = config;//表格配置
        this.itemRule = itemRule;//项目配置
        this.handleList = handleList;//操作配置列表
        this.allPageNum = config.allPageNum;//总页面数
        this.allItemNum = config.allItemNum;//总项目数
        this.curPageNum = config.curPageNum;//当前页面数
        this.singlePageItemNum = config.singlePageItemNum;//单页项目数
    };

    //定义表单类的功能方法//初始化表格，显示表格框架
    table.prototype.init = function () {
        //添加表格体
        var sumWidth = 0;//总宽度
        var tableStr = "<table style='width: " + this.config.width + "'><tbody><tr>";

        //计算表格总权重
        for (var i = 0, length = this.itemRule.length; i < length; i++)sumWidth += this.itemRule[i].width;
        if (this.config.checkData) sumWidth += this.config.checkData.width;
        if (this.config.indexData) sumWidth += this.config.indexData.width;
        if (this.handleList) sumWidth += this.handleList[0].width;
        console.log("sumWidth    " + sumWidth);

        //设置表格各栏宽度
        if (this.config.checkData) {//判断并设置勾选栏
            this.addSelectAllEvent();
            tableStr += "<th style='width:" + (this.config.checkData.width / sumWidth * 100).toFixed(2) + "%'><input type='checkbox' class='m_selectAll'></th>";
        }
        if (this.config.indexData) {//判断并设置序号栏
            tableStr += "<th style='width:" + (this.config.indexData.width / sumWidth * 100).toFixed(2) + "%'>" + this.config.indexData.name + "</th>";
        }
        for (i = 0, length = this.itemRule.length; i < length; i++) {//设置数据栏
            var item = this.itemRule[i];
            tableStr += "<th style='width:" + (item.width / sumWidth * 100).toFixed(2) + "%'>" + item.title + "</th>";
        }
        if (this.handleList) {//判断并设置操作
            this.addHandleEvent();
            tableStr += "<th style='width:" + (this.handleList[0].width / sumWidth * 100).toFixed(2) + "%'>" + this.handleList[0].name + "</th>";
        }
        tableStr += "</tr></tbody> </table> ";

        //添加翻页及左边操作按钮
        var pageStr = "";
        pageStr += "<div class='m_handleBox'><div class='m_pageGroup'><div class='m_firstBtn disabled'>首页</div>" +
            "<div class='m_prevBtn disabled'>上一页</div><div class='m_nextBtn'>下一页</div><div class='m_endBtn'>末页</div>" +
            "<div class='m_pageData'>共<span class='m_pageSum'>" + this.allPageNum + "</span>页 &nbsp; 共<span class='m_itemNum'>" + this.allItemNum + "</span>条数据</div></div>" +
            "<div class='m_pageHandle'><div class='m_deleteAll'>批量删除</div></div></div>";
        //"<div class='m_pageHandle'><div class='m_deleteAll'>批量删除</div><div class='m_flashAll'>刷新数据</div></div></div>";
        if (this.config.noPage)pageStr = "";

        //添加到页面中
        $(this.config.tableID).append(tableStr + pageStr);
        this.addPageEvent();
        this.getData();
        if (this.config.checkData)$(".m_deleteAll").css("display", "inline-block");

        //设置数据刷新函数
        $(document).on("click", ".m_flashAll", this.getData.bind(this));
    };

    //获取表格数据
    table.prototype.getData = function () {
        var postData = {};
        postData[this.config.curPageName] = this.curPageNum;
        postData[this.config.singlePageItemName] = this.singlePageItemNum;
        if (this.postOtherElem) for (var p in this.postOtherElem)postData[p] = this.postOtherElem[p];//添加额外信息
        momo.sendPost(postData, this.config.dataUrl, function (data) {
            this.originData = data;
            //设置翻页信息
            if (!this.config.noPage) {
                var pageData = data;
                for (var i = 0, length = this.config.dataPagePrefix.length; i < length; i++)pageData = pageData[this.config.dataPagePrefix[i]];
                this.curPageNum = pageData[this.config.curPageName] > 0 ? pageData[this.config.curPageName] : 1;
                this.allPageNum = pageData[this.config.allPageName];
                this.allItemNum = pageData[this.config.allItemName];
                $(this.config.tableID + " .m_pageSum").text(this.allPageNum);
                $(this.config.tableID + " .m_itemNum").text(this.allItemNum);
                this.setPage();
            }

            //添加项目数据
            var domStr = "";
            var itemRuleNum = this.itemRule.length;
            for (var i = 0, length = this.config.dataItemPrefix.length; i < length; i++) {
                data = data[this.config.dataItemPrefix[i]];
            }
            this.dataItemList = data;
            $(this.config.tableID + " tbody .dataTr").remove();
            for (var i = 0, length = data.length; i < length; i++) {
                var item = data[i];
                domStr += "<tr class='dataTr'>";
                if (this.config.checkData) {
                    $(this.config.tableID + " .m_selectAll").prop("checked", false);
                    domStr += "<td ><input type='checkbox' class='m_selectItem'></td>";
                } //判断并设置勾选栏
                if (this.config.indexData) {
                    var index = i + 1 + (this.curPageNum - 1) * this.config.singlePageItemNum;
                    domStr += "<td class='m_itemIndex'>" + index + "</td>";
                }
                for (var j = 0; j < itemRuleNum; j++) {
                    //if (j == 0 && this.config.itemKeyName) domStr += "<td data-id='" + item[this.config.itemKeyName] + "' class='" + this.itemRule[j].valueName + "'>" + item[this.itemRule[j].valueName] + "</td>";
                    //else domStr += "<td class='" + this.itemRule[j].valueName + "'>" + item[this.itemRule[j].valueName] + "</td>";
                    domStr += "<td class='" + this.itemRule[j].valueName + "'>" + item[this.itemRule[j].valueName] + "</td>";
                }
                if (this.handleList) {//判断并设置操作
                    domStr += "<td>";
                    for (var a = 1, aLength = this.handleList.length; a < aLength; a++)domStr += "<div data-id='" + a + "' class='m_handleBtn m_handleClass" + a + "'>" + this.handleList[a].name + "</div>";
                    domStr += "</td>";
                }
                domStr += "</tr>";
            }
            $(this.config.tableID + " tbody").append(domStr);

            ////设置左边高度
            //var height = $(" #m_right").height();
            //height += Number($(" #m_right").css("padding-top").replace("px", ""));
            //height += Number($(" #m_right").css("padding-bottom").replace("px", ""));
            //$(" #m_left").height(height);

            //执行外部钩子
            if (this.getDataCall)this.getDataCall();
        }.bind(this))
    };

    //设置页面数
    table.prototype.setPage = function () {
        //去除全选
        this.isSelectAll = false;
        $(this.config.tableID + " .selectAll").prop("checked", false);

        $(this.config.tableID + " .m_pageNum").remove();//清除旧的页面按钮

        //上一页,首页
        if (this.curPageNum === 1 || this.allPageNum === 1) {
            console.log("addClass");
            $(this.config.tableID + " .m_firstBtn").addClass("disabled");
            $(this.config.tableID + " .m_prevBtn").addClass("disabled");
        }
        else {
            console.log("removeClass");
            $(this.config.tableID + " .m_firstBtn").removeClass("disabled");
            $(this.config.tableID + " .m_prevBtn").removeClass("disabled");
        }

        //下一页，末页
        if (this.curPageNum === this.allPageNum) {
            $(this.config.tableID + " .m_endBtn").addClass("disabled");
            $(this.config.tableID + " .m_nextBtn").addClass("disabled");
        }
        else {
            $(this.config.tableID + " .m_endBtn").removeClass("disabled");
            $(this.config.tableID + " .m_nextBtn").removeClass("disabled");
        }

        //翻页按钮
        console.log("this.allPageNum   " + this.allPageNum);
        if (this.allPageNum < 5) {
            for (var i = 1; i < (this.allPageNum + 1); i++) {
                if (this.curPageNum == i)$(this.config.tableID + " .m_nextBtn").before("<div class='active m_pageNum'>" + i + "</div>");
                else $(this.config.tableID + " .m_nextBtn").before("<div class='m_pageNum'>" + i + "</div>");
            }
        }
        else {
            if (this.curPageNum < 3) {
                for (var i = 1; i < (5 + 1); i++) {
                    if (this.curPageNum == i)$(this.config.tableID + " .m_nextBtn").before("<div class='active m_pageNum'>" + i + "</div>");
                    else $(this.config.tableID + " .m_nextBtn").before("<div class='m_pageNum'>" + i + "</div>");
                }
            }
            else if (this.curPageNum > 2 && this.allPageNum > (this.curPageNum + 1)) {
                for (var i = this.curPageNum - 2; i < (this.curPageNum + 3); i++) {
                    if (this.curPageNum == i)$(this.config.tableID + " .m_nextBtn").before("<div class='active m_pageNum'>" + i + "</div>");
                    else $(this.config.tableID + " .m_nextBtn").before("<div class='m_pageNum'>" + i + "</div>");
                }
            }
            else {
                for (var i = this.allPageNum - 4; i < (this.allPageNum + 1); i++) {
                    if (this.curPageNum == i)$(this.config.tableID + " .m_nextBtn").before("<div class='active m_pageNum'>" + i + "</div>");
                    else $(this.config.tableID + " .m_nextBtn").before("<div class='m_pageNum'>" + i + "</div>");
                }
            }
        }
    };

    //添加翻页点击约束
    table.prototype.addPageEvent = function () {
        var self = this;
        //页面数点击
        $(document).on("click", this.config.tableID + " .m_pageNum", function () {
            self.curPageNum = $(this).text();
            self.getData();
        });
        //首页
        $(document).on("click", this.config.tableID + " .m_firstBtn", function () {
            if (!$(this).hasClass("disabled")) {
                self.curPageNum = 1;
                self.getData();
            }
        });
        //末页
        $(document).on("click", this.config.tableID + " .m_endBtn", function () {
            if (!$(this).hasClass("disabled")) {
                self.curPageNum = self.allPageNum;
                self.getData();
            }
        });
        //上一页
        $(document).on("click", this.config.tableID + " .m_prevBtn", function () {
            if (!$(this).hasClass("disabled")) {
                self.curPageNum--;
                self.getData();
            }
        });
        //下一页
        $(document).on("click", this.config.tableID + " .m_nextBtn", function () {
            if (!$(this).hasClass("disabled")) {
                self.curPageNum++;
                self.getData();
            }
        });
        //页面跳转
        if ($("#pageJump").length > 0) {
            $(document).on("click", "#pageJump", function () {
                var maxPage = $("#maxPageNum").text();
                if (self.checkClick && self.checkClick("deleteItem"))return;
                self.curPageNum = $("#inputPageNum").val();
                if (self.curPageNum < 1) {
                    self.curPageNum = 1;
                    $("#inputPageNum").val(1);
                }
                else if (parseInt(self.curPageNum) > parseInt(maxPage)) {
                    self.curPageNum = maxPage;
                    $("#inputPageNum").val(maxPage);
                }
                self.getData();
            });
        }
    };

    //点击全选
    table.prototype.addSelectAllEvent = function () {
        var self = this;
        $(this.config.tableID + " .m_deleteAll").show();

        $(document).on("click", this.config.tableID + " .m_selectAll", function () {
            $(self.config.tableID + " .m_selectItem").prop("checked", $(this).prop("checked"));
        });

        $(document).on("click", this.config.tableID + " .m_selectItem", function (e) {
            $(self.config.tableID + " .m_selectAll").prop("checked", false);
            //阻止事件继续冒泡
            e.stopPropagation();
            e.stopImmediatePropagation();
        });

        //定制批量删除操作
        $(document).on("click", this.config.tableID + " .m_deleteAll", function () {
            var checkData = self.config.checkData;
            //显示确认模态框
            $("#m_askDialog").remove();
            $("body").append(
                "<section id='m_askDialog' title=" + checkData.title + "> " +
                "<p><span class='ui-icon ui-icon-alert' style='float:left; margin:0 7px 20px 0;'></span>" +
                checkData.tipText + "</p></section>");
            $("#m_askDialog").dialog({
                resizable: false,
                height: 200,
                modal: true,
                buttons: {
                    "确定": function () {
                        $(this).dialog("close");
                        var i = 0;
                        var length = 0;
                        var body = {};
                        var itemName = "";

                        //从postElem中获取静态数据
                        for (i = 0, length = checkData.otherElem.length; i < length; i++) {
                            itemName = checkData.otherElem[i];
                            body[itemName] = self.postOtherElem[itemName];
                        }

                        //拼凑删除合同列表ID串
                        var idStr = "";
                        var domList = $(self.config.tableID + " .m_selectItem");
                        for (i = 0, length = domList.length; i < length; i++) {
                            var item = domList.eq(i);
                            if (item.prop("checked")) idStr += self.dataItemList[i][checkData.idName] + ",";//从项目数据中获取项目数据
                        }
                        if (idStr == "")return;

                        body[checkData.postIdName] = idStr.substr(0, idStr.length - 1);
                        momo.sendPost(body, checkData.url, function () {
                            self.getData();
                        }, checkData.isGet, "删除成功");
                    },
                    "取消": function () {
                        $(this).dialog("close");
                    }
                }
            });
        });
    };

    //添加操作栏的操作事件
    table.prototype.addHandleEvent = function () {
        var self = this;
        for (var i = 1, length = this.handleList.length; i < length; i++) {
            $(document).on("click", this.config.tableID + " .m_handleClass" + i, function (e) {
                var i = 0;
                var length = 0;
                var itemName = {};
                var body = {};
                var classIndex = $(this).attr("data-id");//获取操作下标，判断是哪一个操作
                var handleItem = self.handleList[classIndex];
                var itemIndex = $(this).parents("tr").index();
                console.log("classIndex    " + classIndex);
                console.log("itemIndex    " + itemIndex);

                if (handleItem.isEmpty)return;

                //从postElem中获取静态数据
                for (i = 0, length = handleItem.otherElem.length; i < length; i++) {
                    itemName = handleItem.otherElem[i];
                    body[itemName] = self.postOtherElem[itemName];
                }

                //从项目数据中获取项目数据
                for (i = 0, length = handleItem.itemElem.length; i < length; i++) {
                    itemName = handleItem.itemElem[i];
                    body[itemName] = self.dataItemList[itemIndex - 1][itemName];
                }

                if (handleItem.isJump) {//页面跳转类型的操作
                    var dataStr = "";
                    for (i in body)dataStr += i + "=" + body[i] + "&";
                    dataStr.substr(0, dataStr.length - 2);
                    location.href = handleItem.url + "?" + dataStr;
                }
                else if (handleItem.isGet) {//数据操作类型的操作
                    momo.sendPost(body, handleItem.url, function () {
                        self.getData();
                    }, handleItem.isGet, "操作成功");
                }

                //阻止事件继续冒泡
                e.stopPropagation();
                e.stopImmediatePropagation();
            });
        }

    };

    //返回表单类
    return table;
})();



