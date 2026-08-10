/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-21 16:33:59
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @LastEditTime: 2026-08-10 10:00:00
 * @Description: 首页
 */
import { Suspense } from 'react'

import HomeContent from '@/components/HomeContent'
import SkeletonContent from '@/components/SkeletonContent'
import { fetchHomeData } from '@/lib/server/home'

// 每次访问拉取最新数据，保证后台变更即时生效（后续可优化为 ISR/tag 缓存）
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <Suspense fallback={<SkeletonContent />}>
      <HomeData />
    </Suspense>
  )
}

// 取数放在 async Server Component 内：Suspense 负责加载态，
// 客户端导航时以已 resolve 的数据传给客户端组件，避免 promise 挂起
async function HomeData() {
  const data = await fetchHomeData()
  return <HomeContent data={data} />
}
