import Link from 'next/link';
export default function NotFound() { return <div className="document-page page-pad"><h1>Page not found</h1><p>页面不存在。</p><Link className="text-link" href="/zh">返回首页 ↗</Link><br /><Link className="text-link" href="/en">Back home ↗</Link></div>; }
