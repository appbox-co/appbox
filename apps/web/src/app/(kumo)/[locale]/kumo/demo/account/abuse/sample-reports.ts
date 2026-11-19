/**
 * Sample abuse reports for the dev-only demo pages. Nothing here is fetched,
 * and every name, address and title is made up.
 */
import {
  abuseStatusToLabel,
  type AbuseReport,
  type AbuseReportDetail,
  type AbuseTimelineEntry
} from "@/api/account/account"
import type { Comment } from "@/api/comments/comments"
import { demoCommentsViewer } from "../../../_components/comments/fixtures"

const HOUR = 3_600_000
const DAY = 24 * HOUR
// Midnight, so the server render and the browser agree on every date.
const LOADED_AT = Math.floor(Date.now() / DAY) * DAY

const daysAgo = (days: number) => new Date(LOADED_AT - days * DAY).toISOString()

interface Sample {
  id: number
  /** The provider's own reference, which the list shows in place of the id. */
  isp_id?: string | number
  subject: string
  complainant: string
  cyloname?: string
  /** Status codes the case has been through, oldest first: [code, days ago]. */
  steps: [status: number, daysAgo: number][]
  description: string
  admin_response?: string
}

const NOTICE = (work: string, file: string) =>
  [
    "To whom it may concern,",
    "",
    `We act on behalf of the owner of the rights in ${work}. A copy of this work was made available without permission from an address on your network.`,
    "",
    `File name: ${file}`,
    "Protocol: BitTorrent",
    "Address: 203.0.113.10, port 51413",
    "",
    "Please remove or disable access to the material and tell the account holder about this notice.",
    "",
    "Notices Team",
    "notices@rights-agency.example"
  ].join("\n")

const SAMPLES: Sample[] = [
  {
    id: 4108,
    isp_id: "NTC-771204",
    subject: "Copyright notice: unauthorised distribution of a feature film",
    complainant: "Example Rights Agency",
    cyloname: "media-box",
    steps: [
      [-1, 2],
      [7, 2],
      [1, 1]
    ],
    description: NOTICE(
      'the feature film "An Example Picture"',
      "An.Example.Picture.2026.1080p.mkv"
    )
  },
  {
    id: 4107,
    subject: "Trademark complaint about a hosted download page",
    complainant: "Brand Protection Desk",
    cyloname: "automation",
    steps: [
      [-1, 4],
      [7, 4]
    ],
    description:
      "A page served from your network offers downloads under our client's registered name and logo without permission.\n\nPage: https://files.automation.appbox.co/downloads/\n\nPlease remove the page or the marks from it."
  },
  {
    id: 4105,
    isp_id: 880231,
    subject: "Copyright notice: television series, season 2",
    complainant: "Example Rights Agency",
    cyloname: "media-box",
    steps: [[-1, 0.25]],
    description: NOTICE(
      'the television series "Sample Street", season 2',
      "Sample.Street.S02.Complete.720p"
    )
  },
  {
    id: 4099,
    isp_id: "NTC-768930",
    subject: "Notice of claimed infringement: music album",
    complainant: "Recorded Music Notices",
    cyloname: "media-box",
    steps: [
      [-1, 21],
      [7, 21],
      [1, 20],
      [0, 19]
    ],
    description: NOTICE(
      'the album "Placeholder Songs"',
      "Placeholder.Songs.2025.FLAC"
    )
  },
  {
    id: 4090,
    subject: "Report of malware hosted on a download link",
    complainant: "security@scanner.example",
    cyloname: "automation",
    steps: [
      [-1, 40],
      [5, 40],
      [8, 37]
    ],
    description:
      "Our scanner found a file flagged as malicious at the address below.\n\nhttps://files.automation.appbox.co/share/setup-tool.exe\n\nDetection: Trojan.Generic (3 of 60 engines)\nFirst seen: 40 days ago",
    admin_response:
      "We checked the file by hand. It is a packed installer that some scanners flag by mistake, and it has not been shared outside your account. No action was needed, so the case is closed."
  },
  {
    id: 4083,
    isp_id: "NTC-760118",
    subject: "Copyright notice: documentary film",
    complainant: "Example Rights Agency",
    cyloname: "media-box",
    steps: [
      [-1, 63],
      [7, 63],
      [2, 63]
    ],
    description: NOTICE(
      'the documentary "A Sample of Rivers"',
      "A.Sample.of.Rivers.2160p.mkv"
    )
  },
  {
    id: 4071,
    subject: "Copyright notice: software package",
    complainant: "Software Licensing Notices",
    cyloname: "windows-vps",
    steps: [
      [-1, 88],
      [7, 88],
      [3, 88]
    ],
    description: NOTICE(
      'the software package "Example Suite 12"',
      "Example.Suite.12.x64.iso"
    )
  },
  {
    id: 4060,
    subject: "Fwd: complaint regarding your customer",
    complainant: "abuse@upstream.example",
    cyloname: "media-box",
    steps: [
      [-1, 9],
      [5, 9]
    ],
    description:
      "Forwarded message. The original complaint was attached as a scanned letter and could not be read automatically."
  },
  {
    id: 4044,
    isp_id: "NTC-741552",
    subject: "Copyright notice: feature film",
    complainant: "Example Rights Agency",
    cyloname: "old-seedbox",
    steps: [
      [-1, 200],
      [4, 200]
    ],
    description: NOTICE(
      'the feature film "Yet Another Example"',
      "Yet.Another.Example.2025.BluRay.mkv"
    )
  },
  {
    id: 4032,
    subject: "Complaint about spam sent from your network",
    complainant: "postmaster@mailhost.example",
    steps: [
      [-1, 260],
      [5, 260],
      [12, 255]
    ],
    description:
      "We received unsolicited mail from an address on your network. Headers are attached.\n\nUpdate: the sender address was forged and the mail did not come from you. We are withdrawing this complaint."
  }
]

