// Server-side function to fetch plans data
import { PlansData } from "@/components/ui/plans"

// Set to true to use mock data for testing Black Friday promotions
const USE_MOCK_DATA = false

const MOCK_PLANS_DATA: PlansData = {
  data: [
    {
      sort: 1,
      description: "Entry-level appbox pricing for beginners and new users.",
      slug: "beginner-pricing",
      title: "Beginner Appbox Pricing",
      short_title: "Beginner Pricing",
      plans: [
        {
          sort: 1,
          product_id: 83,
          title: "BG-2000",
          short_title: "BG-2000",
          storage_capacity: "2TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 2,
          connection_speed: "10Gbps",
          excluded_app_categories: {
            "8": "Streaming",
            "9": "Stacks",
            "10": "CMS",
            "11": "Operating System",
            "12": "Webserver"
          },
          resources: "1x",
          available: true,
          promotion: {
            active: true,
            promo_code: "APPBOX30",
            title: "30% Off for 3 Months",
            description: "Save 30% on your first 3 months",
            discount_percentage: 30,
            duration_months: 3,
            applies_to: ["monthly"],
            discount_type: "percentage",
            auto_apply: true,
            promotional_pricing: {
              EUR: {
                monthly: {
                  original_per_month: "€10.99",
                  discounted_per_month: "€7.69",
                  savings_per_month: "€3.30",
                  total_savings: "€9.90"
                }
              }
            },
            terms:
              "Discount applies to first 3 months only. Regular pricing applies after promotional period.",
            expiry_date: null,
            badge_text: "SAVE 30%"
          },
          pricing: {
            EUR: {
              monthly: {
                per_month: "€10.99",
                billed: "€10.99"
              },
              quarterly: {
                per_month: "€10.44",
                billed: "€31.32"
              },
              semiannually: {
                per_month: "€9.89",
                billed: "€59.35"
              },
              annually: {
                per_month: "€9.34",
                billed: "€112.10"
              }
            }
          }
        },
        {
          sort: 2,
          product_id: 84,
          title: "BG-3000",
          short_title: "BG-3000",
          storage_capacity: "3TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 2,
          connection_speed: "10Gbps",
          excluded_app_categories: {
            "8": "Streaming",
            "9": "Stacks",
            "10": "CMS",
            "11": "Operating System",
            "12": "Webserver"
          },
          resources: "1x",
          available: true,
          promotion: {
            active: true,
            promo_code: "APPBOX30",
            title: "30% Off for 3 Months",
            description: "Save 30% on your first 3 months",
            discount_percentage: 30,
            duration_months: 3,
            applies_to: ["monthly"],
            discount_type: "percentage",
            auto_apply: true,
            promotional_pricing: {
              EUR: {
                monthly: {
                  original_per_month: "€16.19",
                  discounted_per_month: "€11.33",
                  savings_per_month: "€4.86",
                  total_savings: "€14.58"
                }
              }
            },
            terms:
              "Discount applies to first 3 months only. Regular pricing applies after promotional period.",
            expiry_date: null,
            badge_text: "SAVE 30%"
          },
          pricing: {
            EUR: {
              monthly: {
                per_month: "€16.19",
                billed: "€16.19"
              },
              quarterly: {
                per_month: "€15.38",
                billed: "€46.14"
              },
              semiannually: {
                per_month: "€14.57",
                billed: "€87.43"
              },
              annually: {
                per_month: "€13.76",
                billed: "€165.14"
              }
            }
          }
        }
      ],
      icon: {
        type: "image/svg+xml",
        width: null,
        height: null
      }
    },
    {
      sort: 2,
      description:
        "Standard appbox pricing for users who need more storage and apps.",
      slug: "appbox-pricing",
      title: "Appbox Pricing",
      short_title: "Appbox Pricing",
      plans: [
        {
          sort: 1,
          product_id: 68,
          title: "NG-3500",
          short_title: "NG-3500",
          storage_capacity: "3.5TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 10,
          connection_speed: "25Gbps",
          excluded_app_categories: {},
          resources: "1x",
          available: true,
          promotion: {
            active: true,
            promo_code: "APPBOX30",
            title: "30% Off for 3 Months",
            description: "Save 30% on your first 3 months",
            discount_percentage: 30,
            duration_months: 3,
            applies_to: ["monthly"],
            discount_type: "percentage",
            auto_apply: true,
            promotional_pricing: {
              EUR: {
                monthly: {
                  original_per_month: "€13.95",
                  discounted_per_month: "€9.77",
                  savings_per_month: "€4.19",
                  total_savings: "€12.56"
                }
              }
            },
            terms:
              "Discount applies to first 3 months only. Regular pricing applies after promotional period.",
            expiry_date: null,
            badge_text: "SAVE 30%"
          },
          pricing: {
            EUR: {
              monthly: {
                per_month: "€13.95",
                billed: "€13.95"
              },
              quarterly: {
                per_month: "€13.25",
                billed: "€39.76"
              },
              semiannually: {
                per_month: "€12.56",
                billed: "€75.33"
              },
              annually: {
                per_month: "€11.86",
                billed: "€142.29"
              }
            }
          }
        },
        {
          sort: 3,
          product_id: 70,
          title: "NG-6000",
          short_title: "NG-6000",
          storage_capacity: "6TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 14,
          connection_speed: "25Gbps",
          excluded_app_categories: {},
          resources: "1.4x",
          recommended: true,
          available: true,
          promotion: {
            active: true,
            promo_code: "APPBOX30",
            title: "30% Off for 3 Months",
            description: "Save 30% on your first 3 months",
            discount_percentage: 30,
            duration_months: 3,
            applies_to: ["monthly"],
            discount_type: "percentage",
            auto_apply: true,
            promotional_pricing: {
              EUR: {
                monthly: {
                  original_per_month: "€24.45",
                  discounted_per_month: "€17.12",
                  savings_per_month: "€7.34",
                  total_savings: "€22.01"
                }
              }
            },
            terms:
              "Discount applies to first 3 months only. Regular pricing applies after promotional period.",
            expiry_date: null,
            badge_text: "SAVE 30%"
          },
          pricing: {
            EUR: {
              monthly: {
                per_month: "€24.45",
                billed: "€24.45"
              },
              quarterly: {
                per_month: "€23.23",
                billed: "€69.68"
              },
              semiannually: {
                per_month: "€22.01",
                billed: "€132.03"
              },
              annually: {
                per_month: "€20.78",
                billed: "€249.39"
              }
            }
          }
        }
      ],
      icon: {
        type: "image/svg+xml",
        width: null,
        height: null
      }
    },
    {
      sort: 3,
      description:
        "Dedicated and semi-dedicated appbox pricing options, for enterprises and power users.",
      slug: "dedicated-pricing",
      title: "Dedicated & Semi-Dedicated Appbox Pricing",
      short_title: "Dedicated Pricing",
      plans: [
        {
          sort: 1,
          product_id: 75,
          title: "NG-18000",
          short_title: "NG-18000",
          storage_capacity: "18TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 30,
          connection_speed: "25Gbps",
          excluded_app_categories: {},
          resources: "2x",
          raid: "X",
          number_of_disks: 1,
          available: true,
          promotion: {
            active: true,
            promo_code: "APPBOX30",
            title: "30% Off for 3 Months",
            description: "Save 30% on your first 3 months",
            discount_percentage: 30,
            duration_months: 3,
            applies_to: ["monthly"],
            discount_type: "percentage",
            auto_apply: true,
            promotional_pricing: {
              EUR: {
                monthly: {
                  original_per_month: "€67.99",
                  discounted_per_month: "€47.59",
                  savings_per_month: "€20.40",
                  total_savings: "€61.19"
                }
              }
            },
            terms:
              "Discount applies to first 3 months only. Regular pricing applies after promotional period.",
            expiry_date: null,
            badge_text: "SAVE 30%"
          },
          pricing: {
            EUR: {
              monthly: {
                per_month: "€67.99",
                billed: "€67.99"
              },
              quarterly: {
                per_month: "€67.99",
                billed: "€203.97"
              },
              semiannually: {
                per_month: "€67.99",
                billed: "€407.94"
              },
              annually: {
                per_month: "€67.99",
                billed: "€815.88"
              }
            }
          }
        }
      ],
      icon: {
        type: "image/svg+xml",
        width: null,
        height: null
      }
    }
  ]
}

export async function getPlans(): Promise<PlansData> {
  // Return mock data for testing
  if (USE_MOCK_DATA) {
    console.log("🎭 Using mock data with Black Friday promotions")
    return Promise.resolve(MOCK_PLANS_DATA)
  }

  // Real API call
  try {
    const response = await fetch("https://billing.appbox.co/feeds/plans.php", {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error("Failed to fetch plans data")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching plans data:", error)
    throw error
  }
}
