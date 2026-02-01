export type Service = {
      id: string;
      title: string;
      description: string;
      price: string;
      image: string;
    };
    
    export const siteData = {
      businessName: "Coastal Home Management 30A",
      serviceArea: "Inlet Beach, 30A Florida",
      startingPrice: "~$200/month",
      contactEmail: "coastalhomemanagement30a@gmail.com",
    
      services: [
        {
          id: "home-care",
          title: "Second Home Oversight",
          description:
            "Scheduled inspections ensuring your property is protected year-round.",
          price: "Starting at ~$200/month",
          image: "/service1.png",
        },
        {
          id: "mail",
          title: "Mail & Property Care",
          description:
            "Discreet handling of mail, packages, and on-site details.",
          price: "Included in care plans",
          image: "/service2.png",
        },
        {
          id: "contractor",
          title: "Contractor Coordination",
          description:
            "On-site supervision and trusted vendor coordination.",
          price: "Included in care plans",
          image: "/service3.png",
        },
      ],
    };
    