function current(sample: Sample) {
  return sample.steps[sample.steps.length - 1][0]
}

function toListItem(sample: Sample): AbuseReport {
  const statusCode = current(sample)
  return {
    id: sample.id,
    isp_id: sample.isp_id,
    subject: sample.subject,
    status: abuseStatusToLabel(statusCode),
    statusCode,
    description: sample.description,
    complainant: sample.complainant,
    admin_response: sample.admin_response,
    created_at: daysAgo(sample.steps[0][1]),
    updated_at: daysAgo(sample.steps[sample.steps.length - 1][1]),
    cyloname: sample.cyloname
  }
}

/** Ten reports: every tone a status can have, one of them waiting on the user. */
export const sampleAbuseReports: AbuseReport[] = SAMPLES.map(toListItem)

const MANY_STATUSES = [2, 3, 0, 2, 8, 12, 2, 3, 4, 2]

/** Seventy, for paging: the ten above and sixty older, closed ones. */
export const manyAbuseReports: AbuseReport[] = [
  ...sampleAbuseReports,
  ...Array.from({ length: 60 }, (_, index): AbuseReport => {
    const statusCode = MANY_STATUSES[index % MANY_STATUSES.length]
    const age = 280 + index * 6
    return {
      id: 4000 - index,
      subject: `Copyright notice: archived case ${String(index + 1).padStart(2, "0")}`,
      status: abuseStatusToLabel(statusCode),
      statusCode,
      description: "",
      complainant:
        index % 3 === 0 ? "Recorded Music Notices" : "Example Rights Agency",
      created_at: daysAgo(age),
      updated_at: daysAgo(age - 1),
      cyloname: index % 4 === 0 ? "automation" : "media-box"
    }
  })
]

/** One report in full, as the detail request returns it. */
export function sampleAbuseReport(id: number): AbuseReportDetail | undefined {
  const sample = SAMPLES.find((entry) => entry.id === id)
  if (!sample) return undefined

  // Deliberately newest first: the page is the one that orders them.
  const timeline: AbuseTimelineEntry[] = sample.steps
    .map(([status, days], index) => ({
      id: sample.id * 10 + index,
      abuse_id: sample.id,
      status,
      // Steps on the same day are a few minutes apart, in order.
      created_at: new Date(
        LOADED_AT - days * DAY + index * 7 * 60_000
      ).toISOString()
    }))
    .reverse()

  return {
    ...toListItem(sample),
    ip: "203.0.113.10",
    port: 51413,
    server_name: "ams-42",
    timeline
  }
}

function comment(
  id: number,
  reportId: number,
  author: { user_id: number; alias: string; is_admin: boolean },
  text: string,
  days: number
): Comment {
  return {
    id,
    parent_id: null,
    user_id: author.user_id,
    app_id: reportId,
    comment: text,
    rating: 0,
    alias: author.alias,
    is_admin: author.is_admin,
    children: [],
    created_at: daysAgo(days),
    updated_at: daysAgo(days)
  }
}

const SUPPORT = { user_id: 12, alias: "Appbox Support", is_admin: true }
/** The sample page's "signed-in" user, so their own comments can be edited. */
export const SAMPLE_AUTHOR = {
  user_id: demoCommentsViewer.id,
  alias: "Demo user",
  is_admin: false
}

/** The conversation on a report. Most have none yet. */
export function sampleConversation(reportId: number): Comment[] {
  if (reportId === 4108) {
    return [
      comment(
        9001,
        reportId,
        SUPPORT,
        "The files named in this notice have been quarantined. Reply here once you have looked at them, or tell us if you believe the notice is a mistake.",
        1
      ),
      comment(
        9002,
        reportId,
        SAMPLE_AUTHOR,
        "I have removed the torrent from my client and will not add it again. Is there anything else you need from me?",
        0
      )
    ]
  }
  if (reportId === 4090) {
    return [
      comment(
        9003,
        reportId,
        SAMPLE_AUTHOR,
        "This is an installer I built myself. Happy to send the source if that helps.",
        39
      ),
      comment(
        9004,
        reportId,
        SUPPORT,
        "Thanks. We have reviewed it and closed the case; see the response above.",
        37
      )
    ]
  }
  return []
}
