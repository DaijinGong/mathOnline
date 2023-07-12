##小学加减乘除刷题项目
###功能说明
1. 用户访问服务器后，服务器给出随机但合理的计算题
2. 用户提交答案后，校验答案，并将相关信息汇总放到json文件中
3. 手动修改参数，用户可以查看并刷错题
4. 服务端可以通过记事本留言的方式实现客户端广播
5. 其他用户可以通过访问页面看到刷题进度，但是不影响刷题者使用。

###已改进问题说明
1. 问题：刷题过程中，其他用户登录会造成get路由方法调用的试题刷新，从而判断异常。
措施：在get方法内加入finish标志，初始为true，第一次出题后改为false，除非提交答案判断后才重置为true。不论谁访问都是同一道题，便于监控。
2. 问题：刷题过程中，误触提交答案会导致试题刷新。
措施：已通过校验第一个空是否为空然后alert的方法避免误触。
3. 问题：前端除法需要余数输入框，其他不需要，之前定死的。
措施：现在在发送get请求后，通过校验后端对象的type值来判断是否为除法，进行动态响应。
4. 问题：刷错题时将错题写到了正常刷题的json文件，导致文件被覆盖。
措施：目前暂时用文件分离的方案解决。未来可以搞数据库。
5. 问题：无法通知用户。
措施：加了一个路由，前端每隔一秒就get请求，后端读取chatBox.txt文件，内容交给前端。

###当前问题及后续规划
1. 问题：服务器断开连接后（熄屏或者其他问题），再次连接后，浏览器堆积的get请求会累积发送，导致问题。措施：拟通过时间戳ID来校验避免重复计算。
2. 问题：修改参数相对麻烦，部署到服务器不太好操作。
措施：拟添加管理端来控制题目难度、类型。
3. 问题：目前主要在局域网，依赖于距离。
措施：稳定后部署服务器。
4. 问题：目前功能相对单一，且只能单用户使用。
措施：实现账户登录，可以多用户使用。实现csv题目轮询判断，可以用于应用题、语文题、英语题
