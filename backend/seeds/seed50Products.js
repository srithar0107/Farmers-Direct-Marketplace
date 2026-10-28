const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");

// 5 Sample Farmer Profiles in Tamil Nadu
const SAMPLE_FARMERS = [
  {
    name: "Muthuvel Farmer Producer Group",
    email: "muthuvel.fpo@sample-farmers.tn",
    phone: "9842156781",
    role: "farmer",
    farmerId: "FMR-SAMPLE-01",
    location: "Ottanchathiram, Dindigul",
    district: "Dindigul",
    isSample: true
  },
  {
    name: "Kongu Natural Organic Farms",
    email: "kongu.agro@sample-farmers.tn",
    phone: "9789123450",
    role: "farmer",
    farmerId: "FMR-SAMPLE-02",
    location: "Pollachi, Coimbatore",
    district: "Coimbatore",
    isSample: true
  },
  {
    name: "Kaveri Delta Grain Producers",
    email: "kaveri.delta@sample-farmers.tn",
    phone: "9443210987",
    role: "farmer",
    farmerId: "FMR-SAMPLE-03",
    location: "Thiruvaiyaru, Thanjavur",
    district: "Thanjavur",
    isSample: true
  },
  {
    name: "Sengottai Spice & Fruit Orchards",
    email: "sengottai.orchards@sample-farmers.tn",
    phone: "9952044332",
    role: "farmer",
    farmerId: "FMR-SAMPLE-04",
    location: "Tenkasi, Tirunelveli",
    district: "Tirunelveli",
    isSample: true
  },
  {
    name: "Nilgiris High Hills Fresh Harvest",
    email: "nilgiris.harvest@sample-farmers.tn",
    phone: "9487055441",
    role: "farmer",
    farmerId: "FMR-SAMPLE-05",
    location: "Ooty, Nilgiris",
    district: "Nilgiris",
    isSample: true
  }
];

