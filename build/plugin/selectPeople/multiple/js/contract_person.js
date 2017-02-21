momo.addMenuItem();
var setting = {
    data: {
        simpleData: {
            enable: true
        }
    },
    async: {
        enable: true,
        type: "get",
        url: momo.baseURL + "/api/otherInterface/getOrganizationByOrgId?accessToken=6048&orgId=",
        datatype: "json",
        contentType: "application/json",
        dataFilter: function (treeId, parentNode, responseData) {
            var name = responseData['orgName'], id = responseData['orgId'], pId = responseData['superiorId'];
            var res = [];
            ranc([responseData], res, '');
            return res;
        }
    },
    callback: {
        onClick: nodeClick
    }
};

function ranc(data, array, pId) {
    if (!data) return;
    for (var i = 0; i < data.length; i++) {
        var name = data[i]['orgName'], id = data[i]['orgId'];
        var subData = data[i]['subordinateOrg'];
        array.push({"name": name, "id": id, "pId": pId, open: pId === '' ? true : false});
        if (subData) ranc(subData, array, id);
    }
}


function nodeClick(event, treeId, treeNode, clickFlag) {
    var index = layer.load(2);
    var html = "";
    $(".contract_right .list-body").html('');
    var type = "是";
    var id = treeNode.id;
    $.get(momo.baseURL + 'api/otherInterface/getContactOfOrgId?accessToken=6048&orgId=' + id).done(function (res) {
        layer.close(index);
        var data = res.data.contacts;
        if (data.length > 0) {
            $.each(data, function (index, obj) {
                if (obj) {//obj.accountName
                    html = '<ul>';
                    html += ' <li class=\'accName\' style=\'width:38%;\'><input name="people" type="checkbox" value="' + obj.accountName + '"/>' + obj.chsName + '</li>';
                    html += ' <li style=\'width:40%;\'>' + obj.orgName + '</li>';
                    html += ' <li style=\'width:20%;\'>' + type + '</li>';
                    html += ' </ul>';
                    $(".contract_right .list-body").append(html);
                } else {
                    $(".contract_right .list-body").html('<ul style="text-align:center;">暂无数据</ul>');
                }

            });
        } else {
            $(".contract_right .list-body").html('<ul style="text-align:center;">暂无数据</ul>');
        }

    });
}

function search_data(keyword) {
    var index = layer.load(2);
    $(".contract_right .list-body").html('');
    var type = "是";
    $.ajax({
        type: "POST",
        url: momo.baseURL + "/api/otherInterface/searchAccountByName",
        dataType: "json",
        data: {"accessToken": 6048, "chsName": keyword, "isAll": 1},
        success: function (data) {
            layer.close(index);
            console.log(data);
            if (data.message == "成功") {
                var data = data.data.contacts;
                console.log(data.length);
                if (data.length > 0) {
                    $.each(data, function (index, obj) {
                        if (obj) {//obj.accountName
                            html = '<ul>';
                            html += ' <li class=\'accName\' style=\'width:38%;\'><input name="people" type="checkbox" value="' + obj.accountName + '"/>' + obj.chsName + '</li>';
                            html += ' <li style=\'width:40%;\'>' + obj.orgName + '</li>';
                            html += ' <li style=\'width:20%;\'>' + type + '</li>';
                            html += ' </ul>';
                            $(".contract_right .list-body").append(html);
                        } else {
                            $(".contract_right .list-body").html('<ul style="text-align:center;">暂无数据</ul>');
                        }
                    });
                } else {
                    $(".contract_right .list-body").html('<ul style="text-align:center;">暂无数据</ul>');
                }
            }
        },
        error: function () {
            alert("服务器连接失败！");
        }
    });
}


$(function () {
    //选人数据列表
    $.fn.zTree.init($("#treeDemo"), setting);
    //取消 关闭
    $("#cancel").click(function () {
        parent.layer.closeAll();
    });

    $(".list-body").delegate("input[name='people']", "click", function (e) {
        var tree = $.fn.zTree.getZTreeObj("treeDemo"), node = tree.getSelectedNodes()[0];
        var value = $(this).parent().text();
        if ($(this).is(':checked')) {
            var html = ' <li>' + value + '</li>';
            $(".contract_name ul").append(html);
            //取到当前部门id

        } else {
            $(".contract_name ul").find("li").each(function () {
                if (value == $(this).text()) {
                    $(this).hide();
                }
            })
        }

    });

    //确定操作
    $("#deter").click(function () {
        var tree = $.fn.zTree.getZTreeObj("treeDemo"), node = tree.getSelectedNodes()[0];
        //var orgId = node.id, orgName = node.name;
        var rad = $("[name=people]:checked"), accId = rad.val(), name = rad.parents("ul").find(".accName").text();
        var conditions = $("[name=people]:checked");
        var array = [];
        for (var i = 0; i < conditions.length; i++) {
            var obj = conditions[i].value;
            array.push(obj);
        }
        var userids = array.join(",");
        console.log("多选人员 userids: " + userids);
        parent.window.SP_enterCallback(userids);
        parent.layer.closeAll();
    });

    $(document).on("keydown", function (data) {
        if (data.keyCode == 13) {
            var keyword = $(".person_input_search").val(); //搜索关键词
            if (keyword != "") {
                $(".person_input_search").css("border", "1px solid #ddd");
                search_data(keyword);//搜索接口
            } else {
                $(".person_input_search").css("border", "1px solid red");
                $(".person_input_search").attr('placeholder', '请输入员工名称！');
            }
        }
        ;
    });
    //搜索操作
    $("#contract_person .contract_person_search img").click(function () {
        var keyword = $(".person_input_search").val(); //搜索关键词
        if (keyword != "") {
            $(".person_input_search").css("border", "1px solid #ddd");
            search_data(keyword);//搜索接口
        } else {
            $(".person_input_search").css("border", "1px solid red");
            $(".person_input_search").attr('placeholder', '请输入员工名称！');
        }
    });


});