export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">火车票订购平台</h3>
            <p>提供便捷的火车票查询和预订服务</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">快速链接</h3>
            <ul className="space-y-1">
              <li><a href="/search" className="hover:text-railway-primary">查询车次</a></li>
              <li><a href="/orders" className="hover:text-railway-primary">我的订单</a></li>
              <li><a href="/login" className="hover:text-railway-primary">用户登录</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">联系方式</h3>
            <p>客服电话：12306</p>
            <p>工作时间：06:00 - 23:00</p>
          </div>
        </div>
        <div className="border-t mt-4 pt-4 text-center text-xs text-gray-500">
          © 2024 火车票订购平台 - 模拟演示项目
        </div>
      </div>
    </footer>
  );
}
