/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-08-10 10:00:00
 * @Description: 首页服务端数据
 */
import { getSupabaseServerClient } from '@/lib/supabase/server'

import type { Category } from '@/types'

/**
 * @description: 首页数据（全部分类 + 网站），服务端直接查询
 * 查询与排序逻辑与 /api/categorys 保持一致，供 RSC 页面复用
 */
export async function fetchHomeData(): Promise<Category[]> {
  const supabase = await getSupabaseServerClient()

  // 查询 sql
  const { data, error } = await supabase
    .from('ds_categorys')
    .select('*,websites:ds_websites(*)')
    .order('sort', {
      ascending: false,
    })
    .order('created_at', {
      ascending: false,
    })

  // 执行失败
  if (error) {
    throw new Error(error.message)
  }

  const list = data ?? []

  list.forEach((category: Category) => {
    category?.websites.sort((a, b) => {
      // 2. 再按 pinned 降序 (true 排在前面)
      if (a.pinned !== b.pinned)
        return b.pinned ? 1 : -1

      // 1. 先按 sort 降序 (b - a)
      if (b.sort !== a.sort)
        return b.sort - a.sort

      // 3. 然后按 recommend 降序 (true 排在前面)
      if (a.recommend !== b.recommend)
        return b.recommend ? 1 : -1

      // 4. 最后按 created_at 降序 (新日期在前)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  })

  return list
}
