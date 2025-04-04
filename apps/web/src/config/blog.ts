import type { BlogConfig } from "../lib/opendocs/types/blog"

export const blogConfig: BlogConfig = {
  mainNav: [
    {
      href: "/blog",

      title: {
        en: "Blog"
      }
    }
  ],

  authors: [
    {
      /* the id property must be the same as author_id in the blog post mdx files required for the computed field
        in contentlayer.config.ts so we can get the author details from the blogConfig by comparing the author_id
        with the id below
      */
      id: "rid",
      name: "rid",
      image: "/authors/rid.png",
      site: "https://www.appbox.co",
      email: "support@appbox.co",

      bio: {
        en: "Software Engineer | Writer | Designer",
        pt: "Engenheiro de Software | Escritor | Designer"
      },

      social: {
        github: "rid"
      }
    }
  ],

  rss: [
    {
      type: "xml",
      file: "blog.xml",
      contentType: "application/xml"
    },

    {
      type: "json",
      file: "blog.json",
      contentType: "application/json"
    }
  ]
} as const
