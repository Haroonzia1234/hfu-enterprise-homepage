# Content facts

Everything the homepage may state about HFU Enterprise Ltd. Source: hfuenterprise.com (home, about,
services, our-fleet and contact pages). Anything not listed here must not be stated.

## Company

- Name: HFU Enterprise Ltd (the footer of the live site says "HFU Enterprises"; use "HFU Enterprise Ltd").
- Tagline: Where speed meets reliability.
- Mission line: "We go the extra mile so you don't have to."
- Over seven years of experience in the courier and freight industry. Grew from a regional
  delivery service into a full-spectrum logistics partner.
- Serves clients across the UK and internationally. Business (B2B) and domestic (B2C) customers.
- Office hours: 24/7, seven days a week.
- Phone: 0161 509 6152 and 07576 206225. Email: info@hfuenterprise.com.
- Address on the contact page: 880 Manchester Road, Bradford BD5 8DH.
- Service locations listed in the footer: Manchester, Salford, Stockport, Trafford, Didsbury, Chorlton.
- Stats shown on the live site: 200+ trusted clients, 7+ years of experience, 10K+ jobs successfully completed.
- Promise: a comprehensive, tailored quote in about 15 minutes. "No waiting for email."
- Commitment: "We promise to deliver what we say, when we say it."
- Quote form fields on the live site: name, phone, email, delivery type (Same Day, Next Day,
  Flexible), collection from, delivery to, collection date, collection time (4:15 am to 11:45 pm in
  15 minute steps), vehicle type, instructions.
- Real time tracking and updates are mentioned for direct deliveries. Tracking options are mentioned
  for pallet delivery. Advanced tracking tools are mentioned for express and overnight.
- "A single point of contact managing your logistics challenges so you can focus on building your business."
- "Direct delivery from you to your customers": delivery directly from your warehouse, time sensitive
  and bulk deliveries for businesses across the UK, skipping the middleman.

## Services (seven)

Same Day Courier, Scheduled Delivery, Express and Overnight, International Shipping, Warehouse
Storage and Fulfilment, Pallet Delivery, Home Moves. Full copy in `js/data/services.js`.

## Fleet (eight vehicles)

Dimensions in centimetres, payload in kilograms, standard UK pallets carried. Luton and the three
trucks list Box, Curtain and Tail lift options. Full data in `js/data/fleet.js`.

| Vehicle                          | L   | W   | H   | Payload | Pallets |
| -------------------------------- | --- | --- | --- | ------- | ------- |
| Small Van (SV)                   | 120 | 100 | 100 | 450     | 1       |
| Short Wheel Base Van (SWB)       | 240 | 100 | 120 | 800     | 2       |
| Long Wheel Base Van (LWB)        | 340 | 120 | 180 | 1200    | 3       |
| Extra-Long Wheel Base Van (XLWB) | 420 | 120 | 180 | 1000    | 4       |
| Luton Van (LV)                   | 400 | 200 | 200 | 1000    | 6       |
| 7.5 Tonne (7.5T)                 | 600 | 240 | 220 | 2500    | 10      |
| 18 Tonne (18T)                   | 700 | 240 | 250 | 9000    | 14      |
| 26 Tonne (26T)                   | 800 | 240 | 250 | 15000   | 16      |

## Why choose HFU

Speed without compromise. Flexibility built in. Global reach, local touch. Customer-first service.
Reliable and secure logistics. Competitive prices. Above and beyond service. Innovation at the core.

## Reviews

Five testimonials from the live site (verbatim text, names shortened to first name and initial) in
`js/data/reviews.js`. Only one review mentions a star rating, so no star ratings are displayed.

## FAQs

Eight questions in `js/data/faqs.js`, all answered from the live site copy.

## Not available on the live site, so not claimed

Insurance cover amounts, accreditations or memberships, driver vetting claims, prices, named
clients, awards, review scores, delivery time guarantees, opening of a tracking portal.

## Inconsistencies found on the live site

1. Quote form: Small Van 350 kg, LWB 1000 kg. Fleet page: 450 kg and 1200 kg. This build uses the fleet page.
2. Phone number appears as 0757 6206225 on the contact page and 07576 206225 elsewhere. This build uses 07576 206225.
3. The logo tagline reads "WHERE SPEED MEETS RELIABLITY" (missing an I). This build typesets the wordmark without the tagline.
4. The contact page lists a Bradford address while the service locations are all in Greater Manchester.
5. The live homepage news section contains placeholder text and a hidden client logo strip, so neither is used.
