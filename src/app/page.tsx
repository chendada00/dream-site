/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-21 16:33:59
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @LastEditTime: 2026-08-05 09:24:46
 * @Description: 首页
 */
'use client'
import { DatabaseFill, Plus } from '@gravity-ui/icons'
import { Button, Typography } from '@heroui/react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import AlertContent from '@/components/AlertContent'
import BlurFade from '@/components/BlurFade'
import ErrorContent from '@/components/ErrorContent'
import SkeletonContent from '@/components/SkeletonContent'
import WebsiteCard from '@/components/WebSiteCard'
import useRequest from '@/hooks/use-request'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

import type { Category, PaginatingResponse } from '@/types'
import type { Variants } from 'motion/react'

// 首屏视口内可见的卡片数量（20rem 最小列宽，宽屏约 4 列 × 1 行）
const FIRST_SCREEN_CARD_COUNT = 4

// 卡片级出场动画：y + opacity 逐卡 stagger 淡入（blur 由 BlurFade 区块层负责，避免重复开销）
const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
}

// 网格容器作为变体节点：继承 BlurFade 的 initial/animate，通过 staggerChildren 编排子卡片
const cardGridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const cardTransition = { duration: 0.4, ease: 'easeOut' } as const

export default function Home() {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const { data, loading, error, run } = useRequest<PaginatingResponse<Category>>('/categorys', {
    params: { pageIndex: 0, pageSize: 999 },
  })
  const list = useMemo(() => data?.list ?? [], [data])
  const isInitialLoading = loading || (!data && !error)

  const reload = () => {
    run({ pageIndex: 0, pageSize: 999 })
  }

  const goAdmin = () => {
    router.push('/admin')
  }

  const handleClick = useCallback(async (id: string) => {
    // 计数失败不应影响跳转，且避免产生未处理的 Promise rejection
    try {
      await supabase.rpc('increment_visit_count', {
        row_id: id,
      })
    }
    catch {
      // 忽略计数失败
    }
  }, [supabase])

  if (isInitialLoading) {
    return (
      <SkeletonContent />
    )
  }

  if (error) {
    return (
      <ErrorContent refresh={reload} />
    )
  }

  if (!list?.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex-1 size-full max-w-xl max-h-100 border-border p-6 bg-surface rounded-2xl text-center flex justify-center items-center">
          <div className="flex flex-col gap-2 items-center">
            <div className="bg-default text-foreground p-4 rounded-full">
              <DatabaseFill className="size-5" />
            </div>
            <Typography type="h5">一切安静如常 🕊️</Typography>
            <Typography type="body-sm">当前还没有任何分类，请前往后台进行添加。</Typography>
            <Button size="sm" variant="primary" onPress={goAdmin}>
              <Plus />
              添加分类
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {list.map(({ id, name, websites }, sectionIdx) => {
        return (
          <BlurFade key={id} inView className="flex flex-col gap-2">
            <h1 className="text-lg font-black">{name}</h1>
            {websites?.length
              ? (
                  <motion.div
                    variants={cardGridVariants}
                    className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]"
                  >
                    {websites.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        transition={cardTransition}
                        variants={cardVariants}
                        className="h-full"
                      >
                        <WebsiteCard
                          data={item}
                          handleClick={handleClick}
                          priority={sectionIdx === 0 && idx < FIRST_SCREEN_CARD_COUNT}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )
              : (
                  <div className="flex justify-center p-4">
                    <AlertContent
                      title="暂无网站数据"
                      actionText="添加网站"
                      buttonAction={goAdmin}
                      description="该分类还没有任何网站，请前往后台进行添加。"
                      status="accent"
                    />
                  </div>
                )}
          </BlurFade>
        )
      })}
    </div>
  )
}
