import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { RESPONSE, responseMessage } from '@/lib/utils'

import type { NextRequest } from 'next/server'

/**
 * @description: 删除分类
 * @param {Request} request
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getSupabaseServerClient()
    // 路由内二次鉴权（middleware 的 getClaims 仅解码 JWT，不验证有效性）
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }

    const { id } = await params

    // 删除分类
    const { data, error } = await supabase
      .from('ds_categorys')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(responseMessage(null, error.message, RESPONSE.ERROR))
    }

    // 返回成功响应
    return NextResponse.json(responseMessage(data))
  }
  catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}

/**
 * @description: 修改分类
 * @param {Request} request
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getSupabaseServerClient()
    // 路由内二次鉴权（middleware 的 getClaims 仅解码 JWT，不验证有效性）
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }

    // 获取动态参数
    const { id } = await params
    // 解析请求体（仅保留可更新字段白名单，防止篡改 id 等受保护字段）
    const body = await request.json() as Record<string, unknown>
    const allowedBody = Object.fromEntries(
      ['name', 'sort']
        .filter(key => key in body)
        .map(key => [key, body[key]]),
    )

    // 更新分类
    const { data, error } = await supabase
      .from('ds_categorys')
      .update(allowedBody)
      .eq('id', id)
      .select()
      .single()

    // 如果插入失败
    if (error) {
      // 判断是否违反唯一性约束（PostgreSQL 错误代码 23505）
      if (error.code === '23505') {
        return NextResponse.json(responseMessage(null, '分类名称已存在！', -1))
      }

      // 其他错误
      return NextResponse.json(responseMessage(null, error.message, RESPONSE.ERROR))
    }

    // 返回更新后的菜单数据
    return NextResponse.json(responseMessage(data))
  }
  catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
