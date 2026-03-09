"use client"

import { useEffect } from "react"
import {
  MARKETING_SCREENSHOT_MODE_DEFAULT,
  MARKETING_SCREENSHOT_QUERY_PARAM,
  MARKETING_SCREENSHOT_STORAGE_KEY
} from "@/config/marketing-screenshot-mode"

const TRUE_VALUES = new Set(["1", "true", "yes", "on"])
const FALSE_VALUES = new Set(["0", "false", "no", "off"])
const DOMAIN_REGEX =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi
const EMAIL_REGEX = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi

// Based on Moby's namesgenerator (adjective + notable scientist/engineer surname).
const MOBY_LEFT = [
  "admiring",
  "adoring",
  "affectionate",
  "agitated",
  "amazing",
  "angry",
  "awesome",
  "beautiful",
  "blissful",
  "bold",
  "boring",
  "brave",
  "busy",
  "charming",
  "clever",
  "compassionate",
  "competent",
  "condescending",
  "confident",
  "cool",
  "cranky",
  "crazy",
  "dazzling",
  "determined",
  "distracted",
  "dreamy",
  "eager",
  "ecstatic",
  "elastic",
  "elated",
  "elegant",
  "eloquent",
  "epic",
  "exciting",
  "fervent",
  "festive",
  "flamboyant",
  "focused",
  "friendly",
  "frosty",
  "funny",
  "gallant",
  "gifted",
  "goofy",
  "gracious",
  "great",
  "happy",
  "hardcore",
  "heuristic",
  "hopeful",
  "hungry",
  "infallible",
  "inspiring",
  "intelligent",
  "interesting",
  "jolly",
  "jovial",
  "keen",
  "kind",
  "laughing",
  "loving",
  "lucid",
  "magical",
  "modest",
  "musing",
  "mystifying",
  "naughty",
  "nervous",
  "nice",
  "nifty",
  "nostalgic",
  "objective",
  "optimistic",
  "peaceful",
  "pedantic",
  "pensive",
  "practical",
  "priceless",
  "quirky",
  "quizzical",
  "recursing",
  "relaxed",
  "reverent",
  "romantic",
  "sad",
  "serene",
  "sharp",
  "silly",
  "sleepy",
  "stoic",
  "strange",
  "stupefied",
  "suspicious",
  "sweet",
  "tender",
  "thirsty",
  "trusting",
  "unruffled",
  "upbeat",
  "vibrant",
  "vigilant",
  "vigorous",
  "wizardly",
  "wonderful",
  "xenodochial",
  "youthful",
  "zealous",
  "zen"
] as const

const MOBY_RIGHT = [
  "agnesi",
  "albattani",
  "allen",
  "almeida",
  "antonelli",
  "archimedes",
  "ardinghelli",
  "aryabhata",
  "austin",
  "babbage",
  "banach",
  "banzai",
  "bardeen",
  "bartik",
  "bassi",
  "beaver",
  "bell",
  "benz",
  "bhabha",
  "bhaskara",
  "black",
  "blackburn",
  "blackwell",
  "bohr",
  "booth",
  "borg",
  "bose",
  "bouman",
  "boyd",
  "brahmagupta",
  "brattain",
  "brown",
  "buck",
  "burnell",
  "cannon",
  "carson",
  "cartwright",
  "carver",
  "cerf",
  "chandrasekhar",
  "chaplygin",
  "chatelet",
  "chatterjee",
  "chaum",
  "chebyshev",
  "clarke",
  "cohen",
  "colden",
  "cori",
  "cray",
  "curie",
  "curran",
  "darwin",
  "davinci",
  "dewdney",
  "dhawan",
  "diffie",
  "dijkstra",
  "dirac",
  "driscoll",
  "dubinsky",
  "easley",
  "edison",
  "einstein",
  "elbakyan",
  "elgamal",
  "elion",
  "ellis",
  "engelbart",
  "euclid",
  "euler",
  "faraday",
  "feistel",
  "fermat",
  "fermi",
  "feynman",
  "franklin",
  "gagarin",
  "galileo",
  "galois",
  "ganguly",
  "gates",
  "gauss",
  "germain",
  "goldberg",
  "goldstine",
  "goldwasser",
  "golick",
  "goodall",
  "gould",
  "greider",
  "grothendieck",
  "haibt",
  "hamilton",
  "haslett",
  "hawking",
  "heisenberg",
  "hellman",
  "hermann",
  "herschel",
  "hertz",
  "heyrovsky",
  "hodgkin",
  "hofstadter",
  "hoover",
  "hopper",
  "hugle",
  "hypatia",
  "ishizaka",
  "jackson",
  "jang",
  "jemison",
  "jennings",
  "jepsen",
  "johnson",
  "joliot",
  "jones",
  "kalam",
  "kapitsa",
  "kare",
  "keldysh",
  "keller",
  "kepler",
  "khayyam",
  "khorana",
  "kilby",
  "kirch",
  "knuth",
  "kowalevski",
  "lalande",
  "lamarr",
  "lamport",
  "leakey",
  "leavitt",
  "lederberg",
  "lehmann",
  "lewin",
  "lichterman",
  "liskov",
  "lovelace",
  "lumiere",
  "mahavira",
  "margulis",
  "matsumoto",
  "maxwell",
  "mayer",
  "mccarthy",
  "mcclintock",
  "mclaren",
  "mclean",
  "mcnulty",
  "meitner",
  "mendel",
  "mendeleev",
  "meninsky",
  "merkle",
  "mestorf",
  "mirzakhani",
  "montalcini",
  "moore",
  "morse",
  "moser",
  "murdock",
  "napier",
  "nash",
  "neumann",
  "newton",
  "nightingale",
  "nobel",
  "noether",
  "northcutt",
  "noyce",
  "panini",
  "pare",
  "pascal",
  "pasteur",
  "payne",
  "perlman",
  "pike",
  "poincare",
  "poitras",
  "proskuriakova",
  "ptolemy",
  "raman",
  "ramanujan",
  "rhodes",
  "ride",
  "ritchie",
  "robinson",
  "roentgen",
  "rosalind",
  "rubin",
  "saha",
  "sammet",
  "sanderson",
  "satoshi",
  "shamir",
  "shannon",
  "shaw",
  "shirley",
  "shockley",
  "shtern",
  "sinoussi",
  "snyder",
  "solomon",
  "spence",
  "stonebraker",
  "sutherland",
  "swanson",
  "swartz",
  "swirles",
  "taussig",
  "tesla",
  "tharp",
  "thompson",
  "torvalds",
  "tu",
  "turing",
  "varahamihira",
  "vaughan",
  "villani",
  "visvesvaraya",
  "volhard",
  "wescoff",
  "wilbur",
  "wiles",
  "williams",
  "williamson",
  "wilson",
  "wing",
  "wozniak",
  "wright",
  "wu",
  "yalow",
  "yonath",
  "zhukovsky"
] as const

