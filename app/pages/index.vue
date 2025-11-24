<template>
  <div class="container mx-auto flex flex-col gap-6">
    <template v-if="categoryStatus === 'pending'">
      <USkeleton class="h-20 w-full" v-for="i in 3" :key="i" />
    </template>
    <template v-else>
      <div v-for="item in categoryList?.data?.list || []" :key="item.id">

        <div
            class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            @click="toggleCategory(item.id)"
        >
          <UIcon :name="item.icon || 'ri:menu-5-line'" class="!size-6" />
          <BlurText
              :text="item.name"
              :delay="200"
              class-name="text-xl font-semibold category-title foolishIn"
              animate-by="letters"
              direction="top"
              :threshold="0.1"
              root-margin="0px"
              :step-duration="0.35"
          />
        </div>

        <div

            v-if="item.ds_websites?.length && !collapsedStates[item.id]"
            class="grid gap-5 w-full justify-center grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] mt-2"
        >
          <AnimatedContent
              :distance="15"
              direction="vertical"
              :reverse="false"
              :duration="1.2"
              ease="power3.out"
              :initial-opacity="0"
              :animate-opacity="true"
              :scale="0.9"
              :threshold="0.1"
              :delay="0"
              v-for="child in item.ds_websites || []"
              :key="child.id"
          >
            <div
                class="relative h-full cursor-pointer card-base animated-border animate-fade after:border-green-500/50 dark:after:border-green-400/50 shadow-md dark:shadow-[0_4px_6px_-1px_rgb(255,255,255,0.1)]"
                shadow="hover"
                @click="handleClick(child)"
                @mouseenter="($event.target as HTMLElement)?.classList?.add('hovered')"
            >
              <div class="flex flex-col gap-3">
                <div class="flex gap-2 items-center">
                  <SiteImage :url="child.logo" :color="child.color" loading="lazy" />
                  <div class="flex flex-col gap-0.5">
                    <div class="flex gap-1 items-center">
                      <div class="text-lg font-semibold">{{ child.name }}</div>
                      <template v-if="child.vpn">
                        <UTooltip text="访问需要开启 VPN 服务">
                          <UIcon name="ri:error-warning-line" class="text-slate-400" />
                        </UTooltip>
                      </template>
                    </div>
                    <div class="category-tag flex gap-1 items-center text-xs text-slate-400 font-thin">
                      <template v-for="(tag, index) in child.tags" :key="index">
                        <UBadge color="neutral" variant="soft" class="rounded-full" size="sm">{{ tag }}</UBadge>
                      </template>
                    </div>
                  </div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-6">
                  {{ child.desc }}
                </div>
              </div>
              <div class="flex gap-1 absolute top-2 right-2">
                <UBadge variant="soft" v-if="child.pinned" size="sm">置顶</UBadge>
                <UBadge color="secondary" variant="soft" v-if="child.recommend" size="sm">推荐</UBadge>
              </div>
            </div>
          </AnimatedContent>
        </div>

        <div v-show="!collapsedStates[item.id]" v-else class="flex justify-center items-center flex-col">
          <UAlert
              color="neutral"
              variant="subtle"
              title="此分类暂无站点!"
              description="请前往后台添加数据."
              icon="i-lucide-terminal"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'; // 确保引入所有需要的 API
import type { PageResponse, CategoryList, Response, WebsiteList } from "~/lib/type";

const client = useSupabaseClient<WebsiteList>();
const toast = useToast();

defineOgImageComponent("Nuxt", {
  headline: "Greetings",
  title: `${process.env.NUXT_SITE_NAME} 👋`,
  description: "A beautiful personal site navigation!",
});

// 1. 用于存储每个分类的折叠状态 (本地状态)
// key 是分类 ID，value 是布尔值 (true: 折叠, false: 展开)
const collapsedStates = ref<Record<number, boolean>>({});

// 2. 请求分类列表
const { data: categoryList, status: categoryStatus } = await useFetch<Response<PageResponse<CategoryList>>>(
    "/api/categorys",
    {
      query: { current: 1, pageSize: 999 },
      onRequestError: ({ error }) => {
        toast.add({
          title: "请求失败.",
          description: error.message,
        });
      },
    }
);

// 3. 数据加载后立即初始化所有分类的状态
const initializeCollapseState = (collapseStatus: boolean | null = null) => {
  if (categoryList.value?.data?.list) {
    // 确定初始折叠状态，如果传入了状态（来自 localStorage），则使用传入的
    const initialCollapse = collapseStatus !== null ? collapseStatus : false;

    categoryList.value.data.list.forEach(category => {
      // 默认所有分类都使用传入的或默认的初始状态
      collapsedStates.value[category.id] = initialCollapse;
    });

    // 如果是初始化且没有传入状态，写入默认的“全部展开”状态到 localStorage
    if (collapseStatus === null) {
      localStorage.setItem('globalCollapseState', 'false');
    }
  }
};

// 4. 切换单个分类状态的函数
const toggleCategory = (categoryId: number) => {
  if (categoryId in collapsedStates.value) {
    // 切换本地状态
    collapsedStates.value[categoryId] = !collapsedStates.value[categoryId];

    // 由于用户手动点击了单个分类，全局状态可能被破坏，
    // 因此我们应该将 localStorage 中的全局状态设置为“非全部折叠” (false)
    localStorage.setItem('globalCollapseState', 'false');
  }
};

// 5. 切换所有分类状态的函数 (供布局文件和本地存储监听调用)
const toggleAllCategories = (collapse: boolean) => {
  initializeCollapseState(collapse);
  // 写入 localStorage，供布局文件中的按钮 UI 同步
  localStorage.setItem('globalCollapseState', collapse ? 'true' : 'false');
};

// 6. 监听 localStorage 的变化，以同步布局文件中按钮的操作
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === 'globalCollapseState' && event.newValue !== null) {
    const isCollapsed = event.newValue === 'true';

    if (isCollapsed !== (Object.values(collapsedStates.value).every(state => state))) {
      initializeCollapseState(isCollapsed);
    }
  }
};

// 7. 生命周期钩子
onMounted(() => {
  // 确保只在客户端执行
  if (process.client) {
    // 初始加载时，读取 localStorage 的状态并同步
    const savedState = localStorage.getItem('globalCollapseState');
    if (savedState !== null) {
      initializeCollapseState(savedState === 'true');
    } else {
      // 否则，执行一次默认初始化
      initializeCollapseState();
    }

    window.addEventListener('storage', handleStorageChange);
  }
});
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});


// 8. 点击卡片回调 (保持不变)
const handleClick = async (record: WebsiteList) => {
  try {
    window.open(record.url);
    // umTrackEvent(record.name, record);
    await client.rpc("increment_visit_count", {
      row_id: record.id,
      increment_value: Math.floor(Math.random() * 100) + 1,
    });
  } catch {
    toast.add({
      title: "更新访问次数失败",
      color: "error",
    });
  }
};

// 9. 页面元数据 (保持不变)
definePageMeta({
  title: "伴随的个人站点导航！",
});
</script>