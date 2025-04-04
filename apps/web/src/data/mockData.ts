import type { PlansData } from "@/components/ui/plans"

export const mockData: PlansData = {
  data: [
    // Group 1: Beginner Appbox Pricing
    {
      sort: 1,
      description: "Entry-level appbox pricing for beginners and new users.",
      slug: "beginner-pricing",
      title: "Beginner Appbox Pricing",
      short_title: "Beginner Pricing",
      plans: [
        {
          sort: 1,
          title: "NG-2000",
          short_title: "NG-2000",
          storage_capacity: "2TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 5,
          connection_speed: "10Gbps",
          resources: "1x",
          users_per_disk: 5,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€10.99",
                billed: "€10.99"
              },
              quarterly: {
                per_month: "€10.99",
                billed: "€31.32"
              },
              semiannually: {
                per_month: "€10.44",
                billed: "€62.64"
              },
              annually: {
                per_month: "€10.58",
                billed: "€126.93"
              }
            }
          }
        },
        {
          sort: 2,
          title: "NG-4000",
          short_title: "NG-4000",
          storage_capacity: "4TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 5,
          connection_speed: "10Gbps",
          resources: "1x",
          users_per_disk: 5,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€16.19",
                billed: "€16.19"
              },
              quarterly: {
                per_month: "€16.19",
                billed: "€46.14"
              },
              semiannually: {
                per_month: "€15.38",
                billed: "€92.28"
              },
              annually: {
                per_month: "€15.58",
                billed: "€186.99"
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
    // Group 2: Standard Appbox Pricing
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
          title: "NG-3500",
          short_title: "NG-3500",
          storage_capacity: "3.5TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 10,
          connection_speed: "25Gbps",
          resources: "1x",
          users_per_disk: 5,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€13.95",
                billed: "€13.95"
              },
              quarterly: {
                per_month: "€13.95",
                billed: "€39.76"
              },
              semiannually: {
                per_month: "€13.25",
                billed: "€79.52"
              },
              annually: {
                per_month: "€13.43",
                billed: "€161.12"
              }
            }
          }
        },
        {
          sort: 1,
          title: "NG-4500",
          short_title: "NG-4500",
          storage_capacity: "4.5TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 12,
          connection_speed: "25Gbps",
          resources: "1.2x",
          users_per_disk: 4,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€14.37",
                billed: "€14.37"
              },
              quarterly: {
                per_month: "€14.37",
                billed: "€43.11"
              },
              semiannually: {
                per_month: "€13.75",
                billed: "€41.25"
              },
              annually: {
                per_month: "€13.3",
                billed: "€159.6"
              }
            }
          }
        },
        {
          sort: 2,
          title: "NG-6000",
          short_title: "NG-6000",
          storage_capacity: "6TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 14,
          connection_speed: "25Gbps",
          resources: "1.4x",
          users_per_disk: 3,
          recommended: true,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€18.69",
                billed: "€18.69"
              },
              quarterly: {
                per_month: "€18.69",
                billed: "€56.07"
              },
              semiannually: {
                per_month: "€17.56",
                billed: "€105.36"
              },
              annually: {
                per_month: "€16.82",
                billed: "€201.84"
              }
            }
          }
        },
        {
          sort: 3,
          title: "NG-8000",
          short_title: "NG-8000",
          storage_capacity: "8TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 16,
          connection_speed: "25Gbps",
          resources: "1.6x",
          users_per_disk: 2,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€24.91",
                billed: "€24.91"
              },
              quarterly: {
                per_month: "€24.91",
                billed: "€74.73"
              },
              semiannually: {
                per_month: "€23.66",
                billed: "€141.96"
              },
              annually: {
                per_month: "€22.42",
                billed: "€269.04"
              }
            }
          }
        },
        {
          sort: 4,
          title: "NG-12000",
          short_title: "NG-12000",
          storage_capacity: "12TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 20,
          connection_speed: "25Gbps",
          resources: "1.8x",
          users_per_disk: 1,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€33.99",
                billed: "€33.99"
              },
              quarterly: {
                per_month: "€33.99",
                billed: "€101.97"
              },
              semiannually: {
                per_month: "€32.29",
                billed: "€193.74"
              },
              annually: {
                per_month: "€30.59",
                billed: "€367.08"
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
    // Group 3: Dedicated & Semi-Dedicated Appbox Pricing
    {
      sort: 3,
      description:
        "Dedicated and semi-dedicated appbox pricing options, for enterprises and power users.",
      slug: "dedicated-pricing",
      title: "Dedicated & Semi-Dedicated Appbox Pricing",
      short_title: "Dedicated Pricing",
      plans: [
        {
          sort: 0,
          title: "NG-18000",
          short_title: "NG-18000",
          storage_capacity: "18TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 30,
          connection_speed: "25Gbps",
          resources: "2x",
          users_per_disk: "Dedicated",
          raid: "X",
          number_of_disks: 1,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€65.57",
                billed: "€65.57"
              },
              quarterly: {
                per_month: "€65.57",
                billed: "€196.71"
              },
              semiannually: {
                per_month: "€62.5",
                billed: "€187.5"
              },
              annually: {
                per_month: "€60",
                billed: "€720"
              }
            }
          }
        },
        {
          sort: 1,
          title: "NG-36000",
          short_title: "NG-36000",
          storage_capacity: "36TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 40,
          connection_speed: "25Gbps",
          resources: "3x",
          users_per_disk: "Dedicated",
          raid: "0/1",
          number_of_disks: 2,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€98.28",
                billed: "€98.28"
              },
              quarterly: {
                per_month: "€98.28",
                billed: "€294.84"
              },
              semiannually: {
                per_month: "€95",
                billed: "€285"
              },
              annually: {
                per_month: "€90",
                billed: "€1080"
              }
            }
          }
        },
        {
          sort: 2,
          title: "NG-54000",
          short_title: "NG-54000",
          storage_capacity: "54TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 50,
          connection_speed: "25Gbps",
          resources: "4x",
          users_per_disk: "Dedicated",
          raid: "0/1/1E",
          number_of_disks: 3,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€147.42",
                billed: "€147.42"
              },
              quarterly: {
                per_month: "€147.42",
                billed: "€442.26"
              },
              semiannually: {
                per_month: "€140.05",
                billed: "€840.30"
              },
              annually: {
                per_month: "€132.68",
                billed: "€1592.16"
              }
            }
          }
        },
        {
          sort: 3,
          title: "NG-72000",
          short_title: "NG-72000",
          storage_capacity: "72TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 60,
          connection_speed: "25Gbps",
          resources: "6x",
          users_per_disk: "Dedicated",
          raid: "0/1/10/5/6",
          number_of_disks: 4,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€196.56",
                billed: "€196.56"
              },
              quarterly: {
                per_month: "€196.56",
                billed: "€589.68"
              },
              semiannually: {
                per_month: "€186.73",
                billed: "€1120.38"
              },
              annually: {
                per_month: "€176.90",
                billed: "€2122.80"
              }
            }
          }
        },
        {
          sort: 4,
          title: "NG-144000",
          short_title: "NG-144000",
          storage_capacity: "144TB",
          storage_type: "HDD",
          traffic: "Unmetered",
          app_slots: 200,
          connection_speed: "25Gbps",
          resources: "8x",
          users_per_disk: "Dedicated",
          raid: "0/1/10/5/6/50/60",
          number_of_disks: 8,
          pricing: {
            EUR: {
              monthly: {
                per_month: "€393.12",
                billed: "€393.12"
              },
              quarterly: {
                per_month: "€393.12",
                billed: "€1179.36"
              },
              semiannually: {
                per_month: "€373.46",
                billed: "€2240.76"
              },
              annually: {
                per_month: "€353.81",
                billed: "€4245.72"
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