// Exactly 50 Realistic Tamil Nadu Agricultural Products
const SAMPLE_PRODUCTS_DATA = [
  // --- VEGETABLES (20) ---
  {
    name: "Country Tomato (Naatu Thakkali)",
    category: "Vegetables",
    description: "Naturally grown tangy country tomatoes freshly harvested from red soil fields in Dindigul.",
    price: 28,
    quantity: 350,
    unit: "kg",
    location: "Ottanchathiram, Dindigul",
    district: "Dindigul",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Hybrid Salad Tomato",
    category: "Vegetables",
    description: "Firm, uniform ripe hybrid tomatoes with excellent shelf life and rich color.",
    price: 24,
    quantity: 500,
    unit: "kg",
    location: "Oddanchatram, Dindigul",
    district: "Dindigul",
    organic: false,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1546470427-227c7369a9b7?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Small Sambar Onion (Chinna Vengayam)",
    category: "Vegetables",
    description: "Pungent, authentic Tamil Nadu small shallots harvested from Perambalur and Dindigul belts.",
    price: 65,
    quantity: 400,
    unit: "kg",
    location: "Perambalur, Tiruchirappalli",
    district: "Tiruchirappalli",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Bellary Big Onion",
    category: "Vegetables",
    description: "Crisp, dry outer skin big onions sorted and graded for domestic and restaurant cooking.",
    price: 36,
    quantity: 600,
    unit: "kg",
    location: "Udumalaipettai, Tiruppur",
    district: "Tiruppur",
    organic: false,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Nilgiris Fresh Mountain Potato",
    category: "Vegetables",
    description: "Grown in the cool high-altitude soils of Nilgiris, rich in starch and naturally flavorful.",
    price: 42,
    quantity: 450,
    unit: "kg",
    location: "Ketti Valley, Nilgiris",
    district: "Nilgiris",
    organic: true,
    farmerIndex: 4,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Striped Purple Brinjal (Kathirikkai)",
    category: "Vegetables",
    description: "Traditional green-striped purple brinjals ideal for Ennai Kathirikkai and spiced roasts.",
    price: 32,
    quantity: 280,
    unit: "kg",
    location: "Alanganallur, Madurai",
    district: "Madurai",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Tender Okra / Lady's Finger (Vendakkai)",
    category: "Vegetables",
    description: "Crisp and tender farm-fresh lady's finger harvested early morning for maximum crunch.",
    price: 38,
    quantity: 220,
    unit: "kg",
    location: "Karamadai, Coimbatore",
    district: "Coimbatore",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Samba Green Chilli (Pachai Milagai)",
    category: "Vegetables",
    description: "Hot, vibrant green chillies cultivated in the dry red soils of Kovilpatti.",
    price: 52,
    quantity: 180,
    unit: "kg",
    location: "Sankarankovil, Tirunelveli",
    district: "Tirunelveli",
    organic: false,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Ooty English Carrot",
    category: "Vegetables",
    description: "Sweet, crunchy and bright orange hill carrots washed with fresh spring water.",
    price: 48,
    quantity: 380,
    unit: "kg",
    location: "Ooty, Nilgiris",
    district: "Nilgiris",
    organic: true,
    farmerIndex: 4,
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Kodaikanal Cabbage",
    category: "Vegetables",
    description: "Tightly packed round cabbage heads grown organically on the slopes of Kodaikanal.",
    price: 26,
    quantity: 420,
    unit: "kg",
    location: "Poombarai, Dindigul",
    district: "Dindigul",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Snowball Cauliflower",
    category: "Vegetables",
    description: "Crisp white florets harvested at dawn, shielded from direct sun for clean color.",
    price: 35,
    quantity: 260,
    unit: "piece",
    location: "Hosur, Krishnagiri",
    district: "Krishnagiri",
    organic: false,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Salem Native Drumstick (Murungakkai)",
    category: "Vegetables",
    description: "Fleshy, aromatic native drumsticks with thick pulp, famous across Salem and Karur.",
    price: 45,
    quantity: 190,
    unit: "kg",
    location: "Aravakurichi, Karur",
    district: "Karur",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Ooty Dark Beetroot",
    category: "Vegetables",
    description: "Deep crimson sweet beetroots loaded with dietary nitrates, freshly pulled from moist soil.",
    price: 44,
    quantity: 310,
    unit: "kg",
    location: "Kotagiri, Nilgiris",
    district: "Nilgiris",
    organic: true,
    farmerIndex: 4,
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Country White Radish (Mullangi)",
    category: "Vegetables",
    description: "Crisp, pungent long white radishes harvested fresh for sambar and healthy salads.",
    price: 25,
    quantity: 210,
    unit: "kg",
    location: "Dharapuram, Tiruppur",
    district: "Tiruppur",
    organic: false,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Tender Bottle Gourd (Sorakkai)",
    category: "Vegetables",
    description: "High-water content pale green bottle gourds, cooling and digestive.",
    price: 22,
    quantity: 180,
    unit: "kg",
    location: "Sathyamangalam, Erode",
    district: "Erode",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Ribbed Snake Gourd (Pudalangai)",
    category: "Vegetables",
    description: "Long tender snake gourds grown on traditional bamboo trellises.",
    price: 30,
    quantity: 160,
    unit: "kg",
    location: "Melur, Madurai",
    district: "Madurai",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Small Bitter Gourd (Midhi Pavakkai)",
    category: "Vegetables",
    description: "Naturally sharp small country bitter gourds celebrated for blood sugar management.",
    price: 46,
    quantity: 140,
    unit: "kg",
    location: "Sivakasi, Virudhunagar",
    district: "Virudhunagar",
    organic: true,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Hill Garlic (Kodaikanal Malai Poondu)",
    category: "Vegetables",
    description: "GI-tagged Kodaikanal hill garlic with medicinal potency and intense aromatic oils.",
    price: 240,
    quantity: 120,
    unit: "kg",
    location: "Mannavanur, Dindigul",
    district: "Dindigul",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Fresh Country Ginger (Inji)",
    category: "Vegetables",
    description: "Spicy, fibrous mountain-grown fresh ginger with thin peel and strong pungency.",
    price: 90,
    quantity: 200,
    unit: "kg",
    location: "Anaimalai, Coimbatore",
    district: "Coimbatore",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Aromatic Curry Leaves (Karuveppilai)",
    category: "Vegetables",
    description: "Unpolished, naturally fragrant fresh curry leaves plucked in bunches from Karur groves.",
    price: 40,
    quantity: 90,
    unit: "kg",
    location: "Kulithalai, Karur",
    district: "Karur",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },

  // --- FRUITS (12) ---
  {
    name: "Poovan Banana (Sweet Country Banana)",
    category: "Fruits",
    description: "Naturally ripened sweet, tangy yellow Poovan bananas straight from Trichy Cauvery banks.",
    price: 45,
    quantity: 400,
    unit: "kg",
    location: "Musiri, Tiruchirappalli",
    district: "Tiruchirappalli",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Nendran Banana (Kerala / Tenkasi Variety)",
    category: "Fruits",
    description: "Golden firm Nendran bananas, excellent for healthy steam breakfast and traditional chips.",
    price: 55,
    quantity: 320,
    unit: "kg",
    location: "Shenkottai, Tirunelveli",
    district: "Tirunelveli",
    organic: true,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Robusta Green Cavandish Banana",
    category: "Fruits",
    description: "High-energy sweet dessert bananas harvested from the well-irrigated farms of Theni.",
    price: 35,
    quantity: 500,
    unit: "kg",
    location: "Chinnamanur, Theni",
    district: "Theni",
    organic: false,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Salem Banganapalli Mango",
    category: "Fruits",
    description: "Fibreless, luscious sweet king of mangoes naturally tree-ripened with hay in Salem orchards.",
    price: 95,
    quantity: 450,
    unit: "kg",
    location: "Ayothiyapattinam, Salem",
    district: "Salem",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Dharmapuri Alphonso Mango",
    category: "Fruits",
    description: "Rich, aromatic Alphonso mangoes with sunset orange pulp from Dharmapuri mango belt.",
    price: 130,
    quantity: 300,
    unit: "kg",
    location: "Harur, Dharmapuri",
    district: "Dharmapuri",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Red Lady Sweet Papaya",
    category: "Fruits",
    description: "Juicy, salmon-pink firm flesh papaya bursting with natural enzymes and vitamins.",
    price: 32,
    quantity: 360,
    unit: "kg",
    location: "Cumbum, Theni",
    district: "Theni",
    organic: true,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Madurai Pink Guava (Seeni Koyya)",
    category: "Fruits",
    description: "Crisp white-and-pink fleshed sweet native guavas rich in vitamin C from Madurai soil.",
    price: 45,
    quantity: 240,
    unit: "kg",
    location: "Melur, Madurai",
    district: "Madurai",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1536511136774-67d1e8ef09eb?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Tindivanam Striped Watermelon",
    category: "Fruits",
    description: "Crisp, deeply refreshing sweet dark red watermelons grown along East Coast sandy plains.",
    price: 20,
    quantity: 700,
    unit: "kg",
    location: "Marakkanam, Villupuram",
    district: "Villupuram",
    organic: false,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Panruti Honey Jackfruit (Pala Pazham)",
    category: "Fruits",
    description: "World-famous Panruti jackfruit bulbs dripping with natural floral honey-sweet taste.",
    price: 70,
    quantity: 200,
    unit: "kg",
    location: "Panruti, Cuddalore",
    district: "Cuddalore",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1546548970-71785318a17b?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Ruby Red Sweet Pomegranate",
    category: "Fruits",
    description: "Plump crimson arils with soft seeds and high antioxidant juice from Coimbatore orchards.",
    price: 140,
    quantity: 250,
    unit: "kg",
    location: "Kinathukadavu, Coimbatore",
    district: "Coimbatore",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Dindigul Cricket Ball Sapota (Chikoo)",
    category: "Fruits",
    description: "Brown, sweet caramel-flavored round sapota harvested mature from foothill plantations.",
    price: 40,
    quantity: 280,
    unit: "kg",
    location: "Batlagundu, Dindigul",
    district: "Dindigul",
    organic: true,
    farmerIndex: 0,
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Wild Mountain Amla (Nellikkai)",
    category: "Fruits",
    description: "Large, nutrient-packed wild gooseberries hand-picked from the foot of Western Ghats.",
    price: 60,
    quantity: 150,
    unit: "kg",
    location: "Rajapalayam, Virudhunagar",
    district: "Virudhunagar",
    organic: true,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },

  // --- GRAINS, RICE & CEREALS (8) ---
  {
    name: "Ponni Boiled Rice (Thanjavur)",
    category: "Grains",
    description: "Aged 1-year authentic single-boiled Ponni rice from Cauvery delta paddy fields.",
    price: 58,
    quantity: 1200,
    unit: "kg",
    location: "Kumbakonam, Thanjavur",
    district: "Thanjavur",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Seeraga Samba Traditional Biryani Rice",
    category: "Grains",
    description: "Tiny-grained intensely fragrant heirloom rice, the undisputed soul of Ambur & Dindigul Biryani.",
    price: 110,
    quantity: 600,
    unit: "kg",
    location: "Uppiliyapuram, Tiruchirappalli",
    district: "Tiruchirappalli",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Mappillai Samba Heritage Red Rice",
    category: "Grains",
    description: "Ancient Tamil red medicinal rice revered for building stamina and hemoglobin.",
    price: 85,
    quantity: 450,
    unit: "kg",
    location: "Mannargudi, Tiruvarur",
    district: "Tiruvarur",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Kambu / Pearl Millet (Bajra)",
    category: "Grains",
    description: "Nutritious traditional millets harvested from dryland Tamil farms, ideal for Koozh.",
    price: 45,
    quantity: 500,
    unit: "kg",
    location: "Aruppukkottai, Virudhunagar",
    district: "Virudhunagar",
    organic: true,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Finger Millet / Ragi (Kezhvaragu)",
    category: "Grains",
    description: "Calcium-rich cleaned whole ragi grains grown with rain-fed farming in Dharmapuri hills.",
    price: 42,
    quantity: 650,
    unit: "kg",
    location: "Pennagaram, Dharmapuri",
    district: "Dharmapuri",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Thinai / Foxtail Millet",
    category: "Grains",
    description: "Low-glycemic golden foxtail millet, delicious for savory pongal and health sweets.",
    price: 75,
    quantity: 350,
    unit: "kg",
    location: "Javadhu Hills, Tiruvannamalai",
    district: "Tiruvannamalai",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Samai / Little Millet",
    category: "Grains",
    description: "Fibre-dense polished little millet grains cultivated by tribal farmers in Kolli Hills.",
    price: 78,
    quantity: 300,
    unit: "kg",
    location: "Kolli Hills, Namakkal",
    district: "Namakkal",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Sweet Yellow Field Corn / Maize",
    category: "Grains",
    description: "Sun-dried golden maize grains suited for flour, livestock feed and snacks.",
    price: 28,
    quantity: 800,
    unit: "kg",
    location: "Kangeyam, Tiruppur",
    district: "Tiruppur",
    organic: false,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80"
  },

  // --- PULSES & LEGUMES (5) ---
  {
    name: "Country Toor Dal (Thuvaram Paruppu)",
    category: "Pulses",
    description: "Unpolished, naturally split rich yellow toor dal with deep aroma and no synthetic oil polish.",
    price: 135,
    quantity: 450,
    unit: "kg",
    location: "Tiruvannamalai Plains",
    district: "Tiruvannamalai",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Whole Black Urad Dal (Karuppu Ulundhu)",
    category: "Pulses",
    description: "High-fiber black gram, the secret behind authentic spongy Idlis and Ulundhu Kali.",
    price: 120,
    quantity: 400,
    unit: "kg",
    location: "Nagapattinam Coast",
    district: "Nagapattinam",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Green Moong Dal (Paasi Paruppu)",
    category: "Pulses",
    description: "Nutritious whole and split green gram harvested naturally without chemical fertilizers.",
    price: 115,
    quantity: 380,
    unit: "kg",
    location: "Sankarankovil, Tenkasi",
    district: "Tenkasi",
    organic: true,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Bengal Gram / Chana Dal (Kadalai Paruppu)",
    category: "Pulses",
    description: "Freshly decorticated and split chickpeas for sundal, vadai, and nutrient-dense curries.",
    price: 90,
    quantity: 340,
    unit: "kg",
    location: "Chettinad, Sivaganga",
    district: "Sivaganga",
    organic: false,
    farmerIndex: 3,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Country Black Chickpeas (Kondaikadalai)",
    category: "Pulses",
    description: "Protein-dense country kala chana with earth-brown hull, ideal for sprouts and curries.",
    price: 88,
    quantity: 320,
    unit: "kg",
    location: "Pudukkottai Countryside",
    district: "Pudukkottai",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
  },

  // --- PLANTATION, COCONUT & SPICES (5) ---
  {
    name: "Pollachi Sweet Tender Coconut (Elaneer)",
    category: "Plantation",
    description: "Fresh tender coconuts harvested from Pollachi groves, containing 500ml+ pure electrolyte water.",
    price: 45,
    quantity: 500,
    unit: "piece",
    location: "Pollachi, Coimbatore",
    district: "Coimbatore",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1544378730-8b5104b18790?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Dry Milling Copra / Matured Coconut",
    category: "Plantation",
    description: "Heavy mature whole coconuts packed with rich white meat and high oil content.",
    price: 28,
    quantity: 900,
    unit: "piece",
    location: "Pattukkottai, Thanjavur",
    district: "Thanjavur",
    organic: true,
    farmerIndex: 2,
    image: "https://images.unsplash.com/photo-1544378730-8b5104b18790?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Organic Country Jaggery (Nattu Sakkarai)",
    category: "Plantation",
    description: "Chemical-free unrefined cane jaggery powder made from freshly crushed sugarcane juice.",
    price: 70,
    quantity: 500,
    unit: "kg",
    location: "Modakkurichi, Erode",
    district: "Erode",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Erode Finger Turmeric (Manjal Kizhangu)",
    category: "Spices",
    description: "World-renowned Erode turmeric fingers rich in 3.5%+ active curcumin and bright natural color.",
    price: 130,
    quantity: 350,
    unit: "kg",
    location: "Perundurai, Erode",
    district: "Erode",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Valparai Black Malabar Pepper (Milagu)",
    category: "Spices",
    description: "Sun-dried bold black peppercorns grown under the canopy of rainforest shade trees in Anaimalai.",
    price: 650,
    quantity: 110,
    unit: "kg",
    location: "Valparai, Coimbatore",
    district: "Coimbatore",
    organic: true,
    farmerIndex: 1,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
  }
];