function parseBoolean(value: string | null): boolean | undefined {
  if (!value) return undefined

  const normalizedValue = value.trim().toLowerCase()
  if (TRUE_VALUES.has(normalizedValue)) return true
  if (FALSE_VALUES.has(normalizedValue)) return false
  return undefined
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getMobyPair(seed: string): {
  left: string
  right: string
  suffix: number
} {
  const left = MOBY_LEFT[hashString(`${seed}:left`) % MOBY_LEFT.length]
  let right = MOBY_RIGHT[hashString(`${seed}:right`) % MOBY_RIGHT.length]

  // Keep Docker's in-joke exclusion.
  if (left === "boring" && right === "wozniak") {
    right = MOBY_RIGHT[(MOBY_RIGHT.indexOf(right) + 1) % MOBY_RIGHT.length]
  }

  return {
    left,
    right,
    suffix: hashString(`${seed}:suffix`) % 10
  }
}

function getDisplayAlias(seed: string): string {
  const pair = getMobyPair(seed)
  return `${toTitleCase(pair.left)} ${toTitleCase(pair.right)}`
}

function getSlugAlias(seed: string): string {
  const pair = getMobyPair(seed)
  return `${pair.left}-${pair.right}${pair.suffix}`
}

function getSingleWordAlias(seed: string): string {
  const pair = getMobyPair(seed)
  return toTitleCase(pair.right)
}

function getInitialAlias(seed: string): string {
  const pair = getMobyPair(seed)
  return pair.right.charAt(0).toUpperCase() || "A"
}

function extractTld(domain: string): string {
  const parts = domain.toLowerCase().split(".").filter(Boolean)
  if (parts.length < 2) return "com"
  const last = parts[parts.length - 1]
  const secondLast = parts[parts.length - 2]

  if (last.length === 2 && secondLast.length <= 3 && parts.length >= 3) {
    return `${secondLast}.${last}`
  }
  return last
}

function anonymizeEmail(value: string): string {
  const localPart = getSlugAlias(`${value}:local`)
  const domainPart = getSlugAlias(`${value}:domain`)
  return `${localPart}@${domainPart}.com`
}

function anonymizeDomain(value: string): string {
  return `${getSlugAlias(value)}.${extractTld(value)}`
}

function anonymizeGeneric(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return value

  if (EMAIL_REGEX.test(trimmed)) {
    EMAIL_REGEX.lastIndex = 0
    return trimmed.replace(EMAIL_REGEX, anonymizeEmail)
  }
  EMAIL_REGEX.lastIndex = 0

  if (DOMAIN_REGEX.test(trimmed)) {
    DOMAIN_REGEX.lastIndex = 0
    return trimmed.replace(DOMAIN_REGEX, anonymizeDomain)
  }
  DOMAIN_REGEX.lastIndex = 0

  return getDisplayAlias(trimmed)
}

export function MarketingScreenshotMode() {
  useEffect(() => {
    const queryParamValue = parseBoolean(
      new URL(window.location.href).searchParams.get(
        MARKETING_SCREENSHOT_QUERY_PARAM
      )
    )
    const storageValue = parseBoolean(
      window.localStorage.getItem(MARKETING_SCREENSHOT_STORAGE_KEY)
    )

    let isEnabled = MARKETING_SCREENSHOT_MODE_DEFAULT
    if (storageValue !== undefined) {
      isEnabled = storageValue
    }

    if (queryParamValue !== undefined) {
      isEnabled = queryParamValue
      window.localStorage.setItem(
        MARKETING_SCREENSHOT_STORAGE_KEY,
        String(queryParamValue)
      )
    }

    document.documentElement.dataset.marketingScreenshotMode = isEnabled
      ? "true"
      : "false"

    if (!isEnabled) return

    const processedTextNodes = new WeakSet<Text>()

    const anonymizeElementText = (
      element: Element,
      attrName:
        | "data-anonymize"
        | "data-anonymize-domain"
        | "data-anonymize-single"
        | "data-anonymize-initial"
    ) => {
      const el = element as HTMLElement
      const datasetKey =
        attrName === "data-anonymize"
          ? "anonymizeOriginal"
          : attrName === "data-anonymize-domain"
            ? "anonymizeDomainOriginal"
            : attrName === "data-anonymize-single"
              ? "anonymizeSingleOriginal"
              : "anonymizeInitialOriginal"

      if (el.dataset[datasetKey] === undefined) {
        el.dataset[datasetKey] = el.textContent ?? ""
      }

      const originalValue = el.dataset[datasetKey] ?? ""
      const nextValue =
        attrName === "data-anonymize-domain"
          ? originalValue.replace(DOMAIN_REGEX, anonymizeDomain)
          : attrName === "data-anonymize-single"
            ? getSingleWordAlias(originalValue.trim() || "appbox")
            : attrName === "data-anonymize-initial"
              ? getInitialAlias(originalValue.trim() || "user")
              : anonymizeGeneric(originalValue)

      if (el.textContent !== nextValue) {
        el.textContent = nextValue
      }
    }

    const anonymizeInputElement = (element: Element) => {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement
        )
      )
        return

      if (!element.dataset.anonymizeInputOriginalValue) {
        element.dataset.anonymizeInputOriginalValue = element.value
      }
      if (!element.dataset.anonymizeInputOriginalPlaceholder) {
        element.dataset.anonymizeInputOriginalPlaceholder =
          element.placeholder ?? ""
      }

      element.value = anonymizeGeneric(
        element.dataset.anonymizeInputOriginalValue
      )
      element.placeholder = anonymizeGeneric(
        element.dataset.anonymizeInputOriginalPlaceholder
      )
    }

    const anonymizeDomainTextNodes = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

      let currentNode = walker.nextNode()
      while (currentNode) {
        const textNode = currentNode as Text
        const parent = textNode.parentElement

        if (
          parent &&
          !processedTextNodes.has(textNode) &&
          !parent.closest("[data-anonymize], [data-anonymize-domain]") &&
          !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
        ) {
          const sourceValue = textNode.nodeValue ?? ""
          const nextValue = sourceValue
            .replace(EMAIL_REGEX, anonymizeEmail)
            .replace(DOMAIN_REGEX, anonymizeDomain)

          if (nextValue !== sourceValue) {
            textNode.nodeValue = nextValue
          }

          processedTextNodes.add(textNode)
        }

        currentNode = walker.nextNode()
      }
    }

    const applyAnonymization = (root: ParentNode) => {
      if (root instanceof Element && root.matches("[data-anonymize]")) {
        anonymizeElementText(root, "data-anonymize")
      }
      root
        .querySelectorAll("[data-anonymize]")
        .forEach((el) => anonymizeElementText(el, "data-anonymize"))

      if (root instanceof Element && root.matches("[data-anonymize-domain]")) {
        anonymizeElementText(root, "data-anonymize-domain")
      }
      root
        .querySelectorAll("[data-anonymize-domain]")
        .forEach((el) => anonymizeElementText(el, "data-anonymize-domain"))

      if (root instanceof Element && root.matches("[data-anonymize-single]")) {
        anonymizeElementText(root, "data-anonymize-single")
      }
      root
        .querySelectorAll("[data-anonymize-single]")
        .forEach((el) => anonymizeElementText(el, "data-anonymize-single"))

      if (root instanceof Element && root.matches("[data-anonymize-initial]")) {
        anonymizeElementText(root, "data-anonymize-initial")
      }
      root
        .querySelectorAll("[data-anonymize-initial]")
        .forEach((el) => anonymizeElementText(el, "data-anonymize-initial"))

      if (root instanceof Element && root.matches("[data-anonymize-input]")) {
        anonymizeInputElement(root)
      }
      root
        .querySelectorAll("[data-anonymize-input]")
        .forEach((el) => anonymizeInputElement(el))

      anonymizeDomainTextNodes(root)
    }

    applyAnonymization(document.body)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const parent = mutation.target.parentNode
          if (parent) applyAnonymization(parent as ParentNode)
          continue
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            applyAnonymization(node)
          } else if (node instanceof Text && node.parentNode) {
            applyAnonymization(node.parentNode as ParentNode)
          }
        })
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => observer.disconnect()
  }, [])

  return null
}
