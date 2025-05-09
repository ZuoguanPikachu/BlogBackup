<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from "@/stores/posts"
import MarkdownIt from 'markdown-it'
import prism from 'prismjs'

import 'github-markdown-css/github-markdown.css'
import 'prism-themes/themes/prism-one-light.css'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-python'

const md = new MarkdownIt()
md.set({
  highlight(code: string, lang: string) {
    if (lang && prism.languages[lang]) {
      try {
        const highlighted = prism.highlight(code, prism.languages[lang], lang)
        return `<pre class="language-${lang}"><code>${highlighted}</code></pre>`
      } catch (e) {
        console.error(e)
      }
    }
    return `<pre class="language-plain"><code>${md.utils.escapeHtml(code)}</code></pre>`
  }
})

md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const src = token.attrGet('src')
  const alt = token.content || ''

  const maxWidth = 'max-w-9/10!'
  return `<div class="flex flex-col items-center my-6"><img src="${src}" alt="${alt}" class="${maxWidth} rounded-sm shadow-lg" /></div>`
}

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx]

  token.attrSet('target', '_blank')
  token.attrJoin('class', 'text-emerald-600!')

  return  self.renderToken(tokens, idx, options);
};


const { posts } = storeToRefs(usePostsStore())
const route = useRoute()
const post = computed(() =>
  posts.value.find(p => p.slug === route.params.slug)
)
</script>

<template>
  <div v-html="md.render(post!.content)" class="w-full max-w-6xl p-4 markdown-body"></div>
</template>
