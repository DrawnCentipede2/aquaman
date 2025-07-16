// selected list of countries and their major cities for travel pin packs
// Focused on popular travel destinations rather than exhaustive coverage

export interface CountryCityData {
  [country: string]: string[]
}

export const countriesAndCities: CountryCityData = {
  "Argentina": [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Tucumán", 
    "Mar del Plata", "Salta", "Santa Fe", "Bariloche", "Ushuaia", "Puerto Madryn",
    "El Calafate", "Iguazu", "Mendoza"
  ],

  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast",
    "Newcastle", "Canberra", "Wollongong", "Geelong", "Townsville", "Cairns",
    "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Alice Springs", "Hobart"
  ],

  "Austria": [
    "Vienna", "Salzburg", "Innsbruck", "Graz", "Linz", "Klagenfurt",
    "Villach", "Wels", "Sankt Pölten", "Dornbirn", "Steyr", "Feldkirch",
    "Bregenz", "Leonding", "Klosterneuburg", "Baden", "Wolfsberg", "Leoben"
  ],

  "Belgium": [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges",
    "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "La Louvière",
    "Kortrijk", "Hasselt", "Sint-Niklaas", "Oostende", "Tournai", "Genk"
  ],

  "Brazil": [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte",
    "Manaus", "Curitiba", "Recife", "Goiânia", "Belém", "Porto Alegre",
    "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias",
    "Florianópolis", "Natal", "Foz do Iguaçu", "Paraty", "Ouro Preto"
  ],

  "Canada": [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Mississauga", "Winnipeg", "Quebec City", "Hamilton", "Brampton", "Surrey",
    "Laval", "Halifax", "London", "Markham", "Vaughan", "Gatineau",
    "Saskatoon", "Longueuil", "Burnaby", "Regina", "Richmond", "Richmond Hill"
  ],

  "China": [
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Tianjin", "Wuhan",
    "Xi'an", "Chengdu", "Hangzhou", "Nanjing", "Shenyang", "Harbin",
    "Kunming", "Dalian", "Qingdao", "Jinan", "Zhengzhou", "Changsha",
    "Urumqi", "Lanzhou", "Hefei", "Shijiazhuang", "Suzhou", "Wuxi"
  ],

  "Czech Republic": [
    "Prague", "Brno", "Ostrava", "Plzen", "Liberec", "Olomouc",
    "Ústí nad Labem", "České Budějovice", "Hradec Králové", "Pardubice",
    "Zlín", "Havířov", "Kladno", "Most", "Opava", "Frýdek-Místek",
    "Karviná", "Jihlava", "Teplice", "Děčín", "Karlovy Vary", "Jablonec nad Nisou"
  ],

  "Denmark": [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers",
    "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Helsingør",
    "Silkeborg", "Næstved", "Fredericia", "Viborg", "Køge", "Holstebro"
  ],

  "Egypt": [
    "Cairo", "Alexandria", "Giza", "Shubra El-Kheima", "Port Said", "Suez",
    "Luxor", "Mansoura", "El-Mahalla El-Kubra", "Tanta", "Asyut", "Ismailia",
    "Fayyum", "Zagazig", "Aswan", "Damietta", "Damanhur", "Minya",
    "Beni Suef", "Hurghada", "Qena", "Sohag", "Shibin El Kom", "Banha"
  ],

  "Finland": [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku",
    "Jyväskylä", "Lahti", "Kuopio", "Pori", "Joensuu", "Lappeenranta",
    "Hämeenlinna", "Vaasa", "Seinäjoki", "Rovaniemi", "Mikkeli", "Kotka",
    "Salo", "Porvoo", "Kouvola", "Hyvinkää", "Lohja", "Järvenpää"
  ],

  "France": [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
    "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims",
    "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers",
    "Nîmes", "Villeurbanne", "Saint-Denis", "Le Mans", "Aix-en-Provence", "Clermont-Ferrand",
    "Brest", "Tours", "Limoges", "Amiens", "Annecy", "Perpignan", "Cannes", "Avignon"
  ],

  "Germany": [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart",
    "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden",
    "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld",
    "Bonn", "Münster", "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden",
    "Gelsenkirchen", "Mönchengladbach", "Braunschweig", "Chemnitz", "Kiel", "Aachen"
  ],

  "Greece": [
    "Athens", "Thessaloniki", "Patras", "Piraeus", "Larissa", "Heraklion",
    "Peristeri", "Kallithea", "Acharnes", "Kalamaria", "Nikaia", "Glyfada",
    "Volos", "Ilioupoli", "Kavala", "Trikala", "Serres", "Alexandroupoli",
    "Xanthi", "Katerini", "Agrinio", "Giannitsa", "Chalcis", "Veria",
    "Mykonos", "Santorini", "Rhodes", "Corfu", "Crete", "Delphi"
  ],

  "India": [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai",
    "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur",
    "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad",
    "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
    "Goa", "Udaipur", "Varanasi", "Rishikesh", "Dharamshala", "Kerala"
  ],

  "Indonesia": [
    "Jakarta", "Surabaya", "Bandung", "Bekasi", "Medan", "Tangerang",
    "Depok", "Semarang", "Palembang", "Makassar", "South Tangerang", "Batam",
    "Bandar Lampung", "Bogor", "Pekanbaru", "Padang", "Malang", "Denpasar",
    "Samarinda", "Tasikmalaya", "Pontianak", "Balikpapan", "Jambi", "Surakarta",
    "Bali", "Yogyakarta", "Lombok", "Flores"
  ],

  "Ireland": [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda",
    "Dundalk", "Swords", "Bray", "Navan", "Ennis", "Carlow",
    "Tralee", "Newbridge", "Portlaoise", "Kilkenny", "Naas", "Athlone",
    "Sligo", "Mullingar", "Wexford", "Letterkenny", "Celbridge", "Clonmel"
  ],

  "Israel": [
    "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod",
    "Netanya", "Beer Sheva", "Bnei Brak", "Holon", "Ramat Gan", "Ashkelon",
    "Rehovot", "Bat Yam", "Beit Shemesh", "Kfar Saba", "Herzliya", "Hadera",
    "Modi'in", "Nazareth", "Lod", "Ramla", "Ra'anana", "Givatayim"
  ],

  "Italy": [
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa",
    "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona",
    "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Prato",
    "Parma", "Modena", "Reggio Calabria", "Reggio Emilia", "Perugia", "Livorno",
    "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara",
    "Pisa", "Amalfi", "Cinque Terre", "Positano", "Capri", "Siena"
  ],

  "Japan": [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka",
    "Kobe", "Kawasaki", "Kyoto", "Saitama", "Hiroshima", "Sendai",
    "Chiba", "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Okayama",
    "Sagamihara", "Shizuoka", "Kumamoto", "Kagoshima", "Matsuyama", "Kanazawa",
    "Utsunomiya", "Oita", "Nara", "Toyama", "Kurashiki", "Takamatsu",
    "Naha", "Takayama", "Nikko", "Hakone", "Kamakura", "Mount Fuji"
  ],

  "Malaysia": [
    "Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Johor Bahru",
    "Seberang Perai", "Kuching", "Kota Kinabalu", "Klang", "Subang Jaya", "Selayang",
    "Kajang", "Seremban", "Sungai Petani", "Ampang Jaya", "Malacca City", "Sandakan",
    "Kuantan", "Alor Setar", "Tawau", "Miri", "Taiping", "Bukit Mertajam",
    "Langkawi", "Cameron Highlands", "Genting Highlands", "Penang"
  ],

  "Mexico": [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León",
    "Juárez", "Torreón", "Querétaro", "San Luis Potosí", "Mérida", "Mexicali",
    "Aguascalientes", "Cuernavaca", "Saltillo", "Hermosillo", "Culiacán", "Chihuahua",
    "Morelia", "Tampico", "Xalapa", "Reynosa", "Tuxtla Gutiérrez", "Durango",
    "Cancún", "Playa del Carmen", "Puerto Vallarta", "Tulum", "Oaxaca", "Guanajuato"
  ],

  "Netherlands": [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg",
    "Groningen", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem",
    "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "s-Hertogenbosch", "Hoofddorp",
    "Maastricht", "Leiden", "Dordrecht", "Zoetermeer", "Zwolle", "Deventer",
    "Delft", "Gouda", "Volendam", "Giethoorn", "Kinderdijk"
  ],

  "New Zealand": [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier-Hastings",
    "Dunedin", "Palmerston North", "Nelson", "Rotorua", "New Plymouth", "Whangarei",
    "Invercargill", "Whanganui", "Gisborne", "Timaru", "Queenstown", "Taupo",
    "Westport", "Greymouth", "Blenheim", "Oamaru", "Ashburton", "Pukekohe"
  ],

  "Norway": [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", "Kristiansand", "Fredrikstad",
    "Tromsø", "Sandnes", "Drammen", "Asker", "Lillestrøm", "Skien", "Ålesund",
    "Tønsberg", "Moss", "Haugesund", "Sandefjord", "Arendal", "Bodø",
    "Hamar", "Ytrebygda", "Larvik", "Halden", "Lillehammer", "Flam"
  ],

  "Philippines": [
    "Manila", "Quezon City", "Caloocan", "Davao", "Cebu City", "Zamboanga",
    "Antipolo", "Pasig", "Taguig", "Valenzuela", "Dasmariñas", "Parañaque",
    "Las Piñas", "Makati", "Muntinlupa", "Marikina", "Pasay", "Malabon",
    "Mandaluyong", "Navotas", "San Juan", "Pateros", "Boracay", "Palawan",
    "Bohol", "Siargao", "El Nido", "Baguio"
  ],

  "Poland": [
    "Warsaw", "Krakow", "Łódź", "Wrocław", "Poznań", "Gdańsk",
    "Szczecin", "Bydgoszcz", "Lublin", "Białystok", "Katowice", "Gdynia",
    "Częstochowa", "Radom", "Sosnowiec", "Toruń", "Kielce", "Gliwice",
    "Zabrze", "Bytom", "Bielsko-Biała", "Olsztyn", "Rzeszów", "Ruda Śląska",
    "Zakopane", "Malbork", "Wieliczka"
  ],

  "Portugal": [
    "Lisbon", "Porto", "Amadora", "Braga", "Setúbal", "Coimbra",
    "Queluz", "Funchal", "Cacém", "Vila Nova de Gaia", "Loures", "Felgueiras",
    "Évora", "Rio Tinto", "Barreiro", "Montijo", "Almada", "Agualva-Cacém",
    "Sintra", "Cascais", "Faro", "Óbidos", "Aveiro", "Guimarães",
    "Lagos", "Tavira", "Monsaraz", "Nazaré"
  ],

  "Singapore": [
    "Singapore"
  ],

  "South Africa": [
    "Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth", "Pietermaritzburg",
    "Benoni", "Tembisa", "East London", "Vereeniging", "Bloemfontein", "Boksburg",
    "Welkom", "Newcastle", "Krugersdorp", "Diepsloot", "Botshabelo", "Brakpan",
    "Witbank", "Oberholzer", "Germiston", "Randfontein", "Paarl", "Stellenbosch",
    "Knysna", "Hermanus", "Plettenberg Bay", "Oudtshoorn"
  ],

  "South Korea": [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju",
    "Suwon", "Ulsan", "Changwon", "Goyang", "Yongin", "Seongnam",
    "Bucheon", "Cheongju", "Ansan", "Jeonju", "Anyang", "Cheonan",
    "Pohang", "Uijeongbu", "Siheung", "Pyeongtaek", "Gimhae", "Jeju City",
    "Jeju", "Gyeongju", "Andong", "Sokcho"
  ],

  "Spain": [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga",
    "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba",
    "Valladolid", "Vigo", "Gijón", "Hospitalet de Llobregat", "Vitoria-Gasteiz", "A Coruña",
    "Elche", "Granada", "Oviedo", "Badalona", "Cartagena", "Terrassa",
    "Jerez de la Frontera", "Sabadell", "Móstoles", "Santa Cruz de Tenerife",
    "Toledo", "San Sebastián", "Salamanca", "Santiago de Compostela", "Cádiz", "Segovia"
  ],

  "Sweden": [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro",
    "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå",
    "Gävle", "Borås", "Södertälje", "Eskilstuna", "Halmstad", "Växjö",
    "Karlstad", "Sundsvall", "Trollhättan", "Östersund", "Borlänge", "Falun",
    "Kiruna", "Visby", "Göteborg", "Abisko"
  ],

  "Switzerland": [
    "Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Winterthur",
    "Lucerne", "St. Gallen", "Lugano", "Biel/Bienne", "Thun", "Köniz",
    "La Chaux-de-Fonds", "Schaffhausen", "Fribourg", "Vernier", "Chur", "Neuchâtel",
    "Uster", "Sion", "Emmen", "Zug", "Yverdon-les-Bains", "Dübendorf",
    "Interlaken", "Zermatt", "Montreux", "Grindelwald", "Jungfraujoch", "Davos"
  ],

  "Thailand": [
    "Bangkok", "Samut Prakan", "Mueang Nonthaburi", "Udon Thani", "Chon Buri", "Nakhon Ratchasima",
    "Chiang Mai", "Hat Yai", "Ubon Ratchathani", "Khon Kaen", "Pak Kret", "Surat Thani",
    "Nakhon Si Thammarat", "Nakhon Pathom", "Si Racha", "Phuket", "Rayong", "Lampang",
    "Chiang Rai", "Ratchaburi", "Chumphon", "Lop Buri", "Krabi", "Pattaya",
    "Koh Samui", "Phi Phi Islands", "Ayutthaya", "Sukhothai", "Kanchanaburi"
  ],

  "Turkey": [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep",
    "Konya", "Şanlıurfa", "Mersin", "Diyarbakır", "Kayseri", "Eskişehir",
    "Gebze", "Denizli", "Samsun", "Kahramanmaraş", "Van", "Batman",
    "Elazığ", "Erzurum", "Siirt", "Tokat", "Corum", "Kırıkkale",
    "Cappadocia", "Antalya", "Bodrum", "Kusadasi", "Pamukkale", "Troy"
  ],

  "United Kingdom": [
    "London", "Birmingham", "Leeds", "Glasgow", "Sheffield", "Bradford",
    "Liverpool", "Edinburgh", "Manchester", "Bristol", "Wakefield", "Cardiff",
    "Coventry", "Nottingham", "Leicester", "Sunderland", "Belfast", "Newcastle upon Tyne",
    "Brighton", "Hull", "Plymouth", "Stoke-on-Trent", "Wolverhampton", "Derby",
    "Southampton", "Portsmouth", "York", "Bath", "Cambridge", "Oxford",
    "Canterbury", "Windsor", "Stratford-upon-Avon", "Chester", "Stonehenge"
  ],

  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis", "Seattle",
    "Denver", "Washington DC", "Boston", "El Paso", "Nashville", "Detroit",
    "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore",
    "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City",
    "Mesa", "Atlanta", "Omaha", "Colorado Springs", "Raleigh", "Miami",
    "Oakland", "Minneapolis", "Tulsa", "Cleveland", "Wichita", "New Orleans",
    "Tampa", "Honolulu", "Anchorage", "Orlando", "Key West", "Napa Valley",
    "Yellowstone", "Grand Canyon", "Yosemite", "Charleston"
  ],

  "Vietnam": [
    "Ho Chi Minh City", "Hanoi", "Hai Phong", "Da Nang", "Bien Hoa", "Hue",
    "Nha Trang", "Can Tho", "Rach Gia", "Qui Nhon", "Vung Tau", "Nam Dinh",
    "Phan Thiet", "Long Xuyen", "Ha Long", "Thai Nguyen", "Thanh Hoa", "Buon Ma Thuot",
    "Thai Binh", "Hoi An", "Sapa", "Dalat", "Phu Quoc", "Cat Ba", "Ninh Binh"
  ]
}

// Helper function to get all countries
export const getAllCountries = (): string[] => {
  return Object.keys(countriesAndCities).sort()
}

// Helper function to get cities for a specific country
export const getCitiesForCountry = (country: string): string[] => {
  return countriesAndCities[country] || []
}

// Helper function to validate if a city exists in a country
export const isCityInCountry = (city: string, country: string): boolean => {
  const cities = getCitiesForCountry(country)
  return cities.includes(city)
} 