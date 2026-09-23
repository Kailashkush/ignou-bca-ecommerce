/**
 * Demonstration catalogue used by the seed script.
 *
 * Each product references a flat SVG illustration bundled with the client
 * (client/public/products/). Keeping the artwork local means the catalogue
 * renders identically with no network access and no third-party image host,
 * which matters both for offline demonstration and for the viva. The React
 * `ProductCard` still falls back to a generic placeholder if a file is
 * missing.
 */
const img = (name) => `/products/${name}.svg`;

const categories = [
  { name: 'Electronics', description: 'Phones, laptops, audio and everyday gadgets.' },
  { name: 'Fashion', description: 'Clothing, footwear and accessories for every season.' },
  { name: 'Home & Kitchen', description: 'Appliances, cookware and home essentials.' },
  { name: 'Books', description: 'Fiction, academic titles and reference material.' },
  { name: 'Sports & Fitness', description: 'Equipment and gear for training and play.' },
  { name: 'Beauty & Personal Care', description: 'Skincare, grooming and wellness products.' },
];

/** `category` is the category NAME; the seeder resolves it to an ObjectId. */
const products = [
  // --- Electronics ---------------------------------------------------------
  { title: 'Aurora 14 Ultrabook 16GB/512GB', brand: 'Aurora', category: 'Electronics', price: 62990, mrp: 74990, stockCount: 12, rating: 4.5, ratingCount: 318, imageUrl: img('ultrabook'), description: 'A 1.24 kg magnesium-alloy ultrabook with a 14-inch 2.8K OLED display, 16 GB LPDDR5 memory and a 512 GB NVMe solid-state drive. Rated for up to 13 hours of mixed use and charges to 60 per cent in 45 minutes over USB-C.' },
  { title: 'Nimbus Buds Pro Wireless Earphones', brand: 'Nimbus', category: 'Electronics', price: 4499, mrp: 7999, stockCount: 64, rating: 4.3, ratingCount: 1204, imageUrl: img('earbuds'), description: 'Hybrid active noise cancellation rated at 42 dB, six microphones for call clarity, and 32 hours of total playback with the charging case. Supports multipoint pairing across two devices.' },
  { title: 'Vertex 27" QHD 165Hz Gaming Monitor', brand: 'Vertex', category: 'Electronics', price: 21999, mrp: 27999, stockCount: 18, rating: 4.6, ratingCount: 211, imageUrl: img('monitor'), description: 'A 27-inch 2560 x 1440 IPS panel running at 165 Hz with 1 ms grey-to-grey response, 95 per cent DCI-P3 coverage and a fully adjustable stand with VESA mounting.' },
  { title: 'Cobalt 20000mAh Fast Charging Power Bank', brand: 'Cobalt', category: 'Electronics', price: 1899, mrp: 2999, stockCount: 95, rating: 4.2, ratingCount: 876, imageUrl: img('powerbank'), description: 'A 20000 mAh lithium-polymer power bank with 22.5 W USB-A and 20 W USB-C Power Delivery outputs, capable of charging three devices at once with pass-through support.' },
  { title: 'Aurora Smartwatch S3 AMOLED', brand: 'Aurora', category: 'Electronics', price: 8999, mrp: 12999, stockCount: 41, rating: 4.1, ratingCount: 533, imageUrl: img('smartwatch'), description: 'A 1.43-inch AMOLED smartwatch with continuous heart-rate and blood-oxygen monitoring, built-in GPS, 100-plus sport modes and 5 ATM water resistance. Battery lasts up to 10 days.' },
  { title: 'Helix Mechanical Keyboard TKL Hot-Swap', brand: 'Helix', category: 'Electronics', price: 5499, mrp: 6999, stockCount: 27, rating: 4.7, ratingCount: 164, imageUrl: img('keyboard'), description: 'A tenkeyless mechanical keyboard with hot-swappable sockets, a gasket-mounted plate, double-shot PBT keycaps and per-key RGB lighting. Connects over USB-C, Bluetooth or 2.4 GHz.' },
  { title: 'Nimbus 1080p Webcam with Ring Light', brand: 'Nimbus', category: 'Electronics', price: 2799, mrp: 3999, stockCount: 0, rating: 3.9, ratingCount: 92, imageUrl: img('webcam'), description: 'A full-HD 60 fps webcam with autofocus, a dual noise-cancelling microphone array and a three-stage adjustable ring light. Includes a privacy shutter and a tripod thread.' },
  { title: 'Vertex Wireless Ergonomic Mouse', brand: 'Vertex', category: 'Electronics', price: 2299, mrp: 3199, stockCount: 58, rating: 4.4, ratingCount: 407, imageUrl: img('mouse'), description: 'A vertical ergonomic mouse with a 26000 DPI optical sensor, six programmable buttons and a rechargeable battery rated at 70 days per charge.' },

  // --- Fashion -------------------------------------------------------------
  { title: 'Everyday Cotton Crew Neck T-Shirt', brand: 'Loomcraft', category: 'Fashion', price: 699, mrp: 1299, stockCount: 150, rating: 4.2, ratingCount: 2310, imageUrl: img('tshirt'), description: 'A 180 GSM combed-cotton crew-neck tee with a bio-washed finish, reinforced shoulder taping and a regular fit that holds its shape after repeated washing.' },
  { title: 'Slim Fit Stretch Denim Jeans', brand: 'Loomcraft', category: 'Fashion', price: 1799, mrp: 3199, stockCount: 72, rating: 4.0, ratingCount: 984, imageUrl: img('jeans'), description: 'Mid-rise slim-fit jeans in 11 oz cotton denim with two per cent elastane for movement. Five-pocket styling, YKK hardware and a colour-fast indigo wash.' },
  { title: 'Trailhead Running Shoes', brand: 'Stride', category: 'Fashion', price: 3499, mrp: 5999, stockCount: 36, rating: 4.4, ratingCount: 671, imageUrl: img('runningshoes'), description: 'Neutral daily trainers with a 28 mm compression-moulded EVA midsole, an engineered-mesh upper and a 6 mm heel-to-toe drop. Outsole rubber is rated for 800 km.' },
  { title: 'Weatherproof Commuter Backpack 25L', brand: 'Haul', category: 'Fashion', price: 2599, mrp: 4299, stockCount: 44, rating: 4.6, ratingCount: 512, imageUrl: img('backpack'), description: 'A 25-litre commuter pack in 900D water-resistant polyester with a padded 16-inch laptop sleeve, a luggage pass-through and a concealed anti-theft pocket.' },
  { title: 'Classic Analogue Wrist Watch', brand: 'Meridian', category: 'Fashion', price: 4299, mrp: 6999, stockCount: 21, rating: 4.3, ratingCount: 288, imageUrl: img('watch'), description: 'A 40 mm stainless-steel case with a domed mineral crystal, Japanese quartz movement and a genuine-leather strap. Water resistant to 50 metres.' },
  { title: 'Polarised UV400 Sunglasses', brand: 'Meridian', category: 'Fashion', price: 1299, mrp: 2499, stockCount: 88, rating: 4.1, ratingCount: 356, imageUrl: img('sunglasses'), description: 'Polarised lenses with full UV400 protection in a lightweight TR90 frame with adjustable silicone nose pads. Supplied with a hard case and a microfibre cloth.' },

  // --- Home & Kitchen ------------------------------------------------------
  { title: 'Hearth 1.7L Stainless Electric Kettle', brand: 'Hearth', category: 'Home & Kitchen', price: 1699, mrp: 2499, stockCount: 54, rating: 4.4, ratingCount: 1120, imageUrl: img('kettle'), description: 'A 1.7-litre double-walled kettle with a 1500 W concealed element, automatic shut-off, boil-dry protection and a 360-degree cordless base.' },
  { title: 'Hearth Triple-Layer Non-Stick Frying Pan 28cm', brand: 'Hearth', category: 'Home & Kitchen', price: 1499, mrp: 2299, stockCount: 67, rating: 4.2, ratingCount: 803, imageUrl: img('fryingpan'), description: 'A 28 cm forged-aluminium pan with a triple-layer PFOA-free non-stick coating, a 4.5 mm induction-ready base and a riveted stay-cool handle.' },
  { title: 'Sous Chef 750W Mixer Grinder', brand: 'SousChef', category: 'Home & Kitchen', price: 3299, mrp: 4999, stockCount: 29, rating: 4.0, ratingCount: 645, imageUrl: img('mixer'), description: 'A 750 W mixer grinder with three stainless-steel jars, overload protection and hardened blades rated for wet grinding, dry spices and chutney.' },
  { title: 'Lumen LED Desk Lamp with Wireless Charging', brand: 'Lumen', category: 'Home & Kitchen', price: 2199, mrp: 3499, stockCount: 33, rating: 4.5, ratingCount: 241, imageUrl: img('desklamp'), description: 'A flicker-free LED desk lamp with five colour temperatures, ten brightness steps, a 10 W Qi charging pad in the base and a 60-minute sleep timer.' },
  { title: 'Verdant Ceramic Planter Set of 3', brand: 'Verdant', category: 'Home & Kitchen', price: 1099, mrp: 1799, stockCount: 76, rating: 4.3, ratingCount: 190, imageUrl: img('planter'), description: 'Three hand-glazed stoneware planters in graduated sizes with drainage holes and matching bamboo saucers. Suitable for indoor foliage and succulents.' },
  { title: 'Hearth Vacuum Insulated Flask 1L', brand: 'Hearth', category: 'Home & Kitchen', price: 1249, mrp: 1999, stockCount: 3, rating: 4.6, ratingCount: 907, imageUrl: img('flask'), description: 'A one-litre 18/8 stainless-steel flask with a double-walled vacuum chamber that holds contents hot for 18 hours or cold for 24, with a leak-proof screw cap.' },

  // --- Books ---------------------------------------------------------------
  { title: 'Software Engineering: A Practitioner’s Approach', brand: 'McGraw-Hill', category: 'Books', price: 899, mrp: 1150, stockCount: 40, rating: 4.5, ratingCount: 428, imageUrl: img('sebook'), description: 'Roger S. Pressman and Bruce R. Maxim’s standard text on the software process, requirements modelling, design, quality management and project estimation.' },
  { title: 'Database System Concepts', brand: 'McGraw-Hill', category: 'Books', price: 949, mrp: 1250, stockCount: 35, rating: 4.6, ratingCount: 366, imageUrl: img('dbbook'), description: 'Silberschatz, Korth and Sudarshan’s comprehensive treatment of the relational model, normalisation, transaction management, concurrency control and recovery.' },
  { title: 'Clean Code: A Handbook of Agile Craftsmanship', brand: 'Pearson', category: 'Books', price: 649, mrp: 899, stockCount: 58, rating: 4.7, ratingCount: 1892, imageUrl: img('cleancode'), description: 'Robert C. Martin on naming, functions, error handling, unit tests and the day-to-day discipline of keeping a codebase readable as it grows.' },
  { title: 'The Pragmatic Programmer, 20th Anniversary Edition', brand: 'Pearson', category: 'Books', price: 799, mrp: 1099, stockCount: 26, rating: 4.8, ratingCount: 1455, imageUrl: img('pragprog'), description: 'Hunt and Thomas’s revised classic on practical craft: orthogonality, tracer bullets, defensive programming and building software that is easy to change.' },
  { title: 'Introduction to Algorithms', brand: 'MIT Press', category: 'Books', price: 1299, mrp: 1799, stockCount: 14, rating: 4.7, ratingCount: 733, imageUrl: img('clrs'), description: 'Cormen, Leiserson, Rivest and Stein’s reference covering sorting, graph algorithms, dynamic programming, NP-completeness and amortised analysis.' },

  // --- Sports & Fitness ----------------------------------------------------
  { title: 'Grip Pro Adjustable Dumbbell Set 20kg', brand: 'GripPro', category: 'Sports & Fitness', price: 4999, mrp: 7999, stockCount: 22, rating: 4.3, ratingCount: 398, imageUrl: img('dumbbell'), description: 'A pair of adjustable dumbbells totalling 20 kg with rubber-encased plates, knurled chrome handles and spin-lock collars. Plates convert to a barbell with the included connector.' },
  { title: 'Anchor 6mm TPE Yoga Mat', brand: 'Anchor', category: 'Sports & Fitness', price: 1199, mrp: 1999, stockCount: 84, rating: 4.4, ratingCount: 1041, imageUrl: img('yogamat'), description: 'A 6 mm closed-cell TPE mat with a dual-texture non-slip surface, alignment markings and a carrying strap. Free of PVC, latex and heavy metals.' },
  { title: 'Stride Insulated Sports Bottle 750ml', brand: 'Stride', category: 'Sports & Fitness', price: 799, mrp: 1299, stockCount: 112, rating: 4.2, ratingCount: 622, imageUrl: img('bottle'), description: 'A 750 ml vacuum-insulated bottle with a one-handed flip cap, a silicone carry loop and a powder-coated exterior that resists condensation.' },
  { title: 'GripPro Resistance Band Set of 5', brand: 'GripPro', category: 'Sports & Fitness', price: 899, mrp: 1599, stockCount: 90, rating: 4.1, ratingCount: 487, imageUrl: img('bands'), description: 'Five latex loop bands from extra light to extra heavy, colour-coded by tension, supplied with a mesh carry bag and a printed exercise guide.' },
  { title: 'Anchor Badminton Racket Graphite', brand: 'Anchor', category: 'Sports & Fitness', price: 2199, mrp: 3499, stockCount: 31, rating: 4.0, ratingCount: 256, imageUrl: img('racket'), description: 'An 85 gram full-graphite racket with an isometric head, a medium-flex shaft and a pre-strung tension of 24 lbs. Includes a full-length cover.' },

  // --- Beauty & Personal Care ---------------------------------------------
  { title: 'Lumea Vitamin C Brightening Serum 30ml', brand: 'Lumea', category: 'Beauty & Personal Care', price: 1099, mrp: 1799, stockCount: 61, rating: 4.3, ratingCount: 1533, imageUrl: img('serum'), description: 'A 15 per cent L-ascorbic acid serum buffered with ferulic acid and vitamin E, formulated at pH 3.5 in an amber pump bottle to limit oxidation.' },
  { title: 'Lumea Ceramide Daily Moisturiser 100ml', brand: 'Lumea', category: 'Beauty & Personal Care', price: 849, mrp: 1299, stockCount: 78, rating: 4.5, ratingCount: 2104, imageUrl: img('moisturiser'), description: 'A fragrance-free moisturiser with three ceramides, hyaluronic acid and niacinamide, suitable for sensitive skin and non-comedogenic.' },
  { title: 'Barber’s Row Beard Trimmer Kit', brand: 'Barbers Row', category: 'Beauty & Personal Care', price: 1999, mrp: 3299, stockCount: 47, rating: 4.2, ratingCount: 889, imageUrl: img('trimmer'), description: 'A cordless trimmer with self-sharpening titanium blades, 20 length settings from 0.5 mm to 10 mm, a 90-minute runtime and a fully washable head.' },
  { title: 'Lumea Broad Spectrum SPF 50 Sunscreen', brand: 'Lumea', category: 'Beauty & Personal Care', price: 649, mrp: 999, stockCount: 4, rating: 4.4, ratingCount: 1677, imageUrl: img('sunscreen'), description: 'A lightweight broad-spectrum SPF 50 PA++++ sunscreen with a non-greasy gel-cream texture and no white cast. Water resistant for 80 minutes.' },
];

module.exports = { categories, products };
