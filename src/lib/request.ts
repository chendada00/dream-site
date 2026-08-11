import { toast } from '@heroui/react'

import type { IResponse } from '@/types'

interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>
}

const BASE_URL = '/api'

// 进行中的 GET 请求去重表：相同 URL 的并发请求共享同一个 Promise，避免重复请求
// 请求完成后立即删除，不影响后续串行请求获取最新数据
const pendingGets = new Map<string, Promise<IResponse<unknown>>>()

export async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<IResponse<T>> {
  const {
    params,
    ...fetchOptions
  } = options

  const headers = new Headers(
    fetchOptions.headers,
  )

  // 只有非 FormData 才设置 JSON
  if (
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    )
  }

  const finalUrl = buildUrl(url, params)

  const doFetch = async (): Promise<IResponse<T>> => {
    const response = await fetch(
      finalUrl,
      {
        ...fetchOptions,
        headers,
      },
    )

    if (!response.ok) {
      const msg = `请求失败 ${response.status}`
      toast.danger(msg)
      throw new Error(msg)
    }

    const result = await response.json() as IResponse<T>

    if (result.code !== 200) {
      const msg = result.msg || '请求失败'
      toast.danger(msg)
    }

    return result
  }

  // 仅对 GET 请求做并发去重（写请求必须每次都执行）
  const method = (fetchOptions.method ?? 'GET').toUpperCase()
  if (method === 'GET') {
    const existing = pendingGets.get(finalUrl)
    if (existing)
      return existing as Promise<IResponse<T>>

    const promise = doFetch().finally(() => {
      pendingGets.delete(finalUrl)
    })
    pendingGets.set(finalUrl, promise)
    return promise
  }

  return doFetch()
}

function buildUrl(
  url: string,
  params?: Record<string, unknown>,
) {
  if (!params) {
    return `${BASE_URL}${url}`
  }

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(
        key,
        String(value),
      )
    }
  })

  const query = searchParams.toString()
  return query ? `${BASE_URL}${url}?${query}` : `${BASE_URL}${url}`
}
