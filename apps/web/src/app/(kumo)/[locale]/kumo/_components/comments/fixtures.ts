/**
 * Sample comments for the dev-only demo pages, which render `CommentsView`
 * without a session. Nothing here is fetched.
 */
import type { Comment } from "@/api/comments/comments"
import type { CommentsViewer } from "./comments-view"

/** The demo's "signed-in" user: the author of one comment below, not an admin. */
export const demoCommentsViewer: CommentsViewer = {
  id: 501,
  canModerate: false
}

const DEMO_APP_ID = 1

type Sample = Pick<
  Comment,
  "id" | "user_id" | "alias" | "comment" | "rating" | "created_at"
> & {
  is_admin?: boolean
  uservote?: 1 | 0
  replies?: Sample[]
}

function build(sample: Sample, parentId: number | null = null): Comment {
  const { replies = [], is_admin = false, ...fields } = sample
  return {
    ...fields,
    is_admin,
    app_id: DEMO_APP_ID,
    parent_id: parentId,
    updated_at: fields.created_at,
    children: replies.map((reply) => build(reply, fields.id))
  }
}

// Fixed dates rather than "minutes ago": the view prints relative times, and
// the server and browser renders have to agree on them.
const samples: Sample[] = [
  {
    id: 101,
    user_id: 2041,
    alias: "Marta K.",
    comment:
      "Installed in about a minute and it picked up my existing library without any extra setup. No slowdowns so far, even with a couple of streams running.",
    rating: 12,
    uservote: 1,
    created_at: "2026-11-02T09:14:00Z"
  },
  {
    id: 102,
    user_id: 1876,
    alias: "tobias_r",
    comment:
      "Can this run behind my own domain, or does it have to stay on the default address?",
    rating: 5,
    created_at: "2026-11-08T17:40:00Z",
    replies: [
      {
        id: 103,
        user_id: 12,
        alias: "Appbox Support",
        is_admin: true,
        comment:
          "It can. Add the domain to your account first, then choose it when you install the app or from the app's settings afterwards.",
        rating: 7,
        created_at: "2026-11-08T18:05:00Z",
        replies: [
          {
            id: 104,
            user_id: 1876,
            alias: "tobias_r",
            comment: "That worked, thanks. It was live a few minutes later.",
            rating: 1,
            created_at: "2026-11-09T08:22:00Z",
            replies: [
              {
                id: 105,
                user_id: 12,
                alias: "Appbox Support",
                is_admin: true,
                comment: "Glad to hear it.",
                rating: 0,
                created_at: "2026-11-09T09:01:00Z"
              }
            ]
          }
        ]
      },
      {
        id: 106,
        user_id: 3310,
        alias: "nightowl",
        comment: "Had the same question, good to know it is that simple.",
        rating: 2,
        created_at: "2026-11-10T21:47:00Z"
      }
    ]
  },
  {
    id: 107,
    user_id: demoCommentsViewer.id,
    alias: "Demo user",
    comment:
      "Tip for anyone moving over from another host: restore your backup before the first launch.\n\nOtherwise the setup wizard starts you off with an empty database.",
    rating: 3,
    created_at: "2026-11-11T12:30:00Z"
  },
  {
    id: 108,
    user_id: 2760,
    alias: "hk_lin",
    comment:
      "Updates tend to arrive a week or two after the upstream release. Not a dealbreaker, but worth knowing if you need the newest features.",
    rating: -2,
    uservote: 0,
    created_at: "2026-10-21T07:55:00Z"
  },
  {
    id: 109,
    user_id: 2997,
    alias: "sorenb",
    comment:
      "Does freezing the app keep its data? I only need it a few days a month.",
    rating: 0,
    created_at: "2026-11-12T19:03:00Z"
  }
]

/** Five threads, one of them four levels deep, in no particular order. */
export const demoComments: Comment[] = samples.map((sample) => build(sample))

/** Every comment above, replies included. Feeds the count beside the title. */
export const demoCommentTotal = 9
