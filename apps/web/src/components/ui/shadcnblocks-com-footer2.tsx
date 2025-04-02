import React, { SVGProps } from "react"

/** This is a proper React component that returns <svg> */
function DefaultLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 50 50" width="50" height="50">
      <circle cx="25" cy="25" r="20" fill="blue" />
    </svg>
  )
}

interface MenuItem {
  title: string
  links: {
    text: string
    url: string
    external?: boolean
  }[]
}

interface Footer2Props {
  logo?: {
    url: string
    src: React.ComponentType<SVGProps<SVGSVGElement>>
    alt: string
    title: string
  }
  tagline?: string
  menuItems?: MenuItem[]
  copyright?: string
  bottomLinks?: {
    text: string
    url: string
    external?: boolean
  }[]
}

const Footer2 = ({
  logo = {
    /** Instead of rendering <svg> directly, pass the DefaultLogo component */
    src: DefaultLogo,
    alt: "appbox",
    title: "appbox",
    url: "https://www.appbox.co",
  },
  tagline = "Components made easy.",
  menuItems = [
    {
      title: "Product",
      links: [
        { text: "Overview", url: "#" },
        { text: "Pricing", url: "#" },
        { text: "Marketplace", url: "#" },
        { text: "Features", url: "#" },
        { text: "Integrations", url: "#" },
        { text: "Pricing", url: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About", url: "#" },
        { text: "Team", url: "#" },
        { text: "Blog", url: "#" },
        { text: "Careers", url: "#" },
        { text: "Contact", url: "#" },
        { text: "Privacy", url: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Help", url: "#" },
        { text: "Sales", url: "#" },
        { text: "Advertise", url: "#" },
      ],
    },
    {
      title: "Social",
      links: [
        { text: "Twitter", url: "#" },
        { text: "Instagram", url: "#" },
        { text: "LinkedIn", url: "#" },
      ],
    },
  ],
  copyright = "© 2024 Copyright. All rights reserved.",
  bottomLinks = [
    { text: "Terms and Conditions", url: "#" },
    { text: "Privacy Policy", url: "#" },
  ],
}: Footer2Props) => {
  return (
    <section className="py-32">
      <div className="container">
        <footer>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 lg:justify-start">
                <a href={logo.url}>
                  {/* Now logo.src is definitely a component, so <logo.src /> is valid */}
                  <logo.src className="size-10" />
                </a>
                <p className="text-xl font-semibold">{logo.title}</p>
              </div>
              <p className="mt-4 font-bold">{tagline}</p>
            </div>
            {menuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="text-muted-foreground space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium"
                    >
                      <a
                        href={link.url}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noreferrer noopener" : undefined}
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-24 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium md:flex-row md:items-center">
            <p>{copyright}</p>
            <ul className="flex gap-4">
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="hover:text-primary underline">
                  <a
                    href={link.url}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer noopener" : undefined}
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  )
}

export { Footer2 }
