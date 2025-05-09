import { ref } from 'vue'
import { defineStore } from 'pinia'
import matter from 'gray-matter'

interface Frontmatter {
  title: string
  date: string
  categories: string
  tags: string[]
}

export interface Post {
  slug: string
  title: string
  content: string
  categories: string
  tags: string[]
  date: Date
}

export const usePostsStore = defineStore('posts', () => {
  const parseMarkdown = (fileContent: string): { frontmatter: Frontmatter; content: string } => {
    const { data: frontmatter, content } = matter(fileContent)

    let tags = frontmatter.tags
    if (typeof tags === 'string') {
        tags = [tags]
    }
    frontmatter.tags = tags

    return {
      frontmatter: frontmatter as Frontmatter,
      content
    }
  }

  const posts = ref<Post[]>([])

  const loadPosts = async () => {
    const modules: Record<string, string> = import.meta.glob('../posts/*.md', {
      query: '?raw',
      import: 'default',
      eager: true
    })

    posts.value = Object.entries(modules)
      .map(([path, content]) => {
        const { frontmatter, content: html } = parseMarkdown(content)
        const slug = path.split('/').pop()?.replace('.md', '') || ''
        return {
          slug,
          title: frontmatter.title,
          content: html,
          categories: frontmatter.categories,
          tags: frontmatter.tags,
          date: new Date(frontmatter.date)
        } as Post
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  loadPosts()

  return { posts }
})
