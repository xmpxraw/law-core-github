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
        url: momo.baseURL + "api/otherInterface/getOrganizationByOrgId?accessToken=6048&orgId=",
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
    $("#deter").show();
    $("#deter_search").hide();
    var index = layer.load(2);
    var html = "";
    $(".contract_right .list-body").html('');
    var type = "是";
    var id = treeNode.id;
    $.get(momo.baseURL + '/api/otherInterface/getContactOfOrgId?accessToken=6048&orgId=' + id).done(function (res) {
        layer.close(index);
        var data = res.data.contacts;
        if (data.length > 0) {
            $.each(data, function (index, obj) {
                if (obj) {//obj.accountName
                    //html='<li><a><input name="people" type="radio" value="'+obj.accountName+'"/></a><a>'+obj.chsName+'</a><a>'+type+'</a></li>';
                    html = '<ul>';
                    //html+=' <li><input name="people" type="radio" value="'+obj.accountName+'"/></li>';
                    html += ' <li class=\'accName\' style=\'width:38%;\'><input name="people" type="radio" value="' + obj.accountName + '"/>' + obj.chsName + '</li>';
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
    momo.addMenuItem();
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
            if (data.message == "成功") {
                var data = data.data.contacts;
                if (data.length > 0) {
                    $.each(data, function (index, obj) {
                        if (obj) {//obj.accountName
                            html = '<ul>';
                            html += ' <li class=\'accName\' style=\'width:38%;\'><input name="people" type="radio" value="' + obj.accountName + '" orgName="' + obj.orgName + '"/>' + obj.chsName + '</li>';
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


    //确定操作
    $("#deter").click(function () {
        var tree = $.fn.zTree.getZTreeObj("treeDemo"), node = tree.getSelectedNodes()[0];
        if (node) {
            var orgId = node.id, orgName = node.name;
            var rad = $("[name=people]:checked"), accId = rad.val(), name = rad.parents("ul").find(".accName").text();
            parent.window.SP_enterCallback({peopleId: accId, peopleName: name, departmentId: orgId, orgName: orgName});
            parent.layer.closeAll();
        } else {
            layer.closeAll();
            alert("请选择。。。");
        }

    });

    $("#deter_search").click(function () {
        if ($("[name=people]").is(":checked")) {
            var people = $("[name=people]:checked");
            parent.window.SP_enterCallback({peopleId: people.val(), peopleName: people.parent().text(), departmentId: "", orgName: people.attr("orgName")});
            parent.layer.closeAll();
        } else {
            layer.closeAll();
            alert("请选择。。。");
        }

    });


    $(document).on("keydown", function (data) {
        if (data.keyCode == 13) {
            var keyword = $(".person_input_search").val(); //搜索关键词
            if (keyword != "") {
                $(".person_input_search").css("border", "1px solid #ddd");
                search_data(keyword);//搜索接口
                $("#deter").hide();
                $("#deter_search").show();
            } else {
                $(".person_input_search").css("border", "1px solid red");
                $(".person_input_search").attr('placeholder', '请输入员工名称！');
            }
        }
    });
    //搜索操作
    $("#contract_person .contract_person_search img").click(function () {
        var keyword = $(".person_input_search").val(); //搜索关键词
        if (keyword != "") {
            $(".person_input_search").css("border", "1px solid #ddd");
            search_data(keyword);//搜索接口
            $("#deter").hide();
            $("#deter_search").show();
        } else {
            $(".person_input_search").css("border", "1px solid red");
            $(".person_input_search").attr('placeholder', '请输入员工名称！');
        }
    });


});