var setting = {
    data: {
        simpleData: {
            enable: true
        }
    },
    async: {
        enable: true,
        type: "get",
        url: "http://law-test.heylon.cn:8080/laws/api/otherInterface/getOrganizationByOrgId?accessToken=6048&orgId=",
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
    $.get('http://law-test.heylon.cn:8080/laws/api/otherInterface/getContactOfOrgId?accessToken=6048&orgId=' + id).done(function (res) {
        layer.close(index);
        var data = res.data.contacts;
        if (data.length > 0) {
            $.each(data, function (index, obj) {
                if (obj) {//obj.accountName
                    //html='<li><a><input name="people" type="radio" value="'+obj.accountName+'"/></a><a>'+obj.chsName+'</a><a>'+type+'</a></li>';
                    html = '<ul>';
                    //html+=' <li><input name="people" type="radio" value="'+obj.accountName+'"/></li>';
                    //html+=' <li class=\'accName\' style=\'width:48%;\'><input name="people" type="radio" value="'+obj.accountName+'"/>'+obj.chsName+'</li>';
                    html += ' <li class=\'accName\' style=\'width:48%;\'><input name="people" type="checkbox" value="' + obj.accountName + '"/>' + obj.chsName + '</li>';
                    html += ' <li style=\'width:50%;\'>' + type + '</li>';
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


$(function () {
    //选人数据列表
    $.fn.zTree.init($("#treeDemo"), setting);
    //取消 关闭
    $("#cancel").click(function () {
        parent.layer.closeAll();
    });

    $(".list-body").delegate("input[name='people']", "click", function (e) {
        var value = $(this).parent().text()
        if ($(this).is(':checked')) {
            var html = ' <li>' + value + '</li>';
            $(".contract_name ul").append(html);
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
        if (node) {
            var orgId = node.id, orgName = node.name;
            var rad = $("[name=people]:checked"), accId = rad.val(), name = rad.parents("ul").find(".accName").text();
            console.log("====accId:" + accId + "===name: " + name + "=部门id:" + orgId + "==部门名称:=" + orgName);
            var conditions = $("[name=people]:checked");
            var array = [];
            for (var i = 0; i < conditions.length; i++) {
                var obj = conditions[i].value;
                array.push(obj);
            }
            console.log(array);
            var userids = array.join(",");
            console.log("=部门id:" + orgId + "==部门名称:=" + orgName);
            console.log("多选人员 userids: " + userids);

            parent.layer.closeAll();
        } else {
            layer.closeAll();
            alert("请选择。。。");
        }

    });
});