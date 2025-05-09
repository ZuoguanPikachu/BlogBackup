<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue' 
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CalendarDaysIcon } from '@heroicons/vue/24/solid'
import { Squares2X2Icon, TagIcon } from '@heroicons/vue/24/outline'
import { usePostsStore } from "@/stores/posts"
import type { Post } from '@/stores/posts'

const route = useRoute()
const router = useRouter()
const { posts } = storeToRefs(usePostsStore())

function toPost(slug: string){
  router.push({ path: `/post/${slug}` })
}
// const pagePosts: Ref<Post[]> = ref([])
// if (route.path == '/') {
//     pagePosts.value = posts.value.slice(0, 10)
// }
// else {
//     const pageId = parseInt(route.params.pageId as string, 10)
//     pagePosts.value = posts.value.slice((pageId - 1)*10, pageId*10)
// }

</script>

<template>
  <div class="w-full max-w-6xl p-4">
    <div v-for="post in posts" class="mb-6 p-3 w-full rounded-2xl border-gray-400 border hover:border-emerald-600 hover:cursor-pointer" @click="toPost(post.slug)">
      <div class="mb-4">
        <RouterLink :to="`/post/${post.slug}`" class="hover:text-emerald-600">{{ post.title }}</RouterLink>
      </div>
      <div>
        <CalendarDaysIcon class="inline size-4 text-gray-500 mr-1"/>
        <p class="inline align-bottom text-xs text-gray-500">{{ post.date.toLocaleDateString() }}</p>
      </div>
      <div>
        <div class="inline mr-4">
          <Squares2X2Icon class="inline size-4 text-gray-500 mr-1"/>
          <p class="inline align-bottom text-xs text-gray-500">{{ post.categories }}</p>
        </div>
        <div class="inline">
          <TagIcon class="inline size-4 text-gray-500 mr-1"/>
          <p v-for="tag in post.tags" class="inline align-bottom text-xs text-gray-500 mr-1.5">{{ tag }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

