# Done and Dusted Hertfordshire

**Premier Cleaning Services**

---

## Project Overview

### About the Company
**Done and Dusted Hertfordshire** is a locally‑owned cleaning‑service business based in Hertfordshire, UK. Founded by Megan Sciorio, the company focuses on delivering reliable, thorough, and eco‑friendly cleaning solutions for residential and commercial clients. Their services include domestic cleaning, commercial cleaning, deep cleans, end‑of‑tenancy cleaning, Airbnb turnovers, and HMO maintenance.

**Mission:** Provide a spotless, healthy environment for homes and workplaces while maintaining the highest standards of professionalism, trust, and customer satisfaction.

**Values:**
- **Reliability:** Punctual, consistent service you can count on.
- **Quality:** Trained, background‑checked, insured staff using premium equipment.
- **Eco‑Friendliness:** Optional environmentally safe cleaning products.
- **Customer‑Centric:** Transparent pricing, loyalty rewards, and responsive support.

**Location:** Hertfordshire, United Kingdom (serving the surrounding area).

**Contact:**
- Phone: 01923 549026 / 07782 550292
- Email: info@doneanddusted.co.uk
- Instagram: @doneanddustedhertfordshire_

---
This repository contains a static website for **Done and Dusted Hertfordshire**, a cleaning‑service business offering domestic, commercial, deep‑clean, end‑of‑tenancy, Airbnb, and HMO cleaning. The site is built with plain **HTML**, **CSS**, and **JavaScript** – no frameworks or React are used.

---

## Features & Sections (scraped from `index.html`)

| Section | Description |
|---------|-------------|
| **Hero** | Large headline *“Professional Cleaning for Your Peace of Mind”* with CTA buttons *Get a Quote* and *View Services*. Background features a blurred, high-quality image of a clean living space.
| **Services** | Six service cards (Domestic, Commercial, Deep Clean, End of Tenancy, Airbnb, HMO) each with an icon, image and short description.
| **Why Choose Us?** | Modern card-based grid layout highlighting key features: Experienced & Vetted Staff, Eco‑Friendly Products, 100% Satisfaction, Competitive Pricing.
| **Founder** | Founder profile with photo, quote, and name.
| **Loyalty Program** | Collect 5 cleans → 10 % off next service; visual stamp progress.
| **Testimonials** | Three customer testimonials (Sarah, Mike, Emma) with star rating and photos.
| **Booking Form** | Form collecting name, email, phone, service, date, and additional details.
| **Contact** | Phone numbers, email address, Instagram & Facebook links, and an embedded Google Map.
| **Footer** | Quick navigation links, admin login, social icons, copyright.

---

## Meta Information
- **Title:** `Done and Dusted Hertfordshire | Premier Cleaning Services`
- **Meta Description:** `Professional cleaning services in Hertfordshire. Domestic, commercial, deep cleaning, EOT, AirBnB, and HMO. Book your service today!`
- **Favicon:** Not provided (default browser icon).

---

## Asset Overview (file tree)
```
.
├── admin/
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── dashboard.css
│   └── index.html
├── assets/
│   ├── dusted-assistant.css
│   ├── dusted-assistant.js
│   └── images/
│       ├── airbnb-cleaning.jpg
│       ├── commercial-cleaning.jpg
│       ├── commercial-cleaning.png
│       ├── deep-clean.png
│       ├── domestic-cleaning.png
│       ├── end-of-tenancy.jpg
│       ├── end-of-tenancy.png
│       ├── founder-megan.jpg
│       ├── gallery-bathroom.jpg
│       ├── gallery-detail.png
│       ├── gallery-kitchen-detail.jpg
│       ├── gallery-kitchen.png
│       ├── gallery-living-room.jpg
│       ├── gallery-office.png
│       ├── hmo-maintenance.jpg
│       ├── testimonial-emma.jpg
│       ├── testimonial-mike.jpg
│       ├── testimonial-sarah.png
│       └── test… (other images)
├── download_images.ps1   # PowerShell helper script (not used by the site)
├── fix_style.py          # Python helper script (not used by the site)
├── index.html            # Main page (see above for full markup)
├── script.js             # Site‑wide JavaScript
├── style.css             # Main stylesheet (layout, colors, responsive design)
└── README.md             # **This file**
```

---

## Installation & Local Development
1. **Prerequisites** – Node.js (for `http-server`).
2. **Install http‑server** (if not already installed):
   ```bash
   npx -y http-server@latest ./ -p 8000
   ```
3. **Run the site** – The command above starts a local server on `http://localhost:8000/`.
4. Open the URL in a browser to view the site.

---

## Usage
- Navigate using the top navigation bar (Home, Services, About, Loyalty, Contact, Book Now).
- The **Book Now** button scrolls to the booking form.
- All interactive elements are plain JavaScript – no build step required.

---

## Contributing
Feel free to fork the repository and submit pull requests. Typical contributions might include:
- Updating the design (colors, typography, layout).
- Adding new service cards or testimonials.
- Improving accessibility or SEO metadata.

---

## License
The project is provided **as‑is** for educational purposes. No explicit license is defined.

---

*Generated by Antigravity – a powerful AI coding assistant.*