async function seed50Products() {
  try {
    const existingCount = await Product.countDocuments({ isSample: true });
    if (existingCount >= 50) {
      console.log(`[SEED] Exactly 50 sample products already exist in MongoDB (${existingCount} found). Skipping.`);
      return;
    }

    console.log(`[SEED] Seeding 50 realistic Tamil Nadu agricultural products...`);

    // Ensure sample farmers exist
    const farmerDocs = [];
    for (const f of SAMPLE_FARMERS) {
      let farmer = await User.findOne({ email: f.email });
      if (!farmer) {
        farmer = await User.create({
          name: f.name,
          email: f.email,
          phone: f.phone,
          role: "farmer",
          farmerId: f.farmerId,
          location: f.location,
          district: f.district,
          isSample: true,
          password: await bcrypt.hash("Farmer@123", 10)
        });
        console.log(`[SEED] Created sample farmer: ${f.name} (${f.farmerId})`);
      }
      farmerDocs.push(farmer);
    }

    // Insert sample products that don't yet exist
    let inserted = 0;
    for (const item of SAMPLE_PRODUCTS_DATA) {
      const farmer = farmerDocs[item.farmerIndex] || farmerDocs[0];
      const exists = await Product.findOne({ name: item.name, isSample: true });
      if (!exists) {
        await Product.create({
          name: item.name,
          category: item.category,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          soldQuantity: 0,
          lowStockThreshold: 10,
          unit: item.unit,
          location: item.location,
          district: item.district,
          farmer: farmer._id,
          availability: item.quantity > 0 ? "Available" : "Out of Stock",
          image: item.image,
          harvestDate: new Date(),
          organic: item.organic,
          isSample: true
        });
        inserted++;
      }
    }

    console.log(`✅ [SEED SUCCESS] Seeded ${inserted} new sample products. Total sample products: 50.`);
  } catch (err) {
    console.error("[SEED ERROR] Failed to seed 50 products:", err.message);
  }
}

module.exports = {
  seed50Products,
  SAMPLE_FARMERS,
  SAMPLE_PRODUCTS_DATA
};
