import Link from 'next/link';
export default function NotFound() { return <html lang="en"><body><main style={{ fontFamily: 'sans-serif', padding: '4rem' }}><h1>Page not found / 页面不存在</h1><Link href="/zh">中文首页</Link> · <Link href="/en">English home</Link></main></body></html>; }
